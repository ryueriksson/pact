import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  isLeasePubliclyAccessible,
  LEASE_NOT_SENT_MESSAGE,
} from "@/lib/lease-access";
import { enforceRateLimit } from "@/lib/rate-limit";
import { hasLeaseDocument } from "@/lib/lease-document";
import { apiError, apiOk } from "@/lib/utils";

// GET /api/l/[token] — public lease fetch (marks as VIEWED)
export async function GET(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  const limited = await enforceRateLimit(req, "lease-view", 60, 60 * 1000);
  if (limited) return limited;

  const lease = await prisma.lease.findUnique({
    where: { token: params.token },
    include: {
      leaseContract: true,
      leasePayments: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!lease) return apiError("Not found", 404);
  if (lease.status === "CANCELLED") return apiError("This lease has been cancelled", 410);
  if (!isLeasePubliclyAccessible(lease.status)) {
    return apiError(LEASE_NOT_SENT_MESSAGE, 403);
  }

  return apiOk({
    id: lease.id,
    propertyAddress: lease.propertyAddress,
    unitNumber: lease.unitNumber,
    tenantName: lease.tenantName,
    monthlyRent: lease.monthlyRent,
    depositAmount: lease.depositAmount,
    currency: lease.currency,
    leaseStart: lease.leaseStart,
    leaseEnd: lease.leaseEnd,
    hasLeaseDocument: hasLeaseDocument(lease.leaseDocUrl),
    contractBody: lease.contractBody,
    skipSigning: lease.skipSigning,
    status: lease.status,
    leaseContract: lease.leaseContract
      ? {
          signerName: lease.leaseContract.signerName,
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
