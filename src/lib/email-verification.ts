import { prisma } from "@/lib/prisma";
import { isEmailConfigured, sendVerificationEmail } from "@/lib/email";
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
    return { sent: false, reason: "email_not_configured" as const };
  }

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

  await prisma.auditLog.create({
    data: {
      action: "EMAIL_VERIFICATION_SENT",
      actorId: userId,
      actorEmail: normalizedEmail,
      resourceType: "user",
      resourceId: userId,
    },
  });

  return { sent: true as const };
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

  await prisma.auditLog.create({
    data: {
      action: "EMAIL_VERIFIED",
      actorId: user.id,
      actorEmail: email,
      resourceType: "user",
      resourceId: user.id,
    },
  });

  return { ok: true as const, userId: user.id, email };
}
