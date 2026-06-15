import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("Missing STRIPE_SECRET_KEY environment variable");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-02-24.acacia",
  typescript: true,
});

// Platform fee: 1.5% of transaction
const PLATFORM_FEE_PERCENT = 0.015;

/** Create a Stripe Checkout session for a proposal deposit.
 *  Routes payment directly to the freelancer's connected Stripe account.
 *  Pact takes a 1.5% application fee.
 */
export async function createCheckoutSession({
  proposalId,
  proposalTitle,
  clientEmail,
  amountCents,
  currency = "usd",
  connectedAccountId,
  successUrl,
  cancelUrl,
}: {
  proposalId: string;
  proposalTitle: string;
  clientEmail: string;
  amountCents: number;
  currency?: string;
  connectedAccountId: string;
  successUrl: string;
  cancelUrl: string;
}) {
  const platformFeeCents = Math.round(amountCents * PLATFORM_FEE_PERCENT);

  return stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    customer_email: clientEmail,
    line_items: [
      {
        price_data: {
          currency,
          product_data: {
            name: `Deposit — ${proposalTitle}`,
            description: "Project deposit as outlined in proposal",
          },
          unit_amount: amountCents,
        },
        quantity: 1,
      },
    ],
    payment_intent_data: {
      // Money goes directly to the freelancer's Stripe account
      transfer_data: { destination: connectedAccountId },
      // Pact keeps 1.5% as a platform fee
      application_fee_amount: platformFeeCents,
    },
    metadata: { proposalId },
    success_url: successUrl,
    cancel_url: cancelUrl,
    expires_at: Math.floor(Date.now() / 1000) + 60 * 30, // 30 min
  });
}
