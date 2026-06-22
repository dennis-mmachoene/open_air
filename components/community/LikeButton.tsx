"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { clsx } from "@/lib/cn";

export function LikeButton({ id, initialLiked, initialCount }: { id: string; initialLiked: boolean; initialCount: number }) {
  const { status } = useSession();
  const router = useRouter();
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    if (status !== "authenticated") {
      router.push("/signin");
      return;
    }
    if (busy) return;
    setBusy(true);
    setLiked((v) => !v);
    setCount((c) => c + (liked ? -1 : 1));
    try {
      const res = await fetch(`/api/publish/${id}/like`, { method: "POST" });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setLiked(data.liked);
      setCount(data.likeCount);
    } catch {
      setLiked(initialLiked);
      setCount(initialCount);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      aria-pressed={liked}
      className={clsx(
        "inline-flex items-center gap-2 rounded-pill border px-4 py-2 text-sm font-medium transition-colors ease-standard",
        liked ? "border-p-danger text-p-danger" : "border-border text-text hover:bg-surface-2",
      )}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill={liked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M12 21s-7.5-4.6-10-9.2C.3 8.3 2 5 5.2 5c2 0 3.3 1.1 3.8 2 .5-.9 1.8-2 3.8-2C16 5 17.7 8.3 16 11.8 14.5 16.4 12 21 12 21z" />
      </svg>
      {count}
    </button>
  );
}
