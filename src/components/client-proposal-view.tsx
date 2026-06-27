"use client";

import { useState, useRef, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import SignatureCanvas from "react-signature-canvas";

type Section = {
  id: string;
  type: string;
  order: number;
  content: Record<string, unknown>;
};

type Props = {
  token: string;
  proposal: {
    id: string;
    title: string;
    clientName: string;
    status: string;
    depositAmount: number | null;
    currency: string;
    contractBody: string | null;
    sections: Section[];
    contract: { signerName: string | null; signedAt: Date | null } | null;
    payment: { status: string; paidAt: Date | null } | null;
  };
};

type Step = "proposal" | "sign" | "pay" | "done";

export function ClientProposalView({ token, proposal }: Props) {
  const searchParams = useSearchParams();
  const paymentResult = searchParams.get("payment"); // "success" | "cancelled" | null

  const alreadySigned = !!proposal.contract?.signedAt;
  const alreadyPaid = proposal.payment?.status === "PAID" || paymentResult === "success";

  const initialStep: Step = alreadyPaid
    ? "done"
    : alreadySigned && proposal.depositAmount
    ? "pay"
    : alreadySigned
    ? "done"
    : "proposal";

  const [step, setStep] = useState<Step>(initialStep);
  const [signerName, setSignerName] = useState("");
  const [signerEmail, setSignerEmail] = useState("");
  const [signError, setSignError] = useState("");
  const [signLoading, setSignLoading] = useState(false);
  const [payLoading, setPayLoading] = useState(false);
  const [payError, setPayError] = useState("");
  const [stripeNotConnected, setStripeNotConnected] = useState(false);
  const [cancelled, setCancelled] = useState(paymentResult === "cancelled");

  const sigCanvas = useRef<SignatureCanvas>(null);

  // Dismiss cancelled banner automatically
  useEffect(() => {
    if (cancelled) {
      const t = setTimeout(() => setCancelled(false), 6000);
      return () => clearTimeout(t);
    }
  }, [cancelled]);

  async function handleSign() {
    if (!signerName || !signerEmail) {
      setSignError("Name and email are required");
      return;
    }
    if (sigCanvas.current?.isEmpty()) {
      setSignError("Please draw your signature");
      return;
    }

    setSignLoading(true);
    setSignError("");

    const signatureData = sigCanvas.current!.toDataURL("image/png");

    const res = await fetch(`/api/p/${token}/sign`, {
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

    if (data.requiresPayment) {
      setStep("pay");
    } else {
      setStep("done");
    }
    setSignLoading(false);
  }

  async function handlePay() {
    setPayLoading(true);
    setPayError("");
    setStripeNotConnected(false);

    const res = await fetch(`/api/p/${token}/payment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

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

    // Redirect to Stripe Checkout
    window.location.href = data.url;
  }

  const steps = [
    { key: "proposal", label: "1. Review" },
    { key: "sign",     label: "2. Sign" },
    ...(proposal.depositAmount ? [{ key: "pay", label: "3. Pay" }] : []),
    { key: "done",     label: proposal.depositAmount ? "4. Done" : "3. Done" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4 md:px-6 py-4 md:py-5 flex items-center justify-between">
          <div>
            <h1 className="font-bold text-base md:text-lg text-gray-900">{proposal.title}</h1>
            <p className="text-sm text-gray-500">Prepared for {proposal.clientName}</p>
          </div>
          <span className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded hidden sm:inline">
            Powered by Pact
          </span>
        </div>
      </div>

      {/* Progress tabs */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4 md:px-6 py-3 flex items-center gap-4 md:gap-6 overflow-x-auto">
          {steps.map(({ key, label }) => (
            <span
              key={key}
              className={`text-sm font-medium whitespace-nowrap ${
                step === key ? "text-gray-900" : "text-gray-300"
              }`}
            >
              {label}
            </span>
          ))}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 md:px-6 py-8 md:py-10">

        {/* Payment cancelled banner */}
        {cancelled && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-5 py-4 mb-6 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-xl">⚠️</span>
              <p className="text-sm text-yellow-800 font-medium">
                Payment was cancelled. You can try again whenever you&apos;re ready.
              </p>
            </div>
            <button
              onClick={() => setCancelled(false)}
              className="text-yellow-500 hover:text-yellow-700 text-xs"
            >
              ✕
            </button>
          </div>
        )}

        {/* Step 1: Review */}
        {step === "proposal" && (
          <div>
            <div className="bg-white border border-gray-200 rounded-xl p-6 md:p-8 mb-6 space-y-6">
              {proposal.sections.map((section) => (
                <div key={section.id}>
                  {section.type === "HEADING" && (
                    <h2 className="text-xl font-semibold text-gray-900">
                      {section.content.text as string}
                    </h2>
                  )}
                  {section.type === "TEXT" && (
                    <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
                      {section.content.text as string}
                    </p>
                  )}
                  {section.type === "PRICING" && (
                    <div className="flex items-center justify-between py-3 border-b border-gray-100">
                      <span className="text-gray-700">{section.content.label as string}</span>
                      <span className="font-semibold text-gray-900">
                        {section.content.price as string}
                      </span>
                    </div>
                  )}
                  {section.type === "DIVIDER" && <hr className="border-gray-200" />}
                </div>
              ))}
            </div>

            {proposal.depositAmount && (
              <div className="bg-sky-50 border border-sky-100 rounded-xl px-6 py-4 mb-6 flex items-center justify-between">
                <div>
                  <div className="text-sm text-sky-600 font-medium">Deposit due on signing</div>
                  <div className="text-2xl font-bold text-gray-900 mt-0.5">
                    ${(proposal.depositAmount / 100).toLocaleString()}{" "}
                    <span className="text-sm font-normal text-gray-400 uppercase">
                      {proposal.currency}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={() => setStep("sign")}
              className="w-full bg-sky-600 hover:bg-sky-700 text-white py-4 rounded-xl font-semibold text-base md:text-lg transition-colors shadow-md shadow-sky-100"
            >
              Review & sign contract →
            </button>
          </div>
        )}

        {/* Step 2: Sign */}
        {step === "sign" && (
          <div>
            <div className="bg-white border border-gray-200 rounded-xl p-6 md:p-8 mb-6">
              <h2 className="font-semibold text-gray-900 mb-4">Contract</h2>
              <div className="bg-gray-50 rounded-lg p-4 md:p-5 mb-6 max-h-64 overflow-y-auto">
                <pre className="text-sm text-gray-600 whitespace-pre-wrap font-sans leading-relaxed">
                  {proposal.contractBody ?? "No contract terms attached."}
                </pre>
              </div>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full legal name
                  </label>
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
                    placeholder="jane@company.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Draw your signature
                </label>
                <div className="border-2 border-gray-200 rounded-xl overflow-hidden bg-white">
                  <SignatureCanvas
                    ref={sigCanvas}
                    canvasProps={{
                      width: 600,
                      height: 160,
                      className: "w-full",
                      style: { touchAction: "none" },
                    }}
                    backgroundColor="white"
                  />
                </div>
                <button
                  onClick={() => sigCanvas.current?.clear()}
                  className="text-xs text-gray-400 hover:text-gray-600 mt-2"
                >
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
              <button
                onClick={() => setStep("proposal")}
                className="border-2 border-gray-200 px-5 py-3 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                ← Back
              </button>
              <button
                onClick={handleSign}
                disabled={signLoading}
                className="flex-1 bg-sky-600 hover:bg-sky-700 text-white py-3 rounded-xl font-semibold transition-colors disabled:opacity-50 shadow-md shadow-sky-100"
              >
                {signLoading
                  ? "Submitting..."
                  : proposal.depositAmount
                  ? "Sign & proceed to payment →"
                  : "Sign & complete →"}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Pay */}
        {step === "pay" && (
          <div className="text-center">
            <div className="bg-white border border-gray-200 rounded-xl p-8 md:p-10 mb-6">
              <div className="text-5xl mb-4">✍️</div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Contract signed!</h2>
              <p className="text-gray-500 mb-8">
                One last step — pay your deposit to kick things off.
              </p>
              <div className="text-3xl font-bold text-gray-900 mb-6">
                ${(proposal.depositAmount! / 100).toLocaleString()}{" "}
                <span className="text-base font-normal text-gray-400 uppercase">
                  {proposal.currency}
                </span>
              </div>

              {/* Stripe not connected error */}
              {stripeNotConnected ? (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-6 text-left">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">⚠️</span>
                    <div>
                      <p className="font-semibold text-amber-900 text-sm mb-1">
                        Payment setup incomplete
                      </p>
                      <p className="text-sm text-amber-700">
                        The sender hasn&apos;t connected their payment account yet. Please contact them directly — they need to finish their Pact setup before you can pay online.
                      </p>
                    </div>
                  </div>
                </div>
              ) : payError ? (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-sm text-red-700 text-left">
                  ⚠️ {payError}
                </div>
              ) : null}

              {!stripeNotConnected && (
                <button
                  onClick={handlePay}
                  disabled={payLoading}
                  className="w-full bg-sky-600 hover:bg-sky-700 text-white py-4 rounded-xl font-semibold text-lg transition-colors disabled:opacity-50 shadow-md shadow-sky-100"
                >
                  {payLoading ? "Redirecting to payment..." : "Pay deposit →"}
                </button>
              )}

              <p className="text-xs text-gray-400 mt-4">
                Secured by Stripe. Your card details are never stored on our servers.
              </p>
            </div>
          </div>
        )}

        {/* Done */}
        {step === "done" && (
          <div className="text-center">
            <div className="bg-white border border-gray-200 rounded-xl p-8 md:p-10">
              {paymentResult === "success" || alreadyPaid ? (
                <>
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
                    <span className="text-3xl">✓</span>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment received!</h2>
                  <p className="text-gray-500 mb-6">
                    Your deposit has been processed. You&apos;ll hear from us shortly.
                  </p>
                  <div className="bg-green-50 border border-green-200 rounded-xl px-6 py-4 inline-block">
                    <p className="text-sm text-green-800 font-medium">
                      🎉 You&apos;re all set — project is officially kicked off!
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 bg-sky-100 rounded-full flex items-center justify-center mx-auto mb-5">
                    <span className="text-3xl">✍️</span>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Signed!</h2>
                  <p className="text-gray-500">
                    The contract is signed. We&apos;re ready to get started!
                  </p>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
