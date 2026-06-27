import { NextRequest } from "next/server";
import { requireProposalAccess } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateToken, defaultExpiry } from "@/lib/tokens";
import { sendProposalLink } from "@/lib/email";
import { logAuditFromRequest } from "@/lib/audit-log";
import { apiError, apiOk } from "@/lib/utils";

// POST /api/proposals/[id]/publish
// Generates a unique share token and emails the client
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireProposalAccess();

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

    let emailSent = true;
    try {
      await sendProposalLink({
        to: proposal.clientEmail,
        clientName: proposal.clientName,
        senderName: user.name ?? user.email,
        proposalTitle: proposal.title,
        token,
      });
    } catch (e) {
      console.error("[publish] email failed:", e);
      emailSent = false;
    }

    await logAuditFromRequest(req, {
      action: "PROPOSAL_PUBLISHED",
      actorId: user.id,
      actorEmail: user.email,
      resourceType: "proposal",
      resourceId: proposal.id,
      metadata: { emailSent, clientEmail: proposal.clientEmail },
    });

    return apiOk({
      token: updated.token,
      url: `${process.env.NEXT_PUBLIC_APP_URL}/p/${token}`,
      emailSent,
    });
  } catch (err) {
    if ((err as Error).message === "Unauthorized") return apiError("Unauthorized", 401);
    if ((err as Error).message === "Forbidden") return apiError("Forbidden", 403);
    console.error("[publish]", err);
    return apiError("Failed to publish proposal", 500);
  }
}
