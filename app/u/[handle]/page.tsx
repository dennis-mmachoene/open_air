import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { getProfileByHandle, listByAuthor } from "@/lib/publish";
import { PublishedCard } from "@/components/community/PublishedCard";

export async function generateMetadata({ params }: { params: Promise<{ handle: string }> }): Promise<Metadata> {
  const { handle } = await params;
  const profile = await getProfileByHandle(handle);
  if (!profile) return { title: "Profile not found" };
  return { title: `${profile.name ?? `@${profile.handle}`} on Open Air`, description: profile.bio ?? undefined };
}

export const dynamic = "force-dynamic";

export default async function ProfilePage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const profile = await getProfileByHandle(handle);
  if (!profile) notFound();

  const session = await auth();
  const published = await listByAuthor(profile.id, session?.user?.id);
  const totalLikes = published.reduce((a, p) => a + p.likeCount, 0);

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-5 py-12 sm:px-8">
      <header className="flex flex-col gap-3">
        <h1 className="font-display text-4xl text-text">{profile.name ?? `@${profile.handle}`}</h1>
        <p className="text-text-muted">@{profile.handle}</p>
        {profile.bio ? <p className="max-w-2xl text-lg text-text-soft">{profile.bio}</p> : null}
        <div className="flex flex-wrap items-center gap-4 text-sm text-text-soft">
          {profile.website ? (
            <a href={profile.website} rel="me noopener" target="_blank" className="text-text underline-offset-4 hover:underline">
              {profile.website.replace(/^https?:\/\//, "")}
            </a>
          ) : null}
          <span>{published.length} {published.length === 1 ? "palette" : "palettes"}</span>
          <span>{totalLikes} {totalLikes === 1 ? "like" : "likes"}</span>
        </div>
      </header>

      {published.length === 0 ? (
        <p className="text-text-soft">No published palettes yet.</p>
      ) : (
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
          {published.map((p) => (
            <PublishedCard key={p.id} p={p} />
          ))}
        </div>
      )}
    </div>
  );
}
