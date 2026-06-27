import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { PublishButton } from "@/components/publish-button";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  DRAFT:     { label: "Draft",    color: "bg-gray-100 text-gray-600" },
  SENT:      { label: "Sent",     color: "bg-blue-100 text-blue-700" },
  VIEWED:    { label: "Viewed",   color: "bg-yellow-100 text-yellow-700" },
  SIGNED:    { label: "Signed",   color: "bg-sky-100 text-sky-700" },
  PAID:      { label: "Paid",     color: "bg-green-100 text-green-700" },
  EXPIRED:   { label: "Expired",  color: "bg-red-100 text-red-600" },
  CANCELLED: { label: "Cancelled",color: "bg-gray-100 text-gray-400" },
};

export default async function ProposalDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const proposal = await prisma.proposal.findFirst({
    where: { id: params.id, userId: session.user.id },
    include: {
      sections: { orderBy: { order: "asc" } },
      contract: true,
      payment: true,
    },
  });

  if (!proposal) notFound();

  const badge = STATUS_LABELS[proposal.status] ?? STATUS_LABELS.DRAFT;
  const shareUrl = proposal.token
    ? `${process.env.NEXT_PUBLIC_APP_URL}/p/${proposal.token}`
    : null;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-2">
        <Link href="/proposals" className="text-sm text-gray-400 hover:text-gray-700">
          ← Proposals
        </Link>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-8">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl font-bold text-gray-900 truncate">{proposal.title}</h1>
            <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium flex-shrink-0 ${badge.color}`}>
              {badge.label}
            </span>
          </div>
          <p className="text-gray-500 text-sm mt-1 truncate">
            {proposal.clientName} · {proposal.clientEmail}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {!["SIGNED", "PAID"].includes(proposal.status) && (
            <Link
              href={`/proposals/${proposal.id}/edit`}
              className="border-2 border-gray-200 hover:border-gray-300 px-4 py-2 rounded-xl text-sm font-bold text-gray-600 hover:text-gray-900 transition-all"
            >
              Edit
            </Link>
          )}
          {proposal.status === "DRAFT" && (
            <PublishButton proposalId={proposal.id} />
          )}
        </div>
      </div>

      {/* Share link */}
      {shareUrl && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl px-5 py-4 mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="text-sm font-medium text-blue-900">Shareable link</div>
            <div className="text-xs text-blue-600 mt-0.5 font-mono truncate">{shareUrl}</div>
          </div>
          <a
            href={shareUrl}
            target="_blank"
            rel="noreferrer"
            className="text-xs border border-blue-200 bg-white text-blue-700 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors self-start sm:self-auto flex-shrink-0"
          >
            Preview →
          </a>
        </div>
      )}

      {/* Progress timeline */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6 overflow-x-auto">
        <h2 className="font-semibold text-gray-900 mb-5">Status</h2>
        <div className="flex items-center min-w-[260px]">
          {[
            { label: "Sent",   done: ["SENT","VIEWED","SIGNED","PAID"].includes(proposal.status) },
            { label: "Viewed", done: ["VIEWED","SIGNED","PAID"].includes(proposal.status) },
            { label: "Signed", done: ["SIGNED","PAID"].includes(proposal.status) },
            { label: "Paid",   done: proposal.status === "PAID" },
          ].map((step, i, arr) => (
            <div key={step.label} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                    step.done ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {step.done ? "✓" : i + 1}
                </div>
                <span className="text-xs text-gray-500 mt-1 whitespace-nowrap">{step.label}</span>
              </div>
              {i < arr.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mb-4 mx-1 ${
                    arr[i + 1].done ? "bg-gray-900" : "bg-gray-200"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Signature detail */}
      {proposal.contract?.signedAt && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
          <h2 className="font-semibold text-gray-900 mb-3">Signature</h2>
          <div className="text-sm text-gray-600 space-y-1">
            <p><span className="text-gray-400">Signed by:</span> {proposal.contract.signerName}</p>
            <p><span className="text-gray-400">Email:</span> {proposal.contract.signerEmail}</p>
            <p>
              <span className="text-gray-400">Date:</span>{" "}
              {new Date(proposal.contract.signedAt).toLocaleString()}
            </p>
          </div>
          {proposal.contract.signatureData && (
            <div className="mt-4 border border-gray-100 rounded-lg p-3 bg-gray-50 inline-block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={proposal.contract.signatureData}
                alt="Signature"
                className="h-16 object-contain"
              />
            </div>
          )}
        </div>
      )}

      {/* Payment detail */}
      {proposal.depositAmount && (
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="font-semibold text-gray-900 mb-3">Payment</h2>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-gray-900">
                ${(proposal.depositAmount / 100).toLocaleString()}
              </div>
              <div className="text-xs text-gray-400 mt-0.5 uppercase">
                {proposal.currency} deposit
              </div>
            </div>
            <div>
              {proposal.payment?.status === "PAID" ? (
                <span className="bg-green-100 text-green-700 text-xs font-medium px-3 py-1 rounded-full">
                  ✓ Paid {new Date(proposal.payment.paidAt!).toLocaleDateString()}
                </span>
              ) : (
                <span className="bg-yellow-100 text-yellow-700 text-xs font-medium px-3 py-1 rounded-full">
                  Awaiting payment
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
