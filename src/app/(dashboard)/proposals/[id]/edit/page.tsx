import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { ProposalEditor } from "@/components/proposal-editor";

export default async function EditProposalPage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const proposal = await prisma.proposal.findFirst({
    where: { id: params.id, userId: session.user.id },
    include: { sections: { orderBy: { order: "asc" } } },
  });

  if (!proposal) notFound();

  // Can't edit a signed or paid proposal
  if (["SIGNED", "PAID"].includes(proposal.status)) {
    redirect(`/proposals/${params.id}`);
  }

  return (
    <ProposalEditor
      proposalId={params.id}
      initial={{
        title: proposal.title,
        clientName: proposal.clientName,
        clientEmail: proposal.clientEmail,
        depositAmount: proposal.depositAmount ? String(proposal.depositAmount / 100) : "",
        contractBody: proposal.contractBody ?? "",
        sections: proposal.sections.map((s) => ({
          id: s.id,
          type: s.type as "TEXT" | "PRICING" | "HEADING" | "DIVIDER",
          order: s.order,
          content: s.content as Record<string, unknown>,
        })),
      }}
    />
  );
}
