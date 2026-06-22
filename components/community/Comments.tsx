"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useToast } from "@/components/ui";

export interface CommentView {
  id: string;
  body: string;
  createdAt: string;
  authorId: string;
  authorName: string | null;
  authorHandle: string | null;
  authorImage: string | null;
}

function when(iso: string): string {
  const d = new Date(iso);
  const s = Math.floor((Date.now() - d.getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 604800) return `${Math.floor(s / 86400)}d ago`;
  return d.toLocaleDateString();
}

export function Comments({
  publishedId,
  initial,
  canModerate,
}: {
  publishedId: string;
  initial: CommentView[];
  canModerate: boolean;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const me = session?.user?.id;
  const { success } = useToast();
  const [items, setItems] = useState<CommentView[]>(initial);
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (status !== "authenticated") {
      router.push("/signin");
      return;
    }
    const text = body.trim();
    if (!text || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/publish/${publishedId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not post.");
      setItems((cur) => [data.comment as CommentView, ...cur]);
      setBody("");
      success("Comment posted");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    const prev = items;
    setItems((cur) => cur.filter((c) => c.id !== id));
    try {
      const res = await fetch(`/api/comments/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      success("Comment removed");
    } catch {
      setItems(prev);
    }
  }

  return (
    <section className="flex flex-col gap-4">
      <h2 className="font-display text-xl text-text">
        Comments {items.length ? <span className="text-text-muted">({items.length})</span> : null}
      </h2>

      <form onSubmit={submit} className="flex flex-col gap-2">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={status === "authenticated" ? "Add a comment…" : "Sign in to comment"}
          rows={3}
          maxLength={1000}
          className="w-full resize-y rounded-control border border-border bg-surface px-3 py-2 text-sm text-text placeholder:text-text-muted focus:border-text focus:outline-none"
        />
        <div className="flex items-center justify-between">
          {error ? <p className="text-xs text-p-danger">{error}</p> : <span />}
          <button
            type="submit"
            disabled={busy || !body.trim()}
            className="rounded-pill bg-text px-4 py-1.5 text-sm font-medium text-canvas hover:opacity-90 disabled:opacity-50"
          >
            {status === "authenticated" ? "Post" : "Sign in"}
          </button>
        </div>
      </form>

      {items.length === 0 ? (
        <p className="text-sm text-text-muted">No comments yet. Be the first.</p>
      ) : (
        <ul className="flex flex-col gap-4">
          {items.map((c) => (
            <li key={c.id} className="flex flex-col gap-1 border-b border-border pb-4 last:border-0">
              <div className="flex items-center gap-2 text-sm">
                {c.authorHandle ? (
                  <Link href={`/u/${c.authorHandle}`} className="font-medium text-text hover:underline">
                    @{c.authorHandle}
                  </Link>
                ) : (
                  <span className="font-medium text-text">{c.authorName ?? "Anonymous"}</span>
                )}
                <span className="text-text-muted">·</span>
                <span className="text-text-muted">{when(c.createdAt)}</span>
                {canModerate || c.authorId === me ? (
                  <button
                    type="button"
                    onClick={() => remove(c.id)}
                    className="ml-auto text-xs text-text-muted hover:text-p-danger"
                  >
                    Delete
                  </button>
                ) : null}
              </div>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-text-soft">{c.body}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
