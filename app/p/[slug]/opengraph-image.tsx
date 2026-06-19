import { ImageResponse } from "next/og";
import { getPalette } from "@/lib/palettes/snapshot";

export const alt = "Open Air palette";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OgImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const palette = getPalette(slug);
  const hexes = palette?.swatches.map((s) => s.hex) ?? ["#111", "#222", "#333"];
  const name = palette?.name ?? "Open Air";
  const tagline = palette?.tagline ?? "A living gallery of color";

  return new ImageResponse(
    (
      <div style={{ display: "flex", flexDirection: "column", width: "100%", height: "100%" }}>
        <div style={{ display: "flex", flex: 1 }}>
          {hexes.map((hex, i) => (
            <div key={i} style={{ flex: 1, backgroundColor: hex }} />
          ))}
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            padding: "48px 56px",
            backgroundColor: "#0b0b0c",
            color: "#fafaf9",
          }}
        >
          <div style={{ fontSize: 64, fontWeight: 600 }}>{name}</div>
          <div style={{ fontSize: 30, color: "#a8a29e", marginTop: 8 }}>
            {tagline} · Open Air
          </div>
        </div>
      </div>
    ),
    size,
  );
}
