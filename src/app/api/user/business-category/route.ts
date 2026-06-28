import { NextRequest } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { businessCategorySchema } from "@/lib/validators";
import { apiError, apiOk } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await req.json();
    const parsed = businessCategorySchema.safeParse(body.businessCategory);

    if (!parsed.success) {
      return apiError("Please choose a business category", 422);
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { businessCategory: parsed.data },
      select: { id: true, businessCategory: true },
    });

    return apiOk({ user: updated });
  } catch (err) {
    if ((err as Error).message === "Unauthorized") return apiError("Unauthorized", 401);
    console.error("[business-category]", err);
    return apiError("Something went wrong", 500);
  }
}
