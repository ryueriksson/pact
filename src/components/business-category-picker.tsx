"use client";

import { BUSINESS_CATEGORIES } from "@/lib/business-categories";
import type { BusinessCategory } from "@prisma/client";

type Props = {
  value: BusinessCategory | "";
  onChange: (value: BusinessCategory) => void;
  error?: string;
};

export function BusinessCategoryPicker({ value, onChange, error }: Props) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        What type of business are you?
      </label>
      <p className="text-xs text-gray-400 mb-3">
        We&apos;ll tailor your dashboard so you only see tools that fit your work.
      </p>
      <div className="space-y-3">
        {BUSINESS_CATEGORIES.map((category) => {
          const selected = value === category.value;
          return (
            <button
              key={category.value}
              type="button"
              onClick={() => onChange(category.value)}
              className={`w-full text-left rounded-2xl border-2 p-4 transition-all ${
                selected
                  ? "border-sky-500 bg-sky-50 shadow-sm"
                  : "border-gray-200 bg-white hover:border-sky-200 hover:bg-sky-50/40"
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl leading-none mt-0.5">{category.icon}</span>
                <div className="min-w-0">
                  <p className="font-bold text-gray-900 text-sm">{category.label}</p>
                  <p className="text-sm text-gray-500 mt-1">{category.description}</p>
                  <p className="text-xs text-gray-400 mt-2">{category.examples}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
      {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
    </div>
  );
}
