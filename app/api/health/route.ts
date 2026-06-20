import { NextResponse } from "next/server";
import { runHealthChecks } from "@/lib/health";

export const dynamic = "force-dynamic";

/** Public uptime probe. Returns booleans only — no secrets. 503 if degraded. */
export async function GET() {
  const report = await runHealthChecks();
  return NextResponse.json(report, { status: report.status === "ok" ? 200 : 503 });
}
