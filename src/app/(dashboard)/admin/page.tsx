import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/tokens";
import { redirect } from "next/navigation";

type VolumeByCurrency = {
  currency: string;
  amountCents: number;
  count: number;
};

function mergeVolume(
  proposalRows: { currency: string; _sum: { amount: number | null }; _count: number }[],
  leaseRows: { currency: string; _sum: { amount: number | null }; _count: number }[]
): VolumeByCurrency[] {
  const map = new Map<string, VolumeByCurrency>();

  for (const row of [...proposalRows, ...leaseRows]) {
    const key = row.currency.toLowerCase();
    const existing = map.get(key) ?? { currency: key, amountCents: 0, count: 0 };
    existing.amountCents += row._sum.amount ?? 0;
    existing.count += row._count;
    map.set(key, existing);
  }

  return Array.from(map.values()).sort((a, b) => b.amountCents - a.amountCents);
}

export default async function AdminPage() {
  try {
    await requireAdmin();
  } catch {
    redirect("/dashboard");
  }

  const [
    totalUsers,
    verifiedUsers,
    totalProposals,
    proposalStatusGroups,
    totalLeases,
    proposalPaymentVolume,
    leasePaymentVolume,
    totalTransactions,
    recentUsers,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { emailVerified: { not: null } } }),
    prisma.proposal.count(),
    prisma.proposal.groupBy({
      by: ["status"],
      _count: true,
    }),
    prisma.lease.count(),
    prisma.payment.groupBy({
      by: ["currency"],
      where: { status: "PAID" },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.leasePayment.groupBy({
      by: ["currency"],
      where: { status: "PAID" },
      _sum: { amount: true },
      _count: true,
    }),
    Promise.all([
      prisma.payment.count({ where: { status: "PAID" } }),
      prisma.leasePayment.count({ where: { status: "PAID" } }),
    ]).then(([proposals, leases]) => proposals + leases),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        name: true,
        email: true,
        businessCategory: true,
        plan: true,
        createdAt: true,
        emailVerified: true,
      },
    }),
  ]);

  const volumeByCurrency = mergeVolume(proposalPaymentVolume, leasePaymentVolume);
  const primaryVolume = volumeByCurrency[0];
  const proposalStatusMap = Object.fromEntries(
    proposalStatusGroups.map((row) => [row.status, row._count])
  );

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-black text-gray-900">Admin</h1>
        <p className="text-gray-400 text-sm mt-1">
          Platform-wide stats across all Pact users.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total users" value={totalUsers.toLocaleString()} sub={`${verifiedUsers} verified`} />
        <StatCard label="Total proposals" value={totalProposals.toLocaleString()} sub={`${totalLeases} leases`} />
        <StatCard
          label="Completed transactions"
          value={totalTransactions.toLocaleString()}
          sub="proposal deposits + lease payments"
        />
        <StatCard
          label="Total volume"
          value={
            primaryVolume
              ? formatCurrency(primaryVolume.amountCents, primaryVolume.currency)
              : "$0"
          }
          sub={
            volumeByCurrency.length > 1
              ? `${volumeByCurrency.length} currencies`
              : "paid through Pact"
          }
          highlight
        />
      </div>

      {volumeByCurrency.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-bold text-gray-900">Volume by currency</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {volumeByCurrency.map((row) => (
              <div key={row.currency} className="flex items-center justify-between px-6 py-4">
                <div>
                  <p className="font-semibold text-gray-900 uppercase">{row.currency}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{row.count} transactions</p>
                </div>
                <p className="text-lg font-black text-gray-900">
                  {formatCurrency(row.amountCents, row.currency)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-bold text-gray-900">Proposals by status</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {proposalStatusGroups.length === 0 ? (
              <p className="px-6 py-8 text-sm text-gray-400">No proposals yet.</p>
            ) : (
              proposalStatusGroups.map((row) => (
                <div key={row.status} className="flex items-center justify-between px-6 py-3">
                  <span className="text-sm text-gray-600">{row.status}</span>
                  <span className="text-sm font-bold text-gray-900">{row._count}</span>
                </div>
              ))
            )}
          </div>
          <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 text-xs text-gray-500">
            Paid proposals: {proposalStatusMap.PAID ?? 0}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-bold text-gray-900">Recent signups</h2>
          </div>
          {recentUsers.length === 0 ? (
            <p className="px-6 py-8 text-sm text-gray-400">No users yet.</p>
          ) : (
            <div className="divide-y divide-gray-50">
              {recentUsers.map((user) => (
                <div key={user.id} className="px-6 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 text-sm truncate">
                        {user.name ?? "Unnamed user"}
                      </p>
                      <p className="text-xs text-gray-400 truncate">{user.email}</p>
                    </div>
                    <span className="text-xs text-gray-400 flex-shrink-0">
                      {user.createdAt.toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Badge>{user.businessCategory ?? "No category"}</Badge>
                    <Badge>{user.plan}</Badge>
                    {user.emailVerified ? (
                      <Badge tone="green">Verified</Badge>
                    ) : (
                      <Badge tone="amber">Unverified</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  highlight = false,
}: {
  label: string;
  value: string;
  sub: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl p-5 border ${
        highlight
          ? "bg-gradient-to-br from-sky-600 to-sky-700 border-transparent shadow-lg shadow-sky-200"
          : "bg-white border-gray-100 shadow-sm"
      }`}
    >
      <div className={`text-2xl font-black ${highlight ? "text-white" : "text-gray-900"}`}>
        {value}
      </div>
      <div className={`text-xs mt-1 font-medium ${highlight ? "text-sky-200" : "text-gray-400"}`}>
        {label}
      </div>
      <div className={`text-xs ${highlight ? "text-sky-300" : "text-gray-300"}`}>{sub}</div>
    </div>
  );
}

function Badge({
  children,
  tone = "gray",
}: {
  children: React.ReactNode;
  tone?: "gray" | "green" | "amber";
}) {
  const colors = {
    gray: "bg-gray-100 text-gray-600",
    green: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
  };

  return (
    <span className={`text-[10px] uppercase tracking-wide font-semibold px-2 py-0.5 rounded-full ${colors[tone]}`}>
      {children}
    </span>
  );
}
