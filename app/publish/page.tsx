import type { Metadata } from "next";
import { requireUser } from "@/lib/auth-guard";
import { getEntitlements } from "@/lib/entitlements";
import { PublishForm } from "@/components/community/PublishForm";
import { UpgradeCard } from "@/components/studio/UpgradeCard";

export const metadata: Metadata = { title: "Publish a palette" };

export default async function PublishPage({ searchParams }: { searchParams: Promise<{ colors?: string }> }) {
  const user = await requireUser();
  const entitlements = await getEntitlements(user.id);
  const { colors } = await searchParams;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-5 py-12 sm:px-8">
      <header className="flex flex-col gap-2">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-text-muted">Community</p>
        <h1 className="font-display text-4xl text-text">Publish a palette</h1>
        <p className="text-text-soft">Share a palette with the Open Air community. Document it well — craft and accessibility get noticed.</p>
      </header>
      {entitlements.publish ? <PublishForm initialColors={colors ?? ""} /> : <UpgradeCard feature="Publishing" />}
    </div>
  );
}
