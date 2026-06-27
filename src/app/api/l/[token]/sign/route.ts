import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError, apiOk } from "@/lib/utils";
import { sendLeaseSignedNotification } from "@/lib/email";

// POST /api/l/[token]/sign — tenant signs the lease
export async function POST(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const lease = await prisma.lease.findUnique({
      where: { token: params.token },
      include: { leaseContract: true, user: true },
    });

    if (!lease) return apiError("Not found", 404);
    if (lease.status === "CANCELLED") return apiError("Lease cancelled", 410);
    if (lease.leaseContract?.signedAt) return apiError("Already signed", 409);
    if (lease.skipSigning) return apiError("This lease does not require a digital signature", 400);

    const body = await req.json();
    const { signerName, signerEmail, signatureData } = body;

    if (!signerName || !signerEmail || !signatureData) {
      return apiError("Name, email, and signature are required");
    }

    const ip = req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? undefined;

    await prisma.leaseContract.create({
      data: {
        leaseId: lease.id,
        signerName,
        signerEmail,
        signatureData,
        ipAddress: ip ?? null,
      },
    });

    await prisma.lease.update({
      where: { id: lease.id },
      data: { status: "SIGNED" },
    });

    // Notify landlord
    try {
      await sendLeaseSignedNotification({
        to: lease.user.email,
        ownerName: lease.user.name ?? "Landlord",
        tenantName: signerName,
        propertyAddress: lease.propertyAddress,
        leaseId: lease.id,
      });
    } catch (e) {
      console.error("[lease sign] email failed:", e);
    }

    return apiOk({
      signed: true,
      requiresDeposit: !!lease.depositAmount,
    });
  } catch (err) {
    console.error("[lease sign]", err);
    return apiError("Failed to submit signature", 500);
  }
}
