"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Collection {
  id: string;
  name: string;
  itemCount: number;
}

export function CollectionsManager({ initial }: { initial: Collection[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(
          res.status === 401
            ? "Please sign in again to create a collection."
            : data?.error ?? "Couldn't create the collection.",
        );
        return;
      }
      setName("");
      router.refresh();
    } catch {
      setError("Network error — please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/collections?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        setError("Couldn't delete the collection.");
        return;
      }
      router.refresh();
    } catch {
      setError("Network error — please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={create} className="flex max-w-sm gap-2">
        <input
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={60}
          placeholder="e.g. Client X, My brand"
          aria-label="New collection name"
          className="min-w-0 flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text outline-none focus-visible:border-text"
        />
        <button
          type="submit"
          disabled={!name.trim() || busy}
          className="rounded-lg bg-text px-4 py-2 text-sm font-medium text-canvas transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          {busy ? "Working…" : "Create"}
        </button>
      </form>

      {error ? <p className="text-sm text-p-danger">{error}</p> : null}

      {initial.length === 0 ? (
        <p className="text-text-soft">No collections yet.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-border rounded-xl border border-border">
          {initial.map((c) => (
            <li key={c.id} className="flex items-center justify-between px-4 py-3">
              <span className="text-text">
                {c.name}{" "}
                <span className="text-sm text-text-muted">
                  · {c.itemCount} {c.itemCount === 1 ? "palette" : "palettes"}
                </span>
              </span>
              <button
                type="button"
                onClick={() => remove(c.id)}
                disabled={busy}
                className="text-sm text-text-muted transition-colors hover:text-text disabled:opacity-40"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
