import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { createCheckoutSession } from "@/lib/stripe";
import { apiError, apiOk } from "@/lib/utils";

// POST /api/p/[token]/payment — create Stripe Checkout session
export async function POST(
  _req: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const proposal = await prisma.proposal.findUnique({
      where: { token: params.token },
      include: {
        contract: true,
        payment: true,
        user: {
          select: {
            stripeConnectId: true,
            stripeConnectOnboarded: true,
            plan: true,
          },
        },
      },
    });

    if (!proposal) return apiError("Proposal not found", 404);
    if (!proposal.depositAmount) return apiError("No payment required", 400);
    if (!proposal.contract?.signedAt) return apiError("Contract must be signed first", 409);
    if (proposal.payment?.status === "PAID") return apiError("Already paid", 409);

    // Ensure the freelancer has connected Stripe before accepting payments
    if (!proposal.user.stripeConnectId || !proposal.user.stripeConnectOnboarded) {
      return apiError(
        "The sender has not connected their Stripe account yet. Please contact them.",
        402
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL!;

    const session = await createCheckoutSession({
      proposalId: proposal.id,
      proposalTitle: proposal.title,
      clientEmail: proposal.clientEmail,
      amountCents: proposal.depositAmount,
      currency: proposal.currency,
      connectedAccountId: proposal.user.stripeConnectId,
      successUrl: `${appUrl}/p/${params.token}?payment=success`,
      cancelUrl: `${appUrl}/p/${params.token}?payment=cancelled`,
      waiveFee: proposal.user.plan === "PRO",
    });

    // Create/update payment record
    await prisma.payment.upsert({
      where: { proposalId: proposal.id },
      create: {
        proposalId: proposal.id,
        stripeSessionId: session.id,
        amount: proposal.depositAmount,
        currency: proposal.currency,
        status: "PENDING",
      },
      update: {
        stripeSessionId: session.id,
        status: "PENDING",
      },
    });

    return apiOk({ url: session.url });
  } catch (err) {
    console.error("[payment]", err);
    return apiError("Failed to create payment session", 500);
  }
}
