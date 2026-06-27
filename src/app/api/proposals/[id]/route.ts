import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireProposalAccess } from "@/lib/auth";
import { updateProposalSchema } from "@/lib/validators";
import { apiError, apiOk } from "@/lib/utils";

type Params = { params: { id: string } };

// GET /api/proposals/[id]
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const user = await requireProposalAccess();

    const proposal = await prisma.proposal.findFirst({
      where: { id: params.id, userId: user.id },
      include: {
        sections: { orderBy: { order: "asc" } },
        contract: true,
        payment: true,
      },
    });

    if (!proposal) return apiError("Not found", 404);

    return apiOk({ proposal });
  } catch (err) {
    if ((err as Error).message === "Unauthorized") return apiError("Unauthorized", 401);
    if ((err as Error).message === "Forbidden") return apiError("Forbidden", 403);
    return apiError("Server error", 500);
  }
}

// PATCH /api/proposals/[id]
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const user = await requireProposalAccess();
    const body = await req.json();
    const parsed = updateProposalSchema.safeParse(body);

    if (!parsed.success) {
      return apiError(parsed.error.issues[0].message, 422);
    }

    // Ensure proposal belongs to user
    const existing = await prisma.proposal.findFirst({
      where: { id: params.id, userId: user.id },
    });
    if (!existing) return apiError("Not found", 404);

    // Can't edit a proposal that's already signed or paid
    if (["SIGNED", "PAID"].includes(existing.status)) {
      return apiError("Cannot edit a signed or paid proposal", 409);
    }

    const { sections, ...proposalData } = parsed.data;

    const proposal = await prisma.$transaction(async (tx) => {
      // Delete existing sections and recreate if sections provided
      if (sections !== undefined) {
        await tx.proposalSection.deleteMany({ where: { proposalId: params.id } });
        await tx.proposalSection.createMany({
          data: sections.map((s) => ({
            proposalId: params.id,
            type: s.type,
            order: s.order,
            content: s.content as Prisma.InputJsonValue,
          })),
        });
      }

      return tx.proposal.update({
        where: { id: params.id, userId: user.id },
        data: proposalData,
        include: { sections: { orderBy: { order: "asc" } } },
      });
    });

    return apiOk({ proposal });
  } catch (err) {
    if ((err as Error).message === "Unauthorized") return apiError("Unauthorized", 401);
    if ((err as Error).message === "Forbidden") return apiError("Forbidden", 403);
    return apiError("Server error", 500);
  }
}

// DELETE /api/proposals/[id]
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const user = await requireProposalAccess();

    const existing = await prisma.proposal.findFirst({
      where: { id: params.id, userId: user.id },
    });
    if (!existing) return apiError("Not found", 404);

    await prisma.proposal.delete({ where: { id: params.id, userId: user.id } });

    return apiOk({ success: true });
  } catch (err) {
    if ((err as Error).message === "Unauthorized") return apiError("Unauthorized", 401);
    if ((err as Error).message === "Forbidden") return apiError("Forbidden", 403);
    return apiError("Server error", 500);
  }
}
