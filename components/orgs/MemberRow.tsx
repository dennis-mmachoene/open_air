"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui";
import Link from "next/link";

const ROLES = ["owner", "admin", "member"] as const;

export interface MemberRowData {
  userId: string;
  role: string;
  name: string | null;
  email: string | null;
  handle: string | null;
}

export function MemberRow({
  slug,
  member,
  canManage,
  isSelf,
}: {
  slug: string;
  member: MemberRowData;
  canManage: boolean;
  isSelf: boolean;
}) {
  const router = useRouter();
  const { success } = useToast();
  const [role, setRole] = useState(member.role);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function changeRole(next: string) {
    const prev = role;
    setRole(next);
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/orgs/${slug}/members/${member.userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: next }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not update role.");
      success("Role updated");
      router.refresh();
    } catch (e) {
      setRole(prev);
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!confirm(`Remove ${member.name ?? member.email ?? "this member"} from the team?`)) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/orgs/${slug}/members/${member.userId}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Could not remove member.");
      success("Member removed");
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }

  const display = member.name ?? (member.handle ? `@${member.handle}` : member.email ?? "Member");

  return (
    <li className="flex flex-wrap items-center gap-3 border-b border-border py-3 last:border-0">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-text">
          {member.handle ? (
            <Link href={`/u/${member.handle}`} className="hover:underline">{display}</Link>
          ) : display}
          {isSelf ? <span className="ml-1 text-text-muted">(you)</span> : null}
        </p>
        {member.email ? <p className="truncate text-xs text-text-muted">{member.email}</p> : null}
        {error ? <p className="text-xs text-p-danger">{error}</p> : null}
      </div>
      {canManage && !isSelf ? (
        <select
          value={role}
          onChange={(e) => changeRole(e.target.value)}
          disabled={busy}
          className="rounded-control border border-border bg-canvas px-2 py-1 text-xs capitalize text-text focus:border-text focus:outline-none"
        >
          {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
      ) : (
        <span className="rounded-pill border border-border px-2.5 py-0.5 text-xs capitalize text-text-soft">{role}</span>
      )}
      {canManage && !isSelf ? (
        <button type="button" onClick={remove} disabled={busy} className="text-xs text-text-muted hover:text-p-danger disabled:opacity-50">Remove</button>
      ) : null}
    </li>
  );
}
