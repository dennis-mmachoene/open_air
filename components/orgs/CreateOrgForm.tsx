"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, ErrorNote } from "@/components/ui";

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
    <form onSubmit={submit} className="flex flex-col gap-3 rounded-card border border-border bg-surface p-5">
      <label className="text-sm font-medium text-text" htmlFor="org-name">Create a team</label>
      <div className="flex flex-wrap gap-2">
        <Input
          id="org-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Acme Design"
          maxLength={60}
          className="min-w-0 flex-1"
        />
        <Button type="submit" disabled={busy || !name.trim()}>{busy ? "Creating…" : "Create"}</Button>
      </div>
      <ErrorNote message={error} />
    </form>
  );
}
