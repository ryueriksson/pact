# Activating In-App Payments

When 株式会社龍 is incorporated and your Stripe account is ready, swap in these 4 files to go live with payments.

## Prerequisites

1. **Stripe account** — Create at stripe.com, enable Connect for your platform
2. **Environment variables** — Add to `.env.local` and Vercel:
   ```
   STRIPE_SECRET_KEY=sk_live_...
   STRIPE_PUBLISHABLE_KEY=pk_live_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
   ```
3. **Stripe webhook** — Point `yourdomain.com/api/webhooks/stripe` to your Stripe webhook, listening for:
   - `checkout.session.completed`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `account.updated`

## The swap (4 files)

| Replace this file | With this file from _payment-upgrade/ |
|---|---|
| `src/components/client-lease-view.tsx` | `client-lease-view.tsx` |
| `src/app/(dashboard)/settings/page.tsx` | `settings.page.tsx` |
| `src/app/(dashboard)/leases/[id]/page.tsx` | `leases-detail-page.tsx` |
| `src/app/l/[token]/page.tsx` | `tenant-lease-page.tsx` |

```bash
# From the pact/ directory:
cp _payment-upgrade/client-lease-view.tsx src/components/client-lease-view.tsx
cp _payment-upgrade/settings.page.tsx src/app/\(dashboard\)/settings/page.tsx
cp _payment-upgrade/leases-detail-page.tsx src/app/\(dashboard\)/leases/\[id\]/page.tsx
cp _payment-upgrade/tenant-lease-page.tsx src/app/l/\[token\]/page.tsx
```

## What activates

- Tenant flow: review → sign → deposit (if applicable) → set up monthly rent → done
- Stripe Connect onboarding in Settings for landlords
- Webhook handlers for deposit confirmation and monthly rent receipts
- ACH bank transfer + card supported in all Checkout sessions
- 1.5% platform fee on all transactions (goes to your Stripe account)

## Platform fee

In `src/lib/stripe.ts`, the fee is set at line 13:
```ts
const PLATFORM_FEE_PERCENT = 0.015; // 1.5%
```
Adjust this before going live.

## Email receipts

`src/lib/email.ts` already has `sendRentPaidReceipt()` wired to the webhook.
Add your Resend API key: `RESEND_API_KEY=re_...`
