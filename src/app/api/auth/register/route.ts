import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validators";
import { enforceRateLimit, enforceRateLimitByKey } from "@/lib/rate-limit";
import { logAuditFromRequest } from "@/lib/audit-log";
import { createAndSendVerificationEmail } from "@/lib/email-verification";
import { apiError, apiOk } from "@/lib/utils";

const registerSuccessMessage =
  "Check your email to verify your account before signing in.";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return apiError(parsed.error.issues[0].message, 422);
    }

    const { name, email, password, businessCategory } = parsed.data;
    const normalizedEmail = email.toLowerCase().trim();

    // Rate limit after validation so typos don't consume the quota
    const ipLimited = await enforceRateLimit(req, "register", 20, 60 * 60 * 1000);
    if (ipLimited) return ipLimited;

    const emailLimited = await enforceRateLimitByKey(
      "register-email",
      normalizedEmail,
      10,
      60 * 60 * 1000
    );
    if (emailLimited) return emailLimited;

    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      return apiOk({ message: registerSuccessMessage, email: normalizedEmail }, 201);
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name,
        email: normalizedEmail,
        passwordHash,
        businessCategory,
      },
      select: { id: true, email: true, name: true },
    });

    await logAuditFromRequest(req, {
      action: "USER_REGISTERED",
      actorId: user.id,
      actorEmail: user.email,
      resourceType: "user",
      resourceId: user.id,
      metadata: { businessCategory },
    });

    try {
      await createAndSendVerificationEmail({
        userId: user.id,
        email: user.email,
        name: user.name,
      });
    } catch (err) {
      console.error("[register] verification email failed:", err);
    }

    return apiOk({ message: registerSuccessMessage, email: normalizedEmail }, 201);
  } catch (err) {
    console.error("[register]", err);
    return apiError("Something went wrong", 500);
  }
}
