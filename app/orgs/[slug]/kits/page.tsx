import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth-guard";
import { getOrgBySlug, getMembership } from "@/lib/orgs";
import { listKits } from "@/lib/brandkits";
import { pendingCountByKit } from "@/lib/kitproposals";
import { createKitAction } from "../kits/_actions";

export const metadata: Metadata = { title: "Brand kits", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function KitsPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ error?: string }> }) {
  const { slug } = await params;
  const { error } = await searchParams;
  const user = await requireUser();
  const org = await getOrgBySlug(slug);
  if (!org) notFound();
  const role = await getMembership(org.id, user.id);
  if (!role) notFound();
  const canManage = role === "owner" || role === "admin";
  const kits = await listKits(org.id);
  const pending = canManage ? await pendingCountByKit(kits.map((k) => k.id)) : {};

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-5 py-12 sm:px-8">
      <header className="flex flex-col gap-2">
        <Link href={`/orgs/${slug}`} className="text-xs text-text-muted underline-offset-4 hover:underline">← {org.name}</Link>
        <h1 className="font-display text-4xl text-text">Brand kits</h1>
        <p className="text-lg text-text-soft">Your team&apos;s canonical colors and palettes — shared with every member.</p>
      </header>

      {error ? <p className="rounded-lg border border-p-danger/40 bg-p-danger/5 px-3 py-2 text-sm text-p-danger">{error}</p> : null}

      {kits.length === 0 ? (
        <p className="text-text-soft">No brand kits yet.{canManage ? " Create one below." : ""}</p>
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {kits.map((k) => (
            <li key={k.id}>
              <Link href={`/orgs/${slug}/kits/${k.slug}`} className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4 transition-colors hover:border-text">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate font-display text-lg text-text">{k.name}</span>
                  <span className="flex shrink-0 items-center gap-2 text-xs text-text-muted">
                    {pending[k.id] ? <span className="rounded-full bg-amber-600/15 px-2 py-0.5 font-medium text-amber-700 dark:text-amber-400">{pending[k.id]} pending</span> : null}
                    {k.assetCount} {k.assetCount === 1 ? "asset" : "assets"}
                  </span>
                </div>
                {k.description ? <p className="line-clamp-2 text-sm text-text-soft">{k.description}</p> : null}
              </Link>
            </li>
          ))}
        </ul>
      )}

      {canManage ? (
        <form action={createKitAction} className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-5">
          <input type="hidden" name="slug" value={slug} />
          <h2 className="text-sm font-medium text-text">Create a brand kit</h2>
          <input name="name" placeholder="Kit name (e.g. Core brand)" required className="rounded-xl border border-border bg-canvas px-3 py-2 text-sm text-text focus:border-text focus:outline-none" />
          <input name="description" placeholder="Description (optional)" className="rounded-xl border border-border bg-canvas px-3 py-2 text-sm text-text focus:border-text focus:outline-none" />
          <button className="w-fit rounded-full bg-text px-5 py-2 text-sm font-medium text-canvas hover:opacity-90">Create kit</button>
        </form>
      ) : null}
    </div>
  );
}
