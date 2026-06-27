import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validators";
import { enforceRateLimit, enforceRateLimitByKey } from "@/lib/rate-limit";
import { logAuditFromRequest } from "@/lib/audit-log";
import {
  createAndSendVerificationEmail,
  registerErrorMessage,
} from "@/lib/email-verification";
import { apiError, apiOk } from "@/lib/utils";

export const runtime = "nodejs";

const registerSuccessMessage =
  "Check your email to verify your account before signing in.";

export async function POST(req: NextRequest) {
  if (!process.env.DATABASE_URL?.trim()) {
    console.error("[register] DATABASE_URL is not configured");
    return apiError(
      "Registration is temporarily unavailable. The server database is not configured.",
      503
    );
  }

  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return apiError(parsed.error.issues[0].message, 422);
    }

    const { name, email, password, businessCategory } = parsed.data;
    const normalizedEmail = email.toLowerCase().trim();

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

    const emailResult = await createAndSendVerificationEmail({
      userId: user.id,
      email: user.email,
      name: user.name,
    });

    return apiOk(
      {
        message: registerSuccessMessage,
        email: normalizedEmail,
        verificationEmailSent: emailResult.sent,
      },
      201
    );
  } catch (err) {
    console.error("[register]", err);
    const message = registerErrorMessage(err);
    const status =
      err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002"
        ? 409
        : err instanceof Prisma.PrismaClientInitializationError
          ? 503
          : 500;
    return apiError(message, status);
  }
}
