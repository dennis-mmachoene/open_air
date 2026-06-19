"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { clsx } from "@/lib/cn";

export function SaveButton({ slug }: { slug: string }) {
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [limit, setLimit] = useState(false);

  useEffect(() => {
    let active = true;
    fetch(`/api/saves?slug=${encodeURIComponent(slug)}`)
      .then((r) => r.json())
      .then((d: { authenticated: boolean; saved?: boolean }) => {
        if (!active) return;
        setAuthenticated(d.authenticated);
        setSaved(Boolean(d.saved));
      })
      .catch(() => active && setAuthenticated(false));
    return () => {
      active = false;
    };
  }, [slug]);

  async function onClick() {
    if (authenticated === false) {
      router.push("/signin");
      return;
    }
    if (busy) return;
    setBusy(true);
    setLimit(false);
    try {
      const res = await fetch("/api/saves", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      });
      const data: { saved: boolean; limitReached?: boolean } = await res.json();
      if (data.limitReached) setLimit(true);
      else setSaved(data.saved);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={onClick}
        aria-pressed={saved}
        className={clsx(
          "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors",
          saved
            ? "border-text bg-text text-canvas"
            : "border-border text-text hover:bg-surface-2",
        )}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" fill={saved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 1 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
        {saved ? "Saved" : "Save"}
      </button>
      {limit ? (
        <span className="text-xs" style={{ color: "var(--text-soft)" }}>
          Free plan saves up to 5.{" "}
          <a href="/pricing" className="underline underline-offset-2">Go Pro</a> for unlimited.
        </span>
      ) : null}
    </div>
  );
}
