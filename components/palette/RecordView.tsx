"use client";

import { useEffect } from "react";

/** Fire-and-forget: records this palette in the recently-viewed cookie. */
export function RecordView({ slug }: { slug: string }) {
  useEffect(() => {
    fetch("/api/recent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug }),
      keepalive: true,
    }).catch(() => {});
  }, [slug]);
  return null;
}
