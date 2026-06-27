import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { resetPasswordSchema } from "@/lib/validators";
import { enforceRateLimit } from "@/lib/rate-limit";
import { logAuditFromRequest } from "@/lib/audit-log";
import { apiError, apiOk } from "@/lib/utils";

// POST /api/auth/reset-password
export async function POST(req: NextRequest) {
  try {
    const limited = await enforceRateLimit(req, "reset-password", 10, 60 * 60 * 1000);
    if (limited) return limited;

    const body = await req.json();
    const parsed = resetPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return apiError(parsed.error.issues[0].message, 422);
    }

    const { token, password } = parsed.data;

    const record = await prisma.verificationToken.findUnique({
      where: { token },
    });

    if (!record || record.expires < new Date()) {
      return apiError("This reset link is invalid or has expired.", 400);
    }

    const email = record.identifier.toLowerCase().trim();

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, passwordHash: true },
    });

    if (!user?.passwordHash) {
      return apiError(
        "No password account found for this email. Try signing in with Google instead.",
        400
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { passwordHash },
      }),
      prisma.session.deleteMany({ where: { userId: user.id } }),
      prisma.verificationToken.delete({ where: { token } }),
    ]);

    await logAuditFromRequest(req, {
      action: "PASSWORD_RESET",
      actorId: user.id,
      actorEmail: email,
      resourceType: "user",
      resourceId: user.id,
    });

    return apiOk({ message: "Password updated. You can sign in now." });
  } catch (err) {
    console.error("[reset-password]", err);
    return apiError("Something went wrong", 500);
  }
}
