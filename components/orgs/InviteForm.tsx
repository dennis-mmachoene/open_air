"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function InviteForm({ slug }: { slug: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("member");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || busy) return;
    setBusy(true);
    setError(null);
    setSent(null);
    try {
      const res = await fetch(`/api/orgs/${slug}/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not send invite.");
      setSent(email.trim());
      setEmail("");
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="teammate@company.com"
          className="min-w-0 flex-1 rounded-xl border border-border bg-canvas px-3 py-2 text-sm text-text placeholder:text-text-muted focus:border-text focus:outline-none"
        />
        <select value={role} onChange={(e) => setRole(e.target.value)} className="rounded-xl border border-border bg-canvas px-3 py-2 text-sm text-text focus:border-text focus:outline-none">
          <option value="member">Member</option>
          <option value="admin">Admin</option>
        </select>
        <button type="submit" disabled={busy || !email.trim()} className="rounded-full bg-text px-4 py-2 text-sm font-medium text-canvas hover:opacity-90 disabled:opacity-50">
          {busy ? "Sending…" : "Invite"}
        </button>
      </div>
      {error ? <p className="text-xs text-p-danger">{error}</p> : null}
      {sent ? <p className="text-xs text-text-soft">Invite sent to {sent}.</p> : null}
    </form>
  );
}
