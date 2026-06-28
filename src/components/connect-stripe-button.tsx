"use client";

import { useState } from "react";
import { StripeWordmark } from "@/components/stripe-wordmark";

type Props = {
  isConnected: boolean;
  isPending?: boolean;
  disabled?: boolean;
};

export function ConnectStripeButton({ isConnected, isPending, disabled }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleClick() {
    if (disabled) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/stripe/connect", { method: "POST" });

      let data: { error?: string; url?: string } = {};
      try {
        data = await res.json();
      } catch {
        throw new Error("Unexpected server response. Check that Stripe is configured in .env.");
      }

      if (!res.ok) {
        setError(data.error ?? "Something went wrong");
        return;
      }

      if (!data.url) {
        setError("Stripe did not return an onboarding link. Please try again.");
        return;
      }

      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
        {error} —{" "}
        <button onClick={handleClick} className="underline font-medium">try again</button>
      </div>
    );
  }

  if (isConnected) {
    return (
      <button
        onClick={handleClick}
        disabled={loading || disabled}
        className="text-sm border border-gray-200 text-gray-600 hover:border-gray-300 hover:text-gray-900 px-4 py-2.5 rounded-xl font-semibold transition-all disabled:opacity-50"
      >
        {loading ? "Opening..." : "Open Stripe dashboard →"}
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading || disabled}
      className="w-full flex items-center justify-center gap-3 bg-[#635BFF] hover:bg-[#5147e6] text-white py-3.5 rounded-xl font-bold text-sm transition-all disabled:opacity-50 shadow-lg shadow-sky-100"
    >
      {loading ? (
        "Connecting..."
      ) : (
        <>
          <StripeWordmark variant="white" height={16} />
          {isPending ? "Finish Stripe setup →" : "Connect Stripe account →"}
        </>
      )}
    </button>
  );
}
