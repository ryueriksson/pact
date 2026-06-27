import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { LeaseEditor } from "@/components/lease-editor";

export default async function EditLeasePage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const lease = await prisma.lease.findFirst({
    where: { id: params.id, userId: session.user.id },
  });

  if (!lease) notFound();
  if (["ACTIVE", "EXPIRED", "CANCELLED", "SIGNED"].includes(lease.status)) {
    redirect(`/leases/${lease.id}`);
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { plan: true },
  });

  return (
    <LeaseEditor
      leaseId={lease.id}
      isPro={user?.plan === "PRO"}
      initial={{
        propertyAddress: lease.propertyAddress,
        unitNumber: lease.unitNumber ?? "",
        tenantName: lease.tenantName,
        tenantEmail: lease.tenantEmail,
        monthlyRent: (lease.monthlyRent / 100).toFixed(2),
        depositAmount: lease.depositAmount ? (lease.depositAmount / 100).toFixed(2) : "",
        leaseStart: lease.leaseStart.toISOString(),
        leaseEnd: lease.leaseEnd.toISOString(),
        leaseDocUrl: lease.leaseDocUrl ?? "",
        contractBody: lease.contractBody ?? "",
        skipSigning: lease.skipSigning,
      }}
    />
  );
}
