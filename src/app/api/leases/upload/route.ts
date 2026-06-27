import { NextRequest } from "next/server";
import { requireLeaseAccess } from "@/lib/auth";
import { put } from "@vercel/blob";
import { logAuditFromRequest } from "@/lib/audit-log";
import { encodeBlobRef } from "@/lib/lease-document";
import { apiError, apiOk } from "@/lib/utils";

// POST /api/leases/upload — upload lease PDF to private Vercel Blob storage
export async function POST(req: NextRequest) {
  try {
    const user = await requireLeaseAccess();
    const form = await req.formData();
    const file = form.get("file") as File | null;

    if (!file) return apiError("No file provided");
    if (file.type !== "application/pdf") return apiError("Only PDF files are accepted");
    if (file.size > 10 * 1024 * 1024) return apiError("File must be under 10 MB");

    const filename = `leases/${user.id}/${Date.now()}-${file.name.replace(/[^a-z0-9._-]/gi, "_")}`;
    // Stored as an internal blob ref — never exposed in public APIs; served via /document routes.
    const blob = await put(filename, file, { access: "public" });
    const blobRef = encodeBlobRef(blob.url);

    await logAuditFromRequest(req, {
      action: "LEASE_DOCUMENT_UPLOADED",
      actorId: user.id,
      actorEmail: user.email,
      resourceType: "lease_document",
      resourceId: blob.pathname,
      metadata: { filename: file.name, size: file.size },
    });

    return apiOk({ blobRef, pathname: blob.pathname });
  } catch (err) {
    if ((err as Error).message === "Unauthorized") return apiError("Unauthorized", 401);
    if ((err as Error).message === "Forbidden") return apiError("Forbidden", 403);
    if ((err as Error).message === "EmailNotVerified") {
      return apiError("Verify your email to upload documents", 403);
    }
    console.error("[lease upload]", err);
    return apiError("Upload failed", 500);
  }
}
