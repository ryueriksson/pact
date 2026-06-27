import { NextRequest } from "next/server";
import { requireLeaseAccess } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateToken } from "@/lib/tokens";
import { sendLeaseLink } from "@/lib/email";
import { logAuditFromRequest } from "@/lib/audit-log";
import { apiError, apiOk } from "@/lib/utils";

// POST /api/leases/[id]/publish — send to tenant
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireLeaseAccess();

    const lease = await prisma.lease.findFirst({
      where: { id: params.id, userId: user.id },
    });
    if (!lease) return apiError("Not found", 404);
    if (lease.status !== "DRAFT") return apiError("Lease already sent");

    const shareToken = generateToken(32);

    await prisma.lease.update({
      where: { id: params.id, userId: user.id },
      data: { status: "SENT", token: shareToken },
    });

    try {
      await sendLeaseLink({
        to: lease.tenantEmail,
        tenantName: lease.tenantName,
        senderName: user.name ?? user.email ?? "Your landlord",
        propertyAddress: lease.propertyAddress,
        token: shareToken,
      });
    } catch (e) {
      console.error("[lease publish] email failed:", e);
    }

    await logAuditFromRequest(req, {
      action: "LEASE_PUBLISHED",
      actorId: user.id,
      actorEmail: user.email,
      resourceType: "lease",
      resourceId: lease.id,
      metadata: { tenantEmail: lease.tenantEmail },
    });

    return apiOk({ token: shareToken });
  } catch (err) {
    if ((err as Error).message === "Unauthorized") return apiError("Unauthorized", 401);
    if ((err as Error).message === "Forbidden") return apiError("Forbidden", 403);
    return apiError("Failed to publish lease", 500);
  }
}
