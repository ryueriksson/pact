"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/logo";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const emailParam = searchParams.get("email");

  const [email, setEmail] = useState(emailParam ?? "");
  const [status, setStatus] = useState<"idle" | "verifying" | "verified" | "error">(
    token ? "verifying" : "idle"
  );
  const [message, setMessage] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState("");

  useEffect(() => {
    if (!token) return;

    async function verify() {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();

      if (res.ok) {
        setStatus("verified");
        setMessage(data.message ?? "Email verified.");
        if (data.email) setEmail(data.email);
        return;
      }

      setStatus("error");
      setMessage(data.error ?? "Verification failed.");
    }

    verify();
  }, [token]);

  async function handleResend(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;

    setResendLoading(true);
    setResendMessage("");

    const res = await fetch("/api/auth/verify-email", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    setResendLoading(false);

    if (!res.ok) {
      setResendMessage(data.error ?? "Could not resend verification email.");
      return;
    }

    setResendMessage(data.message ?? "Verification email sent.");
  }

  return (
    <div className="min-h-screen bg-[#FAFAF9] flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm">
          {status === "verifying" && (
            <>
              <h1 className="text-xl font-black text-gray-900 mb-2">Verifying your email…</h1>
              <p className="text-sm text-gray-500">Please wait a moment.</p>
            </>
          )}

          {status === "verified" && (
            <>
              <h1 className="text-xl font-black text-gray-900 mb-2">Email verified</h1>
              <p className="text-sm text-gray-500 mb-6">{message}</p>
              <button
                onClick={() => router.push("/login?verified=1")}
                className="w-full bg-sky-600 hover:bg-sky-700 text-white py-3 rounded-xl font-bold text-sm transition-colors"
              >
                Sign in →
              </button>
            </>
          )}

          {status === "error" && (
            <>
              <h1 className="text-xl font-black text-gray-900 mb-2">Verification failed</h1>
              <p className="text-sm text-red-600 mb-6">{message}</p>
            </>
          )}

          {(status === "idle" || status === "error") && (
            <>
              {status === "idle" && (
                <>
                  <h1 className="text-xl font-black text-gray-900 mb-2">Check your email</h1>
                  <p className="text-sm text-gray-500 mb-6">
                    We sent a verification link to your inbox. Click it to activate your account,
                    then sign in.
                  </p>
                </>
              )}

              <form onSubmit={handleResend} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Email address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full border-2 border-gray-200 focus:border-sky-400 rounded-xl px-4 py-3 text-sm outline-none transition-colors bg-white"
                    placeholder="you@example.com"
                  />
                </div>
                {resendMessage && (
                  <p className="text-sm text-gray-600">{resendMessage}</p>
                )}
                <button
                  type="submit"
                  disabled={resendLoading}
                  className="w-full bg-sky-600 hover:bg-sky-700 text-white py-3 rounded-xl font-bold text-sm transition-colors disabled:opacity-50"
                >
                  {resendLoading ? "Sending…" : "Resend verification email"}
                </button>
              </form>
            </>
          )}

          <p className="text-center text-sm text-gray-500 mt-6">
            <Link href="/login" className="text-sky-600 font-bold hover:text-sky-700">
              Back to sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FAFAF9]" />}>
      <VerifyEmailContent />
    </Suspense>
  );
}
