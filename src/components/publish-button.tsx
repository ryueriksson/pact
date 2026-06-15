"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function PublishButton({ proposalId }: { proposalId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handlePublish() {
    setLoading(true);
    setError("");

    const res = await fetch(`/api/proposals/${proposalId}/publish`, {
      method: "POST",
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Failed to publish");
      setLoading(false);
      return;
    }

    router.refresh();
    setLoading(false);
  }

  return (
    <div>
      {error && <p className="text-red-600 text-xs mb-2">{error}</p>}
      <button
        onClick={handlePublish}
        disabled={loading}
        className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors disabled:opacity-50"
      >
        {loading ? "Sending..." : "Send to client →"}
      </button>
    </div>
  );
}
