import { NextRequest } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL!;

// GET /api/stripe/connect/callback?account_id=acct_xxx
// Stripe redirects here after the freelancer completes onboarding
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const accountId = searchParams.get("account_id");

  if (!accountId) {
    return Response.redirect(`${APP_URL}/settings?error=missing_account`);
  }

  try {
    const user = await requireAuth();

    // Verify the account belongs to this user
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { stripeConnectId: true },
    });

    if (dbUser?.stripeConnectId !== accountId) {
      return Response.redirect(`${APP_URL}/settings?error=account_mismatch`);
    }

    // Check if Stripe account is fully onboarded
    const account = await stripe.accounts.retrieve(accountId);
    const onboarded = account.details_submitted && !account.requirements?.currently_due?.length;

    await prisma.user.update({
      where: { id: user.id },
      data: {
        stripeConnectId: accountId,
        stripeConnectOnboarded: !!onboarded,
      },
    });

    if (onboarded) {
      return Response.redirect(`${APP_URL}/settings?stripe=connected`);
    } else {
      // Onboarding started but not complete — send them back
      return Response.redirect(`${APP_URL}/settings?stripe=incomplete`);
    }
  } catch (err) {
    console.error("[stripe/callback]", err);
    return Response.redirect(`${APP_URL}/settings?error=callback_failed`);
  }
}
