"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";

const CONFIRM_WORD = "DELETE";

export function DeleteAccount() {
  const [confirming, setConfirming] = useState(false);
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);

  const armed = typed.trim().toUpperCase() === CONFIRM_WORD;

  async function remove() {
    if (!armed) return;
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
    <div className="flex max-w-md flex-col gap-3 rounded-xl border border-border bg-surface p-4">
      <p className="text-sm font-medium text-text">Delete your account permanently?</p>
      <p className="text-sm text-text-soft">
        This immediately and irreversibly removes your profile, saved palettes,
        collections, generated palettes, and API keys, and cancels any active
        subscription. This cannot be undone.
      </p>
      <label className="flex flex-col gap-1 text-sm text-text-soft">
        Type <span className="font-mono font-medium text-text">{CONFIRM_WORD}</span> to confirm:
        <input
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          autoComplete="off"
          autoFocus
          placeholder={CONFIRM_WORD}
          aria-label={`Type ${CONFIRM_WORD} to confirm account deletion`}
          className="rounded-lg border border-border bg-canvas px-3 py-2 font-mono text-text outline-none focus-visible:border-p-danger"
        />
      </label>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={remove}
          disabled={!armed || busy}
          className="rounded-full px-3 py-1 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40"
          style={{ backgroundColor: "var(--p-danger)" }}
        >
          {busy ? "Deleting…" : "Delete my account"}
        </button>
        <button
          type="button"
          onClick={() => {
            setConfirming(false);
            setTyped("");
          }}
          className="rounded-full border border-border px-3 py-1 text-sm text-text"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
