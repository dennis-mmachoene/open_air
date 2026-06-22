import { kitTokensBySyncToken } from "@/lib/sync/kit-sync";
import { serializeTokens, etagFor, isTokenFormat, FORMATS, type TokenFormat } from "@/lib/sync/serialize";
import { rateLimit } from "@/lib/rate-limit";

/**
 * Live Sync: GET /api/v1/kits/:id/tokens?format=dtcg|css|scss|tailwind|json
 * Auth via the kit's sync token (?token= or `Authorization: Bearer`).
 * Supports ETag / If-None-Match for cheap polling.
 */
export async function GET(request: Request, { params }: { params: Promise<{ kitId: string }> }) {
  const { kitId } = await params;
  const url = new URL(request.url);
  const authz = request.headers.get("authorization") ?? "";
  const bearer = authz.startsWith("Bearer ") ? authz.slice(7).trim() : "";
  const token = bearer || url.searchParams.get("token") || "";
  if (!token) return json({ error: "missing sync token" }, 401);

  const rl = await rateLimit(`kit-sync:${token.slice(0, 16)}`, { limit: 60, windowMs: 60_000 });
  if (!rl.success) return json({ error: "rate limit exceeded" }, 429);

  const data = await kitTokensBySyncToken(token);
  if (!data || data.kitId !== kitId) return json({ error: "invalid sync token" }, 401);

  const fmtParam = url.searchParams.get("format") ?? "dtcg";
  if (!isTokenFormat(fmtParam)) return json({ error: "unknown format", formats: FORMATS.map((f) => f.id) }, 400);
  const format: TokenFormat = fmtParam;

  const etag = etagFor(data.tokens, format);
  if (request.headers.get("if-none-match") === etag) {
    return new Response(null, { status: 304, headers: { ETag: etag, "Cache-Control": "public, max-age=0, must-revalidate" } });
  }

  const body = serializeTokens(data.tokens, format);
  const meta = FORMATS.find((f) => f.id === format)!;
  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": meta.contentType,
      ETag: etag,
      "Cache-Control": "public, max-age=0, must-revalidate",
      "Access-Control-Allow-Origin": "*",
      "X-Open-Air-Kit": data.name,
    },
  });
}

function json(obj: unknown, status: number): Response {
  return new Response(JSON.stringify(obj), { status, headers: { "Content-Type": "application/json" } });
}
