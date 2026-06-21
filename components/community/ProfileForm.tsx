"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ProfileForm({ initial }: { initial: { handle: string | null; bio: string | null; website: string | null } }) {
  const router = useRouter();
  const [handle, setHandle] = useState(initial.handle ?? "");
  const [bio, setBio] = useState(initial.bio ?? "");
  const [website, setWebsite] = useState(initial.website ?? "");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ handle, bio, website }),
      });
      const data = await res.json();
      if (!res.ok) setMsg({ ok: false, text: data.error ?? "Couldn't save." });
      else {
        setMsg({ ok: true, text: "Profile saved." });
        router.refresh();
      }
    } catch {
      setMsg({ ok: false, text: "Network error." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={save} className="flex max-w-md flex-col gap-3">
      <label className="flex flex-col gap-1 text-sm text-text-soft">
        Handle
        <div className="flex items-center gap-1 rounded-lg border border-border bg-surface px-3 focus-within:border-text">
          <span className="text-text-muted">@</span>
          <input value={handle} onChange={(e) => setHandle(e.target.value)} placeholder="yourname" className="min-w-0 flex-1 bg-transparent py-2 text-sm text-text outline-none" />
        </div>
        <span className="text-xs text-text-muted">Your profile lives at /u/{handle || "yourname"}</span>
      </label>
      <label className="flex flex-col gap-1 text-sm text-text-soft">
        Bio
        <textarea value={bio} onChange={(e) => setBio(e.target.value)} maxLength={300} rows={2} className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text outline-none focus-visible:border-text" />
      </label>
      <label className="flex flex-col gap-1 text-sm text-text-soft">
        Website
        <input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://…" className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text outline-none focus-visible:border-text" />
      </label>
      {msg ? <p className={msg.ok ? "text-sm text-text-soft" : "text-sm text-p-danger"}>{msg.text}</p> : null}
      <button type="submit" disabled={busy} className="self-start rounded-full bg-text px-5 py-2 text-sm font-medium text-canvas disabled:opacity-40">
        {busy ? "Saving…" : "Save profile"}
      </button>
    </form>
  );
}
