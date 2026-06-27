import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ProposalSearch } from "@/components/proposal-search";

const STATUS: Record<string, { label: string; color: string }> = {
  DRAFT:     { label: "Draft",    color: "bg-gray-100 text-gray-600" },
  SENT:      { label: "Sent",     color: "bg-blue-100 text-blue-700" },
  VIEWED:    { label: "Viewed",   color: "bg-yellow-100 text-yellow-700" },
  SIGNED:    { label: "Signed",   color: "bg-sky-100 text-sky-700" },
  PAID:      { label: "Paid",     color: "bg-green-100 text-green-700" },
  EXPIRED:   { label: "Expired",  color: "bg-red-100 text-red-600" },
  CANCELLED: { label: "Cancelled",color: "bg-gray-100 text-gray-400" },
};

export default async function ProposalsPage({
  searchParams,
}: {
  searchParams: { q?: string; status?: string };
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const q = searchParams.q?.trim() ?? "";
  const statusFilter = searchParams.status ?? "all";

  const proposals = await prisma.proposal.findMany({
    where: {
      userId: session.user.id,
      ...(q
        ? {
            OR: [
              { title: { contains: q, mode: "insensitive" } },
              { clientName: { contains: q, mode: "insensitive" } },
              { clientEmail: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
      ...(statusFilter !== "all" ? { status: statusFilter as "DRAFT" | "SENT" | "VIEWED" | "SIGNED" | "PAID" | "EXPIRED" | "CANCELLED" } : {}),
    },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      clientName: true,
      clientEmail: true,
      status: true,
      depositAmount: true,
      currency: true,
      createdAt: true,
    },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black text-gray-900">Proposals</h1>
        <Link
          href="/proposals/new"
          className="bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors shadow-md shadow-sky-100"
        >
          + New Proposal
        </Link>
      </div>

      {/* Search & filter bar */}
      <ProposalSearch currentQ={q} currentStatus={statusFilter} />

      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden mt-4">
        {proposals.length === 0 ? (
          <div className="py-20 text-center text-gray-400">
            {q || statusFilter !== "all" ? (
              <>
                <p className="mb-2 font-medium text-gray-600">No proposals match your filters</p>
                <Link href="/proposals" className="text-sm text-sky-600 hover:underline">
                  Clear filters
                </Link>
              </>
            ) : (
              <>
                <p className="mb-4 font-medium text-gray-600">No proposals yet</p>
                <Link
                  href="/proposals/new"
                  className="text-sm bg-sky-600 text-white px-5 py-2.5 rounded-xl hover:bg-sky-700 transition-colors"
                >
                  Create your first proposal
                </Link>
              </>
            )}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Proposal</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Client</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Amount</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {proposals.map((p) => {
                const badge = STATUS[p.status] ?? STATUS.DRAFT;
                const href = `/proposals/${p.id}`;
                return (
                  <tr key={p.id} className="hover:bg-sky-50/40 transition-colors group">
                    <td className="px-6 py-4">
                      <Link href={href} className="block">
                        <span className="font-semibold text-gray-900 group-hover:text-sky-700 transition-colors">
                          {p.title}
                        </span>
                        <span className="block text-xs text-gray-400 mt-0.5 sm:hidden">{p.clientName}</span>
                      </Link>
                    </td>
                    <td className="px-4 py-4 hidden sm:table-cell">
                      <Link href={href} className="block text-gray-600">
                        <div>{p.clientName}</div>
                        <div className="text-xs text-gray-400">{p.clientEmail}</div>
                      </Link>
                    </td>
                    <td className="px-4 py-4 hidden md:table-cell">
                      <Link href={href} className="block font-semibold text-gray-800">
                        {p.depositAmount
                          ? `$${(p.depositAmount / 100).toLocaleString()}`
                          : <span className="text-gray-300 font-normal">—</span>}
                      </Link>
                    </td>
                    <td className="px-4 py-4">
                      <Link href={href} className="block">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${badge.color}`}>
                          {badge.label}
                        </span>
                      </Link>
                    </td>
                    <td className="px-4 py-4 hidden lg:table-cell">
                      <Link href={href} className="block text-xs text-gray-400">
                        {new Date(p.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {proposals.length > 0 && (
        <p className="text-xs text-gray-400 mt-3 text-right">
          {proposals.length} proposal{proposals.length !== 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
}
