import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAuditFromRequest } from "@/lib/audit-log";
import { apiError, apiOk } from "@/lib/utils";

// DELETE /api/user — permanently delete the authenticated user's account
export async function DELETE(req: NextRequest) {
  try {
    const user = await requireAuth();

    await logAuditFromRequest(req, {
      action: "ACCOUNT_DELETED",
      actorId: user.id,
      actorEmail: user.email,
      resourceType: "user",
      resourceId: user.id,
    });

    await prisma.user.delete({
      where: { id: user.id },
    });

    return apiOk({ message: "Account deleted" });
  } catch (err) {
    if ((err as Error).message === "Unauthorized") return apiError("Unauthorized", 401);
    console.error("[delete-user]", err);
    return apiError("Failed to delete account", 500);
  }
}
