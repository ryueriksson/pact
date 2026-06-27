import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
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

export default async function LeasesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const leases = await prisma.lease.findMany({
    where: { userId: session.user.id },
    include: { leaseContract: true, leasePayments: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Leases</h1>
          <p className="text-gray-400 text-sm mt-0.5">Manage rental agreements and payments</p>
        </div>
        <Link
          href="/leases/new"
          className="bg-sky-600 hover:bg-sky-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-colors shadow-md shadow-sky-100 flex items-center gap-2"
        >
          <span>+</span> New Lease
        </Link>
      </div>

      {leases.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-2xl p-12 text-center">
          <div className="text-5xl mb-4">🏠</div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">No leases yet</h2>
          <p className="text-gray-400 text-sm mb-6">
            Create a lease and send it to your tenant — they sign and pay in one link.
          </p>
          <Link
            href="/leases/new"
            className="inline-flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-colors"
          >
            <span>+</span> New Lease
          </Link>
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">Property</th>
                  <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden sm:table-cell">Tenant</th>
                  <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden md:table-cell">Monthly rent</th>
                  <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden lg:table-cell">Lease period</th>
                  <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">Status</th>
                  <th className="px-6 py-3.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {leases.map((lease) => (
                  <tr key={lease.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">
                          {lease.propertyAddress}
                        </p>
                        {lease.unitNumber && (
                          <p className="text-xs text-gray-400">{lease.unitNumber}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden sm:table-cell">
                      <p className="text-sm text-gray-700">{lease.tenantName}</p>
                      <p className="text-xs text-gray-400">{lease.tenantEmail}</p>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      <p className="text-sm font-semibold text-gray-900">
                        {formatCurrency(lease.monthlyRent, lease.currency)}/mo
                      </p>
                    </td>
                    <td className="px-6 py-4 hidden lg:table-cell">
                      <p className="text-xs text-gray-500">
                        {new Date(lease.leaseStart).toLocaleDateString()} –{" "}
                        {new Date(lease.leaseEnd).toLocaleDateString()}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_COLORS[lease.status] ?? "bg-gray-100 text-gray-600"}`}>
                        {lease.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/leases/${lease.id}`}
                        className="text-xs font-semibold text-sky-600 hover:text-sky-700"
                      >
                        View →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
