"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { clsx } from "@/lib/cn";

export function FollowButton({
  authorId,
  initialFollowing,
  initialCount,
}: {
  authorId: string;
  initialFollowing: boolean;
  initialCount: number;
}) {
  const { status } = useSession();
  const router = useRouter();
  const [following, setFollowing] = useState(initialFollowing);
  const [count, setCount] = useState(initialCount);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    if (status !== "authenticated") {
      router.push("/signin");
      return;
    }
    if (busy) return;
    setBusy(true);
    setFollowing((v) => !v);
    setCount((c) => c + (following ? -1 : 1));
    try {
      const res = await fetch(`/api/follow/${authorId}`, { method: "POST" });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setFollowing(data.following);
      setCount(data.followerCount);
    } catch {
      setFollowing(initialFollowing);
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
      aria-pressed={following}
      className={clsx(
        "inline-flex items-center gap-2 rounded-pill border px-5 py-2 text-sm font-medium transition-colors",
        following ? "border-border text-text hover:bg-surface-2" : "border-text bg-text text-canvas hover:opacity-90",
      )}
    >
      {following ? "Following" : "Follow"}
      <span className="text-text-muted">·</span>
      <span className={following ? "text-text-soft" : "text-canvas/80"}>{count}</span>
    </button>
  );
}
