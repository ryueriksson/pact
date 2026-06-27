"use client";

import { useState } from "react";
import { Logo } from "@/components/logo";
import Link from "next/link";

const PRO_FEATURES = [
  "Unlimited proposals & leases",
  "No transaction fees (save 1% on every deal)",
  "Custom contract templates",
  "Client portal branding",
  "Priority support",
  "Team members (coming soon)",
];

export default function UpgradePage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleUpgrade() {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/billing/upgrade", { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        setLoading(false);
        return;
      }

      window.location.href = data.url;
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#FAFAF9] flex flex-col items-center justify-center px-4 py-16">
      <Logo href="/dashboard" className="mb-10" />

      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-gray-900 mb-2">Upgrade to Pro</h1>
          <p className="text-gray-400">More power. Zero transaction fees.</p>
        </div>

        <div className="bg-sky-600 rounded-2xl p-8 mb-4 relative overflow-hidden">
          <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full" />
          <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-white/10 rounded-full" />

          <div className="relative">
            <div className="flex items-end gap-1 mb-6">
              <span className="text-5xl font-black text-white">$30</span>
              <span className="text-sky-200 mb-1.5">/month</span>
            </div>

            <ul className="space-y-3 mb-8">
              {PRO_FEATURES.map((f) => (
                <li key={f} className="flex items-center gap-3 text-sky-100 text-sm">
                  <span className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center text-white text-xs flex-shrink-0">+</span>
                  {f}
                </li>
              ))}
            </ul>

            {error && (
              <div className="bg-red-500/20 border border-red-400/30 text-red-100 text-sm px-4 py-3 rounded-xl mb-4">
                {error}
              </div>
            )}

            <button
              onClick={handleUpgrade}
              disabled={loading}
              className="w-full bg-white text-sky-700 hover:bg-sky-50 py-4 rounded-xl font-bold text-lg transition-all shadow-lg disabled:opacity-60"
            >
              {loading ? "Redirecting to checkout…" : "Upgrade now →"}
            </button>

            <p className="text-center text-xs text-sky-300 mt-4">
              Cancel anytime · Billed monthly · Secured by Stripe
            </p>
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl p-5">
          <p className="text-xs text-gray-500 text-center">
            <strong className="text-gray-700">Free plan:</strong> 1% fee on transactions, unlimited proposals & leases.
            Upgrade when the math makes sense — most users do after their first big deal.
          </p>
        </div>

        <div className="text-center mt-6">
          <Link href="/dashboard" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
            ← Back to dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
