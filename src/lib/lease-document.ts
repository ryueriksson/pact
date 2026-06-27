import { head } from "@vercel/blob";

const BLOB_REF_PREFIX = "blob:";

/** Encode a private blob URL for storage in the database. */
export function encodeBlobRef(blobUrl: string): string {
  return `${BLOB_REF_PREFIX}${blobUrl}`;
}

export function isBlobRef(stored: string | null | undefined): boolean {
  return !!stored?.startsWith(BLOB_REF_PREFIX);
}

export function decodeBlobRef(stored: string): string | null {
  if (!stored) return null;
  if (stored.startsWith(BLOB_REF_PREFIX)) {
    return stored.slice(BLOB_REF_PREFIX.length);
  }
  return null;
}

/** Whether the lease record has an uploaded PDF (private or legacy public). */
export function hasLeaseDocument(stored: string | null | undefined): boolean {
  return !!stored?.trim();
}

/**
 * Resolve a short-lived download URL for a stored lease document reference.
 * Legacy public URLs are returned as-is for backwards compatibility.
 */
export async function resolveLeaseDocumentUrl(
  stored: string | null | undefined
): Promise<string | null> {
  if (!stored) return null;

  const privateUrl = decodeBlobRef(stored);
  if (privateUrl) {
    const meta = await head(privateUrl);
    return meta.downloadUrl;
  }

  if (stored.startsWith("http")) {
    return stored;
  }

  return null;
}
