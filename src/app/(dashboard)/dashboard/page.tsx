import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { redirect } from "next/navigation";

const STATUS = {
  DRAFT:     { label: "Draft",    color: "bg-gray-100 text-gray-500",        dot: "bg-gray-400" },
  SENT:      { label: "Sent",     color: "bg-blue-50 text-blue-600",         dot: "bg-blue-400" },
  VIEWED:    { label: "Viewed",   color: "bg-amber-50 text-amber-600",       dot: "bg-amber-400" },
  SIGNED:    { label: "Signed",   color: "bg-violet-50 text-violet-700",     dot: "bg-violet-500" },
  PAID:      { label: "Paid",     color: "bg-emerald-50 text-emerald-700",   dot: "bg-emerald-500" },
  EXPIRED:   { label: "Expired",  color: "bg-red-50 text-red-600",           dot: "bg-red-400" },
  CANCELLED: { label: "Cancelled",color: "bg-gray-100 text-gray-400",        dot: "bg-gray-300" },
} as const;

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [proposals, statusGroups, totalPaid] = await Promise.all([
    prisma.proposal.findMany({
      where: { userId: session.user.id },
      orderBy: { updatedAt: "desc" },
      take: 6,
      select: {
        id: true, title: true, clientName: true, status: true,
        depositAmount: true, currency: true, updatedAt: true,
      },
    }),
    prisma.proposal.groupBy({
      by: ["status"],
      where: { userId: session.user.id },
      _count: true,
    }),
    prisma.payment.aggregate({
      where: { proposal: { userId: session.user.id }, status: "PAID" },
      _sum: { amount: true },
    }),
  ]);

  const total = statusGroups.reduce((a, s) => a + s._count, 0);
  const statMap = Object.fromEntries(statusGroups.map((s) => [s.status, s._count]));
  const collected = (totalPaid._sum.amount ?? 0) / 100;
  const awaiting = (statMap.SENT ?? 0) + (statMap.VIEWED ?? 0);

  const firstName = session.user?.name?.split(" ")[0] ?? "there";

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-gray-900">
            Good {getGreeting()}, {firstName} 👋
          </h1>
          <p className="text-gray-400 text-sm mt-1">Here&apos;s what&apos;s happening with your deals.</p>
        </div>
        <Link
          href="/proposals/new"
          className="bg-violet-600 hover:bg-violet-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-colors shadow-md shadow-violet-100 flex items-center gap-2"
        >
          <span>+</span> New Proposal
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          {
            label: "Total proposals",
            value: total,
            sub: "all time",
            icon: "📄",
            color: "bg-white",
          },
          {
            label: "Awaiting action",
            value: awaiting,
            sub: "sent or viewed",
            icon: "⏳",
            color: "bg-white",
          },
          {
            label: "Awaiting payment",
            value: statMap.SIGNED ?? 0,
            sub: "contracts signed",
            icon: "✍️",
            color: "bg-white",
          },
          {
            label: "Total collected",
            value: `$${collected.toLocaleString()}`,
            sub: "all time",
            icon: "💰",
            color: "bg-gradient-to-br from-violet-600 to-indigo-600",
            light: true,
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className={`${stat.color} rounded-2xl p-5 border border-gray-100 ${stat.light ? "border-transparent shadow-lg shadow-violet-200" : "shadow-sm"}`}
          >
            <div className="text-2xl mb-3">{stat.icon}</div>
            <div className={`text-2xl font-black ${stat.light ? "text-white" : "text-gray-900"}`}>
              {stat.value}
            </div>
            <div className={`text-xs mt-1 font-medium ${stat.light ? "text-violet-200" : "text-gray-400"}`}>
              {stat.label}
            </div>
            <div className={`text-xs ${stat.light ? "text-violet-300" : "text-gray-300"}`}>
              {stat.sub}
            </div>
          </div>
        ))}
      </div>

      {/* Recent proposals */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-bold text-gray-900">Recent proposals</h2>
          <Link href="/proposals" className="text-xs text-violet-600 hover:text-violet-700 font-semibold">
            View all →
          </Link>
        </div>

        {proposals.length === 0 ? (
          <div className="py-20 text-center">
            <div className="text-4xl mb-4">🚀</div>
            <p className="font-semibold text-gray-700 mb-1">No proposals yet</p>
            <p className="text-sm text-gray-400 mb-6">Create your first proposal and start closing deals.</p>
            <Link
              href="/proposals/new"
              className="inline-flex items-center gap-2 bg-violet-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-violet-700 transition-colors"
            >
              + Create first proposal
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {proposals.map((p) => {
              const badge = STATUS[p.status as keyof typeof STATUS] ?? STATUS.DRAFT;
              return (
                <Link
                  key={p.id}
                  href={`/proposals/${p.id}`}
                  className="flex items-center justify-between px-6 py-4 hover:bg-violet-50/40 transition-colors group"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center text-violet-600 font-bold text-sm flex-shrink-0 group-hover:bg-violet-200 transition-colors">
                      {p.title[0].toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 text-sm truncate group-hover:text-violet-700 transition-colors">
                        {p.title}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">{p.clientName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 flex-shrink-0 ml-4">
                    {p.depositAmount && (
                      <span className="text-sm font-bold text-gray-700">
                        ${(p.depositAmount / 100).toLocaleString()}
                      </span>
                    )}
                    <span className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-semibold ${badge.color}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                      {badge.label}
                    </span>
                    <span className="text-xs text-gray-300">
                      {new Date(p.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}
