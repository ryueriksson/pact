import { NextRequest } from "next/server";
import { requireLeaseAccess } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiError, apiOk } from "@/lib/utils";

// GET /api/leases/[id]
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireLeaseAccess();

    const lease = await prisma.lease.findFirst({
      where: { id: params.id, userId: user.id },
      include: { leaseContract: true, leasePayments: true },
    });

    if (!lease) return apiError("Not found", 404);
    return apiOk({ lease });
  } catch (err) {
    if ((err as Error).message === "Unauthorized") return apiError("Unauthorized", 401);
    if ((err as Error).message === "Forbidden") return apiError("Forbidden", 403);
    return apiError("Server error", 500);
  }
}

// PATCH /api/leases/[id]
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireLeaseAccess();

    const lease = await prisma.lease.findFirst({
      where: { id: params.id, userId: user.id },
    });
    if (!lease) return apiError("Not found", 404);
    if (["ACTIVE", "EXPIRED", "CANCELLED"].includes(lease.status)) {
      return apiError("Cannot edit an active or closed lease");
    }

    const body = await req.json();
    const updated = await prisma.lease.update({
      where: { id: params.id, userId: user.id },
      data: {
        propertyAddress: body.propertyAddress ?? lease.propertyAddress,
        unitNumber: body.unitNumber !== undefined ? body.unitNumber : lease.unitNumber,
        tenantName: body.tenantName ?? lease.tenantName,
        tenantEmail: body.tenantEmail ?? lease.tenantEmail,
        monthlyRent: body.monthlyRent !== undefined ? Math.round(Number(body.monthlyRent)) : lease.monthlyRent,
        depositAmount: body.depositAmount !== undefined
          ? (body.depositAmount ? Math.round(Number(body.depositAmount)) : null)
          : lease.depositAmount,
        currency: body.currency ?? lease.currency,
        leaseStart: body.leaseStart ? new Date(body.leaseStart) : lease.leaseStart,
        leaseEnd: body.leaseEnd ? new Date(body.leaseEnd) : lease.leaseEnd,
        leaseDocUrl: body.leaseDocUrl !== undefined ? body.leaseDocUrl : lease.leaseDocUrl,
        contractBody: body.contractBody !== undefined ? body.contractBody : lease.contractBody,
        skipSigning: body.skipSigning !== undefined ? body.skipSigning : lease.skipSigning,
      },
    });
    return apiOk({ lease: updated });
  } catch (err) {
    if ((err as Error).message === "Unauthorized") return apiError("Unauthorized", 401);
    if ((err as Error).message === "Forbidden") return apiError("Forbidden", 403);
    console.error("[leases PATCH]", err);
    return apiError("Failed to update lease", 500);
  }
}
