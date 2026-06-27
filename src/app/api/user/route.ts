import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiError, apiOk } from "@/lib/utils";

// DELETE /api/user — permanently delete the authenticated user's account
export async function DELETE() {
  try {
    const user = await requireAuth();

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
