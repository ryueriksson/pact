import { PrismaClient, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { isEmailConfigured, sendVerificationEmail } from "@/lib/email";
import { logAuditEvent } from "@/lib/audit-log";
import { generateToken } from "@/lib/tokens";

const VERIFY_PREFIX = "verify-email:";
const VERIFY_EXPIRY_HOURS = 24;

export function verificationIdentifier(email: string) {
  return `${VERIFY_PREFIX}${email.toLowerCase().trim()}`;
}

export async function createAndSendVerificationEmail({
  userId,
  email,
  name,
}: {
  userId: string;
  email: string;
  name?: string | null;
}) {
  if (!isEmailConfigured()) {
    console.warn("[email-verification] RESEND_API_KEY not configured");
    return { sent: false, reason: "email_not_configured" as const };
  }

  try {
    const normalizedEmail = email.toLowerCase().trim();
    const identifier = verificationIdentifier(normalizedEmail);
    const token = generateToken(32);
    const expires = new Date();
    expires.setHours(expires.getHours() + VERIFY_EXPIRY_HOURS);

    await prisma.verificationToken.deleteMany({ where: { identifier } });
    await prisma.verificationToken.create({
      data: { identifier, token, expires },
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const verifyUrl = `${appUrl}/verify-email?token=${token}`;

    await sendVerificationEmail({
      to: normalizedEmail,
      name: name ?? normalizedEmail,
      verifyUrl,
    });

    await logAuditEvent({
      action: "EMAIL_VERIFICATION_SENT",
      actorId: userId,
      actorEmail: normalizedEmail,
      resourceType: "user",
      resourceId: userId,
    });

    return { sent: true as const };
  } catch (err) {
    console.error("[email-verification]", err);
    return { sent: false, reason: "send_failed" as const };
  }
}

export async function verifyEmailToken(token: string) {
  const record = await prisma.verificationToken.findUnique({ where: { token } });
  if (!record || record.expires < new Date()) {
    return { ok: false as const, reason: "invalid_or_expired" as const };
  }

  if (!record.identifier.startsWith(VERIFY_PREFIX)) {
    return { ok: false as const, reason: "invalid_or_expired" as const };
  }

  const email = record.identifier.slice(VERIFY_PREFIX.length);
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, emailVerified: true },
  });

  if (!user) {
    return { ok: false as const, reason: "invalid_or_expired" as const };
  }

  if (!user.emailVerified) {
    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { emailVerified: new Date() },
      }),
      prisma.verificationToken.delete({ where: { token } }),
    ]);
  } else {
    await prisma.verificationToken.delete({ where: { token } });
  }

  await logAuditEvent({
    action: "EMAIL_VERIFIED",
    actorId: user.id,
    actorEmail: email,
    resourceType: "user",
    resourceId: user.id,
  });

  return { ok: true as const, userId: user.id, email };
}

function registerErrorMessage(err: unknown): string {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      return "An account with this email already exists. Try signing in instead.";
    }
  }

  if (err instanceof Prisma.PrismaClientInitializationError) {
    return "The server could not connect to the database. Please try again in a few minutes.";
  }

  const message = err instanceof Error ? err.message : String(err);
  if (message.includes("DATABASE_URL") || message.includes("Can't reach database")) {
    return "The server could not connect to the database. Please try again in a few minutes.";
  }

  return "Something went wrong. Please try again.";
}

export { registerErrorMessage };
