"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { BusinessCategoryPicker } from "@/components/business-category-picker";
import { getCategoryLabel } from "@/lib/business-categories";
import type { BusinessCategory } from "@prisma/client";

type Props = {
  currentCategory: BusinessCategory;
};

export function ChangeBusinessCategoryForm({ currentCategory }: Props) {
  const router = useRouter();
  const { update } = useSession();
  const [businessCategory, setBusinessCategory] = useState<BusinessCategory>(currentCategory);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const hasChanges = businessCategory !== currentCategory;

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!hasChanges) {
      setEditing(false);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/user/business-category", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessCategory }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong");
        return;
      }

      await update({ businessCategory });
      setSuccess("Account type updated. Your dashboard will reflect the new tools.");
      setEditing(false);
      router.refresh();
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function handleCancel() {
    setBusinessCategory(currentCategory);
    setError("");
    setSuccess("");
    setEditing(false);
  }

  if (!editing) {
    return (
      <div className="border-t border-gray-100 pt-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-gray-700">Account type</p>
            <p className="text-sm text-gray-500 mt-0.5">{getCategoryLabel(currentCategory)}</p>
            {success && (
              <p className="text-xs text-emerald-600 mt-2">{success}</p>
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              setSuccess("");
              setEditing(true);
            }}
            className="text-xs border border-gray-200 text-gray-600 hover:border-gray-300 hover:text-gray-900 px-3 py-1.5 rounded-lg font-semibold transition-colors flex-shrink-0"
          >
            Change
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="border-t border-gray-100 pt-4 space-y-4">
      <BusinessCategoryPicker
        value={businessCategory}
        onChange={setBusinessCategory}
        error={error}
        label="Account type"
        hint="Switch anytime. Your existing proposals and leases stay in your account — only the dashboard navigation changes."
      />

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={loading || !hasChanges}
          className="text-sm bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-xl font-semibold transition-colors disabled:opacity-50"
        >
          {loading ? "Saving..." : "Save account type"}
        </button>
        <button
          type="button"
          onClick={handleCancel}
          disabled={loading}
          className="text-sm text-gray-500 hover:text-gray-700 font-medium"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
