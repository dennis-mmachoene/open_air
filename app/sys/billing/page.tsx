import Link from "next/link";
import { requirePlatformAdmin } from "@/lib/platform/auth";
import { SysShell } from "@/components/platform/SysShell";
import { Stat, SectionCard } from "@/components/platform/ui";
import { adminOverview } from "@/lib/admin-data";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

const PRICE = { pro: 12, studio: 29 }; // indicative monthly USD for MRR estimate

export default async function SysBillingPage() {
  const admin = await requirePlatformAdmin();
  const o = await adminOverview();
  const mrr = o.byPlan.pro * PRICE.pro + o.byPlan.studio * PRICE.studio;
  const stripeConfigured = Boolean(env.STRIPE_SECRET_KEY && env.STRIPE_WEBHOOK_SECRET);

  return (
    <SysShell admin={admin} active="/sys/billing">
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="font-display text-2xl text-text">Billing oversight</h1>
          <p className="text-sm text-text-muted">Subscription mix and revenue signal. Plan is derived server-side from Stripe; overrides are audit-logged.</p>
        </div>

        <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Stat label="Paying customers" value={o.byPlan.pro + o.byPlan.studio} sub={`${o.byPlan.pro} Pro · ${o.byPlan.studio} Studio`} />
          <Stat label="Free accounts" value={o.byPlan.free} />
          <Stat label="Est. MRR" value={`$${mrr.toLocaleString()}`} sub="indicative" />
          <Stat label="Conversion" value={`${o.totalUsers ? Math.round(((o.byPlan.pro + o.byPlan.studio) / o.totalUsers) * 100) : 0}%`} />
        </section>

        <SectionCard title="Stripe">
          <div className="flex items-center justify-between text-sm">
            <span className="text-text-soft">Integration</span>
            <span className={stripeConfigured ? "text-green-700 dark:text-green-400" : "text-amber-700 dark:text-amber-400"}>
              {stripeConfigured ? "Configured" : "Not configured"}
            </span>
          </div>
          <p className="text-xs text-text-muted">Webhook: <code>/api/stripe/webhook</code> (idempotent). To comp or correct an account, override its plan in <Link href="/sys/users" className="underline underline-offset-4">Users</Link>.</p>
        </SectionCard>
      </div>
    </SysShell>
  );
}
