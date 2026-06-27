"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type SectionType = "TEXT" | "PRICING" | "HEADING" | "DIVIDER";

type Section = {
  id: string;
  type: SectionType;
  order: number;
  content: Record<string, unknown>;
};

type Initial = {
  title: string;
  clientName: string;
  clientEmail: string;
  depositAmount: string;
  contractBody: string;
  sections: Section[];
};

type Props = {
  proposalId?: string; // if set → edit mode; if undefined → create mode
  initial?: Partial<Initial>;
};

const DEFAULT_CONTRACT = `SERVICE AGREEMENT

This Service Agreement ("Agreement") is entered into as of the date signed below.

1. SERVICES
The service provider agrees to perform the services described in the attached proposal. Any additional work outside the agreed scope will be quoted separately.

2. PAYMENT
A deposit is due upon signing this agreement. The remaining balance is due upon project completion before delivery of final files.

3. REVISIONS
This project includes up to [X] rounds of revisions. Additional revisions will be billed at an hourly rate.

4. INTELLECTUAL PROPERTY
Upon receipt of final payment, all deliverables become the property of the client.

5. CANCELLATION
If the client cancels after signing, the deposit is non-refundable.

6. LIMITATION OF LIABILITY
The service provider's liability is limited to the total amount paid under this agreement.

By signing below, both parties agree to the terms of this Agreement.`;

function defaultContent(type: SectionType): Record<string, unknown> {
  switch (type) {
    case "HEADING": return { text: "New Section" };
    case "TEXT":    return { text: "" };
    case "PRICING": return { label: "", price: "" };
    case "DIVIDER": return {};
  }
}

export function ProposalEditor({ proposalId, initial }: Props) {
  const router = useRouter();
  const isEdit = !!proposalId;

  const [title, setTitle]               = useState(initial?.title ?? "");
  const [clientName, setClientName]     = useState(initial?.clientName ?? "");
  const [clientEmail, setClientEmail]   = useState(initial?.clientEmail ?? "");
  const [depositAmount, setDeposit]     = useState(initial?.depositAmount ?? "");
  const [contractBody, setContract]     = useState(initial?.contractBody ?? DEFAULT_CONTRACT);
  const [sections, setSections]         = useState<Section[]>(
    initial?.sections?.length
      ? initial.sections
      : [
          { id: crypto.randomUUID(), type: "HEADING", order: 0, content: { text: "Project Overview" } },
          { id: crypto.randomUUID(), type: "TEXT",    order: 1, content: { text: "Describe the project scope, deliverables, and timeline here." } },
        ]
  );

  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [saved, setSaved]       = useState(false);

  // ── Drag-to-reorder ──────────────────────────────────────────
  const dragId    = useRef<string | null>(null);
  const dragOver  = useRef<string | null>(null);

  function onDragStart(id: string) { dragId.current = id; }
  function onDragEnter(id: string) { dragOver.current = id; }

  function onDragEnd() {
    if (!dragId.current || !dragOver.current || dragId.current === dragOver.current) {
      dragId.current = dragOver.current = null;
      return;
    }
    setSections((prev) => {
      const next = [...prev];
      const fromIdx = next.findIndex((s) => s.id === dragId.current);
      const toIdx   = next.findIndex((s) => s.id === dragOver.current);
      const [moved] = next.splice(fromIdx, 1);
      next.splice(toIdx, 0, moved);
      return next.map((s, i) => ({ ...s, order: i }));
    });
    dragId.current = dragOver.current = null;
  }

  // ── Section helpers ───────────────────────────────────────────
  function addSection(type: SectionType) {
    setSections((prev) => [
      ...prev,
      { id: crypto.randomUUID(), type, order: prev.length, content: defaultContent(type) },
    ]);
  }

  function updateSection(id: string, content: Record<string, unknown>) {
    setSections((prev) => prev.map((s) => s.id === id ? { ...s, content } : s));
  }

  function removeSection(id: string) {
    setSections((prev) => prev.filter((s) => s.id !== id).map((s, i) => ({ ...s, order: i })));
  }

  // ── Save / Publish ────────────────────────────────────────────
  async function handleSave(publish = false) {
    if (!title || !clientName || !clientEmail) {
      setError("Title, client name, and client email are required");
      return;
    }

    setLoading(true);
    setError("");

    const body = {
      title,
      clientName,
      clientEmail,
      depositAmount: depositAmount ? Math.round(parseFloat(depositAmount) * 100) : undefined,
      contractBody,
      sections: sections.map(({ id: _id, ...s }) => s),
    };

    try {
      let id = proposalId;

      if (isEdit) {
        const res = await fetch(`/api/proposals/${proposalId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
      } else {
        const res = await fetch("/api/proposals", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        id = data.proposal.id;
      }

      if (publish) {
        const res = await fetch(`/api/proposals/${id}/publish`, { method: "POST" });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        router.push(`/proposals/${id}?published=true`);
      } else {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
        if (!isEdit) router.push(`/proposals/${id}`);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Back link in edit mode */}
      {isEdit && (
        <div className="mb-4">
          <Link
            href={`/proposals/${proposalId}`}
            className="text-sm text-gray-400 hover:text-gray-700 transition-colors"
          >
            ← Back to proposal
          </Link>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-gray-900">
            {isEdit ? "Edit Proposal" : "New Proposal"}
          </h1>
          <p className="text-gray-400 text-sm mt-0.5">
            {isEdit ? "Changes are saved to your draft." : "Fill in the details, then send to your client."}
          </p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <button
            onClick={() => handleSave(false)}
            disabled={loading}
            className="border-2 border-gray-200 hover:border-gray-300 px-4 py-2 rounded-xl text-sm font-bold text-gray-600 hover:text-gray-900 transition-all disabled:opacity-50"
          >
            {saved ? "Saved" : loading ? "Saving..." : "Save draft"}
          </button>
          <button
            onClick={() => handleSave(true)}
            disabled={loading || !title || !clientEmail}
            className="bg-sky-600 hover:bg-sky-700 text-white px-5 py-2 rounded-xl text-sm font-bold transition-all disabled:opacity-40 shadow-md shadow-sky-100 flex items-center gap-2"
          >
            {loading ? "Sending..." : "Send to client →"}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-6 flex items-center gap-2">
          {error}
        </div>
      )}

      {/* Client details */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 mb-5">
        <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span className="w-6 h-6 bg-sky-100 text-sky-700 rounded-lg flex items-center justify-center text-xs font-black">1</span>
          Client details
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { label: "Proposal title", value: title, set: setTitle, placeholder: "Website redesign project", full: true },
            { label: "Client name", value: clientName, set: setClientName, placeholder: "Acme Corp" },
            { label: "Client email", value: clientEmail, set: setClientEmail, placeholder: "client@company.com", type: "email" },
            { label: "Deposit amount ($)", value: depositAmount, set: setDeposit, placeholder: "500.00", type: "number" },
          ].map((f) => (
            <div key={f.label} className={f.full ? "md:col-span-2" : ""}>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">{f.label}</label>
              <input
                type={f.type ?? "text"}
                value={f.value}
                onChange={(e) => f.set(e.target.value)}
                placeholder={f.placeholder}
                className="w-full border-2 border-gray-100 focus:border-sky-400 rounded-xl px-4 py-3 text-sm outline-none transition-colors bg-gray-50 focus:bg-white"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Proposal sections */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 mb-5">
        <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span className="w-6 h-6 bg-sky-100 text-sky-700 rounded-lg flex items-center justify-center text-xs font-black">2</span>
          Proposal content
          <span className="text-xs text-gray-400 font-normal ml-1">Drag to reorder</span>
        </h2>

        <div className="space-y-3 mb-5">
          {sections.map((section) => (
            <div
              key={section.id}
              draggable
              onDragStart={() => onDragStart(section.id)}
              onDragEnter={() => onDragEnter(section.id)}
              onDragEnd={onDragEnd}
              onDragOver={(e) => e.preventDefault()}
              className="border-2 border-gray-100 hover:border-sky-200 rounded-xl p-4 relative group cursor-grab active:cursor-grabbing transition-colors bg-white"
            >
              {/* Drag handle */}
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 group-hover:text-gray-400 transition-colors select-none">
                ⠿
              </div>

              {/* Remove button */}
              <button
                onClick={() => removeSection(section.id)}
                className="absolute top-3 right-3 w-6 h-6 rounded-lg bg-gray-100 hover:bg-red-100 text-gray-400 hover:text-red-500 text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
              >
                Close
              </button>

              <div className="pl-6 pr-8">
                {section.type === "HEADING" && (
                  <input
                    className="w-full font-bold text-lg text-gray-900 border-none outline-none bg-transparent placeholder-gray-300"
                    value={(section.content.text as string) ?? ""}
                    onChange={(e) => updateSection(section.id, { text: e.target.value })}
                    placeholder="Section heading..."
                  />
                )}
                {section.type === "TEXT" && (
                  <textarea
                    className="w-full text-sm text-gray-600 border-none outline-none bg-transparent resize-none placeholder-gray-300"
                    rows={3}
                    value={(section.content.text as string) ?? ""}
                    onChange={(e) => updateSection(section.id, { text: e.target.value })}
                    placeholder="Add your content here..."
                  />
                )}
                {section.type === "PRICING" && (
                  <div className="flex gap-3 items-center">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wide w-14 flex-shrink-0">Price</span>
                    <input
                      className="flex-1 border-2 border-gray-100 focus:border-sky-300 rounded-lg px-3 py-1.5 text-sm outline-none bg-gray-50 focus:bg-white"
                      placeholder="Service or item description"
                      value={(section.content.label as string) ?? ""}
                      onChange={(e) => updateSection(section.id, { ...section.content, label: e.target.value })}
                    />
                    <input
                      className="w-28 border-2 border-gray-100 focus:border-sky-300 rounded-lg px-3 py-1.5 text-sm outline-none bg-gray-50 focus:bg-white"
                      placeholder="$0"
                      value={(section.content.price as string) ?? ""}
                      onChange={(e) => updateSection(section.id, { ...section.content, price: e.target.value })}
                    />
                  </div>
                )}
                {section.type === "DIVIDER" && (
                  <div className="flex items-center gap-3">
                    <hr className="flex-1 border-gray-200" />
                    <span className="text-xs text-gray-300">divider</span>
                    <hr className="flex-1 border-gray-200" />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Add section buttons */}
        <div className="flex flex-wrap gap-2">
          {(["HEADING", "TEXT", "PRICING", "DIVIDER"] as const).map((type) => (
            <button
              key={type}
              onClick={() => addSection(type)}
              className="flex items-center gap-1.5 text-xs border-2 border-dashed border-gray-200 hover:border-sky-300 hover:text-sky-600 px-3 py-2 rounded-lg text-gray-500 transition-all font-medium"
            >
              <span>+</span>
              {type === "HEADING" ? "Heading" : type === "TEXT" ? "Text" : type === "PRICING" ? "Pricing row" : "Divider"}
            </button>
          ))}
        </div>
      </div>

      {/* Contract */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6">
        <h2 className="font-bold text-gray-900 mb-1 flex items-center gap-2">
          <span className="w-6 h-6 bg-sky-100 text-sky-700 rounded-lg flex items-center justify-center text-xs font-black">3</span>
          Contract / Terms
        </h2>
        <p className="text-xs text-gray-400 mb-4 ml-8">
          Your client signs this before paying. Edit to match your terms.
        </p>
        <textarea
          value={contractBody}
          onChange={(e) => setContract(e.target.value)}
          rows={14}
          className="w-full border-2 border-gray-100 focus:border-sky-300 rounded-xl px-4 py-3 text-sm font-mono text-gray-600 outline-none resize-none transition-colors bg-gray-50 focus:bg-white leading-relaxed"
        />
      </div>
    </div>
  );
}
