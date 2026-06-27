import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { OnboardingForm } from "@/components/onboarding-form";

export default async function OnboardingPage() {
  const user = await requireUser();

  if (user.businessCategory) {
    redirect("/dashboard");
  }

  return <OnboardingForm />;
}
