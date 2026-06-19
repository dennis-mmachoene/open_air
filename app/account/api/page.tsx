import type { Metadata } from "next";
import { requireUser } from "@/lib/auth-guard";
import { getEntitlements } from "@/lib/entitlements";
import { ApiKeys } from "@/components/account/ApiKeys";
import { UpgradeCard } from "@/components/studio/UpgradeCard";

export const metadata: Metadata = { title: "API keys" };

export default async function ApiKeysPage() {
  const user = await requireUser();
  const entitlements = await getEntitlements(user.id);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-5 py-12 sm:px-8">
      <header className="flex flex-col gap-2">
        <h1 className="font-display text-4xl text-text">API keys</h1>
        <p className="text-text-soft">
          Use the Open Air API to pull palettes into your own tools.
        </p>
      </header>

      {entitlements.api ? (
        <>
          <ApiKeys />
          <div className="flex flex-col gap-2 rounded-2xl border border-border p-5">
            <h2 className="text-sm font-medium text-text">Example request</h2>
            <pre className="overflow-auto rounded-lg bg-surface-2 p-3 font-mono text-xs text-text">
              <code>{`curl https://openair.app/api/v1/palettes?mood=Calm \\
  -H "Authorization: Bearer oa_your_key"`}</code>
            </pre>
          </div>
        </>
      ) : (
        <UpgradeCard feature="The public API" />
      )}
    </div>
  );
}
