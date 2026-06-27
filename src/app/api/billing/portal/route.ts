import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createBillingPortalSession } from "@/lib/stripe";
import { apiError, apiOk } from "@/lib/utils";

// POST /api/billing/portal — redirect Pro user to Stripe billing portal
export async function POST(_req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return apiError("Unauthorized", 401);

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { stripeCustomerId: true, plan: true },
    });

    if (!user) return apiError("User not found", 404);
    if (!user.stripeCustomerId) return apiError("No billing account found", 400);

    const appUrl = process.env.NEXT_PUBLIC_APP_URL!;

    const portalSession = await createBillingPortalSession({
      stripeCustomerId: user.stripeCustomerId,
      returnUrl: `${appUrl}/settings`,
    });

    return apiOk({ url: portalSession.url });
  } catch (err) {
    console.error("[billing/portal]", err);
    return apiError("Failed to create portal session", 500);
  }
}
