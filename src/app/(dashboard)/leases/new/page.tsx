import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { LeaseEditor } from "@/components/lease-editor";

export default async function NewLeasePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { plan: true },
  });

  return <LeaseEditor isPro={user?.plan === "PRO"} />;
}
