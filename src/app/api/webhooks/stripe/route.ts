import { NextRequest } from "next/server";
import { stripe, PRO_SUBSCRIPTION_PRICE_CENTS } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { sendPaymentConfirmation, sendRentPaidReceipt } from "@/lib/email";
import { formatCurrency } from "@/lib/tokens";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return Response.json({ error: "No signature" }, { status: 400 });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("[stripe-webhook] Invalid signature:", err);
    return Response.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const eventType = session.metadata?.type;

        if (session.mode === "payment" && session.payment_status !== "paid") {
          break;
        }
        if (session.mode === "subscription" && session.status !== "complete") {
          break;
        }

        // ── Pro subscription — flip user plan ──────────────────
        if (eventType === "pro_subscription") {
          const userId = session.metadata?.userId;
          if (!userId) break;
          if (session.amount_total !== PRO_SUBSCRIPTION_PRICE_CENTS) break;

          await prisma.user.update({
            where: { id: userId },
            data: {
              plan: "PRO",
              stripeCustomerId: session.customer as string,
            },
          });
          break;
        }

        // ── Lease deposit (one-time) ───────────────────────────
        if (eventType === "lease_deposit") {
          const leaseId = session.metadata?.leaseId;
          if (!leaseId) break;

          await prisma.leasePayment.updateMany({
            where: {
              leaseId,
              type: "DEPOSIT",
              status: "PENDING",
              stripeSessionId: session.id,
            },
            data: { status: "PAID", paidAt: new Date() },
          });
          break;
        }

        // ── Lease rent subscription set up ─────────────────────
        if (eventType === "lease_rent") {
          const leaseId = session.metadata?.leaseId;
          const subId = session.subscription as string | null;
          if (!leaseId || !subId) break;

          await prisma.lease.update({
            where: { id: leaseId },
            data: { status: "ACTIVE", stripeSubId: subId },
          });
          break;
        }

        // ── Proposal deposit ───────────────────────────────────
        const proposalId = session.metadata?.proposalId;
        if (!proposalId) break;

        const proposal = await prisma.proposal.findUnique({
          where: { id: proposalId },
        });
        if (!proposal) break;

        await prisma.payment.update({
          where: { proposalId },
          data: {
            stripePaymentIntentId: session.payment_intent as string,
            status: "PAID",
            paidAt: new Date(),
          },
        });

        await prisma.proposal.update({
          where: { id: proposalId },
          data: { status: "PAID" },
        });

        if (proposal.depositAmount) {
          await sendPaymentConfirmation({
            to: proposal.clientEmail,
            clientName: proposal.clientName,
            proposalTitle: proposal.title,
            amountFormatted: formatCurrency(proposal.depositAmount, proposal.currency),
          });
        }
        break;
      }

      // ── Pro subscription cancelled/deleted ─────────────────
      case "customer.subscription.deleted": {
        const sub = event.data.object;
        const customerId = sub.customer as string;

        await prisma.user.updateMany({
          where: { stripeCustomerId: customerId },
          data: { plan: "FREE" },
        });
        break;
      }

      case "checkout.session.expired": {
        const session = event.data.object;
        const proposalId = session.metadata?.proposalId;
        if (!proposalId) break;

        await prisma.payment.updateMany({
          where: { proposalId, status: "PENDING" },
          data: { status: "FAILED" },
        });
        break;
      }

      // ── Lease: monthly rent invoice paid ───────────────────
      case "invoice.payment_succeeded": {
        const invoice = event.data.object;
        const subId = invoice.subscription as string | null;
        if (!subId) break;

        const lease = await prisma.lease.findFirst({
          where: { stripeSubId: subId },
        });
        if (!lease) break;

        await prisma.leasePayment.upsert({
          where: { stripeInvoiceId: invoice.id },
          create: {
            leaseId: lease.id,
            type: "RENT",
            amount: invoice.amount_paid,
            currency: invoice.currency,
            stripeInvoiceId: invoice.id,
            status: "PAID",
            paidAt: new Date(),
          },
          update: {},
        });

        const month = new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" });
        try {
          await sendRentPaidReceipt({
            to: lease.tenantEmail,
            tenantName: lease.tenantName,
            propertyAddress: lease.propertyAddress,
            amountFormatted: formatCurrency(invoice.amount_paid, invoice.currency),
            month,
          });
        } catch (e) {
          console.error("[webhook] rent receipt email failed:", e);
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object;
        const subId = invoice.subscription as string | null;
        if (!subId) break;

        const lease = await prisma.lease.findFirst({ where: { stripeSubId: subId } });
        if (!lease) break;

        await prisma.leasePayment.upsert({
          where: { stripeInvoiceId: invoice.id },
          create: {
            leaseId: lease.id,
            type: "RENT",
            amount: invoice.amount_due,
            currency: invoice.currency,
            stripeInvoiceId: invoice.id,
            status: "FAILED",
            dueDate: new Date(),
          },
          update: {},
        });
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object;
        const paymentIntentId = charge.payment_intent as string;

        await prisma.payment.updateMany({
          where: { stripePaymentIntentId: paymentIntentId },
          data: { status: "REFUNDED" },
        });
        break;
      }

      default:
        break;
    }

    return Response.json({ received: true });
  } catch (err) {
    console.error("[stripe-webhook] Handler error:", err);
    return Response.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}
