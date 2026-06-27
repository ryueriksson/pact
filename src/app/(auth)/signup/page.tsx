"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { BusinessCategoryPicker } from "@/components/business-category-picker";
import type { BusinessCategory } from "@prisma/client";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [businessCategory, setBusinessCategory] = useState<BusinessCategory | "">("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!businessCategory) {
      setError("Please choose the option that best describes your business");
      setLoading(false);
      return;
    }

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, businessCategory }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Registration failed");
      setLoading(false);
      return;
    }

    const result = await signIn("credentials", {
      email,
      password,
      callbackUrl: "/dashboard",
      redirect: false,
    });

    if (result?.error) {
      setError("Account created, but sign-in failed. Please log in.");
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-[#FAFAF9] flex">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col w-[480px] bg-gradient-to-br from-sky-600 to-indigo-700 p-12 relative overflow-hidden flex-shrink-0">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNCI+PHBhdGggZD0iTTM2IDM0djZoNnYtNmgtNnptMC0zMHY2aDZ2LTZoLTZ6bTAgMTV2Nmg2di02aC02em0tMTUgMTV2Nmg2di02aC02em0wLTE1djZoNnYtNmgtNnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-100" />
        <div className="relative flex flex-col h-full">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 40 40" fill="none">
                <path d="M12 30V11H20.5C24.09 11 27 13.91 27 17.5C27 21.09 24.09 24 20.5 24H12" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M14 30 Q20 26 28 29" stroke="#BAE6FD" strokeWidth="2.5" strokeLinecap="round"/>
              </svg>
            </div>
            <span className="font-bold text-xl text-white">Pact</span>
          </div>

          <div className="mt-auto">
            <div className="space-y-6">
              {[
                { quote: "I closed my first $3,000 client the same day I signed up. One link, they signed, they paid. Done.", author: "Sarah M.", role: "Brand Designer" },
                { quote: "Replaced Dubsado and DocuSign. Simpler and half the price.", author: "James K.", role: "Web Developer" },
              ].map((t) => (
                <div key={t.author} className="bg-white/10 rounded-2xl p-5 backdrop-blur-sm">
                  <p className="text-white/90 text-sm leading-relaxed mb-3">&quot;{t.quote}&quot;</p>
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-sky-300 flex items-center justify-center text-xs font-bold text-sky-800">
                      {t.author[0]}
                    </div>
                    <div>
                      <p className="text-white text-xs font-bold">{t.author}</p>
                      <p className="text-sky-300 text-xs">{t.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-10">
            <Logo />
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-black text-gray-900">Create your account</h1>
            <p className="text-gray-500 mt-1">Free forever. No credit card needed.</p>
          </div>

          <button
            onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
            className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-200 hover:border-sky-300 rounded-xl px-4 py-3 text-sm font-semibold text-gray-700 transition-all hover:shadow-sm mb-6"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-[#FAFAF9] px-3 text-xs text-gray-400 font-medium">or continue with email</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl flex items-center gap-2">
                <span>⚠️</span> {error}
              </div>
            )}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Full name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full border-2 border-gray-200 focus:border-sky-400 rounded-xl px-4 py-3 text-sm outline-none transition-colors bg-white"
                placeholder="Jane Smith"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full border-2 border-gray-200 focus:border-sky-400 rounded-xl px-4 py-3 text-sm outline-none transition-colors bg-white"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="w-full border-2 border-gray-200 focus:border-sky-400 rounded-xl px-4 py-3 text-sm outline-none transition-colors bg-white"
                placeholder="Min. 8 characters"
              />
            </div>
            <BusinessCategoryPicker
              value={businessCategory}
              onChange={setBusinessCategory}
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-sky-600 hover:bg-sky-700 text-white py-3.5 rounded-xl font-bold text-sm transition-all disabled:opacity-50 shadow-lg shadow-sky-100 hover:shadow-sky-200 mt-2"
            >
              {loading ? "Creating account..." : "Create free account →"}
            </button>
          </form>

          <p className="text-center text-xs text-gray-400 mt-4">
            By signing up you agree to our{" "}
            <Link href="/terms" className="underline">Terms</Link> and{" "}
            <Link href="/privacy" className="underline">Privacy Policy</Link>.
          </p>

          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{" "}
            <Link href="/login" className="text-sky-600 font-bold hover:text-sky-700">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
