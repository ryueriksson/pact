"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

export function DeleteAccountButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/user", { method: "DELETE" });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong");
        return;
      }

      await signOut({ redirect: false });
      router.push("/login");
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (confirming) {
    return (
      <div className="flex flex-col items-end gap-2">
        {error && <p className="text-xs text-red-600">{error}</p>}
        <p className="text-xs text-red-600 font-medium">Are you sure? This cannot be undone.</p>
        <div className="flex gap-2">
          <button
            onClick={() => setConfirming(false)}
            disabled={loading}
            className="text-xs border border-gray-200 text-gray-600 px-4 py-2 rounded-lg font-semibold"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={loading}
            className="text-xs bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold disabled:opacity-50"
          >
            {loading ? "Deleting..." : "Yes, delete"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="text-xs border border-red-200 text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg font-semibold transition-colors"
    >
      Delete account
    </button>
  );
}
