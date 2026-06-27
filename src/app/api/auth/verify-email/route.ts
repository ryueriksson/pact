import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { enforceRateLimit, enforceRateLimitByKey } from "@/lib/rate-limit";
import { createAndSendVerificationEmail, verifyEmailToken } from "@/lib/email-verification";
import { apiError, apiOk } from "@/lib/utils";

const verifySchema = z.object({
  token: z.string().min(1),
});

// POST /api/auth/verify-email — confirm email with token
export async function POST(req: NextRequest) {
  try {
    const limited = await enforceRateLimit(req, "verify-email", 20, 60 * 60 * 1000);
    if (limited) return limited;

    const body = await req.json();
    const parsed = verifySchema.safeParse(body);
    if (!parsed.success) {
      return apiError("Invalid verification link", 422);
    }

    const result = await verifyEmailToken(parsed.data.token);
    if (!result.ok) {
      return apiError("This verification link is invalid or has expired.", 400);
    }

    return apiOk({ message: "Email verified. You can sign in now.", email: result.email });
  } catch (err) {
    console.error("[verify-email]", err);
    return apiError("Something went wrong", 500);
  }
}

const resendSchema = z.object({
  email: z.string().email(),
});

// PUT /api/auth/verify-email — resend verification email
export async function PUT(req: NextRequest) {
  try {
    const limited = await enforceRateLimit(req, "resend-verification", 5, 60 * 60 * 1000);
    if (limited) return limited;

    const body = await req.json();
    const parsed = resendSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("Invalid email", 422);
    }

    const email = parsed.data.email.toLowerCase().trim();
    const emailLimited = await enforceRateLimitByKey(
      "resend-verification-email",
      email,
      3,
      60 * 60 * 1000
    );
    if (emailLimited) return emailLimited;

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, name: true, emailVerified: true, passwordHash: true },
    });

    const genericMessage =
      "If an unverified account exists for that email, we sent a new verification link.";

    if (!user?.passwordHash || user.emailVerified) {
      return apiOk({ message: genericMessage });
    }

    try {
      await createAndSendVerificationEmail({
        userId: user.id,
        email: user.email,
        name: user.name,
      });
    } catch (err) {
      console.error("[resend-verification]", err);
      return apiError(
        "Email is not configured yet. Add RESEND_API_KEY to your environment.",
        503
      );
    }

    return apiOk({ message: genericMessage });
  } catch (err) {
    console.error("[resend-verification]", err);
    return apiError("Something went wrong", 500);
  }
}
