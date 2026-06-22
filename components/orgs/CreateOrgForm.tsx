"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function CreateOrgForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/orgs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not create team.");
      router.push(`/orgs/${data.org.slug}`);
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-5">
      <label className="text-sm font-medium text-text" htmlFor="org-name">Create a team</label>
      <div className="flex flex-wrap gap-2">
        <input
          id="org-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Acme Design"
          maxLength={60}
          className="min-w-0 flex-1 rounded-xl border border-border bg-canvas px-3 py-2 text-sm text-text placeholder:text-text-muted focus:border-text focus:outline-none"
        />
        <button type="submit" disabled={busy || !name.trim()} className="rounded-full bg-text px-5 py-2 text-sm font-medium text-canvas hover:opacity-90 disabled:opacity-50">
          {busy ? "Creating…" : "Create"}
        </button>
      </div>
      {error ? <p className="text-xs text-p-danger">{error}</p> : null}
    </form>
  );
}
