"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export function AcceptInvite({ token }: { token: string }) {
  const { status } = useSession();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function accept() {
    if (status !== "authenticated") {
      router.push(`/signin?callbackUrl=/invite/${token}`);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/orgs/invites/${token}/accept`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not accept invite.");
      router.push(`/orgs/${data.orgSlug}`);
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button type="button" onClick={accept} disabled={busy} className="rounded-pill bg-text px-5 py-2.5 text-sm font-medium text-canvas hover:opacity-90 disabled:opacity-50">
        {status === "authenticated" ? (busy ? "Joining…" : "Accept invite") : "Sign in to accept"}
      </button>
      {error ? <p className="text-sm text-p-danger">{error}</p> : null}
    </div>
  );
}
