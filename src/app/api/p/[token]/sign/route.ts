import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { signContractSchema } from "@/lib/validators";
import { sendSignedNotification } from "@/lib/email";
import { logAuditFromRequest } from "@/lib/audit-log";
import { apiError, apiOk } from "@/lib/utils";

// POST /api/p/[token]/sign — client submits e-signature
export async function POST(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const body = await req.json();
    const parsed = signContractSchema.safeParse(body);

    if (!parsed.success) {
      return apiError(parsed.error.issues[0].message, 422);
    }

    const proposal = await prisma.proposal.findUnique({
      where: { token: params.token },
      include: { user: { select: { email: true, name: true } }, contract: true },
    });

    if (!proposal) return apiError("Proposal not found", 404);
    if (proposal.status === "CANCELLED") {
      return apiError("This proposal has been cancelled", 410);
    }
    if (proposal.expiresAt && proposal.expiresAt < new Date()) {
      return apiError("Proposal has expired", 410);
    }
    if (proposal.contract?.signedAt) {
      return apiError("Already signed", 409);
    }

    const ipAddress =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      req.headers.get("x-real-ip") ??
      "unknown";

    const userAgent = req.headers.get("user-agent") ?? "";

    // Upsert contract record
    await prisma.contract.upsert({
      where: { proposalId: proposal.id },
      create: {
        proposalId: proposal.id,
        signerName: parsed.data.signerName,
        signerEmail: parsed.data.signerEmail,
        signatureData: parsed.data.signatureData,
        signedAt: new Date(),
        ipAddress,
        userAgent,
      },
      update: {
        signerName: parsed.data.signerName,
        signerEmail: parsed.data.signerEmail,
        signatureData: parsed.data.signatureData,
        signedAt: new Date(),
        ipAddress,
        userAgent,
      },
    });

    // Update proposal status
    await prisma.proposal.update({
      where: { id: proposal.id },
      data: {
        status: proposal.depositAmount ? "SIGNED" : "PAID", // no payment needed → complete
      },
    });

    // Notify proposal owner
    await sendSignedNotification({
      to: proposal.user.email,
      ownerName: proposal.user.name ?? proposal.user.email,
      clientName: parsed.data.signerName,
      proposalTitle: proposal.title,
      proposalId: proposal.id,
    });

    await logAuditFromRequest(req, {
      action: "PROPOSAL_SIGNED",
      resourceType: "proposal",
      resourceId: proposal.id,
      metadata: { signerEmail: parsed.data.signerEmail },
    });

    return apiOk({ success: true, requiresPayment: !!proposal.depositAmount });
  } catch (err) {
    console.error("[sign]", err);
    return apiError("Failed to submit signature", 500);
  }
}
