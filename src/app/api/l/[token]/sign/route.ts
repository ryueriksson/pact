import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  isLeasePubliclyAccessible,
  LEASE_NOT_SENT_MESSAGE,
} from "@/lib/lease-access";
import { enforceRateLimit } from "@/lib/rate-limit";
import { signContractSchema } from "@/lib/validators";
import { sendLeaseSignedNotification } from "@/lib/email";
import { logAuditFromRequest } from "@/lib/audit-log";
import { apiError, apiOk } from "@/lib/utils";

// POST /api/l/[token]/sign — tenant signs the lease
export async function POST(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const limited = await enforceRateLimit(req, "lease-sign", 10, 60 * 60 * 1000);
    if (limited) return limited;

    const lease = await prisma.lease.findUnique({
      where: { token: params.token },
      include: { leaseContract: true, user: true },
    });

    if (!lease) return apiError("Not found", 404);
    if (lease.status === "CANCELLED") return apiError("Lease cancelled", 410);
    if (!isLeasePubliclyAccessible(lease.status)) {
      return apiError(LEASE_NOT_SENT_MESSAGE, 403);
    }
    if (lease.leaseContract?.signedAt) return apiError("Already signed", 409);
    if (lease.skipSigning) {
      return apiError("This lease does not require a digital signature", 400);
    }

    const body = await req.json();
    const parsed = signContractSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(parsed.error.issues[0].message, 422);
    }

    const { signerName, signerEmail, signatureData } = parsed.data;
    const ip = req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? undefined;

    await prisma.leaseContract.create({
      data: {
        leaseId: lease.id,
        signerName,
        signerEmail,
        signatureData,
        ipAddress: ip ?? null,
      },
    });

    await prisma.lease.update({
      where: { id: lease.id },
      data: { status: "SIGNED" },
    });

    try {
      await sendLeaseSignedNotification({
        to: lease.user.email,
        ownerName: lease.user.name ?? "Landlord",
        tenantName: signerName,
        propertyAddress: lease.propertyAddress,
        leaseId: lease.id,
      });
    } catch (e) {
      console.error("[lease sign] email failed:", e);
    }

    await logAuditFromRequest(req, {
      action: "LEASE_SIGNED",
      resourceType: "lease",
      resourceId: lease.id,
      metadata: { signerEmail },
    });

    return apiOk({
      signed: true,
      requiresDeposit: !!lease.depositAmount,
    });
  } catch (err) {
    console.error("[lease sign]", err);
    return apiError("Failed to submit signature", 500);
  }
}
