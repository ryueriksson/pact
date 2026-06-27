"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getLeasePayoutFeeMessage } from "@/lib/fees";

const DEFAULT_CONTRACT = `RESIDENTIAL LEASE AGREEMENT

This Residential Lease Agreement ("Lease") is entered into as of the date signed below between the Landlord and Tenant identified herein.

1. PROPERTY
Landlord agrees to lease to Tenant the property described above for residential purposes only.

2. TERM
The lease begins on the start date and ends on the end date specified. Either party may terminate with 30 days written notice after the initial term.

3. RENT
Tenant agrees to pay the monthly rent amount on the 1st day of each month. A late fee may apply after a 5-day grace period.

4. SECURITY DEPOSIT
The security deposit will be held by the Landlord and returned within 30 days of the end of the lease, less any deductions for damages beyond normal wear and tear.

5. UTILITIES
Tenant is responsible for all utility payments unless otherwise agreed in writing.

6. MAINTENANCE
Tenant shall keep the property clean and notify the Landlord of any repairs needed promptly. Tenant shall not make alterations without written consent.

7. ENTRY
Landlord may enter the property with 24 hours notice for inspections, repairs, or showings.

8. PETS
No pets are permitted without prior written consent from the Landlord.

9. SUBLETTING
Tenant may not sublet or assign this lease without the Landlord's written consent.

10. GOVERNING LAW
This agreement is governed by the laws of the jurisdiction where the property is located.

By signing below, Tenant agrees to all terms of this Lease Agreement.`;

type LeaseEditorInitial = {
  propertyAddress?: string;
  unitNumber?: string;
  tenantName?: string;
  tenantEmail?: string;
  monthlyRent?: string;
  depositAmount?: string;
  currency?: string;
  leaseStart?: string;
  leaseEnd?: string;
  leaseDocUrl?: string;
  contractBody?: string;
  skipSigning?: boolean;
};

type Props = {
  leaseId?: string;
  isPro?: boolean;
  initial?: LeaseEditorInitial;
};

function resolveDocMode(initial?: LeaseEditorInitial): "upload" | "text" {
  if (initial?.contractBody?.trim()) return "text";
  if (initial?.leaseDocUrl) return "upload";
  return "text";
}

function resolveContractBody(initial?: LeaseEditorInitial): string {
  if (initial?.contractBody?.trim()) return initial.contractBody;
  return DEFAULT_CONTRACT;
}

export function LeaseEditor({ leaseId, isPro = false, initial }: Props) {
  const router = useRouter();
  const isEdit = !!leaseId;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [propertyAddress, setPropertyAddress] = useState(initial?.propertyAddress ?? "");
  const [unitNumber, setUnitNumber]           = useState(initial?.unitNumber ?? "");
  const [tenantName, setTenantName]           = useState(initial?.tenantName ?? "");
  const [tenantEmail, setTenantEmail]         = useState(initial?.tenantEmail ?? "");
  const [monthlyRent, setMonthlyRent]         = useState(initial?.monthlyRent ?? "");
  const [depositAmount, setDepositAmount]     = useState(initial?.depositAmount ?? "");
  const [leaseStart, setLeaseStart]           = useState(initial?.leaseStart?.slice(0, 10) ?? "");
  const [leaseEnd, setLeaseEnd]               = useState(initial?.leaseEnd?.slice(0, 10) ?? "");
  const [leaseDocUrl, setLeaseDocUrl]         = useState(initial?.leaseDocUrl ?? "");
  const [contractBody, setContractBody]       = useState(() => resolveContractBody(initial));
  const [skipSigning, setSkipSigning]         = useState(initial?.skipSigning ?? false);
  const [docMode, setDocMode]                 = useState<"upload" | "text">(() => resolveDocMode(initial));

  const [uploading, setUploading]   = useState(false);
  const [uploadName, setUploadName] = useState(
    initial?.leaseDocUrl ? "Uploaded document" : ""
  );
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState("");
  const [saved, setSaved]           = useState(false);

  async function handleUpload(file: File) {
    setUploading(true);
    setError("");
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/leases/upload", { method: "POST", body: form });
    const data = await res.json();
    setUploading(false);
    if (!res.ok) {
      setError(data.error ?? "Upload failed");
      return;
    }
    setLeaseDocUrl(data.blobRef);
    setUploadName(file.name);
  }

  async function handleSave(publish = false) {
    if (!propertyAddress || !tenantName || !tenantEmail || !monthlyRent || !leaseStart || !leaseEnd) {
      setError("Property address, tenant details, monthly rent, and lease dates are required");
      return;
    }

    setLoading(true);
    setError("");

    const body = {
      propertyAddress,
      unitNumber: unitNumber || undefined,
      tenantName,
      tenantEmail,
      monthlyRent: Math.round(parseFloat(monthlyRent) * 100),
      depositAmount: depositAmount ? Math.round(parseFloat(depositAmount) * 100) : undefined,
      leaseStart,
      leaseEnd,
      leaseDocUrl: docMode === "upload" ? (leaseDocUrl || null) : null,
      contractBody: docMode === "text" ? contractBody : null,
      skipSigning,
    };

    try {
      let id = leaseId;

      if (isEdit) {
        const res = await fetch(`/api/leases/${leaseId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
      } else {
        const res = await fetch("/api/leases", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        id = data.lease.id;
      }

      if (publish) {
        const res = await fetch(`/api/leases/${id}/publish`, { method: "POST" });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        router.push(`/leases/${id}?sent=true`);
      } else {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
        if (!isEdit) router.push(`/leases/${id}`);
        else router.refresh();
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      {isEdit && (
        <div className="mb-4">
          <Link
            href={`/leases/${leaseId}`}
            className="text-sm text-gray-400 hover:text-gray-700 transition-colors"
          >
            ← Back to lease
          </Link>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-gray-900">
            {isEdit ? "Edit Lease" : "New Lease"}
          </h1>
          <p className="text-gray-400 text-sm mt-0.5">
            {isEdit ? "Changes saved immediately." : "Fill in the details, then send to your tenant."}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleSave(false)}
            disabled={loading}
            className="border-2 border-gray-200 hover:border-gray-300 px-4 py-2 rounded-xl text-sm font-bold text-gray-600 hover:text-gray-900 transition-all disabled:opacity-50"
          >
            {saved ? "Saved" : loading ? "Saving..." : "Save draft"}
          </button>
          <button
            onClick={() => handleSave(true)}
            disabled={loading || !propertyAddress || !tenantEmail}
            className="bg-sky-600 hover:bg-sky-700 text-white px-5 py-2 rounded-xl text-sm font-bold transition-all disabled:opacity-40 shadow-md shadow-sky-100"
          >
            {loading ? "Sending..." : "Send to tenant →"}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-6 flex items-center gap-2">
          {error}
        </div>
      )}

      {/* Section 1: Property */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 mb-5">
        <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span className="w-6 h-6 bg-sky-100 text-sky-700 rounded-lg flex items-center justify-center text-xs font-black">1</span>
          Property details
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Property address
            </label>
            <input
              value={propertyAddress}
              onChange={(e) => setPropertyAddress(e.target.value)}
              placeholder="123 Main St, Apt 4, New York, NY 10001"
              className="w-full border-2 border-gray-100 focus:border-sky-400 rounded-xl px-4 py-3 text-sm outline-none transition-colors bg-gray-50 focus:bg-white"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Unit / Suite (optional)
            </label>
            <input
              value={unitNumber}
              onChange={(e) => setUnitNumber(e.target.value)}
              placeholder="Apt 4B"
              className="w-full border-2 border-gray-100 focus:border-sky-400 rounded-xl px-4 py-3 text-sm outline-none transition-colors bg-gray-50 focus:bg-white"
            />
          </div>
        </div>
      </div>

      {/* Section 2: Tenant */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 mb-5">
        <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span className="w-6 h-6 bg-sky-100 text-sky-700 rounded-lg flex items-center justify-center text-xs font-black">2</span>
          Tenant details
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Tenant full name
            </label>
            <input
              value={tenantName}
              onChange={(e) => setTenantName(e.target.value)}
              placeholder="Jane Smith"
              className="w-full border-2 border-gray-100 focus:border-sky-400 rounded-xl px-4 py-3 text-sm outline-none transition-colors bg-gray-50 focus:bg-white"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Tenant email
            </label>
            <input
              type="email"
              value={tenantEmail}
              onChange={(e) => setTenantEmail(e.target.value)}
              placeholder="jane@email.com"
              className="w-full border-2 border-gray-100 focus:border-sky-400 rounded-xl px-4 py-3 text-sm outline-none transition-colors bg-gray-50 focus:bg-white"
            />
          </div>
        </div>

        {/* Existing tenant checkbox */}
        <label className="flex items-start gap-3 mt-4 cursor-pointer group">
          <div className="relative flex-shrink-0 mt-0.5">
            <input
              type="checkbox"
              checked={skipSigning}
              onChange={(e) => setSkipSigning(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-5 h-5 rounded border-2 border-gray-200 peer-checked:border-sky-500 peer-checked:bg-sky-500 transition-all flex items-center justify-center">
              {skipSigning && <span className="text-white text-xs font-bold">Yes</span>}
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-700 group-hover:text-gray-900 transition-colors">
              Tenant has an existing signed lease
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              Skip the e-sign step — use this for tenants who already signed a paper lease.
            </p>
          </div>
        </label>
      </div>

      {/* Section 3: Financials */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 mb-5">
        <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span className="w-6 h-6 bg-sky-100 text-sky-700 rounded-lg flex items-center justify-center text-xs font-black">3</span>
          Rent & deposit
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Monthly rent ($)
            </label>
            <input
              type="number"
              value={monthlyRent}
              onChange={(e) => setMonthlyRent(e.target.value)}
              placeholder="2000.00"
              min="0"
              step="0.01"
              className="w-full border-2 border-gray-100 focus:border-sky-400 rounded-xl px-4 py-3 text-sm outline-none transition-colors bg-gray-50 focus:bg-white"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Security deposit ($) <span className="font-normal text-gray-400 normal-case">optional</span>
            </label>
            <input
              type="number"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              placeholder="2000.00"
              min="0"
              step="0.01"
              className="w-full border-2 border-gray-100 focus:border-sky-400 rounded-xl px-4 py-3 text-sm outline-none transition-colors bg-gray-50 focus:bg-white"
            />
          </div>
        </div>
        {monthlyRent && (
          <div className="bg-sky-50 rounded-xl px-4 py-3 text-xs text-sky-700 leading-relaxed">
            Note: {getLeasePayoutFeeMessage(monthlyRent, isPro)}
          </div>
        )}
      </div>

      {/* Section 4: Dates */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 mb-5">
        <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span className="w-6 h-6 bg-sky-100 text-sky-700 rounded-lg flex items-center justify-center text-xs font-black">4</span>
          Lease term
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Start date
            </label>
            <input
              type="date"
              value={leaseStart}
              onChange={(e) => setLeaseStart(e.target.value)}
              className="w-full border-2 border-gray-100 focus:border-sky-400 rounded-xl px-4 py-3 text-sm outline-none transition-colors bg-gray-50 focus:bg-white"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              End date
            </label>
            <input
              type="date"
              value={leaseEnd}
              onChange={(e) => setLeaseEnd(e.target.value)}
              className="w-full border-2 border-gray-100 focus:border-sky-400 rounded-xl px-4 py-3 text-sm outline-none transition-colors bg-gray-50 focus:bg-white"
            />
          </div>
        </div>
      </div>

      {/* Section 5: Lease Document */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6">
        <h2 className="font-bold text-gray-900 mb-1 flex items-center gap-2">
          <span className="w-6 h-6 bg-sky-100 text-sky-700 rounded-lg flex items-center justify-center text-xs font-black">5</span>
          Lease document
        </h2>
        <p className="text-xs text-gray-400 mb-4 ml-8">Your tenant will sign this before paying.</p>

        {/* Mode toggle */}
        <div className="flex gap-2 mb-5">
          <button
            onClick={() => setDocMode("upload")}
            className={`px-4 py-2 rounded-xl text-sm font-semibold border-2 transition-all ${
              docMode === "upload"
                ? "bg-sky-600 border-sky-600 text-white"
                : "border-gray-100 text-gray-500 hover:border-sky-200 bg-white"
            }`}
          >
            Upload PDF
          </button>
          <button
            onClick={() => setDocMode("text")}
            className={`px-4 py-2 rounded-xl text-sm font-semibold border-2 transition-all ${
              docMode === "text"
                ? "bg-sky-600 border-sky-600 text-white"
                : "border-gray-100 text-gray-500 hover:border-sky-200 bg-white"
            }`}
          >
            Write in editor
          </button>
        </div>

        {docMode === "upload" ? (
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleUpload(file);
              }}
            />
            {leaseDocUrl ? (
              <div className="border-2 border-sky-200 bg-sky-50 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl"></span>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{uploadName}</p>
                    <p className="text-xs text-gray-400">PDF uploaded successfully</p>
                  </div>
                </div>
                <button
                  onClick={() => { setLeaseDocUrl(""); setUploadName(""); }}
                  className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                >
                  Remove
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="w-full border-2 border-dashed border-gray-200 hover:border-sky-300 rounded-xl p-8 text-center transition-colors group disabled:opacity-50"
              >
                <p className="text-sm font-semibold text-gray-600 group-hover:text-sky-600 transition-colors">
                  {uploading ? "Uploading…" : "Click to upload lease PDF"}
                </p>
                <p className="text-xs text-gray-400 mt-1">Max 10 MB</p>
              </button>
            )}
          </div>
        ) : (
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Lease terms
            </label>
            <p className="text-xs text-gray-400 mb-2">
              Edit the agreement text below. Your tenant will review and sign this before paying.
            </p>
            <textarea
              value={contractBody}
              onChange={(e) => setContractBody(e.target.value)}
              rows={16}
              className="w-full border-2 border-gray-100 focus:border-sky-300 rounded-xl px-4 py-3 text-sm font-mono text-gray-600 outline-none resize-y min-h-[280px] transition-colors bg-gray-50 focus:bg-white leading-relaxed"
            />
          </div>
        )}
      </div>
    </div>
  );
}
