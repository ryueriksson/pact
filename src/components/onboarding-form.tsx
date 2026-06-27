"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/logo";
import { BusinessCategoryPicker } from "@/components/business-category-picker";
import type { BusinessCategory } from "@prisma/client";

export function OnboardingForm() {
  const router = useRouter();
  const { update } = useSession();
  const [businessCategory, setBusinessCategory] = useState<BusinessCategory | "">("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!businessCategory) {
      setError("Please choose the option that best describes your business");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/user/business-category", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ businessCategory }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Something went wrong");
      setLoading(false);
      return;
    }

    await update({ businessCategory });
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-[#FAFAF9] flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-lg">
        <div className="mb-8 text-center">
          <div className="flex justify-center mb-6">
            <Logo />
          </div>
          <h1 className="text-2xl font-black text-gray-900">Tell us about your business</h1>
          <p className="text-gray-500 mt-2">
            We&apos;ll customize Pact so you only see the tools you actually need.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-6">
          <BusinessCategoryPicker
            value={businessCategory}
            onChange={setBusinessCategory}
            error={error}
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-sky-600 hover:bg-sky-700 text-white py-3.5 rounded-xl font-bold text-sm transition-all disabled:opacity-50 shadow-lg shadow-sky-100"
          >
            {loading ? "Saving..." : "Continue to dashboard →"}
          </button>
        </form>
      </div>
    </div>
  );
}
