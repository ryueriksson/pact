import { NextRequest } from "next/server";
import { requireLeaseAccess } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAuditFromRequest } from "@/lib/audit-log";
import { resolveLeaseDocumentUrl } from "@/lib/lease-document";
import { apiError } from "@/lib/utils";

// GET /api/leases/[id]/document — signed redirect for landlord PDF access
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireLeaseAccess();

    const lease = await prisma.lease.findFirst({
      where: { id: params.id, userId: user.id },
      select: { id: true, leaseDocUrl: true },
    });

    if (!lease?.leaseDocUrl) return apiError("No document found", 404);

    const downloadUrl = await resolveLeaseDocumentUrl(lease.leaseDocUrl);
    if (!downloadUrl) return apiError("Document unavailable", 404);

    await logAuditFromRequest(req, {
      action: "LEASE_DOCUMENT_ACCESSED",
      actorId: user.id,
      actorEmail: user.email,
      resourceType: "lease",
      resourceId: lease.id,
      metadata: { access: "landlord" },
    });

    return Response.redirect(downloadUrl, 302);
  } catch (err) {
    if ((err as Error).message === "Unauthorized") return apiError("Unauthorized", 401);
    if ((err as Error).message === "Forbidden") return apiError("Forbidden", 403);
    if ((err as Error).message === "EmailNotVerified") {
      return apiError("Verify your email to access documents", 403);
    }
    console.error("[lease document]", err);
    return apiError("Failed to load document", 500);
  }
}
