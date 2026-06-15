import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { generateToken, defaultExpiry } from "@/lib/tokens";
import { sendProposalLink } from "@/lib/email";
import { apiError, apiOk } from "@/lib/utils";

// POST /api/proposals/[id]/publish
// Generates a unique share token and emails the client
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth();

    const proposal = await prisma.proposal.findFirst({
      where: { id: params.id, userId: user.id },
    });
    if (!proposal) return apiError("Not found", 404);

    if (proposal.status === "PAID") {
      return apiError("Proposal is already paid", 409);
    }

    // Generate token if not already set
    const token = proposal.token ?? generateToken();

    const updated = await prisma.proposal.update({
      where: { id: params.id },
      data: {
        token,
        status: "SENT",
        expiresAt: defaultExpiry(30),
      },
    });

    // Send email to client
    await sendProposalLink({
      to: proposal.clientEmail,
      clientName: proposal.clientName,
      senderName: user.name ?? user.email,
      proposalTitle: proposal.title,
      token,
    });

    return apiOk({
      token: updated.token,
      url: `${process.env.NEXT_PUBLIC_APP_URL}/p/${token}`,
    });
  } catch (err) {
    if ((err as Error).message === "Unauthorized") return apiError("Unauthorized", 401);
    console.error("[publish]", err);
    return apiError("Failed to publish proposal", 500);
  }
}
