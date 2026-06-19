import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getSavedSlugs } from "@/lib/saves";
import { listUserPalettes } from "@/lib/user-palettes";
import { Strata } from "@/components/palette/Strata";
import {
  createUserCollection,
  deleteUserCollection,
  listUserCollections,
} from "@/lib/user-collections";
import { getPalette } from "@/lib/palettes/snapshot";
import { PaletteCard } from "@/components/gallery/PaletteCard";
import { Rail } from "@/components/gallery/Rail";

export const metadata: Metadata = { title: "Dashboard" };

async function createCollection(formData: FormData) {
  "use server";
  const session = await auth();
  if (!session?.user) return;
  const name = String(formData.get("name") ?? "").trim();
  if (name) await createUserCollection(session.user.id, name);
  revalidatePath("/dashboard");
}

async function removeCollection(formData: FormData) {
  "use server";
  const session = await auth();
  if (!session?.user) return;
  await deleteUserCollection(session.user.id, String(formData.get("id") ?? ""));
  revalidatePath("/dashboard");
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/signin");

  const [savedSlugs, collections, generated] = await Promise.all([
    getSavedSlugs(session.user.id),
    listUserCollections(session.user.id),
    listUserPalettes(session.user.id),
  ]);
  const saved = savedSlugs.map(getPalette).filter((p) => p !== undefined);

  const jar = await cookies();
  const recentSlugs = (jar.get("oa_recent")?.value ?? "").split(",").filter(Boolean);
  const recent = recentSlugs
    .map(getPalette)
    .filter((p) => p !== undefined)
    .slice(0, 8);

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-12 px-5 py-12 sm:px-8">
      <header className="flex flex-col gap-1">
        <h1 className="font-display text-4xl text-text">Your dashboard</h1>
        <p className="text-text-soft">
          Welcome back{session.user.name ? `, ${session.user.name}` : ""}.
        </p>
      </header>

      {/* Saved */}
      <section className="flex flex-col gap-4">
        <h2 className="font-display text-2xl text-text">Saved palettes</h2>
        {saved.length === 0 ? (
          <p className="text-text-soft">
            Nothing saved yet —{" "}
            <Link href="/" className="underline underline-offset-4">browse the gallery</Link>{" "}
            and tap the heart on any palette.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {saved.map((p) => (
              <PaletteCard key={p.slug} palette={p} />
            ))}
          </div>
        )}
      </section>

      {/* Collections */}
      <section className="flex flex-col gap-4">
        <h2 className="font-display text-2xl text-text">Collections</h2>
        <form action={createCollection} className="flex max-w-sm gap-2">
          <input
            name="name"
            placeholder="e.g. Client X, My brand"
            className="min-w-0 flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text outline-none focus-visible:border-text"
          />
          <button className="rounded-lg bg-text px-4 py-2 text-sm font-medium text-canvas">
            Create
          </button>
        </form>
        {collections.length === 0 ? (
          <p className="text-text-soft">No collections yet.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-border rounded-xl border border-border">
            {collections.map((c) => (
              <li key={c.id} className="flex items-center justify-between px-4 py-3">
                <span className="text-text">
                  {c.name}{" "}
                  <span className="text-sm text-text-muted">
                    · {c.itemCount} {c.itemCount === 1 ? "palette" : "palettes"}
                  </span>
                </span>
                <form action={removeCollection}>
                  <input type="hidden" name="id" value={c.id} />
                  <button className="text-sm text-text-muted transition-colors hover:text-text">
                    Delete
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Generated */}
      {generated.length > 0 ? (
        <section className="flex flex-col gap-4">
          <h2 className="font-display text-2xl text-text">Generated palettes</h2>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {generated.map((g) => (
              <div key={g.id} className="overflow-hidden rounded-2xl border border-border">
                <Strata hexes={g.swatches.map((s) => s.hex)} className="h-28 rounded-b-none" />
                <div className="p-3">
                  <p className="truncate font-display text-text">{g.name}</p>
                  <p className="text-xs text-text-muted">{g.harmony}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {/* Recently viewed */}
      {recent.length > 0 ? (
        <Rail title="Recently viewed" palettes={recent} />
      ) : null}
    </div>
  );
}
