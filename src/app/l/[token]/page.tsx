import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ClientLeaseView } from "@/components/client-lease-view";
import { isLeasePubliclyAccessible } from "@/lib/lease-access";

export default async function TenantLeasePage({ params }: { params: { token: string } }) {
  const lease = await prisma.lease.findUnique({
    where: { token: params.token },
    include: {
      leaseContract: true,
      leasePayments: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!lease || lease.status === "CANCELLED" || !isLeasePubliclyAccessible(lease.status)) {
    notFound();
  }

  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50" />}>
      <ClientLeaseView
        token={params.token}
        lease={{
          id: lease.id,
          propertyAddress: lease.propertyAddress,
          unitNumber: lease.unitNumber,
          tenantName: lease.tenantName,
          monthlyRent: lease.monthlyRent,
          depositAmount: lease.depositAmount,
          currency: lease.currency,
          leaseStart: lease.leaseStart.toISOString(),
          leaseEnd: lease.leaseEnd.toISOString(),
          hasLeaseDocument: !!lease.leaseDocUrl,
          contractBody: lease.contractBody,
          status: lease.status,
          skipSigning: lease.skipSigning,
          stripeSubId: lease.stripeSubId,
          leaseContract: lease.leaseContract
            ? {
                signerName: lease.leaseContract.signerName,
                signedAt: lease.leaseContract.signedAt.toISOString(),
              }
            : null,
          depositPaid: lease.leasePayments.some(
            (p) => p.type === "DEPOSIT" && p.status === "PAID"
          ),
        }}
      />
    </Suspense>
  );
}
