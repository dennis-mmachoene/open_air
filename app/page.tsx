import { auth } from "@/lib/auth";
import { GalleryHome } from "@/components/gallery/GalleryHome";
import { Landing } from "@/components/marketing/Landing";

/**
 * Smart home: signed-out visitors get the marketing landing; signed-in users
 * land straight in the gallery. (This makes / dynamic, by design.)
 */
export default async function Home({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await auth();
  if (!session?.user) return <Landing />;
  const sp = await searchParams;
  return <GalleryHome searchParams={sp} />;
}
