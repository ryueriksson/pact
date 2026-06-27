import { NextRequest } from "next/server";
import { requireLeaseAccess } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateToken } from "@/lib/tokens";
import { logAuditFromRequest } from "@/lib/audit-log";
import { apiError, apiOk } from "@/lib/utils";

// POST /api/leases — create a new lease
export async function POST(req: NextRequest) {
  try {
    const user = await requireLeaseAccess();
    const body = await req.json();
    const {
      propertyAddress,
      unitNumber,
      tenantName,
      tenantEmail,
      monthlyRent,
      depositAmount,
      currency = "usd",
      leaseStart,
      leaseEnd,
      leaseDocUrl,
      contractBody,
      skipSigning = false,
    } = body;

    if (!propertyAddress || !tenantName || !tenantEmail || !monthlyRent || !leaseStart || !leaseEnd) {
      return apiError("Property address, tenant details, monthly rent, and lease dates are required");
    }

    const lease = await prisma.lease.create({
      data: {
        userId: user.id,
        token: generateToken(32),
        propertyAddress,
        unitNumber: unitNumber || null,
        tenantName,
        tenantEmail,
        monthlyRent: Math.round(Number(monthlyRent)),
        depositAmount: depositAmount ? Math.round(Number(depositAmount)) : null,
        currency,
        leaseStart: new Date(leaseStart),
        leaseEnd: new Date(leaseEnd),
        leaseDocUrl: leaseDocUrl || null,
        contractBody: contractBody || null,
        skipSigning,
      },
    });

    await logAuditFromRequest(req, {
      action: "LEASE_CREATED",
      actorId: user.id,
      actorEmail: user.email,
      resourceType: "lease",
      resourceId: lease.id,
    });

    return apiOk({ lease }, 201);
  } catch (err) {
    if ((err as Error).message === "Unauthorized") return apiError("Unauthorized", 401);
    if ((err as Error).message === "Forbidden") return apiError("Forbidden", 403);
    console.error("[leases POST]", err);
    return apiError("Failed to create lease", 500);
  }
}
