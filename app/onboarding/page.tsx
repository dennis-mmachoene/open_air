import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { needsOnboarding, listUseCases } from "@/lib/onboarding";
import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow";

export const metadata: Metadata = { title: "Welcome" };
export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const session = await auth();
  if (!session?.user) redirect("/signin");
  if (!(await needsOnboarding(session.user.id))) redirect("/dashboard");

  return <OnboardingFlow name={session.user.name ?? null} useCases={listUseCases()} />;
}
