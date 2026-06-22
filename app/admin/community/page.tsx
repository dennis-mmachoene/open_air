import { revalidatePath } from "next/cache";
import Link from "next/link";
import { requireAdmin } from "../_guard";
import { Strata } from "@/components/palette/Strata";
import { listFeed } from "@/lib/publish";
import {
  listOpenReports,
  resolveReports,
  adminRemovePalette,
  setFeatured,
  listFeatured,
} from "@/lib/social";

async function resolveAction(formData: FormData) {
  "use server";
  await requireAdmin();
  await resolveReports(String(formData.get("id")));
  revalidatePath("/admin/community");
}
async function removeAction(formData: FormData) {
  "use server";
  await requireAdmin();
  await adminRemovePalette(String(formData.get("id")));
  revalidatePath("/admin/community");
}
async function featureAction(formData: FormData) {
  "use server";
  await requireAdmin();
  await setFeatured(String(formData.get("id")), formData.get("on") === "1");
  revalidatePath("/admin/community");
}

export default async function AdminCommunityPage() {
  await requireAdmin();
  const [reports, recent, featured] = await Promise.all([
    listOpenReports(),
    listFeed("new", 24),
    listFeatured(48),
  ]);
  const featuredIds = new Set(featured.map((f) => f.id));

  return (
    <div className="flex flex-col gap-10">
      <section className="flex flex-col gap-3">
        <h2 className="font-display text-lg text-text">Open reports {reports.length ? <span className="text-text-muted">({reports.length})</span> : null}</h2>
        {reports.length === 0 ? (
          <p className="text-sm text-text-soft">No open reports. 🎉</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {reports.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-surface p-3">
                <Strata hexes={r.hexes} className="h-9 w-16 flex-none" />
                <div className="min-w-0 flex-1">
                  <Link href={`/s/${r.slug}`} className="truncate text-sm text-text hover:underline">{r.name}</Link>
                  <p className="text-xs text-text-muted">Reason: {r.reason} · {r.reporterEmail ?? "unknown"}</p>
                </div>
                <form action={resolveAction}>
                  <input type="hidden" name="id" value={r.publishedId} />
                  <button className="rounded-lg border border-border px-3 py-1.5 text-xs text-text-soft hover:bg-surface-2">Dismiss</button>
                </form>
                <form action={removeAction}>
                  <input type="hidden" name="id" value={r.publishedId} />
                  <button className="rounded-lg bg-p-danger px-3 py-1.5 text-xs font-medium text-white">Remove palette</button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-lg text-text">Recent public palettes</h2>
        <p className="text-sm text-text-muted">Toggle staff picks (shown on Explore → Staff picks).</p>
        {recent.length === 0 ? (
          <p className="text-sm text-text-soft">Nothing published yet.</p>
        ) : (
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {recent.map((p) => {
              const on = featuredIds.has(p.id);
              return (
                <li key={p.id} className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-3">
                  <Strata hexes={p.hexes} className="h-9 w-16 flex-none" />
                  <Link href={`/s/${p.slug}`} className="min-w-0 flex-1 truncate text-sm text-text hover:underline">{p.name}</Link>
                  <form action={featureAction}>
                    <input type="hidden" name="id" value={p.id} />
                    <input type="hidden" name="on" value={on ? "0" : "1"} />
                    <button className={on ? "rounded-lg bg-text px-3 py-1.5 text-xs font-medium text-canvas" : "rounded-lg border border-border px-3 py-1.5 text-xs text-text-soft hover:bg-surface-2"}>
                      {on ? "★ Featured" : "Feature"}
                    </button>
                  </form>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
