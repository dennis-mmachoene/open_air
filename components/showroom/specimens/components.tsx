import type { Specimen } from "../registry";

export const components: Specimen[] = [
  {
    id: "card",
    group: "Components",
    title: "Card",
    render: () => (
      <div className="overflow-hidden rounded-xl border border-p-border">
        <div className="h-20" style={{ background: "linear-gradient(90deg, var(--p-c1), var(--p-c3))" }} />
        <div className="flex flex-col gap-2 p-3">
          <h4 className="font-medium text-p-text">Coastal Mornings</h4>
          <p className="text-sm text-p-text-soft">Soft sea blues and washed light.</p>
          <button className="mt-1 self-start rounded-lg bg-p-primary px-3 py-1.5 text-sm font-medium text-p-on-primary">View</button>
        </div>
      </div>
    ),
  },
  {
    id: "stats",
    group: "Components",
    title: "Stat cards",
    span: 2,
    render: () => (
      <div className="grid grid-cols-3 gap-3">
        {[
          ["Revenue", "$48.2k", "+12%"],
          ["Active", "1,284", "+4%"],
          ["Churn", "0.8%", "−0.3%"],
        ].map(([label, value, delta]) => (
          <div key={label} className="rounded-xl border border-p-border p-3">
            <p className="text-xs text-p-text-muted">{label}</p>
            <p className="mt-1 text-xl font-semibold text-p-text">{value}</p>
            <p className="text-xs font-medium" style={{ color: "var(--p-success)" }}>{delta}</p>
          </div>
        ))}
      </div>
    ),
  },
  {
    id: "alert",
    group: "Components",
    title: "Alerts",
    render: () => (
      <div className="flex flex-col gap-2 text-sm">
        {[
          ["info", "Heads up — a new palette dropped."],
          ["success", "Saved to your collection."],
          ["warning", "Your trial ends in 3 days."],
          ["danger", "Couldn't reach the server."],
        ].map(([tone, msg]) => (
          <div key={tone} className="flex items-center gap-2 rounded-lg border px-3 py-2" style={{ borderColor: `var(--p-${tone})`, color: "var(--p-text)" }}>
            <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: `var(--p-${tone})` }} />
            {msg}
          </div>
        ))}
      </div>
    ),
  },
  {
    id: "tabs",
    group: "Components",
    title: "Tabs & accordion",
    render: () => (
      <div className="flex flex-col gap-3">
        <div className="flex gap-4 border-b border-p-border text-sm">
          <span className="-mb-px border-b-2 pb-2 font-medium text-p-text" style={{ borderColor: "var(--p-primary)" }}>Overview</span>
          <span className="pb-2 text-p-text-muted">Activity</span>
          <span className="pb-2 text-p-text-muted">Settings</span>
        </div>
        <div className="rounded-lg border border-p-border">
          <div className="flex items-center justify-between border-b border-p-border px-3 py-2 text-sm text-p-text">
            What is a role token? <span className="text-p-text-muted">−</span>
          </div>
          <div className="px-3 py-2 text-sm text-p-text-soft">A named slot every specimen reads from.</div>
        </div>
      </div>
    ),
  },
  {
    id: "table",
    group: "Components",
    title: "Data table",
    span: 2,
    render: () => (
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-p-border text-p-text-muted">
            <th className="py-2 font-medium">Name</th>
            <th className="py-2 font-medium">Plan</th>
            <th className="py-2 font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {[
            ["Maya R.", "Studio", "success", "Active"],
            ["Ada L.", "Pro", "warning", "Past due"],
            ["Grace H.", "Free", "info", "Trialing"],
          ].map(([name, plan, tone, status]) => (
            <tr key={name} className="border-b border-p-border last:border-0 text-p-text">
              <td className="py-2">{name}</td>
              <td className="py-2 text-p-text-soft">{plan}</td>
              <td className="py-2">
                <span className="rounded-full px-2 py-0.5 text-xs" style={{ backgroundColor: `var(--p-${tone})`, color: "#fff" }}>{status}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    ),
  },
  {
    id: "nav",
    group: "Components",
    title: "Navbar · breadcrumbs · pagination",
    span: 2,
    render: () => (
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between rounded-lg border border-p-border px-3 py-2">
          <span className="font-display text-sm text-p-text">Open Air</span>
          <div className="flex items-center gap-3 text-sm text-p-text-soft">
            <span>Gallery</span><span>Studio</span>
            <span className="rounded-full bg-p-primary px-3 py-1 text-xs font-medium text-p-on-primary">Go Pro</span>
          </div>
        </div>
        <div className="flex items-center gap-1 text-xs text-p-text-muted">
          Home <span>/</span> Collections <span>/</span> <span className="text-p-text">Jewel Box</span>
        </div>
        <div className="flex items-center gap-1 text-sm">
          {["1", "2", "3"].map((n) => (
            <span key={n} className="flex h-7 w-7 items-center justify-center rounded-md text-xs" style={n === "2" ? { backgroundColor: "var(--p-primary)", color: "var(--p-on-primary)" } : { color: "var(--p-text-soft)" }}>{n}</span>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: "timeline",
    group: "Components",
    title: "Timeline & chat",
    render: () => (
      <div className="flex flex-col gap-3 text-sm">
        <div className="flex flex-col gap-2">
          {["Created the palette", "Ran the AA gate", "Published"].map((t, i) => (
            <div key={t} className="flex items-center gap-2 text-p-text-soft">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: i === 0 ? "var(--p-primary)" : "var(--p-border)" }} />
              {t}
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="max-w-[80%] self-start rounded-2xl rounded-bl-sm bg-p-surface-2 px-3 py-1.5 text-p-text">Love this one</span>
          <span className="max-w-[80%] self-end rounded-2xl rounded-br-sm px-3 py-1.5" style={{ backgroundColor: "var(--p-primary)", color: "var(--p-on-primary)" }}>Same — saving it.</span>
        </div>
      </div>
    ),
  },
  {
    id: "overlay",
    group: "Components",
    title: "Dialog & toast",
    render: () => (
      <div className="flex flex-col gap-3">
        <div className="rounded-xl border border-p-border p-3 shadow-sm">
          <h4 className="font-medium text-p-text">Delete palette?</h4>
          <p className="mt-1 text-sm text-p-text-soft">This can&apos;t be undone.</p>
          <div className="mt-3 flex justify-end gap-2">
            <button className="rounded-lg border border-p-border px-3 py-1.5 text-sm text-p-text">Cancel</button>
            <button className="rounded-lg px-3 py-1.5 text-sm font-medium text-white" style={{ backgroundColor: "var(--p-danger)" }}>Delete</button>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-p-border bg-p-surface-2 px-3 py-2 text-sm text-p-text shadow-sm">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: "var(--p-success)" }} /> Changes saved
        </div>
      </div>
    ),
  },
];
