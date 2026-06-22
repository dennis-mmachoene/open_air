"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Textarea, Field, ErrorNote, useToast } from "@/components/ui";

export function ProfileForm({ initial }: { initial: { handle: string | null; bio: string | null; website: string | null } }) {
  const router = useRouter();
  const [handle, setHandle] = useState(initial.handle ?? "");
  const [bio, setBio] = useState(initial.bio ?? "");
  const [website, setWebsite] = useState(initial.website ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { success } = useToast();

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ handle, bio, website }),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error ?? "Couldn't save.");
      else {
        success("Profile saved");
        router.refresh();
      }
    } catch {
      setError("Network error.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={save} className="flex max-w-md flex-col gap-3">
      <Field label="Handle" hint={`Your profile lives at /u/${handle || "yourname"}`}>
        <div className="flex items-center gap-1 rounded-control border border-border bg-canvas px-3 transition-colors ease-standard focus-within:border-text">
          <span className="text-text-muted">@</span>
          <input value={handle} onChange={(e) => setHandle(e.target.value)} placeholder="yourname" aria-label="Handle" className="min-w-0 flex-1 bg-transparent py-2 text-sm text-text outline-none" />
        </div>
      </Field>
      <Field label="Bio">
        <Textarea value={bio} onChange={(e) => setBio(e.target.value)} maxLength={300} rows={2} aria-label="Bio" />
      </Field>
      <Field label="Website">
        <Input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://…" aria-label="Website" />
      </Field>
      <ErrorNote message={error} />
      <Button type="submit" loading={busy} className="self-start">{busy ? "Saving…" : "Save profile"}</Button>
    </form>
  );
}
