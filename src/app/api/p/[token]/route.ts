import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError, apiOk } from "@/lib/utils";

// GET /api/p/[token] — public endpoint for client proposal view
export async function GET(
  _req: NextRequest,
  { params }: { params: { token: string } }
) {
  const proposal = await prisma.proposal.findUnique({
    where: { token: params.token },
    include: {
      sections: { orderBy: { order: "asc" } },
      contract: { select: { signerName: true, signedAt: true } },
      payment: { select: { status: true, paidAt: true, amount: true, currency: true } },
    },
  });

  if (!proposal) return apiError("Proposal not found", 404);

  // Check expiry
  if (proposal.expiresAt && proposal.expiresAt < new Date()) {
    return apiError("This proposal has expired", 410);
  }

  if (proposal.status === "CANCELLED") {
    return apiError("This proposal has been cancelled", 410);
  }

  // Mark as viewed if first time
  if (proposal.status === "SENT") {
    await prisma.proposal.update({
      where: { id: proposal.id },
      data: { status: "VIEWED" },
    });
  }

  // Return safe public fields only (never expose userId, token internals)
  return apiOk({
    id: proposal.id,
    title: proposal.title,
    clientName: proposal.clientName,
    status: proposal.status,
    depositAmount: proposal.depositAmount,
    currency: proposal.currency,
    contractBody: proposal.contractBody,
    sections: proposal.sections,
    contract: proposal.contract,
    payment: proposal.payment,
    expiresAt: proposal.expiresAt,
  });
}
