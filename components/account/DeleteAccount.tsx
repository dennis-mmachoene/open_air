"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";

export function DeleteAccount() {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  async function remove() {
    setBusy(true);
    try {
      const res = await fetch("/api/account", { method: "DELETE" });
      if (res.ok) await signOut({ callbackUrl: "/" });
    } finally {
      setBusy(false);
    }
  }

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="text-sm text-text-muted underline underline-offset-4 transition-colors hover:text-p-danger"
      >
        Delete account
      </button>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <span className="text-text-soft">Delete everything permanently?</span>
      <button
        type="button"
        onClick={remove}
        disabled={busy}
        className="rounded-full px-3 py-1 font-medium text-white disabled:opacity-50"
        style={{ backgroundColor: "var(--p-danger)" }}
      >
        {busy ? "Deleting…" : "Yes, delete"}
      </button>
      <button
        type="button"
        onClick={() => setConfirming(false)}
        className="rounded-full border border-border px-3 py-1 text-text"
      >
        Cancel
      </button>
    </div>
  );
}
