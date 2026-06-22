"use client";

import { useEffect, useRef, useState } from "react";
import { useToast } from "@/components/ui";

interface Coll {
  id: string;
  name: string;
  inCollection: boolean;
}

export function CollectionPicker({ slug }: { slug: string }) {
  const [open, setOpen] = useState(false);
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [collections, setCollections] = useState<Coll[]>([]);
  const [pending, setPending] = useState<Set<string>>(new Set());
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { success } = useToast();
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const r = await fetch(`/api/collections?slug=${encodeURIComponent(slug)}`);
        const d: { authenticated: boolean; collections: Coll[] } = await r.json();
        if (!active) return;
        setAuthenticated(d.authenticated);
        setCollections(d.collections);
      } catch {
        if (active) setAuthenticated(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [slug]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  if (authenticated === false) return null;

  const inCount = collections.filter((c) => c.inCollection).length;

  function setPendingFor(id: string, on: boolean) {
    setPending((prev) => {
      const next = new Set(prev);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  async function toggle(id: string) {
    if (pending.has(id)) return;
    setError(null);
    // Optimistic flip so the checkbox responds instantly.
    setCollections((cs) =>
      cs.map((c) => (c.id === id ? { ...c, inCollection: !c.inCollection } : c)),
    );
    setPendingFor(id, true);
    try {
      const res = await fetch("/api/collections", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ collectionId: id, slug }),
      });
      if (!res.ok) throw new Error();
      const data: { inCollection?: boolean } = await res.json();
      // Reconcile with the authoritative server result.
      if (typeof data.inCollection === "boolean") {
        setCollections((cs) =>
          cs.map((c) => (c.id === id ? { ...c, inCollection: data.inCollection! } : c)),
        );
        success(data.inCollection ? "Added to collection" : "Removed from collection");
      }
    } catch {
      // Revert the optimistic change on failure.
      setCollections((cs) =>
        cs.map((c) => (c.id === id ? { ...c, inCollection: !c.inCollection } : c)),
      );
      setError("Couldn't update that collection. Try again.");
    } finally {
      setPendingFor(id, false);
    }
  }

  async function create() {
    const trimmed = name.trim();
    if (!trimmed || creating) return;
    setCreating(true);
    setError(null);
    try {
      const res = await fetch("/api/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      if (!res.ok) throw new Error();
      const data: { collection?: { id: string; name: string } } = await res.json();
      setName("");
      if (data.collection) {
        success("Collection created");
        // Add it to the list, then immediately add this palette to it.
        setCollections((cs) => [
          ...cs,
          { id: data.collection!.id, name: data.collection!.name, inCollection: false },
        ]);
        await toggle(data.collection.id);
      }
    } catch {
      setError("Couldn't create the collection. Try again.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="inline-flex items-center gap-2 rounded-pill border border-border px-4 py-2 text-sm font-medium text-text transition-colors ease-standard hover:bg-surface-2"
      >
        Add to collection
        {inCount > 0 ? (
          <span className="rounded-pill bg-text px-1.5 text-xs font-medium text-canvas">
            {inCount}
          </span>
        ) : null}
      </button>
      {open ? (
        <div className="absolute z-20 mt-2 w-64 rounded-control border border-border bg-surface p-2 shadow-lg">
          <div className="max-h-48 overflow-auto">
            {collections.length === 0 ? (
              <p className="px-2 py-3 text-sm text-text-muted">
                No collections yet — create one below.
              </p>
            ) : (
              collections.map((c) => (
                <label
                  key={c.id}
                  className="flex cursor-pointer items-center gap-2 rounded-control px-2 py-1.5 text-sm text-text hover:bg-surface-2"
                >
                  <input
                    type="checkbox"
                    checked={c.inCollection}
                    disabled={pending.has(c.id)}
                    onChange={() => toggle(c.id)}
                  />
                  <span className="flex-1 truncate">{c.name}</span>
                  {pending.has(c.id) ? (
                    <span className="text-xs text-text-muted">…</span>
                  ) : c.inCollection ? (
                    <span className="text-xs text-text-muted">✓</span>
                  ) : null}
                </label>
              ))
            )}
          </div>
          {error ? <p className="px-2 py-1 text-xs text-p-danger">{error}</p> : null}
          <div className="mt-2 flex gap-1 border-t border-border pt-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  create();
                }
              }}
              maxLength={60}
              placeholder="New collection"
              aria-label="New collection name"
              className="min-w-0 flex-1 rounded-control border border-border bg-bg px-2 py-1 text-sm text-text outline-none"
            />
            <button
              type="button"
              onClick={create}
              disabled={!name.trim() || creating}
              className="rounded-control bg-text px-2.5 py-1 text-sm text-canvas disabled:opacity-40"
            >
              {creating ? "…" : "Add"}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
