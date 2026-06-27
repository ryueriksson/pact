import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  isLeasePubliclyAccessible,
  LEASE_NOT_SENT_MESSAGE,
} from "@/lib/lease-access";
import { logAuditFromRequest } from "@/lib/audit-log";
import { resolveLeaseDocumentUrl } from "@/lib/lease-document";
import { enforceRateLimit } from "@/lib/rate-limit";
import { apiError } from "@/lib/utils";

// GET /api/l/[token]/document — signed redirect for tenant PDF access
export async function GET(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  const limited = await enforceRateLimit(req, "lease-document", 30, 60 * 60 * 1000);
  if (limited) return limited;

  const lease = await prisma.lease.findUnique({
    where: { token: params.token },
    select: { id: true, leaseDocUrl: true, status: true },
  });

  if (!lease) return apiError("Not found", 404);
  if (lease.status === "CANCELLED") return apiError("This lease has been cancelled", 410);
  if (!isLeasePubliclyAccessible(lease.status)) {
    return apiError(LEASE_NOT_SENT_MESSAGE, 403);
  }
  if (!lease.leaseDocUrl) return apiError("No document found", 404);

  try {
    const downloadUrl = await resolveLeaseDocumentUrl(lease.leaseDocUrl);
    if (!downloadUrl) return apiError("Document unavailable", 404);

    await logAuditFromRequest(req, {
      action: "LEASE_DOCUMENT_ACCESSED",
      resourceType: "lease",
      resourceId: lease.id,
      metadata: { access: "tenant", token: params.token },
    });

    return Response.redirect(downloadUrl, 302);
  } catch (err) {
    console.error("[tenant lease document]", err);
    return apiError("Failed to load document", 500);
  }
}
