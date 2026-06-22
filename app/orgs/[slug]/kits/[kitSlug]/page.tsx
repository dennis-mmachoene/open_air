import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth-guard";
import { getOrgBySlug, getMembership, listMembers } from "@/lib/orgs";
import { getKit } from "@/lib/brandkits";
import { listProposals } from "@/lib/kitproposals";
import { getSyncConfig } from "@/lib/sync/kit-sync";
import { FORMATS } from "@/lib/sync/serialize";
import { site } from "@/lib/site";
import { Strata } from "@/components/palette/Strata";
import { lintTokens } from "@/lib/color/lint";
import { CopyHex } from "@/components/orgs/CopyHex";
import {
  addAssetAction,
  deleteAssetAction,
  deleteKitAction,
  rotateSyncTokenAction,
  revokeSyncTokenAction,
  setWebhookAction,
  proposeAddAction,
  proposeRemoveAction,
  approveProposalAction,
  rejectProposalAction,
} from "../_actions";

export async function generateMetadata({ params }: { params: Promise<{ slug: string; kitSlug: string }> }): Promise<Metadata> {
  const { slug, kitSlug } = await params;
  const org = await getOrgBySlug(slug);
  const kit = org ? await getKit(org.id, kitSlug) : null;
  return { title: kit ? `${kit.name} · Brand kit` : "Brand kit", robots: { index: false, follow: false } };
}

export const dynamic = "force-dynamic";

const TYPE_LABEL: Record<string, string> = { add_asset: "Add", update_asset: "Update", delete_asset: "Remove" };

export default async function KitDetailPage({ params, searchParams }: { params: Promise<{ slug: string; kitSlug: string }>; searchParams: Promise<{ error?: string; proposed?: string }> }) {
  const { slug, kitSlug } = await params;
  const { error, proposed } = await searchParams;
  const user = await requireUser();
  const org = await getOrgBySlug(slug);
  if (!org) notFound();
  const role = await getMembership(org.id, user.id);
  if (!role) notFound();
  const canManage = role === "owner" || role === "admin";
  const kit = await getKit(org.id, kitSlug);
  if (!kit) notFound();

  const [pending, members, sync] = await Promise.all([
    listProposals(kit.id, "pending"),
    canManage ? listMembers(org.id) : Promise.resolve([]),
    canManage ? getSyncConfig(kit.id) : Promise.resolve({ syncToken: null, webhookUrl: null }),
  ]);
  const base = site.url.replace(/\/$/, "");
  const syncUrl = sync.syncToken ? `${base}/api/v1/kits/${kit.id}/tokens?format=dtcg&token=${sync.syncToken}` : null;
  const lintReport = lintTokens(kit.assets.flatMap((a) => a.hexes.map((hex) => ({ name: a.name, hex }))));
  const nameOf = (id: string) => members.find((m) => m.userId === id)?.name ?? members.find((m) => m.userId === id)?.email ?? "A member";
  const assetName = (id: string | null) => kit.assets.find((a) => a.id === id)?.name ?? "an asset";

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-5 py-12 sm:px-8">
      <header className="flex flex-col gap-2">
        <Link href={`/orgs/${slug}/kits`} className="text-xs text-text-muted underline-offset-4 hover:underline">← Brand kits</Link>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-4xl text-text">{kit.name}</h1>
            {kit.description ? <p className="mt-1 text-lg text-text-soft">{kit.description}</p> : null}
          </div>
          {canManage ? (
            <form action={deleteKitAction}>
              <input type="hidden" name="slug" value={slug} />
              <input type="hidden" name="kitId" value={kit.id} />
              <button className="rounded-pill border border-p-danger/40 px-4 py-2 text-sm font-medium text-p-danger hover:bg-p-danger/5">Delete kit</button>
            </form>
          ) : null}
        </div>
      </header>

      {error ? <p className="rounded-control border border-p-danger/40 bg-p-danger/5 px-3 py-2 text-sm text-p-danger">{error}</p> : null}
      {proposed ? <p className="rounded-control border border-green-600/40 bg-green-600/5 px-3 py-2 text-sm text-green-700 dark:text-green-400">Proposal submitted for review.</p> : null}

      {kit.assets.length > 0 ? (
        <section className="flex flex-wrap items-center gap-4 rounded-card border border-border bg-surface p-4">
          <div className="flex items-baseline gap-2">
            <span className="font-display text-2xl text-text">{lintReport.score}</span>
            <span className="text-xs text-text-muted">lint score</span>
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            {lintReport.counts.error > 0 ? <span className="rounded-pill border border-p-danger/40 px-2.5 py-1 text-p-danger">{lintReport.counts.error} errors</span> : null}
            {lintReport.counts.warning > 0 ? <span className="rounded-pill border border-amber-600/40 px-2.5 py-1 text-amber-700 dark:text-amber-400">{lintReport.counts.warning} warnings</span> : null}
            {lintReport.violations.length === 0 ? <span className="rounded-pill bg-green-600/15 px-2.5 py-1 font-medium text-green-700 dark:text-green-400">Clean ✨</span> : null}
          </div>
          {lintReport.violations.length > 0 ? (
            <details className="w-full">
              <summary className="cursor-pointer text-xs text-text-muted hover:text-text-soft">Show {lintReport.violations.length} issue{lintReport.violations.length === 1 ? "" : "s"}</summary>
              <ul className="mt-2 flex flex-col gap-1 text-sm text-text-soft">
                {lintReport.violations.map((v, i) => <li key={i}>· {v.message}</li>)}
              </ul>
            </details>
          ) : null}
        </section>
      ) : null}

      {canManage && pending.length > 0 ? (
        <section className="flex flex-col gap-3 rounded-card border border-amber-600/40 bg-amber-600/5 p-5">
          <h2 className="font-display text-lg text-text">Pending proposals ({pending.length})</h2>
          <ul className="flex flex-col gap-3">
            {pending.map((p) => (
              <li key={p.id} className="flex flex-col gap-2 rounded-control border border-border bg-canvas p-3">
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="rounded-pill border border-border px-2 py-0.5 text-xs font-medium">{TYPE_LABEL[p.type]}</span>
                  <span className="text-text">{p.type === "add_asset" ? p.payload.name : assetName(p.targetAssetId)}</span>
                  <span className="text-xs text-text-muted">· proposed by {nameOf(p.proposedBy)}</span>
                </div>
                {p.payload.hexes?.length ? <div className="flex flex-wrap gap-1.5">{p.payload.hexes.map((h, i) => <CopyHex key={`${h}-${i}`} hex={h} />)}</div> : null}
                {p.note ? <p className="text-sm text-text-soft">“{p.note}”</p> : null}
                <div className="flex flex-wrap items-center gap-2">
                  <form action={approveProposalAction}>
                    <input type="hidden" name="slug" value={slug} /><input type="hidden" name="kitSlug" value={kit.slug} /><input type="hidden" name="id" value={p.id} />
                    <button className="rounded-control bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:opacity-90">Approve</button>
                  </form>
                  <form action={rejectProposalAction} className="flex items-center gap-1">
                    <input type="hidden" name="slug" value={slug} /><input type="hidden" name="kitSlug" value={kit.slug} /><input type="hidden" name="id" value={p.id} />
                    <input name="note" placeholder="Reason (optional)" className="w-40 rounded-control border border-border bg-surface px-2 py-1 text-xs text-text focus:border-text focus:outline-none" />
                    <button className="rounded-control border border-border px-3 py-1.5 text-xs text-text-soft hover:bg-surface-2">Reject</button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {kit.assets.length === 0 ? (
        <p className="text-text-soft">No colors or palettes yet.</p>
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {kit.assets.map((a) => (
            <li key={a.id} className="flex flex-col gap-3 rounded-card border border-border bg-surface p-4">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-medium text-text">{a.name}</p>
                  <p className="text-xs capitalize text-text-muted">{a.type}</p>
                </div>
                {canManage ? (
                  <form action={deleteAssetAction}>
                    <input type="hidden" name="slug" value={slug} /><input type="hidden" name="kitSlug" value={kit.slug} /><input type="hidden" name="kitId" value={kit.id} /><input type="hidden" name="assetId" value={a.id} />
                    <button className="text-xs text-text-muted hover:text-p-danger">Remove</button>
                  </form>
                ) : (
                  <form action={proposeRemoveAction}>
                    <input type="hidden" name="slug" value={slug} /><input type="hidden" name="kitSlug" value={kit.slug} /><input type="hidden" name="kitId" value={kit.id} /><input type="hidden" name="assetId" value={a.id} />
                    <button className="text-xs text-text-muted hover:text-text-soft">Propose removal</button>
                  </form>
                )}
              </div>
              {a.type === "palette" ? <Strata hexes={a.hexes} className="h-14" /> : <div className="h-14 rounded-control border border-border" style={{ background: a.hexes[0] }} />}
              <div className="flex flex-wrap gap-1.5">{a.hexes.map((h, i) => <CopyHex key={`${h}-${i}`} hex={h} />)}</div>
              {a.notes ? <p className="text-xs text-text-soft">{a.notes}</p> : null}
            </li>
          ))}
        </ul>
      )}

      {canManage ? (
        <section className="flex flex-col gap-4 rounded-card border border-border bg-surface p-5">
          <div className="flex flex-col gap-1">
            <h2 className="font-display text-lg text-text">Live sync</h2>
            <p className="text-sm text-text-soft">Serve this kit as design tokens at a stable URL. Consumers poll with ETag — they only re-download when colors change.</p>
          </div>
          {sync.syncToken ? (
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium text-text-soft">Sync URL (DTCG)</span>
                <code className="block overflow-x-auto rounded-control border border-border bg-canvas px-3 py-2 font-mono text-xs text-text">{syncUrl}</code>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="text-text-muted">Formats:</span>
                {FORMATS.map((fmt) => (
                  <a key={fmt.id} href={`${base}/api/v1/kits/${kit.id}/tokens?format=${fmt.id}&token=${sync.syncToken}`} target="_blank" rel="noopener" className="rounded-pill border border-border px-2.5 py-1 text-text-soft hover:bg-surface-2">{fmt.label}</a>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <form action={rotateSyncTokenAction}>
                  <input type="hidden" name="slug" value={slug} /><input type="hidden" name="kitSlug" value={kit.slug} /><input type="hidden" name="kitId" value={kit.id} />
                  <button className="rounded-control border border-border px-3 py-1.5 text-xs text-text-soft hover:bg-surface-2">Rotate token</button>
                </form>
                <form action={revokeSyncTokenAction}>
                  <input type="hidden" name="slug" value={slug} /><input type="hidden" name="kitSlug" value={kit.slug} /><input type="hidden" name="kitId" value={kit.id} />
                  <button className="rounded-control border border-p-danger/40 px-3 py-1.5 text-xs text-p-danger hover:bg-p-danger/5">Revoke</button>
                </form>
              </div>
              <form action={setWebhookAction} className="flex flex-wrap items-center gap-2 border-t border-border pt-3">
                <input type="hidden" name="slug" value={slug} /><input type="hidden" name="kitSlug" value={kit.slug} /><input type="hidden" name="kitId" value={kit.id} />
                <input name="url" type="url" defaultValue={sync.webhookUrl ?? ""} placeholder="https://ci.example.com/hook (optional)" className="min-w-0 flex-1 rounded-control border border-border bg-canvas px-3 py-1.5 text-xs text-text focus:border-text focus:outline-none" />
                <button className="rounded-control border border-border px-3 py-1.5 text-xs text-text-soft hover:bg-surface-2">Save webhook</button>
              </form>
              <p className="text-xs text-text-muted">Anyone with the token URL can read these tokens — treat it like a secret and rotate if leaked.</p>
            </div>
          ) : (
            <form action={rotateSyncTokenAction}>
              <input type="hidden" name="slug" value={slug} /><input type="hidden" name="kitSlug" value={kit.slug} /><input type="hidden" name="kitId" value={kit.id} />
              <button className="w-fit rounded-pill bg-text px-4 py-2 text-sm font-medium text-canvas hover:opacity-90">Enable live sync</button>
            </form>
          )}
        </section>
      ) : null}

      {canManage ? (
        <form action={addAssetAction} className="flex flex-col gap-3 rounded-card border border-border bg-surface p-5">
          <input type="hidden" name="slug" value={slug} /><input type="hidden" name="kitSlug" value={kit.slug} /><input type="hidden" name="kitId" value={kit.id} />
          <h2 className="text-sm font-medium text-text">Add a color or palette</h2>
          <div className="flex flex-wrap gap-2">
            <input name="name" placeholder="Name (e.g. Primary, Ramp)" required className="min-w-0 flex-1 rounded-control border border-border bg-canvas px-3 py-2 text-sm text-text focus:border-text focus:outline-none" />
            <input name="hexes" placeholder="#1d4ed8 or #1d4ed8, #3b82f6, …" required className="min-w-0 flex-[2] rounded-control border border-border bg-canvas px-3 py-2 text-sm text-text focus:border-text focus:outline-none" />
          </div>
          <input name="notes" placeholder="Notes (optional)" className="rounded-control border border-border bg-canvas px-3 py-2 text-sm text-text focus:border-text focus:outline-none" />
          <button className="w-fit rounded-pill bg-text px-5 py-2 text-sm font-medium text-canvas hover:opacity-90">Add</button>
          <p className="text-xs text-text-muted">One hex = a color swatch; multiple = a palette.</p>
        </form>
      ) : (
        <form action={proposeAddAction} className="flex flex-col gap-3 rounded-card border border-border bg-surface p-5">
          <input type="hidden" name="slug" value={slug} /><input type="hidden" name="kitSlug" value={kit.slug} /><input type="hidden" name="kitId" value={kit.id} />
          <h2 className="text-sm font-medium text-text">Propose a color or palette</h2>
          <p className="text-xs text-text-muted">As a member, your suggestion goes to an admin for review before it lands in the kit.</p>
          <div className="flex flex-wrap gap-2">
            <input name="name" placeholder="Name" required className="min-w-0 flex-1 rounded-control border border-border bg-canvas px-3 py-2 text-sm text-text focus:border-text focus:outline-none" />
            <input name="hexes" placeholder="#1d4ed8 or #1d4ed8, #3b82f6, …" required className="min-w-0 flex-[2] rounded-control border border-border bg-canvas px-3 py-2 text-sm text-text focus:border-text focus:outline-none" />
          </div>
          <input name="note" placeholder="Why this change? (optional)" className="rounded-control border border-border bg-canvas px-3 py-2 text-sm text-text focus:border-text focus:outline-none" />
          <button className="w-fit rounded-pill bg-text px-5 py-2 text-sm font-medium text-canvas hover:opacity-90">Submit proposal</button>
        </form>
      )}
    </div>
  );
}
