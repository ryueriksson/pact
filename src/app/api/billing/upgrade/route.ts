import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createProSubscriptionSession } from "@/lib/stripe";
import { apiError, apiOk } from "@/lib/utils";

// POST /api/billing/upgrade — create Stripe Checkout for Pro plan
export async function POST(_req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return apiError("Unauthorized", 401);

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { email: true, plan: true },
    });

    if (!user) return apiError("User not found", 404);
    if (user.plan === "PRO") return apiError("Already on Pro plan", 400);

    const appUrl = process.env.NEXT_PUBLIC_APP_URL!;

    const checkoutSession = await createProSubscriptionSession({
      userId: session.user.id,
      userEmail: user.email,
      successUrl: `${appUrl}/settings?upgrade=success`,
      cancelUrl: `${appUrl}/upgrade`,
    });

    return apiOk({ url: checkoutSession.url });
  } catch (err) {
    console.error("[billing/upgrade]", err);
    return apiError("Failed to create checkout session", 500);
  }
}
