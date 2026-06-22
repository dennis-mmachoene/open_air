"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Select, ErrorNote, useToast } from "@/components/ui";

export function InviteForm({ slug }: { slug: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("member");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { success } = useToast();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/orgs/${slug}/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not send invite.");
      success(`Invite sent to ${email.trim()}`);
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
        <Input
          type="email"
          aria-label="Teammate email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="teammate@company.com"
          className="min-w-0 flex-1"
        />
        <Select aria-label="Role" value={role} onChange={(e) => setRole(e.target.value)} className="w-auto">
          <option value="member">Member</option>
          <option value="admin">Admin</option>
        </Select>
        <Button type="submit" disabled={busy || !email.trim()}>{busy ? "Sending…" : "Invite"}</Button>
      </div>
      <ErrorNote message={error} />
    </form>
  );
}
