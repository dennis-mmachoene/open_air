import { ImageResponse } from "next/og";
import { auth } from "@/lib/auth";
import { getEntitlements } from "@/lib/entitlements";
import { getPalette } from "@/lib/palettes/snapshot";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const session = await auth();
  if (!session?.user) return new Response("unauthorized", { status: 401 });
  const entitlements = await getEntitlements(session.user.id);
  if (!entitlements.allExports) {
    return new Response("upgrade required", { status: 403 });
  }
  const palette = getPalette(slug);
  if (!palette) return new Response("not found", { status: 404 });

  const hexes = palette.swatches.map((s) => s.hex);
  return new ImageResponse(
    (
      <div style={{ display: "flex", flexDirection: "column", width: "100%", height: "100%" }}>
        <div style={{ display: "flex", flex: 1 }}>
          {hexes.map((hex, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                backgroundColor: hex,
                display: "flex",
                alignItems: "flex-end",
                padding: 16,
                color: "#fff",
                fontSize: 22,
                fontFamily: "monospace",
              }}
            >
              {hex}
            </div>
          ))}
        </div>
        <div
          style={{
            display: "flex",
            padding: "20px 28px",
            backgroundColor: "#0b0b0c",
            color: "#fafaf9",
            fontSize: 30,
          }}
        >
          {palette.name} · Open Air
        </div>
      </div>
    ),
    { width: 1200, height: 420 },
  );
}
