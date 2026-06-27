"use client";

import { useState } from "react";
import Link from "next/link";
import { LogoMark } from "@/components/logo";

type NavItem = {
  href: string;
  label: string;
};

type Props = {
  initials: string;
  name: string;
  email: string;
  nav: NavItem[];
  createHref: string;
  createLabel: string;
};

export function MobileNav({ initials, name, email, nav, createHref, createLabel }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between shadow-sm">
        <Link href="/dashboard" className="flex items-center gap-2">
          <LogoMark size={28} />
          <span className="font-black text-base text-gray-900">Pact</span>
        </Link>
        <button
          onClick={() => setOpen(true)}
          className="w-9 h-9 flex flex-col items-center justify-center gap-1.5 rounded-xl hover:bg-gray-100 transition-colors"
          aria-label="Open menu"
        >
          <span className="w-5 h-0.5 bg-gray-600 rounded-full" />
          <span className="w-5 h-0.5 bg-gray-600 rounded-full" />
          <span className="w-3 h-0.5 bg-gray-600 rounded-full" />
        </button>
      </div>

      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/30 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <div
        className={`fixed top-0 left-0 bottom-0 z-50 w-72 bg-white shadow-2xl flex flex-col transform transition-transform duration-200 md:hidden ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <Link href="/dashboard" onClick={() => setOpen(false)} className="flex items-center gap-2.5">
            <LogoMark size={28} />
            <span className="font-black text-base text-gray-900">Pact</span>
          </Link>
          <button
            onClick={() => setOpen(false)}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500"
          >
            Close
          </button>
        </div>

        <div className="px-4 py-4">
          <Link
            href={createHref}
            onClick={() => setOpen(false)}
            className="flex items-center justify-center gap-2 w-full bg-sky-600 hover:bg-sky-700 text-white text-sm font-bold py-2.5 rounded-xl transition-colors shadow-md shadow-sky-100"
          >
            <span className="text-base">+</span> {createLabel}
          </Link>
        </div>

        <nav className="flex-1 px-3 py-2 space-y-0.5">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm text-gray-500 hover:bg-sky-50 hover:text-sky-700 font-medium transition-all"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="border-t border-gray-100 p-4">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-500 to-sky-700 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-900 truncate">{name || "Account"}</p>
              <p className="text-xs text-gray-400 truncate">{email}</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
