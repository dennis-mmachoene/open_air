"use client";

import { useEffect, useRef, useState } from "react";

interface Coll {
  id: string;
  name: string;
  inCollection: boolean;
}

export function CollectionPicker({ slug }: { slug: string }) {
  const [open, setOpen] = useState(false);
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [collections, setCollections] = useState<Coll[]>([]);
  const [name, setName] = useState("");
  const ref = useRef<HTMLDivElement | null>(null);

  async function refresh() {
    const r = await fetch(`/api/collections?slug=${encodeURIComponent(slug)}`);
    const d: { authenticated: boolean; collections: Coll[] } = await r.json();
    setAuthenticated(d.authenticated);
    setCollections(d.collections);
  }

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

  async function toggle(id: string) {
    await fetch("/api/collections", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ collectionId: id, slug }),
    });
    await refresh();
  }

  async function create() {
    if (!name.trim()) return;
    await fetch("/api/collections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    setName("");
    await refresh();
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium text-text transition-colors hover:bg-surface-2"
      >
        Add to collection
      </button>
      {open ? (
        <div className="absolute z-20 mt-2 w-64 rounded-xl border border-border bg-surface p-2 shadow-lg">
          <div className="max-h-48 overflow-auto">
            {collections.length === 0 ? (
              <p className="px-2 py-3 text-sm text-text-muted">No collections yet.</p>
            ) : (
              collections.map((c) => (
                <label
                  key={c.id}
                  className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-text hover:bg-surface-2"
                >
                  <input
                    type="checkbox"
                    checked={c.inCollection}
                    onChange={() => toggle(c.id)}
                  />
                  {c.name}
                </label>
              ))
            )}
          </div>
          <div className="mt-2 flex gap-1 border-t border-border pt-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="New collection"
              className="min-w-0 flex-1 rounded-lg border border-border bg-bg px-2 py-1 text-sm text-text outline-none"
            />
            <button
              type="button"
              onClick={create}
              className="rounded-lg bg-text px-2.5 py-1 text-sm text-canvas"
            >
              Add
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
