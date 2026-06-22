import type { Metadata } from "next";
import Link from "next/link";
import { Input } from "@/components/ui";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth-guard";
import { getOrgBySlug, getMembership } from "@/lib/orgs";
import { listDomains } from "@/lib/org-domains";
import { addDomainAction, verifyDomainAction, toggleAutoJoinAction, removeDomainAction } from "./_actions";

export const metadata: Metadata = { title: "Domains", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function DomainsPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ error?: string }> }) {
  const { slug } = await params;
  const { error } = await searchParams;
  const user = await requireUser();
  const org = await getOrgBySlug(slug);
  if (!org) notFound();
  const role = await getMembership(org.id, user.id);
  if (role !== "owner" && role !== "admin") notFound();
  const domains = await listDomains(org.id);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-5 py-12 sm:px-8">
      <header className="flex flex-col gap-2">
        <Link href={`/orgs/${slug}`} className="text-xs text-text-muted underline-offset-4 hover:underline">← {org.name}</Link>
        <h1 className="font-display text-4xl text-text">Verified domains</h1>
        <p className="text-lg text-text-soft">Claim your company domain so teammates who sign in with a matching email join automatically.</p>
      </header>

      {error ? <p className="rounded-control border border-p-danger/40 bg-p-danger/5 px-3 py-2 text-sm text-p-danger">{error}</p> : null}

      {domains.length === 0 ? (
        <p className="text-text-soft">No domains claimed yet.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {domains.map((d) => (
            <li key={d.id} className="flex flex-col gap-3 rounded-card border border-border bg-surface p-4">
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-mono text-sm text-text">{d.domain}</span>
                {d.verified ? (
                  <span className="rounded-pill border border-green-600/40 px-2.5 py-0.5 text-xs text-green-700 dark:text-green-400">Verified</span>
                ) : (
                  <span className="rounded-pill border border-amber-600/40 px-2.5 py-0.5 text-xs text-amber-700 dark:text-amber-400">Pending</span>
                )}
                <span className="ml-auto text-xs text-text-muted">Auto-join {d.autoJoin ? "on" : "off"}</span>
              </div>

              {!d.verified ? (
                <div className="flex flex-col gap-2 rounded-control border border-border bg-canvas p-3 text-sm">
                  <p className="text-text-soft">Add this TXT record to your DNS, then verify:</p>
                  <code className="block overflow-x-auto font-mono text-xs text-text">{d.verificationToken}</code>
                  <form action={verifyDomainAction}>
                    <input type="hidden" name="slug" value={slug} /><input type="hidden" name="id" value={d.id} />
                    <button className="w-fit rounded-pill bg-text px-4 py-1.5 text-xs font-medium text-canvas hover:opacity-90">Verify domain</button>
                  </form>
                </div>
              ) : null}

              <div className="flex flex-wrap items-center gap-2">
                <form action={toggleAutoJoinAction}>
                  <input type="hidden" name="slug" value={slug} /><input type="hidden" name="id" value={d.id} /><input type="hidden" name="on" value={d.autoJoin ? "0" : "1"} />
                  <button className="rounded-control border border-border px-3 py-1.5 text-xs text-text-soft hover:bg-surface-2">{d.autoJoin ? "Disable auto-join" : "Enable auto-join"}</button>
                </form>
                <form action={removeDomainAction}>
                  <input type="hidden" name="slug" value={slug} /><input type="hidden" name="id" value={d.id} />
                  <button className="text-xs text-text-muted hover:text-p-danger">Remove</button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}

      <form action={addDomainAction} className="flex flex-col gap-3 rounded-card border border-border bg-surface p-5">
        <input type="hidden" name="slug" value={slug} />
        <h2 className="text-sm font-medium text-text">Claim a domain</h2>
        <div className="flex flex-wrap gap-2">
          <Input name="domain" placeholder="acme.com" required className="min-w-0 flex-1"  aria-label="acme.com"/>
          <button className="rounded-pill bg-text px-5 py-2 text-sm font-medium text-canvas hover:opacity-90">Add domain</button>
        </div>
        <p className="text-xs text-text-muted">Public providers (gmail.com, outlook.com, …) can&apos;t be claimed.</p>
      </form>
    </div>
  );
}
