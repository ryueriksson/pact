import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireProposalAccess } from "@/lib/auth";
import { createProposalSchema } from "@/lib/validators";
import { apiError, apiOk } from "@/lib/utils";

// GET /api/proposals — list all proposals for current user
export async function GET() {
  try {
    const user = await requireProposalAccess();

    const proposals = await prisma.proposal.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        title: true,
        clientName: true,
        clientEmail: true,
        status: true,
        depositAmount: true,
        currency: true,
        token: true,
        createdAt: true,
        updatedAt: true,
        contract: { select: { signedAt: true } },
        payment: { select: { status: true, paidAt: true } },
      },
    });

    return apiOk({ proposals });
  } catch (err) {
    if ((err as Error).message === "Unauthorized") return apiError("Unauthorized", 401);
    if ((err as Error).message === "Forbidden") return apiError("Forbidden", 403);
    console.error("[proposals/GET]", err);
    return apiError("Failed to fetch proposals", 500);
  }
}

// POST /api/proposals — create a new proposal
export async function POST(req: NextRequest) {
  try {
    const user = await requireProposalAccess();
    const body = await req.json();
    const parsed = createProposalSchema.safeParse(body);

    if (!parsed.success) {
      return apiError(parsed.error.issues[0].message, 422);
    }

    const { sections, ...proposalData } = parsed.data;

    const proposal = await prisma.proposal.create({
      data: {
        ...proposalData,
        userId: user.id,
        sections: {
          create: sections.map((s) => ({
            type: s.type,
            order: s.order,
            content: s.content as Prisma.InputJsonValue,
          })),
        },
      },
      include: { sections: true },
    });

    return apiOk({ proposal }, 201);
  } catch (err) {
    if ((err as Error).message === "Unauthorized") return apiError("Unauthorized", 401);
    if ((err as Error).message === "Forbidden") return apiError("Forbidden", 403);
    console.error("[proposals/POST]", err);
    return apiError("Failed to create proposal", 500);
  }
}
