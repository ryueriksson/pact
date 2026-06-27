"use client";

import { useState } from "react";

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
          <svg height="16" viewBox="0 0 60 25" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M59.64 14.28h-8.06c.19 1.93 1.6 2.55 3.2 2.55 1.64 0 2.96-.37 4.05-.95v3.32a8.33 8.33 0 0 1-4.56 1.1c-4.01 0-6.83-2.5-6.83-7.48 0-4.19 2.39-7.52 6.3-7.52 3.92 0 5.96 3.28 5.96 7.5 0 .4-.04 1.26-.06 1.48zm-5.92-5.62c-1.03 0-2.17.73-2.17 2.58h4.23c0-1.85-1.07-2.58-2.06-2.58zM40.69 20.3c-1.96 0-3.96-.54-4.96-1.09l.07-3.36c1.11.63 2.6 1.13 4.34 1.13 1.36 0 2.02-.55 2.02-1.4 0-.93-.74-1.4-2.46-1.96-2.95-.94-4.54-2.41-4.54-4.87 0-2.72 2.2-4.87 5.88-4.87 1.86 0 3.29.35 4.26.84v3.31c-.87-.54-2.23-1.04-3.88-1.04-1.19 0-1.81.52-1.81 1.29 0 .81.69 1.19 2.41 1.81 2.98 1.02 4.63 2.5 4.63 4.99-.01 2.76-2.12 5.22-5.96 5.22zm-15.05-.09V5.53l4.31-.01v14.69h-4.31zm.15-16.51a2.32 2.32 0 0 1 0-4.64 2.32 2.32 0 0 1 0 4.64zM19.5 20.21l-.09-1.67c-.93 1.2-2.3 1.87-4.15 1.87-3.41 0-5.99-2.89-5.99-7.39 0-4.81 2.6-7.61 6.1-7.61 1.64 0 2.9.6 3.84 1.63V.14h4.31v20.07H19.5zm-.29-9.92c-.56-.7-1.38-1.15-2.38-1.15-1.69 0-2.86 1.36-2.86 3.55 0 2.17 1.15 3.55 2.86 3.55 1 0 1.82-.46 2.38-1.16v-4.79zM6.41 20.21l-.09-1.96c-.95 1.33-2.35 2.16-4.34 2.16C.79 20.41 0 19.23 0 17.75c0-2.64 2.07-4.15 6.54-4.15h.94v-.51c0-1.32-.51-1.93-2.1-1.93-1.33 0-2.73.48-3.79 1.09l.06-3.37A10.03 10.03 0 0 1 6.29 7.9c3.56 0 5.43 1.64 5.43 4.88v7.43H6.41zm-.33-5.02c-2.17 0-2.91.68-2.91 1.66 0 .74.47 1.22 1.34 1.22 1 0 1.57-.73 1.57-1.92v-.96z" fill="white"/>
          </svg>
          {isPending ? "Finish Stripe setup →" : "Connect Stripe account →"}
        </>
      )}
    </button>
  );
}
