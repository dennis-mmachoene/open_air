"use client";

import { useState } from "react";

export function ManageBillingButton() {
  const [busy, setBusy] = useState(false);

  async function open() {
    setBusy(true);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data: { url?: string } = await res.json();
      if (data.url) window.location.assign(data.url);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={open}
      disabled={busy}
      className="rounded-full border border-border px-4 py-2 text-sm font-medium text-text transition-colors hover:bg-surface-2 disabled:opacity-50"
    >
      {busy ? "Opening…" : "Manage subscription"}
    </button>
  );
}
