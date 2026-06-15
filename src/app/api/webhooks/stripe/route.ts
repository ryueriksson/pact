import { NextRequest } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { sendPaymentConfirmation } from "@/lib/email";
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
        const proposalId = session.metadata?.proposalId;

        if (!proposalId) break;

        const proposal = await prisma.proposal.findUnique({
          where: { id: proposalId },
        });
        if (!proposal) break;

        // Mark payment as paid
        await prisma.payment.update({
          where: { proposalId },
          data: {
            stripePaymentIntentId: session.payment_intent as string,
            status: "PAID",
            paidAt: new Date(),
          },
        });

        // Update proposal status
        await prisma.proposal.update({
          where: { id: proposalId },
          data: { status: "PAID" },
        });

        // Confirm to client
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

      case "charge.refunded": {
        // Handle refunds — mark payment as refunded
        const charge = event.data.object;
        const paymentIntentId = charge.payment_intent as string;

        await prisma.payment.updateMany({
          where: { stripePaymentIntentId: paymentIntentId },
          data: { status: "REFUNDED" },
        });
        break;
      }

      default:
        // Unhandled event type — ignore
        break;
    }

    return Response.json({ received: true });
  } catch (err) {
    console.error("[stripe-webhook] Handler error:", err);
    return Response.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}
