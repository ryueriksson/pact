import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.EMAIL_FROM ?? "Pact <noreply@pact.so>";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

// ─── Email Templates ──────────────────────────────────────────────────────────

export async function sendProposalLink({
  to,
  clientName,
  senderName,
  proposalTitle,
  token,
}: {
  to: string;
  clientName: string;
  senderName: string;
  proposalTitle: string;
  token: string;
}) {
  const link = `${APP_URL}/p/${token}`;

  return resend.emails.send({
    from: FROM,
    to,
    subject: `${senderName} sent you a proposal: "${proposalTitle}"`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;">
        <h1 style="font-size:24px;margin-bottom:8px;">Hi ${clientName},</h1>
        <p style="color:#555;font-size:16px;line-height:1.6;">
          ${senderName} has sent you a proposal for <strong>${proposalTitle}</strong>.
          Review, sign, and pay your deposit — all in one place.
        </p>
        <a href="${link}"
           style="display:inline-block;margin-top:24px;padding:14px 28px;
                  background:#0f172a;color:#fff;border-radius:8px;
                  text-decoration:none;font-weight:600;font-size:15px;">
          View Proposal →
        </a>
        <p style="color:#aaa;font-size:13px;margin-top:32px;">
          Or copy this link: ${link}
        </p>
        <hr style="border:none;border-top:1px solid #eee;margin:32px 0;" />
        <p style="color:#aaa;font-size:12px;">Powered by Pact</p>
      </div>
    `,
  });
}

export async function sendSignedNotification({
  to,
  ownerName,
  clientName,
  proposalTitle,
  proposalId,
}: {
  to: string;
  ownerName: string;
  clientName: string;
  proposalTitle: string;
  proposalId: string;
}) {
  const link = `${APP_URL}/proposals/${proposalId}`;

  return resend.emails.send({
    from: FROM,
    to,
    subject: `✅ ${clientName} signed "${proposalTitle}"`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;">
        <h1 style="font-size:24px;margin-bottom:8px;">Great news, ${ownerName}!</h1>
        <p style="color:#555;font-size:16px;line-height:1.6;">
          <strong>${clientName}</strong> has signed the contract for
          <strong>${proposalTitle}</strong>.
        </p>
        <a href="${link}"
           style="display:inline-block;margin-top:24px;padding:14px 28px;
                  background:#0f172a;color:#fff;border-radius:8px;
                  text-decoration:none;font-weight:600;font-size:15px;">
          View Proposal →
        </a>
      </div>
    `,
  });
}

export async function sendPaymentConfirmation({
  to,
  clientName,
  proposalTitle,
  amountFormatted,
}: {
  to: string;
  clientName: string;
  proposalTitle: string;
  amountFormatted: string;
}) {
  return resend.emails.send({
    from: FROM,
    to,
    subject: `Payment received — ${proposalTitle}`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;">
        <h1 style="font-size:24px;margin-bottom:8px;">Payment confirmed!</h1>
        <p style="color:#555;font-size:16px;line-height:1.6;">
          Hi ${clientName}, your deposit of <strong>${amountFormatted}</strong>
          for <strong>${proposalTitle}</strong> has been received. You're all set!
        </p>
      </div>
    `,
  });
}
