import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { directFromBrief, directRefine } from "@/lib/director-ai";
import { rateLimit, consumeDailyBudget } from "@/lib/rate-limit";

const PER_MIN = 20;
const DAILY_CAP = 2000;
const MAX_CHARS = 600;

export async function POST(request: Request) {
  const session = await auth();
  const body = (await request.json().catch(() => null)) as
    | { brief?: unknown; base?: unknown; refine?: unknown }
    | null;

  const who =
    session?.user?.id ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "anon";
  const rl = await rateLimit(`ai-system:${who}`, { limit: PER_MIN, windowMs: 60_000 });
  if (!rl.success) return NextResponse.json({ error: "rate limit exceeded" }, { status: 429 });
  if (!consumeDailyBudget("ai-system", DAILY_CAP)) {
    return NextResponse.json({ error: "busy right now, try again later" }, { status: 429 });
  }

  const base = typeof body?.base === "string" ? body.base.trim() : "";
  const refine = typeof body?.refine === "string" ? body.refine.trim().slice(0, MAX_CHARS) : "";
  if (base && refine) {
    return NextResponse.json(await directRefine(base, refine));
  }
  const brief = typeof body?.brief === "string" ? body.brief.trim().slice(0, MAX_CHARS) : "";
  if (!brief) return NextResponse.json({ error: "bad request" }, { status: 400 });
  return NextResponse.json(await directFromBrief(brief));
}
