import Stripe from "stripe";

export const STRIPE_NOT_CONFIGURED = "STRIPE_NOT_CONFIGURED";

let stripeClient: Stripe | null = null;

export function isStripeConfigured() {
  return !!process.env.STRIPE_SECRET_KEY?.trim();
}

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) {
    throw new Error(STRIPE_NOT_CONFIGURED);
  }

  if (!stripeClient) {
    stripeClient = new Stripe(key, {
      apiVersion: "2025-02-24.acacia",
      typescript: true,
    });
  }

  return stripeClient;
}

/** Lazy Stripe client — avoids crashing routes when keys are not set yet. */
export const stripe: Stripe = new Proxy({} as Stripe, {
  get(_target, prop, receiver) {
    const client = getStripe();
    const value = Reflect.get(client, prop, receiver);
    return typeof value === "function" ? value.bind(client) : value;
  },
});

// Platform fee: 1% of transaction
const PLATFORM_FEE_PERCENT = 0.01;

/** Create a Stripe Checkout session for a lease security deposit (one-time). */
export async function createLeaseDepositSession({
  leaseId,
  propertyAddress,
  tenantEmail,
  amountCents,
  currency = "usd",
  connectedAccountId,
  successUrl,
  cancelUrl,
  waiveFee = false,
}: {
  leaseId: string;
  propertyAddress: string;
  tenantEmail: string;
  amountCents: number;
  currency?: string;
  connectedAccountId: string;
  successUrl: string;
  cancelUrl: string;
  waiveFee?: boolean;
}) {
  const platformFeeCents = waiveFee ? 0 : Math.round(amountCents * PLATFORM_FEE_PERCENT);

  return stripe.checkout.sessions.create({
    payment_method_types: ["card", "us_bank_account"],
    mode: "payment",
    customer_email: tenantEmail,
    line_items: [
      {
        price_data: {
          currency,
          product_data: {
            name: `Security Deposit — ${propertyAddress}`,
            description: "One-time security deposit",
          },
          unit_amount: amountCents,
        },
        quantity: 1,
      },
    ],
    payment_intent_data: {
      transfer_data: { destination: connectedAccountId },
      ...(platformFeeCents > 0 && { application_fee_amount: platformFeeCents }),
    },
    metadata: { leaseId, type: "lease_deposit" },
    success_url: successUrl,
    cancel_url: cancelUrl,
    expires_at: Math.floor(Date.now() / 1000) + 60 * 30,
  });
}

/** Create a Stripe Checkout subscription for recurring monthly rent.
 *  Tenant enters card once; Stripe auto-charges monthly and routes to landlord.
 *  Pact takes 1% application_fee_percent from each invoice.
 */
export async function createLeaseRentSubscription({
  leaseId,
  propertyAddress,
  tenantEmail,
  monthlyRentCents,
  currency = "usd",
  connectedAccountId,
  successUrl,
  cancelUrl,
  waiveFee = false,
}: {
  leaseId: string;
  propertyAddress: string;
  tenantEmail: string;
  monthlyRentCents: number;
  currency?: string;
  connectedAccountId: string;
  successUrl: string;
  cancelUrl: string;
  waiveFee?: boolean;
}) {
  return stripe.checkout.sessions.create({
    payment_method_types: ["card", "us_bank_account"],
    mode: "subscription",
    customer_email: tenantEmail,
    line_items: [
      {
        price_data: {
          currency,
          product_data: {
            name: `Monthly Rent — ${propertyAddress}`,
            description: "Recurring monthly rent",
          },
          unit_amount: monthlyRentCents,
          recurring: { interval: "month" },
        },
        quantity: 1,
      },
    ],
    subscription_data: {
      ...(waiveFee ? {} : { application_fee_percent: PLATFORM_FEE_PERCENT * 100 }),
      transfer_data: { destination: connectedAccountId },
      metadata: { leaseId, type: "lease_rent" },
    },
    metadata: { leaseId, type: "lease_rent" },
    success_url: successUrl,
    cancel_url: cancelUrl,
  });
}

/** Create a Stripe Checkout session for a Pact Pro subscription ($30/mo).
 *  Payment goes directly to Pact's platform account (no Connect).
 */
export async function createProSubscriptionSession({
  userId,
  userEmail,
  successUrl,
  cancelUrl,
}: {
  userId: string;
  userEmail: string;
  successUrl: string;
  cancelUrl: string;
}) {
  return stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "subscription",
    customer_email: userEmail,
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: "Pact Pro",
            description: "Unlimited proposals & leases, no transaction fees",
          },
          unit_amount: 3000, // $30.00
          recurring: { interval: "month" },
        },
        quantity: 1,
      },
    ],
    metadata: { userId, type: "pro_subscription" },
    success_url: successUrl,
    cancel_url: cancelUrl,
  });
}

/** Create a Stripe billing portal session so Pro users can manage/cancel their subscription. */
export async function createBillingPortalSession({
  stripeCustomerId,
  returnUrl,
}: {
  stripeCustomerId: string;
  returnUrl: string;
}) {
  return stripe.billingPortal.sessions.create({
    customer: stripeCustomerId,
    return_url: returnUrl,
  });
}

/** Create a Stripe Checkout session for a proposal deposit.
 *  Routes payment directly to the freelancer's connected Stripe account.
 *  Pact takes a 1% application fee.
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
  waiveFee = false,
}: {
  proposalId: string;
  proposalTitle: string;
  clientEmail: string;
  amountCents: number;
  currency?: string;
  connectedAccountId: string;
  successUrl: string;
  cancelUrl: string;
  waiveFee?: boolean;
}) {
  const platformFeeCents = waiveFee ? 0 : Math.round(amountCents * PLATFORM_FEE_PERCENT);

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
      transfer_data: { destination: connectedAccountId },
      ...(platformFeeCents > 0 && { application_fee_amount: platformFeeCents }),
    },
    metadata: { proposalId },
    success_url: successUrl,
    cancel_url: cancelUrl,
    expires_at: Math.floor(Date.now() / 1000) + 60 * 30, // 30 min
  });
}
