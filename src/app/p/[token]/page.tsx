import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { ClientProposalView } from "@/components/client-proposal-view";

export default async function PublicProposalPage({
  params,
}: {
  params: { token: string };
}) {
  const proposal = await prisma.proposal.findUnique({
    where: { token: params.token },
    include: {
      sections: { orderBy: { order: "asc" } },
      contract: { select: { signerName: true, signedAt: true } },
      payment: { select: { status: true, paidAt: true } },
    },
  });

  if (!proposal) notFound();

  if (proposal.expiresAt && proposal.expiresAt < new Date()) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Proposal Expired</h1>
          <p className="text-gray-500">This proposal is no longer accepting signatures.</p>
        </div>
      </div>
    );
  }

  // Mark as viewed (server-side, no redirect)
  if (proposal.status === "SENT") {
    await prisma.proposal.update({
      where: { id: proposal.id },
      data: { status: "VIEWED" },
    });
  }

  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50" />}>
    <ClientProposalView
      token={params.token}
      proposal={{
        id: proposal.id,
        title: proposal.title,
        clientName: proposal.clientName,
        status: proposal.status,
        depositAmount: proposal.depositAmount,
        currency: proposal.currency,
        contractBody: proposal.contractBody,
        sections: proposal.sections as Array<{
          id: string;
          type: string;
          order: number;
          content: Record<string, unknown>;
        }>,
        contract: proposal.contract,
        payment: proposal.payment,
      }}
    />
    </Suspense>
  );
}
