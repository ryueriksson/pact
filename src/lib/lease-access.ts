import type { LeaseStatus } from "@prisma/client";

/** Lease statuses reachable via the public share link (never DRAFT). */
const PUBLIC_LEASE_STATUSES: LeaseStatus[] = ["SENT", "SIGNED", "ACTIVE", "EXPIRED"];

export function isLeasePubliclyAccessible(status: LeaseStatus): boolean {
  return PUBLIC_LEASE_STATUSES.includes(status);
}

export const LEASE_NOT_SENT_MESSAGE =
  "This lease has not been sent yet. Ask your landlord to publish it.";
