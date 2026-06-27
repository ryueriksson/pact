import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError, apiOk } from "@/lib/utils";
import { createLeaseDepositSession, createLeaseRentSubscription } from "@/lib/stripe";

// POST /api/l/[token]/payment?type=deposit|rent
export async function POST(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") ?? "deposit"; // "deposit" | "rent"

    const lease = await prisma.lease.findUnique({
      where: { token: params.token },
      include: {
        leaseContract: true,
        leasePayments: true,
        user: { select: { stripeConnectId: true, stripeConnectOnboarded: true, plan: true } },
      },
    });

    if (!lease) return apiError("Not found", 404);
    if (!lease.skipSigning && !lease.leaseContract?.signedAt) {
      return apiError("Lease must be signed first", 409);
    }

    if (!lease.user.stripeConnectId || !lease.user.stripeConnectOnboarded) {
      return apiError(
        "The landlord hasn't connected their payment account yet. Please contact them.",
        402
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL!;

    if (type === "deposit") {
      if (!lease.depositAmount) return apiError("No deposit required for this lease", 400);

      const alreadyPaid = lease.leasePayments.some(
        (p) => p.type === "DEPOSIT" && p.status === "PAID"
      );
      if (alreadyPaid) return apiError("Deposit already paid", 409);

      const session = await createLeaseDepositSession({
        leaseId: lease.id,
        propertyAddress: lease.propertyAddress,
        tenantEmail: lease.tenantEmail,
        amountCents: lease.depositAmount,
        currency: lease.currency,
        connectedAccountId: lease.user.stripeConnectId,
        successUrl: `${appUrl}/l/${params.token}?payment=deposit_success`,
        cancelUrl: `${appUrl}/l/${params.token}?payment=cancelled`,
        waiveFee: lease.user.plan === "PRO",
      });

      // Upsert pending deposit payment record
      const existing = lease.leasePayments.find((p) => p.type === "DEPOSIT");
      if (existing) {
        await prisma.leasePayment.update({
          where: { id: existing.id },
          data: { stripeSessionId: session.id, status: "PENDING" },
        });
      } else {
        await prisma.leasePayment.create({
          data: {
            leaseId: lease.id,
            type: "DEPOSIT",
            amount: lease.depositAmount,
            currency: lease.currency,
            stripeSessionId: session.id,
          },
        });
      }

      return apiOk({ url: session.url });
    }

    if (type === "rent") {
      if (lease.stripeSubId) return apiError("Rent subscription already active", 409);

      const session = await createLeaseRentSubscription({
        leaseId: lease.id,
        propertyAddress: lease.propertyAddress,
        tenantEmail: lease.tenantEmail,
        monthlyRentCents: lease.monthlyRent,
        currency: lease.currency,
        connectedAccountId: lease.user.stripeConnectId,
        successUrl: `${appUrl}/l/${params.token}?payment=rent_success`,
        cancelUrl: `${appUrl}/l/${params.token}?payment=cancelled`,
        waiveFee: lease.user.plan === "PRO",
      });

      return apiOk({ url: session.url });
    }

    return apiError("Invalid payment type");
  } catch (err) {
    console.error("[lease payment]", err);
    return apiError("Failed to create payment session", 500);
  }
}
