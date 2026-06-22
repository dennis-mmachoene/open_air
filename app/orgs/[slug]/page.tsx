import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { requireUser } from "@/lib/auth-guard";
import { getOrgBySlug, getMembership, listMembers, listInvites, seatUsage, ownerSeatLimit } from "@/lib/orgs";
import { InviteForm } from "@/components/orgs/InviteForm";
import { InviteRow } from "@/components/orgs/InviteRow";
import { MemberRow } from "@/components/orgs/MemberRow";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const org = await getOrgBySlug(slug);
  return { title: org ? `${org.name} · Team` : "Team", robots: { index: false, follow: false } };
}

export const dynamic = "force-dynamic";

export default async function OrgPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await requireUser();
  const org = await getOrgBySlug(slug);
  if (!org) notFound();

  const role = await getMembership(org.id, user.id);
  if (!role) notFound(); // non-members can't see the team

  const canManage = role === "owner" || role === "admin";
  const [members, invites, used, limit] = await Promise.all([
    listMembers(org.id),
    canManage ? listInvites(org.id) : Promise.resolve([]),
    seatUsage(org.id),
    ownerSeatLimit(org.id),
  ]);
  const atCap = used >= limit;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-10 px-5 py-12 sm:px-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-text-muted">Team</p>
          <h1 className="font-display text-4xl text-text">{org.name}</h1>
        </div>
        <span className="rounded-full border border-border px-3 py-1 text-sm capitalize text-text-soft">You&apos;re {role === "admin" ? "an" : "the"} {role}</span>
      </header>

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-xl text-text">Members <span className="text-text-muted">({members.length})</span></h2>
        <ul className="flex flex-col">
          {members.map((m) => (
            <MemberRow
              key={m.userId}
              slug={org.slug}
              member={{ userId: m.userId, role: m.role, name: m.name, email: m.email, handle: m.handle }}
              canManage={role === "owner"}
              isSelf={m.userId === user.id}
            />
          ))}
        </ul>
        {role === "admin" ? (
          <p className="text-xs text-text-muted">Admins can invite and remove members; only owners can change roles.</p>
        ) : null}
      </section>

      {canManage ? (
        <section className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="font-display text-xl text-text">Invite teammates</h2>
              <span className="text-xs text-text-muted">{used} / {limit} seats used</span>
            </div>
            {atCap ? (
              <p className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-soft">
                Your team is at its seat limit. <Link href="/pricing" className="underline underline-offset-4">Upgrade the plan</Link> or remove a member to invite more.
              </p>
            ) : (
              <InviteForm slug={org.slug} />
            )}
          </div>
          {invites.length > 0 ? (
            <div className="flex flex-col gap-2">
              <h3 className="text-sm font-medium text-text-soft">Pending invites</h3>
              <ul className="flex flex-col">
                {invites.map((i) => (
                  <InviteRow key={i.id} slug={org.slug} id={i.id} email={i.email} role={i.role} />
                ))}
              </ul>
            </div>
          ) : null}
        </section>
      ) : null}

      <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-surface p-5">
        <div>
          <h2 className="font-display text-lg text-text">Brand kits</h2>
          <p className="text-sm text-text-soft">Your team&apos;s shared colors and palettes.</p>
        </div>
        <Link href={`/orgs/${org.slug}/kits`} className="rounded-full border border-border px-4 py-2 text-sm font-medium text-text transition-colors hover:bg-surface-2">Open brand kits →</Link>
      </section>

      {canManage ? (
        <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-surface p-5">
          <div>
            <h2 className="font-display text-lg text-text">Verified domains</h2>
            <p className="text-sm text-text-soft">Auto-join teammates by company email domain.</p>
          </div>
          <Link href={`/orgs/${org.slug}/domains`} className="rounded-full border border-border px-4 py-2 text-sm font-medium text-text transition-colors hover:bg-surface-2">Manage domains →</Link>
        </section>
      ) : null}

      {canManage ? (
        <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-surface p-5">
          <div>
            <h2 className="font-display text-lg text-text">Audit log</h2>
            <p className="text-sm text-text-soft">Every membership and brand-kit change, with CSV/JSON export.</p>
          </div>
          <Link href={`/orgs/${org.slug}/audit`} className="rounded-full border border-border px-4 py-2 text-sm font-medium text-text transition-colors hover:bg-surface-2">View audit log →</Link>
        </section>
      ) : null}

      <section className="rounded-2xl border border-dashed border-border p-5 text-sm text-text-muted">
        A review / approval workflow for color changes is coming next for teams.
      </section>
    </div>
  );
}
