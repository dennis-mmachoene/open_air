"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function InviteRow({ slug, id, email, role }: { slug: string; id: string; email: string; role: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function revoke() {
    setBusy(true);
    try {
      const res = await fetch(`/api/orgs/${slug}/invites/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      setBusy(false);
    }
  }

  return (
    <li className="flex flex-wrap items-center gap-3 border-b border-border py-3 last:border-0">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-text">{email}</p>
        <p className="text-xs text-text-muted">Pending · {role}</p>
      </div>
      <button type="button" onClick={revoke} disabled={busy} className="text-xs text-text-muted hover:text-p-danger disabled:opacity-50">Revoke</button>
    </li>
  );
}
