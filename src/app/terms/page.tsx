import Link from "next/link";
import { Logo } from "@/components/logo";

export const metadata = {
  title: "Terms of Service — Pact",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#FAFAF9]">
      <header className="border-b border-gray-100 bg-white px-6 py-4">
        <div className="max-w-3xl mx-auto">
          <Logo />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-black text-gray-900 mb-2">Terms of Service</h1>
        <p className="text-sm text-gray-400 mb-10">Last updated: June 2026</p>

        <div className="prose prose-gray max-w-none space-y-6 text-gray-600 text-sm leading-relaxed">
          <p>
            By using Pact, you agree to these terms. Pact is operated by 株式会社RYU (&quot;we&quot;, &quot;us&quot;).
          </p>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">The service</h2>
            <p>
              Pact helps freelancers, agencies, and landlords send proposals and leases,
              collect e-signatures, and receive payments. You are responsible for the content
              you send and the agreements you enter into with your clients or tenants.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">Accounts</h2>
            <p>
              You must provide accurate information and keep your credentials secure.
              You are responsible for all activity under your account.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">Payments & fees</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Payments are processed by Stripe. You must connect a valid Stripe account to receive payouts.</li>
              <li>Free plan: Pact charges a 1% platform fee on transactions. Pro plan waives the platform fee.</li>
              <li>Stripe processing fees apply separately (cards, ACH, etc.).</li>
              <li>Pro subscription is billed monthly at $29/month unless cancelled.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">Acceptable use</h2>
            <p>
              You may not use Pact for illegal activity, fraud, harassment, or to send spam.
              We may suspend accounts that violate these terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">Limitation of liability</h2>
            <p>
              Pact is provided &quot;as is&quot;. We are not a party to your contracts with clients or tenants.
              We are not liable for disputes between you and third parties, or for indirect damages.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">Contact</h2>
            <p>
              Questions about these terms:{" "}
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
