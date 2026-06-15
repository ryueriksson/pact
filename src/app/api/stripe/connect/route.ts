import { NextRequest } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { apiError, apiOk } from "@/lib/utils";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL!;

// POST /api/stripe/connect
// Creates (or retrieves) a Stripe Express account and returns the onboarding URL
export async function POST(_req: NextRequest) {
  try {
    const user = await requireAuth();

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { stripeConnectId: true, stripeConnectOnboarded: true },
    });

    if (!dbUser) return apiError("User not found", 404);

    // If already fully onboarded, return dashboard link instead
    if (dbUser.stripeConnectId && dbUser.stripeConnectOnboarded) {
      const loginLink = await stripe.accounts.createLoginLink(dbUser.stripeConnectId);
      return apiOk({ url: loginLink.url, alreadyConnected: true });
    }

    // Create Express account if not yet created
    let accountId = dbUser.stripeConnectId;

    if (!accountId) {
      const account = await stripe.accounts.create({
        type: "express",
        email: user.email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_type: "individual",
        settings: {
          payouts: { schedule: { interval: "daily" } },
        },
      });

      accountId = account.id;

      await prisma.user.update({
        where: { id: user.id },
        data: { stripeConnectId: accountId },
      });
    }

    // Create onboarding link
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${APP_URL}/api/stripe/connect?refresh=true`,
      return_url: `${APP_URL}/api/stripe/connect/callback?account_id=${accountId}`,
      type: "account_onboarding",
    });

    return apiOk({ url: accountLink.url, alreadyConnected: false });
  } catch (err) {
    if ((err as Error).message === "Unauthorized") return apiError("Unauthorized", 401);
    console.error("[stripe/connect]", err);
    return apiError("Failed to start Stripe onboarding", 500);
  }
}

// GET /api/stripe/connect?refresh=true  — Stripe sends user here if link expired
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const refresh = searchParams.get("refresh");

  if (refresh) {
    // Re-generate account link and redirect
    try {
      const user = await requireAuth();
      const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { stripeConnectId: true },
      });

      if (!dbUser?.stripeConnectId) {
        return Response.redirect(`${APP_URL}/settings?error=no_account`);
      }

      const accountLink = await stripe.accountLinks.create({
        account: dbUser.stripeConnectId,
        refresh_url: `${APP_URL}/api/stripe/connect?refresh=true`,
        return_url: `${APP_URL}/api/stripe/connect/callback?account_id=${dbUser.stripeConnectId}`,
        type: "account_onboarding",
      });

      return Response.redirect(accountLink.url);
    } catch {
      return Response.redirect(`${APP_URL}/settings?error=refresh_failed`);
    }
  }

  return apiError("Not found", 404);
}
