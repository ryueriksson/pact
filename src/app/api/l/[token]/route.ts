import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError, apiOk } from "@/lib/utils";

// GET /api/l/[token] — public lease fetch (marks as VIEWED)
export async function GET(
  _req: NextRequest,
  { params }: { params: { token: string } }
) {
  const lease = await prisma.lease.findUnique({
    where: { token: params.token },
    include: {
      leaseContract: true,
      leasePayments: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!lease) return apiError("Not found", 404);
  if (lease.status === "CANCELLED") return apiError("This lease has been cancelled", 410);

  if (lease.status === "SENT") {
    await prisma.lease.update({
      where: { id: lease.id },
      data: { status: "SENT" },
    });
  }

  return apiOk({
    id: lease.id,
    propertyAddress: lease.propertyAddress,
    unitNumber: lease.unitNumber,
    tenantName: lease.tenantName,
    tenantEmail: lease.tenantEmail,
    monthlyRent: lease.monthlyRent,
    depositAmount: lease.depositAmount,
    currency: lease.currency,
    leaseStart: lease.leaseStart,
    leaseEnd: lease.leaseEnd,
    leaseDocUrl: lease.leaseDocUrl,
    contractBody: lease.contractBody,
    skipSigning: lease.skipSigning,
    status: lease.status,
    leaseContract: lease.leaseContract
      ? {
          signerName: lease.leaseContract.signerName,
          signerEmail: lease.leaseContract.signerEmail,
          signedAt: lease.leaseContract.signedAt,
        }
      : null,
    leasePayments: lease.leasePayments.map((p) => ({
      type: p.type,
      amount: p.amount,
      currency: p.currency,
      status: p.status,
      paidAt: p.paidAt,
    })),
  });
}
