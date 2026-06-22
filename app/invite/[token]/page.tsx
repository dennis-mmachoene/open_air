import type { Metadata } from "next";
import Link from "next/link";
import { getInviteByToken } from "@/lib/orgs";
import { AcceptInvite } from "@/components/orgs/AcceptInvite";

export const metadata: Metadata = { title: "Team invite", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

function inviteUnavailable(invite: Awaited<ReturnType<typeof getInviteByToken>>): boolean {
  return !invite || invite.status !== "pending" || invite.expiresAt.getTime() < Date.now();
}

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const invite = await getInviteByToken(token);

  const invalid = inviteUnavailable(invite);

  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-md flex-col items-center justify-center gap-6 px-5 py-12 text-center">
      {invalid ? (
        <>
          <h1 className="font-display text-3xl text-text">Invite unavailable</h1>
          <p className="text-text-soft">This invite link is invalid, already used, or expired. Ask a team admin to send a new one.</p>
          <Link href="/orgs" className="text-sm text-text underline-offset-4 hover:underline">Go to Teams</Link>
        </>
      ) : (
        <>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-text-muted">Team invite</p>
          <h1 className="font-display text-3xl text-text">Join {invite!.orgName}</h1>
          <p className="text-text-soft">You&apos;ve been invited to collaborate as <strong className="text-text capitalize">{invite!.role}</strong>. Accept to join the team.</p>
          <AcceptInvite token={token} />
        </>
      )}
    </div>
  );
}
