import Link from "next/link";
import { Logo } from "@/components/logo";

export const metadata = {
  title: "Privacy Policy — Pact",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#FAFAF9]">
      <header className="border-b border-gray-100 bg-white px-6 py-4">
        <div className="max-w-3xl mx-auto">
          <Logo />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-black text-gray-900 mb-2">Privacy Policy</h1>
        <p className="text-sm text-gray-400 mb-10">Last updated: June 2026</p>

        <div className="prose prose-gray max-w-none space-y-6 text-gray-600 text-sm leading-relaxed">
          <p>
            Pact (&quot;we&quot;, &quot;us&quot;) is operated by 株式会社RYU. This policy explains how we
            collect, use, and protect your information when you use pact.so.
          </p>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">Information we collect</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Account details: name, email, password (hashed)</li>
              <li>Business information: proposals, leases, contracts, and payment records</li>
              <li>Payment data: processed by Stripe; we do not store card numbers</li>
              <li>Usage data: logs and analytics to improve the service</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">How we use your information</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Provide and improve the Pact platform</li>
              <li>Send transactional emails (proposals, leases, receipts, password resets)</li>
              <li>Process payments through Stripe Connect</li>
              <li>Respond to support requests</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">Third parties</h2>
            <p>
              We use Stripe for payments, Resend for email delivery, and Vercel for hosting.
              These providers process data according to their own privacy policies.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">Your rights</h2>
            <p>
              You may request access, correction, or deletion of your account data at any time
              from Settings or by contacting{" "}
              <a href="mailto:use.pact.features@gmail.com" className="text-sky-600 hover:underline">
                use.pact.features@gmail.com
              </a>.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">Contact</h2>
            <p>
              Questions about this policy:{" "}
              <a href="mailto:use.pact.features@gmail.com" className="text-sky-600 hover:underline">
                use.pact.features@gmail.com
              </a>
            </p>
          </section>
        </div>

        <p className="mt-12 text-sm text-gray-400">
          <Link href="/" className="text-sky-600 hover:underline">← Back to home</Link>
        </p>
      </main>
    </div>
  );
}
