import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError } from "@/lib/utils";

export function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

type RateLimitResult = { success: true } | { success: false; retryAfter: number };

/** Database-backed sliding window rate limit (works across serverless instances). */
export async function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + windowMs);

  try {
    const bucket = await prisma.rateLimitBucket.findUnique({ where: { key } });

    if (!bucket || bucket.expiresAt < now) {
      await prisma.rateLimitBucket.upsert({
        where: { key },
        create: { key, count: 1, expiresAt },
        update: { count: 1, expiresAt },
      });
      return { success: true };
    }

    if (bucket.count >= limit) {
      const retryAfter = Math.max(
        1,
        Math.ceil((bucket.expiresAt.getTime() - now.getTime()) / 1000)
      );
      return { success: false, retryAfter };
    }

    await prisma.rateLimitBucket.update({
      where: { key },
      data: { count: { increment: 1 } },
    });
    return { success: true };
  } catch (err) {
    console.error("[rate-limit]", err);
    // Fail closed — prefer blocking over allowing abuse when the limiter is unavailable
    return { success: false, retryAfter: 60 };
  }
}

/** Apply rate limit; returns a 429 response when exceeded, otherwise null. */
export async function enforceRateLimit(
  req: NextRequest,
  scope: string,
  limit: number,
  windowMs: number,
  identifier?: string
) {
  const ip = getClientIp(req);
  const key = identifier ? `${scope}:${identifier}:${ip}` : `${scope}:${ip}`;
  const result = await checkRateLimit(key, limit, windowMs);

  if (!result.success) {
    return apiError("Too many requests. Please try again later.", 429);
  }

  return null;
}

/** Rate limit keyed by identifier only (e.g. email), regardless of IP. */
export async function enforceRateLimitByKey(
  scope: string,
  identifier: string,
  limit: number,
  windowMs: number
) {
  const key = `${scope}:${identifier.toLowerCase().trim()}`;
  const result = await checkRateLimit(key, limit, windowMs);

  if (!result.success) {
    return apiError("Too many requests. Please try again later.", 429);
  }

  return null;
}
