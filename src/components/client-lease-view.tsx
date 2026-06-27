"use client";

import { useState, useRef, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import SignatureCanvas from "react-signature-canvas";
import { LogoMark } from "@/components/logo";

type Props = {
  token: string;
  lease: {
    id: string;
    propertyAddress: string;
    unitNumber: string | null;
    tenantName: string;
    monthlyRent: number;
    depositAmount: number | null;
    currency: string;
    leaseStart: string;
    leaseEnd: string;
    leaseDocUrl: string | null;
    contractBody: string | null;
    status: string;
    skipSigning: boolean;
    stripeSubId: string | null;
    leaseContract: { signerName: string; signedAt: string } | null;
    depositPaid: boolean;
  };
};

type Step = "review" | "sign" | "deposit" | "rent" | "done";

function fmt(cents: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

export function ClientLeaseView({ token, lease }: Props) {
  const searchParams = useSearchParams();
  const paymentParam = searchParams.get("payment"); // deposit_success | rent_success | cancelled

  const alreadySigned = !!lease.leaseContract?.signedAt || lease.skipSigning;
  const depositPaid   = lease.depositPaid || paymentParam === "deposit_success";
  const rentActive    = !!lease.stripeSubId || paymentParam === "rent_success";

  function getInitialStep(): Step {
    if (rentActive) return "done";
    if (alreadySigned && !lease.depositAmount && !lease.stripeSubId) return "done";
    if (depositPaid && !rentActive) return "rent";
    if (alreadySigned && lease.depositAmount && !depositPaid) return "deposit";
    if (alreadySigned && !lease.depositAmount) return "rent";
    if (lease.skipSigning) return lease.depositAmount ? "deposit" : "rent";
    return "review";
  }

  const [step, setStep]               = useState<Step>(getInitialStep);
  const [signerName, setSignerName]   = useState("");
  const [signerEmail, setSignerEmail] = useState("");
  const [signError, setSignError]     = useState("");
  const [signLoading, setSignLoading] = useState(false);
  const [payLoading, setPayLoading]   = useState(false);
  const [payError, setPayError]       = useState("");
  const [stripeNotConnected, setStripeNotConnected] = useState(false);
  const [cancelled, setCancelled]     = useState(paymentParam === "cancelled");

  const sigCanvas = useRef<SignatureCanvas>(null);

  useEffect(() => {
    if (cancelled) {
      const t = setTimeout(() => setCancelled(false), 6000);
      return () => clearTimeout(t);
    }
  }, [cancelled]);

  // Build steps list — skip sign step for existing tenants
  const steps: { key: Step; label: string }[] = lease.skipSigning
    ? [
        ...(lease.depositAmount ? [{ key: "deposit" as Step, label: "1. Deposit" }] : []),
        { key: "rent" as Step, label: lease.depositAmount ? "2. Set up rent" : "1. Set up rent" },
        { key: "done" as Step, label: lease.depositAmount ? "3. Done" : "2. Done" },
      ]
    : [
        { key: "review",  label: "1. Review" },
        { key: "sign",    label: "2. Sign" },
        ...(lease.depositAmount ? [{ key: "deposit" as Step, label: "3. Deposit" }] : []),
        { key: "rent" as Step, label: lease.depositAmount ? "4. Set up rent" : "3. Set up rent" },
        { key: "done" as Step, label: lease.depositAmount ? "5. Done" : "4. Done" },
      ];

  async function handleSign() {
    if (!signerName || !signerEmail) { setSignError("Name and email are required"); return; }
    if (sigCanvas.current?.isEmpty()) { setSignError("Please draw your signature"); return; }

    setSignLoading(true);
    setSignError("");

    const signatureData = sigCanvas.current!.toDataURL("image/png");
    const res = await fetch(`/api/l/${token}/sign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ signerName, signerEmail, signatureData }),
    });
    const data = await res.json();

    if (!res.ok) {
      setSignError(data.error ?? "Failed to submit signature");
      setSignLoading(false);
      return;
    }

    setStep(data.requiresDeposit ? "deposit" : "rent");
    setSignLoading(false);
  }

  async function handlePay(type: "deposit" | "rent") {
    setPayLoading(true);
    setPayError("");
    setStripeNotConnected(false);

    const res = await fetch(`/api/l/${token}/payment?type=${type}`, { method: "POST" });
    const data = await res.json();

    if (!res.ok) {
      if (res.status === 402) {
        setStripeNotConnected(true);
      } else {
        setPayError(data.error ?? "Something went wrong. Please try again.");
      }
      setPayLoading(false);
      return;
    }

    window.location.href = data.url;
  }

  const address = lease.unitNumber
    ? `${lease.propertyAddress} · ${lease.unitNumber}`
    : lease.propertyAddress;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4 md:px-6 py-4 md:py-5 flex items-center justify-between">
          <div>
            <h1 className="font-bold text-base md:text-lg text-gray-900">{address}</h1>
            <p className="text-sm text-gray-500">Lease for {lease.tenantName}</p>
          </div>
          <div className="flex items-center gap-2">
            <LogoMark size={20} />
            <span className="text-xs text-gray-400 hidden sm:inline">Powered by Pact</span>
          </div>
        </div>
      </div>

      {/* Steps */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4 md:px-6 py-3 flex items-center gap-4 md:gap-6 overflow-x-auto">
          {steps.map(({ key, label }) => (
            <span
              key={key}
              className={`text-sm font-medium whitespace-nowrap ${step === key ? "text-gray-900" : "text-gray-300"}`}
            >
              {label}
            </span>
          ))}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 md:px-6 py-8 md:py-10">

        {/* Cancelled banner */}
        {cancelled && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-5 py-4 mb-6 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-xl">⚠️</span>
              <p className="text-sm text-yellow-800 font-medium">
                Payment was cancelled. You can try again whenever you&apos;re ready.
              </p>
            </div>
            <button onClick={() => setCancelled(false)} className="text-yellow-500 hover:text-yellow-700 text-xs">✕</button>
          </div>
        )}

        {/* ── Step 1: Review ───────────────────────────────────── */}
        {step === "review" && (
          <div>
            <div className="bg-white border border-gray-200 rounded-xl p-6 md:p-8 mb-6">
              <h2 className="font-bold text-gray-900 mb-5">Lease summary</h2>
              <div className="grid grid-cols-2 gap-4 mb-6">
                {[
                  { label: "Property", value: address },
                  { label: "Tenant", value: lease.tenantName },
                  { label: "Monthly rent", value: fmt(lease.monthlyRent, lease.currency) + " / month" },
                  { label: "Security deposit", value: lease.depositAmount ? fmt(lease.depositAmount, lease.currency) : "None" },
                  { label: "Lease start", value: new Date(lease.leaseStart).toLocaleDateString() },
                  { label: "Lease end", value: new Date(lease.leaseEnd).toLocaleDateString() },
                ].map((item) => (
                  <div key={item.label}>
                    <p className="text-xs text-gray-400 font-medium mb-0.5">{item.label}</p>
                    <p className="text-sm font-semibold text-gray-900">{item.value}</p>
                  </div>
                ))}
              </div>

              <div className="bg-sky-50 rounded-xl p-4">
                <p className="text-xs font-semibold text-sky-700 mb-2">What happens next:</p>
                <ul className="text-xs text-sky-700 space-y-1">
                  {lease.skipSigning
                    ? <li>• Your landlord has noted your lease is already signed — no digital signature needed</li>
                    : <li>• Sign the lease agreement digitally</li>}
                  {lease.depositAmount && <li>• Pay a one-time security deposit of {fmt(lease.depositAmount, lease.currency)}</li>}
                  <li>• Enter your card or bank account once to set up automatic monthly rent ({fmt(lease.monthlyRent, lease.currency)}/mo)</li>
                  <li>• Rent is charged automatically on the 1st of each month</li>
                </ul>
              </div>
            </div>

            {/* PDF view */}
            {lease.leaseDocUrl && (
              <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
                <h2 className="font-bold text-gray-900 mb-3 text-sm">Lease document</h2>
                <iframe
                  src={lease.leaseDocUrl}
                  className="w-full h-[500px] rounded-lg border border-gray-100"
                  title="Lease document"
                />
              </div>
            )}

            {/* Contract text fallback */}
            {!lease.leaseDocUrl && lease.contractBody && (
              <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
                <h2 className="font-bold text-gray-900 mb-3 text-sm">Lease terms</h2>
                <div className="bg-gray-50 rounded-lg p-4 md:p-5 max-h-80 overflow-y-auto">
                  <pre className="text-sm text-gray-600 whitespace-pre-wrap font-sans leading-relaxed">
                    {lease.contractBody}
                  </pre>
                </div>
              </div>
            )}

            <button
              onClick={() => setStep(lease.skipSigning ? (lease.depositAmount ? "deposit" : "rent") : "sign")}
              className="w-full bg-sky-600 hover:bg-sky-700 text-white py-4 rounded-xl font-semibold text-base md:text-lg transition-colors shadow-md shadow-sky-100"
            >
              {lease.skipSigning ? "Proceed to payment →" : "I've reviewed — proceed to sign →"}
            </button>
          </div>
        )}

        {/* ── Step 2: Sign ─────────────────────────────────────── */}
        {step === "sign" && (
          <div>
            <div className="bg-white border border-gray-200 rounded-xl p-6 md:p-8 mb-6">
              <h2 className="font-semibold text-gray-900 mb-4">Sign the lease</h2>

              {!lease.leaseDocUrl && lease.contractBody && (
                <div className="bg-gray-50 rounded-lg p-4 md:p-5 mb-6 max-h-64 overflow-y-auto">
                  <pre className="text-sm text-gray-600 whitespace-pre-wrap font-sans leading-relaxed">
                    {lease.contractBody}
                  </pre>
                </div>
              )}

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full legal name</label>
                  <input
                    value={signerName}
                    onChange={(e) => setSignerName(e.target.value)}
                    className="w-full border-2 border-gray-100 focus:border-sky-400 rounded-xl px-4 py-3 text-sm outline-none transition-colors"
                    placeholder="Jane Smith"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={signerEmail}
                    onChange={(e) => setSignerEmail(e.target.value)}
                    className="w-full border-2 border-gray-100 focus:border-sky-400 rounded-xl px-4 py-3 text-sm outline-none transition-colors"
                    placeholder="jane@email.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Draw your signature</label>
                <div className="border-2 border-gray-200 rounded-xl overflow-hidden bg-white">
                  <SignatureCanvas
                    ref={sigCanvas}
                    canvasProps={{ width: 600, height: 160, className: "w-full", style: { touchAction: "none" } }}
                    backgroundColor="white"
                  />
                </div>
                <button onClick={() => sigCanvas.current?.clear()} className="text-xs text-gray-400 hover:text-gray-600 mt-2">
                  Clear signature
                </button>
              </div>

              {signError && (
                <div className="mt-4 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
                  {signError}
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep("review")} className="border-2 border-gray-200 px-5 py-3 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
                ← Back
              </button>
              <button
                onClick={handleSign}
                disabled={signLoading}
                className="flex-1 bg-sky-600 hover:bg-sky-700 text-white py-3 rounded-xl font-semibold transition-colors disabled:opacity-50 shadow-md shadow-sky-100"
              >
                {signLoading ? "Submitting…" : "Sign lease →"}
              </button>
            </div>
          </div>
        )}

        {/* ── Step 3: Deposit ──────────────────────────────────── */}
        {step === "deposit" && (
          <div className="text-center">
            <div className="bg-white border border-gray-200 rounded-xl p-8 md:p-10 mb-6">
              <div className="text-5xl mb-4">✍️</div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Lease signed!</h2>
              <p className="text-gray-500 mb-6">Now pay your security deposit to secure the property.</p>
              <div className="text-3xl font-bold text-gray-900 mb-8">
                {fmt(lease.depositAmount!, lease.currency)}
                <span className="text-base font-normal text-gray-400 ml-2">one-time deposit</span>
              </div>

              {stripeNotConnected ? (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-6 text-left">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">⚠️</span>
                    <div>
                      <p className="font-semibold text-amber-900 text-sm mb-1">Payment setup incomplete</p>
                      <p className="text-sm text-amber-700">The landlord hasn&apos;t connected their payment account yet. Please contact them directly.</p>
                    </div>
                  </div>
                </div>
              ) : payError ? (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-sm text-red-700 text-left">⚠️ {payError}</div>
              ) : null}

              {!stripeNotConnected && (
                <button
                  onClick={() => handlePay("deposit")}
                  disabled={payLoading}
                  className="w-full bg-sky-600 hover:bg-sky-700 text-white py-4 rounded-xl font-semibold text-lg transition-colors disabled:opacity-50 shadow-md shadow-sky-100"
                >
                  {payLoading ? "Redirecting…" : `Pay ${fmt(lease.depositAmount!, lease.currency)} deposit →`}
                </button>
              )}

              <p className="text-xs text-gray-400 mt-4">Pay by card or bank transfer. Secured by Stripe — your details are never stored by us.</p>
            </div>
          </div>
        )}

        {/* ── Step 4: Set up rent ──────────────────────────────── */}
        {step === "rent" && (
          <div className="text-center">
            <div className="bg-white border border-gray-200 rounded-xl p-8 md:p-10 mb-6">
              {paymentParam === "deposit_success" ? (
                <>
                  <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">✓</span>
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 mb-2">Deposit received!</h2>
                </>
              ) : (
                <>
                  <div className="text-5xl mb-4">🏠</div>
                  <h2 className="text-xl font-bold text-gray-900 mb-2">One last step!</h2>
                </>
              )}
              <p className="text-gray-500 mb-6">
                Set up automatic monthly rent so you never miss a payment.
              </p>
              <div className="bg-sky-50 rounded-xl p-4 mb-8 text-left">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Monthly rent</span>
                  <span className="text-lg font-bold text-gray-900">{fmt(lease.monthlyRent, lease.currency)}/mo</span>
                </div>
                <div className="text-xs text-gray-400">
                  Your card will be charged automatically on the 1st of each month. You&apos;ll get a receipt by email.
                </div>
              </div>

              {stripeNotConnected ? (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-6 text-left">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">⚠️</span>
                    <div>
                      <p className="font-semibold text-amber-900 text-sm mb-1">Payment setup incomplete</p>
                      <p className="text-sm text-amber-700">The landlord hasn&apos;t connected their payment account yet. Please contact them directly.</p>
                    </div>
                  </div>
                </div>
              ) : payError ? (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-sm text-red-700 text-left">⚠️ {payError}</div>
              ) : null}

              {!stripeNotConnected && (
                <button
                  onClick={() => handlePay("rent")}
                  disabled={payLoading}
                  className="w-full bg-sky-600 hover:bg-sky-700 text-white py-4 rounded-xl font-semibold text-lg transition-colors disabled:opacity-50 shadow-md shadow-sky-100"
                >
                  {payLoading ? "Redirecting…" : "Set up monthly rent →"}
                </button>
              )}

              <p className="text-xs text-gray-400 mt-4">Pay by card or bank transfer. Cancel anytime by contacting your landlord.</p>
            </div>
          </div>
        )}

        {/* ── Done ─────────────────────────────────────────────── */}
        {step === "done" && (
          <div className="text-center">
            <div className="bg-white border border-gray-200 rounded-xl p-8 md:p-10">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
                <span className="text-3xl">✓</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">You&apos;re all set!</h2>
              <p className="text-gray-500 mb-6">
                {paymentParam === "rent_success"
                  ? "Rent is set up! You'll be charged automatically on the 1st of each month."
                  : "The lease is signed and everything is in place."}
              </p>
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 mb-6 text-left space-y-3">
                {!lease.skipSigning && lease.leaseContract && (
                  <div className="flex items-center gap-3">
                    <span className="text-green-500">✓</span>
                    <span className="text-sm text-gray-700">Lease signed on {new Date(lease.leaseContract.signedAt).toLocaleDateString()}</span>
                  </div>
                )}
                {lease.skipSigning && (
                  <div className="flex items-center gap-3">
                    <span className="text-green-500">✓</span>
                    <span className="text-sm text-gray-700">Existing signed lease on file</span>
                  </div>
                )}
                {depositPaid && (
                  <div className="flex items-center gap-3">
                    <span className="text-green-500">✓</span>
                    <span className="text-sm text-gray-700">Security deposit paid</span>
                  </div>
                )}
                {(rentActive || paymentParam === "rent_success") && (
                  <div className="flex items-center gap-3">
                    <span className="text-green-500">✓</span>
                    <span className="text-sm text-gray-700">Monthly rent of {fmt(lease.monthlyRent, lease.currency)} set up — auto-charged on the 1st</span>
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-400">
                Bookmark this page — your lease document and payment history are always available here.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
