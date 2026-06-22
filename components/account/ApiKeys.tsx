"use client";

import { useEffect, useState } from "react";
import { CopyButton } from "@/components/ui/CopyButton";
import { Button, useToast } from "@/components/ui";

interface Key {
  id: string;
  label: string | null;
  lastUsedAt: string | null;
  createdAt: string;
}

export function ApiKeys() {
  const [keys, setKeys] = useState<Key[]>([]);
  const [label, setLabel] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const { success } = useToast();

  async function refresh() {
    const r = await fetch("/api/keys");
    const d: { keys?: Key[] } = await r.json();
    setKeys(d.keys ?? []);
  }

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const r = await fetch("/api/keys");
        const d: { keys?: Key[] } = await r.json();
        if (active) setKeys(d.keys ?? []);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  async function create() {
    setBusy(true);
    try {
      const r = await fetch("/api/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label }),
      });
      const d: { token?: string } = await r.json();
      if (d.token) {
        setToken(d.token);
        success("API key created");
        setLabel("");
        await refresh();
      }
    } finally {
      setBusy(false);
    }
  }

  async function revoke(id: string) {
    await fetch(`/api/keys?id=${id}`, { method: "DELETE" });
    success("API key revoked");
    await refresh();
  }

  return (
    <div className="flex flex-col gap-5">
      {token ? (
        <div className="flex flex-col gap-2 rounded-control border border-border bg-surface-2 p-4">
          <p className="text-sm text-text">
            Copy your key now — it won&apos;t be shown again.
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 overflow-x-auto rounded-control bg-surface px-3 py-2 font-mono text-xs text-text">
              {token}
            </code>
            <CopyButton value={token} label="Copy" copiedLabel="Copied" className="rounded-pill border border-border px-3 py-1.5 text-text hover:bg-surface" />
          </div>
        </div>
      ) : null}

      <div className="flex gap-2">
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Key label (e.g. Production)"
          className="min-w-0 flex-1 rounded-control border border-border bg-surface px-3 py-2 text-sm text-text outline-none focus-visible:border-text"
        />
        <Button onClick={create} disabled={busy}>Create key</Button>
      </div>

      {keys.length === 0 ? (
        <p className="text-sm text-text-muted">No API keys yet.</p>
      ) : (
        <ul className="divide-y divide-border rounded-control border border-border">
          {keys.map((k) => (
            <li key={k.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-sm text-text">{k.label ?? "API key"}</p>
                <p className="text-xs text-text-muted">
                  {k.lastUsedAt ? `Last used ${new Date(k.lastUsedAt).toLocaleDateString()}` : "Never used"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => revoke(k.id)}
                className="text-sm text-text-muted transition-colors ease-standard hover:text-p-danger"
              >
                Revoke
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
