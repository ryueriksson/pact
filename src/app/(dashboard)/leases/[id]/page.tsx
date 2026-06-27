import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { formatCurrency } from "@/lib/tokens";

const STATUS_COLORS: Record<string, string> = {
  DRAFT:     "bg-gray-100 text-gray-600",
  SENT:      "bg-sky-100 text-sky-700",
  SIGNED:    "bg-amber-100 text-amber-700",
  ACTIVE:    "bg-green-100 text-green-700",
  EXPIRED:   "bg-gray-100 text-gray-500",
  CANCELLED: "bg-red-100 text-red-600",
};

export default async function LeaseDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { sent?: string };
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const lease = await prisma.lease.findFirst({
    where: { id: params.id, userId: session.user.id },
    include: {
      leaseContract: true,
      leasePayments: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!lease) notFound();

  const tenantLink  = `${process.env.NEXT_PUBLIC_APP_URL}/l/${lease.token}`;
  const depositPaid = lease.leasePayments.some((p) => p.type === "DEPOSIT" && p.status === "PAID");
  const rentActive  = !!lease.stripeSubId;

  return (
    <div className="max-w-3xl mx-auto">
      {/* Sent banner */}
      {searchParams.sent && (
        <div className="bg-green-50 border border-green-200 rounded-xl px-5 py-4 mb-6 flex items-center gap-3">
          <div>
            <p className="font-semibold text-green-800 text-sm">Lease sent to {lease.tenantEmail}!</p>
            <p className="text-xs text-green-600 mt-0.5">They&apos;ll receive an email with a link to sign and set up payments.</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-black text-gray-900">{lease.propertyAddress}</h1>
            {lease.unitNumber && (
              <span className="text-gray-400 text-lg">· {lease.unitNumber}</span>
            )}
          </div>
          <p className="text-gray-500 text-sm">Tenant: {lease.tenantName} · {lease.tenantEmail}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_COLORS[lease.status]}`}>
            {lease.status}
          </span>
          {["DRAFT", "SENT"].includes(lease.status) && (
            <Link
              href={`/leases/${lease.id}/edit`}
              className="border-2 border-gray-200 hover:border-gray-300 text-gray-600 hover:text-gray-900 px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
            >
              Edit
            </Link>
          )}
        </div>
      </div>

      {/* Key info cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Monthly rent", value: formatCurrency(lease.monthlyRent, lease.currency) + "/mo" },
          { label: "Security deposit", value: lease.depositAmount ? formatCurrency(lease.depositAmount, lease.currency) : "None" },
          { label: "Lease start", value: new Date(lease.leaseStart).toLocaleDateString() },
          { label: "Lease end", value: new Date(lease.leaseEnd).toLocaleDateString() },
        ].map((item) => (
          <div key={item.label} className="bg-white border border-gray-100 rounded-xl p-4">
            <p className="text-xs text-gray-400 font-medium mb-1">{item.label}</p>
            <p className="text-sm font-bold text-gray-900">{item.value}</p>
          </div>
        ))}
      </div>

      {/* Tenant link */}
      {lease.status !== "DRAFT" && (
        <div className="bg-white border border-gray-100 rounded-2xl p-5 mb-5">
          <h2 className="font-bold text-gray-900 text-sm mb-3">Tenant link</h2>
          <div className="flex items-center gap-2">
            <input
              readOnly
              value={tenantLink}
              className="flex-1 border-2 border-gray-100 rounded-xl px-3 py-2 text-sm text-gray-600 bg-gray-50 outline-none"
            />
            <button className="border-2 border-gray-200 hover:border-sky-300 text-gray-500 hover:text-sky-600 px-3 py-2 rounded-xl text-xs font-bold transition-all">
              Copy
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            This link is permanent — your tenant can always return to view the signed lease and payment history.
          </p>
        </div>
      )}

      {/* Checklist */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5 mb-5">
        <h2 className="font-bold text-gray-900 text-sm mb-4">Status checklist</h2>
        <div className="space-y-3">
          {[
            { label: "Lease sent to tenant", done: lease.status !== "DRAFT" },
            {
              label: lease.skipSigning ? "Existing lease on file (no signature required)" : "Lease signed by tenant",
              done: !!lease.leaseContract?.signedAt || lease.skipSigning,
            },
            ...(lease.depositAmount ? [{ label: "Security deposit paid", done: depositPaid }] : []),
            { label: "Monthly rent set up", done: rentActive },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-3">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                item.done ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-300"
              }`}>
                {item.done ? "Done" : "Pending"}
              </div>
              <span className={`text-sm ${item.done ? "text-gray-700 font-medium" : "text-gray-400"}`}>
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Payment history */}
      {lease.leasePayments.length > 0 && (
        <div className="bg-white border border-gray-100 rounded-2xl p-5">
          <h2 className="font-bold text-gray-900 text-sm mb-4">Payment history</h2>
          <div className="space-y-2">
            {lease.leasePayments.map((payment) => (
              <div key={payment.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div className="flex items-center gap-3">
                  <span className={`w-2 h-2 rounded-full ${
                    payment.status === "PAID" ? "bg-green-400" :
                    payment.status === "FAILED" ? "bg-red-400" : "bg-gray-300"
                  }`} />
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      {payment.type === "DEPOSIT" ? "Security deposit" : "Rent payment"}
                    </p>
                    {payment.paidAt && (
                      <p className="text-xs text-gray-400">
                        Paid {new Date(payment.paidAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">
                    {formatCurrency(payment.amount, payment.currency)}
                  </p>
                  <span className={`text-xs font-medium ${
                    payment.status === "PAID" ? "text-green-600" :
                    payment.status === "FAILED" ? "text-red-500" : "text-gray-400"
                  }`}>
                    {payment.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Back */}
      <div className="mt-6">
        <Link href="/leases" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
          ← Back to leases
        </Link>
      </div>
    </div>
  );
}
