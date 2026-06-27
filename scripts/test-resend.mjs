/**
 * Test Resend connection. Usage:
 *   npm run test:email -- you@example.com
 */
import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { Resend } from "resend";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, "../.env");

if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

const key = process.env.RESEND_API_KEY?.trim();
const to = process.argv[2];

if (!key) {
  console.error("Missing RESEND_API_KEY in environment.");
  process.exit(1);
}

if (!to) {
  console.error("Usage: npm run test:email -- your@email.com");
  process.exit(1);
}

const from = process.env.EMAIL_FROM?.trim() || "Pact <onboarding@resend.dev>";
const replyTo = process.env.EMAIL_REPLY_TO?.trim() || "use.pact.features@gmail.com";

const resend = new Resend(key);

const { data, error } = await resend.emails.send({
  from,
  replyTo,
  to: [to],
  subject: "Pact — Resend is connected",
  html: `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;">
      <h1 style="font-size:24px;margin-bottom:8px;">Resend is working</h1>
      <p style="color:#555;font-size:16px;line-height:1.6;">
        Pact can now send transactional emails (proposals, leases, password resets).
      </p>
      <p style="color:#aaa;font-size:12px;margin-top:32px;">— Pact</p>
    </div>
  `,
});

if (error) {
  console.error("Send failed:", error.message);
  process.exit(1);
}

console.log("Email sent successfully. ID:", data?.id);
