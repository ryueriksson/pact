import { NextRequest } from "next/server";
import { requireLeaseAccess } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiError, apiOk } from "@/lib/utils";
import { sendLeaseLink } from "@/lib/email";

// POST /api/leases/[id]/publish — send to tenant
export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireLeaseAccess();

    const lease = await prisma.lease.findFirst({
      where: { id: params.id, userId: user.id },
    });
    if (!lease) return apiError("Not found", 404);
    if (lease.status !== "DRAFT") return apiError("Lease already sent");

    await prisma.lease.update({
      where: { id: params.id },
      data: { status: "SENT" },
    });

    try {
      await sendLeaseLink({
        to: lease.tenantEmail,
        tenantName: lease.tenantName,
        senderName: user.name ?? user.email ?? "Your landlord",
        propertyAddress: lease.propertyAddress,
        token: lease.token,
      });
    } catch (e) {
      console.error("[lease publish] email failed:", e);
    }

    return apiOk({ token: lease.token });
  } catch (err) {
    if ((err as Error).message === "Unauthorized") return apiError("Unauthorized", 401);
    if ((err as Error).message === "Forbidden") return apiError("Forbidden", 403);
    return apiError("Failed to publish lease", 500);
  }
}
