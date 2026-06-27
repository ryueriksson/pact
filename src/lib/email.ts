import { Resend } from "resend";

const DEFAULT_FROM = "Pact <onboarding@resend.dev>";
const DEFAULT_REPLY_TO = "use.pact.features@gmail.com";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

let resendClient: Resend | null = null;

export function isEmailConfigured() {
  return !!process.env.RESEND_API_KEY?.trim();
}

function getResend() {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) {
    throw new Error("EMAIL_NOT_CONFIGURED");
  }
  if (!resendClient) {
    resendClient = new Resend(key);
  }
  return resendClient;
}

function getFromAddress() {
  return process.env.EMAIL_FROM?.trim() || DEFAULT_FROM;
}

type EmailPayload = {
  to: string | string[];
  subject: string;
  html: string;
};

async function sendEmail(payload: EmailPayload) {
  const { data, error } = await getResend().emails.send({
    from: getFromAddress(),
    replyTo: getReplyToAddress(),
    ...payload,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

function getReplyToAddress() {
  return process.env.EMAIL_REPLY_TO?.trim() || DEFAULT_REPLY_TO;
}

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

  return sendEmail({
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

  return sendEmail({
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

// ─── Lease Email Templates ────────────────────────────────────────────────────

export async function sendLeaseLink({
  to,
  tenantName,
  senderName,
  propertyAddress,
  token,
}: {
  to: string;
  tenantName: string;
  senderName: string;
  propertyAddress: string;
  token: string;
}) {
  const link = `${APP_URL}/l/${token}`;

  return sendEmail({
    to,
    subject: `${senderName} sent you a lease to sign — ${propertyAddress}`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;">
        <h1 style="font-size:24px;margin-bottom:8px;">Hi ${tenantName},</h1>
        <p style="color:#555;font-size:16px;line-height:1.6;">
          <strong>${senderName}</strong> has sent you a lease agreement for
          <strong>${propertyAddress}</strong>.
          Review the lease, sign it, and set up your deposit and rent payments — all in one place.
        </p>
        <a href="${link}"
           style="display:inline-block;margin-top:24px;padding:14px 28px;
                  background:#0284C7;color:#fff;border-radius:8px;
                  text-decoration:none;font-weight:600;font-size:15px;">
          Review & Sign Lease →
        </a>
        <p style="color:#aaa;font-size:13px;margin-top:32px;">
          This link is permanent — you can return to it any time: ${link}
        </p>
        <hr style="border:none;border-top:1px solid #eee;margin:32px 0;" />
        <p style="color:#aaa;font-size:12px;">Powered by Pact</p>
      </div>
    `,
  });
}

export async function sendLeaseSignedNotification({
  to,
  ownerName,
  tenantName,
  propertyAddress,
  leaseId,
}: {
  to: string;
  ownerName: string;
  tenantName: string;
  propertyAddress: string;
  leaseId: string;
}) {
  const link = `${APP_URL}/leases/${leaseId}`;

  return sendEmail({
    to,
    subject: `✅ ${tenantName} signed the lease — ${propertyAddress}`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;">
        <h1 style="font-size:24px;margin-bottom:8px;">Lease signed!</h1>
        <p style="color:#555;font-size:16px;line-height:1.6;">
          <strong>${tenantName}</strong> has signed the lease for
          <strong>${propertyAddress}</strong>.
          They've been prompted to pay the deposit and set up recurring rent.
        </p>
        <a href="${link}"
           style="display:inline-block;margin-top:24px;padding:14px 28px;
                  background:#0284C7;color:#fff;border-radius:8px;
                  text-decoration:none;font-weight:600;font-size:15px;">
          View Lease →
        </a>
      </div>
    `,
  });
}

export async function sendRentPaidReceipt({
  to,
  tenantName,
  propertyAddress,
  amountFormatted,
  month,
}: {
  to: string;
  tenantName: string;
  propertyAddress: string;
  amountFormatted: string;
  month: string;
}) {
  return sendEmail({
    to,
    subject: `Rent receipt — ${propertyAddress} (${month})`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;">
        <h1 style="font-size:24px;margin-bottom:8px;">Rent received ✓</h1>
        <p style="color:#555;font-size:16px;line-height:1.6;">
          Hi ${tenantName}, your rent payment of <strong>${amountFormatted}</strong>
          for <strong>${propertyAddress}</strong> (${month}) has been received.
        </p>
        <p style="color:#aaa;font-size:12px;margin-top:32px;">Powered by Pact</p>
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
  return sendEmail({
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

export async function sendPasswordResetEmail({
  to,
  resetUrl,
}: {
  to: string;
  resetUrl: string;
}) {
  return sendEmail({
    to,
    subject: "Reset your Pact password",
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;">
        <h1 style="font-size:24px;margin-bottom:8px;">Reset your password</h1>
        <p style="color:#555;font-size:16px;line-height:1.6;">
          We received a request to reset the password for your Pact account.
          Click the button below to choose a new password. This link expires in 1 hour.
        </p>
        <a href="${resetUrl}"
           style="display:inline-block;margin-top:24px;padding:14px 28px;
                  background:#0284C7;color:#fff;border-radius:8px;
                  text-decoration:none;font-weight:600;font-size:15px;">
          Reset password →
        </a>
        <p style="color:#aaa;font-size:13px;margin-top:32px;">
          If you didn't request this, you can safely ignore this email.
        </p>
        <p style="color:#aaa;font-size:12px;margin-top:24px;">— Pact</p>
      </div>
    `,
  });
}
