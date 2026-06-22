"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Strata } from "@/components/palette/Strata";
import { clsx } from "@/lib/cn";

interface Rec {
  slug: string;
  name: string;
  hexes: string[];
}
interface Msg {
  role: "user" | "aura";
  text: string;
  palettes?: Rec[];
}

const PROMPTS = ["Calm wellness brand", "Bold fintech dashboard", "Warm autumn editorial"];

export function Assistant() {
  const { data: session } = useSession();
  const firstName = session?.user?.name?.split(" ")[0];
  const authed = Boolean(session?.user);

  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const greeting = firstName
    ? `Hi ${firstName} — what are you designing today? Tell me the mood or use-case and I'll find palettes.`
    : `Hi there! Describe the mood or project you have in mind and I'll suggest palettes. Sign in to open and save them.`;

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  async function send(text: string) {
    const message = text.trim();
    if (!message || busy) return;
    setInput("");
    const history = messages.slice(-8).map((m) => ({ role: m.role, text: m.text }));
    setMessages((m) => [...m, { role: "user", text: message }]);
    setBusy(true);
    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, history }),
      });
      const data: { reply: string; palettes: Rec[] } = await res.json();
      setMessages((m) => [...m, { role: "aura", text: data.reply, palettes: data.palettes }]);
    } catch {
      setMessages((m) => [
        ...m,
        { role: "aura", text: "Sorry — I couldn't reach the colour engine just now." },
      ]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {/* Launcher */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close color assistant" : "Open color assistant"}
        className="fixed bottom-5 right-5 z-50 flex h-12 w-12 items-center justify-center rounded-pill bg-text text-canvas shadow-lg transition-transform hover:scale-105"
      >
        {open ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 2l1.6 5.2L19 9l-5.4 1.8L12 16l-1.6-5.2L5 9l5.4-1.8L12 2z" />
            <circle cx="18.5" cy="17.5" r="1.6" />
          </svg>
        )}
      </button>

      {/* Panel */}
      {open ? (
        <div className="fixed bottom-20 right-5 z-50 flex max-h-[70vh] w-[min(92vw,22rem)] flex-col overflow-hidden rounded-card border border-border bg-surface shadow-2xl">
          <div className="flex items-center gap-2 border-b border-border px-4 py-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-pill bg-text text-canvas">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l1.6 5.2L19 9l-5.4 1.8L12 16l-1.6-5.2L5 9l5.4-1.8L12 2z" /></svg>
            </span>
            <div>
              <p className="text-sm font-medium text-text">Aura</p>
              <p className="text-xs text-text-muted">Color concierge</p>
            </div>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
            <span className="inline-block max-w-[85%] rounded-card rounded-bl-sm bg-surface-2 px-3 py-2 text-sm text-text">
              {greeting}
            </span>
            {messages.map((m, i) => (
              <div key={i} className={clsx("flex flex-col gap-2", m.role === "user" && "items-end")}>
                <span
                  className={clsx(
                    "max-w-[85%] rounded-card px-3 py-2 text-sm",
                    m.role === "user"
                      ? "rounded-br-sm bg-text text-canvas"
                      : "rounded-bl-sm bg-surface-2 text-text",
                  )}
                >
                  {m.text}
                </span>
                {m.palettes && m.palettes.length > 0 ? (
                  <div className="flex w-full flex-col gap-1.5">
                    {m.palettes.map((p) => (
                      <Link
                        key={p.slug}
                        href={authed ? `/p/${p.slug}` : "/signin"}
                        className="flex items-center gap-2 rounded-control border border-border p-1.5 transition-colors hover:bg-surface-2"
                      >
                        <Strata hexes={p.hexes} className="h-7 w-16 shrink-0" />
                        <span className="truncate text-sm text-text">{p.name}</span>
                      </Link>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
            {busy ? (
              <span className="inline-flex gap-1 rounded-card rounded-bl-sm bg-surface-2 px-3 py-2">
                <span className="h-1.5 w-1.5 animate-bounce rounded-pill bg-text-muted" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-pill bg-text-muted [animation-delay:0.15s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-pill bg-text-muted [animation-delay:0.3s]" />
              </span>
            ) : null}

            {messages.length === 0 && !busy ? (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {PROMPTS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => send(p)}
                    className="rounded-pill border border-border px-2.5 py-1 text-xs text-text-soft transition-colors hover:border-text hover:text-text"
                  >
                    {p}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex gap-2 border-t border-border p-3"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Describe what you need…"
              className="min-w-0 flex-1 rounded-pill border border-border bg-bg px-3 py-2 text-sm text-text outline-none focus-visible:border-text"
            />
            <button
              type="submit"
              disabled={busy || !input.trim()}
              className="rounded-pill bg-text px-4 py-2 text-sm font-medium text-canvas disabled:opacity-40"
            >
              Ask
            </button>
          </form>
        </div>
      ) : null}
    </>
  );
}
