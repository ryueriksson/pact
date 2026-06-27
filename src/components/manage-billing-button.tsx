"use client";

import { useState } from "react";

export function ManageBillingButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleClick() {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong");
        return;
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (error) {
    return (
      <p className="text-xs text-red-600">
        {error} —{" "}
        <button onClick={handleClick} className="underline font-medium">
          try again
        </button>
      </p>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="text-xs border border-gray-200 text-gray-600 hover:border-gray-300 hover:text-gray-900 px-3 py-1.5 rounded-lg font-semibold transition-all disabled:opacity-50"
    >
      {loading ? "Opening..." : "Manage subscription →"}
    </button>
  );
}
