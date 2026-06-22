"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { clsx } from "@/lib/cn";
import { useToast } from "@/components/ui";

export function BookmarkButton({ id, initialBookmarked }: { id: string; initialBookmarked: boolean }) {
  const { status } = useSession();
  const router = useRouter();
  const [saved, setSaved] = useState(initialBookmarked);
  const [busy, setBusy] = useState(false);
  const { success } = useToast();

  async function toggle() {
    if (status !== "authenticated") {
      router.push("/signin");
      return;
    }
    if (busy) return;
    setBusy(true);
    setSaved((v) => !v);
    try {
      const res = await fetch(`/api/bookmark/${id}`, { method: "POST" });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setSaved(data.bookmarked);
      success(data.bookmarked ? "Saved to your library" : "Removed from saved");
    } catch {
      setSaved(initialBookmarked);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      aria-pressed={saved}
      className={clsx(
        "inline-flex items-center gap-2 rounded-pill border px-4 py-2 text-sm font-medium transition-colors ease-standard",
        saved ? "border-text bg-text text-canvas" : "border-border text-text hover:bg-surface-2",
      )}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill={saved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1z" />
      </svg>
      {saved ? "Saved" : "Save"}
    </button>
  );
}
