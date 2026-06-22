import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth-guard";
import { listOrgsForUser } from "@/lib/orgs";
import { CreateOrgForm } from "@/components/orgs/CreateOrgForm";

export const metadata: Metadata = { title: "Teams" };
export const dynamic = "force-dynamic";

export default async function OrgsPage() {
  const user = await requireUser();
  const orgs = await listOrgsForUser(user.id);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-5 py-12 sm:px-8">
      <header className="flex flex-col gap-2">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-text-muted">Governance</p>
        <h1 className="font-display text-4xl text-text">Teams</h1>
        <p className="text-lg text-text-soft">Collaborate on shared color systems. Invite teammates, assign roles, and (soon) govern brand kits together.</p>
      </header>

      {orgs.length === 0 ? (
        <p className="text-text-soft">You&apos;re not on any team yet. Create one to get started.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {orgs.map((o) => (
            <li key={o.id}>
              <Link href={`/orgs/${o.slug}`} className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-surface p-4 transition-colors hover:border-text">
                <div className="min-w-0">
                  <p className="truncate font-display text-lg text-text">{o.name}</p>
                  <p className="text-xs text-text-muted">{o.memberCount} {o.memberCount === 1 ? "member" : "members"}</p>
                </div>
                <span className="rounded-full border border-border px-2.5 py-0.5 text-xs capitalize text-text-soft">{o.role}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <CreateOrgForm />
    </div>
  );
}
