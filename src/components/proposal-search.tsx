"use client";

import { useRouter, usePathname } from "next/navigation";
import { useState, useTransition } from "react";

const STATUSES = [
  { value: "all",       label: "All" },
  { value: "DRAFT",     label: "Draft" },
  { value: "SENT",      label: "Sent" },
  { value: "VIEWED",    label: "Viewed" },
  { value: "SIGNED",    label: "Signed" },
  { value: "PAID",      label: "Paid" },
  { value: "EXPIRED",   label: "Expired" },
];

type Props = {
  currentQ: string;
  currentStatus: string;
};

export function ProposalSearch({ currentQ, currentStatus }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [, startTransition] = useTransition();
  const [q, setQ] = useState(currentQ);

  function navigate(newQ: string, newStatus: string) {
    const params = new URLSearchParams();
    if (newQ) params.set("q", newQ);
    if (newStatus !== "all") params.set("status", newStatus);
    const qs = params.toString();
    startTransition(() => {
      router.push(qs ? `${pathname}?${qs}` : pathname);
    });
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    navigate(q, currentStatus);
  }

  function handleStatus(value: string) {
    navigate(q, value);
  }

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      {/* Search box */}
      <form onSubmit={handleSearch} className="flex-1 flex gap-2">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by title, client name or email…"
            className="w-full border-2 border-gray-100 focus:border-violet-400 rounded-xl pl-9 pr-4 py-2.5 text-sm outline-none transition-colors bg-white"
          />
        </div>
        <button
          type="submit"
          className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-colors"
        >
          Search
        </button>
      </form>

      {/* Status filter */}
      <div className="flex gap-1.5 flex-wrap sm:flex-nowrap">
        {STATUSES.map((s) => (
          <button
            key={s.value}
            onClick={() => handleStatus(s.value)}
            className={`px-3 py-2 rounded-xl text-xs font-semibold border-2 transition-all whitespace-nowrap ${
              currentStatus === s.value
                ? "bg-violet-600 border-violet-600 text-white"
                : "border-gray-100 text-gray-500 hover:border-violet-200 hover:text-violet-700 bg-white"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}
