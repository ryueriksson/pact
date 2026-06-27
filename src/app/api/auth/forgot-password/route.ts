import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { isEmailConfigured, sendPasswordResetEmail } from "@/lib/email";
import { generateToken } from "@/lib/tokens";
import { forgotPasswordSchema } from "@/lib/validators";
import { apiError, apiOk } from "@/lib/utils";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
const RESET_EXPIRY_HOURS = 1;

const successMessage =
  "If an account exists for that email, we sent a password reset link.";

// POST /api/auth/forgot-password
export async function POST(req: NextRequest) {
  try {
    if (!isEmailConfigured()) {
      return apiError(
        "Email is not configured yet. Add RESEND_API_KEY to your environment.",
        503
      );
    }

    const body = await req.json();
    const parsed = forgotPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return apiError(parsed.error.issues[0].message, 422);
    }

    const email = parsed.data.email.toLowerCase().trim();

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, passwordHash: true },
    });

    // Always return the same message — don't reveal whether the email exists
    if (!user?.passwordHash) {
      return apiOk({ message: successMessage });
    }

    const token = generateToken(32);
    const expires = new Date();
    expires.setHours(expires.getHours() + RESET_EXPIRY_HOURS);

    await prisma.verificationToken.deleteMany({ where: { identifier: email } });
    await prisma.verificationToken.create({
      data: { identifier: email, token, expires },
    });

    const resetUrl = `${APP_URL}/reset-password?token=${token}`;

    await sendPasswordResetEmail({ to: email, resetUrl });

    return apiOk({ message: successMessage });
  } catch (err) {
    console.error("[forgot-password]", err);
    return apiError("Something went wrong", 500);
  }
}
