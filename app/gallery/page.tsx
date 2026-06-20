import type { Metadata } from "next";
import { GalleryHome } from "@/components/gallery/GalleryHome";

export const metadata: Metadata = {
  title: "Gallery — browse 100+ color palettes",
  description:
    "Browse Open Air's living gallery of curated color palettes. Filter by mood, color family, season and harmony.",
};

export default async function GalleryPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  return <GalleryHome searchParams={sp} />;
}
