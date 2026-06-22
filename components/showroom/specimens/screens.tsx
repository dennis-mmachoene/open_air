import type { Specimen } from "../registry";

export const screens: Specimen[] = [
  {
    id: "hero",
    group: "Screens",
    title: "Marketing landing",
    span: 3,
    render: () => (
      <div className="overflow-hidden rounded-control border border-p-border">
        <div className="flex items-center justify-between border-b border-p-border px-4 py-2 text-sm">
          <span className="font-display text-p-text">Acme</span>
          <div className="flex items-center gap-3 text-p-text-soft">
            <span>Features</span><span>Pricing</span>
            <span className="rounded-pill bg-p-primary px-3 py-1 text-xs font-medium text-p-on-primary">Start free</span>
          </div>
        </div>
        <div className="flex flex-col items-center gap-3 px-6 py-8 text-center" style={{ backgroundColor: "var(--p-bg)" }}>
          <span className="rounded-pill bg-p-surface-2 px-3 py-1 text-xs text-p-text-soft">New · v2 is here</span>
          <h3 className="max-w-md font-display text-2xl text-p-text">Ship beautiful products faster</h3>
          <p className="max-w-sm text-sm text-p-text-soft">The toolkit your team will actually enjoy using.</p>
          <div className="flex gap-2">
            <button className="rounded-control bg-p-primary px-4 py-2 text-sm font-medium text-p-on-primary">Get started</button>
            <button className="rounded-control border border-p-border px-4 py-2 text-sm text-p-text">Live demo</button>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-3">
            {[1, 2, 3].map((n) => (
              <div key={n} className="rounded-control border border-p-border p-3 text-left">
                <span className="inline-block h-6 w-6 rounded" style={{ backgroundColor: `var(--p-c${n})` }} />
                <p className="mt-2 text-xs font-medium text-p-text">Feature {n}</p>
                <p className="text-xs text-p-text-muted">Short description.</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "pricing",
    group: "Screens",
    title: "Pricing",
    span: 3,
    render: () => (
      <div className="grid grid-cols-3 gap-3">
        {[
          ["Free", "$0", false],
          ["Pro", "$8", true],
          ["Studio", "$24", false],
        ].map(([name, price, featured]) => (
          <div key={name as string} className="flex flex-col gap-2 rounded-control border p-4" style={featured ? { borderColor: "var(--p-primary)", backgroundColor: "var(--p-surface)" } : { borderColor: "var(--p-border)" }}>
            <p className="text-sm font-medium text-p-text">{name}</p>
            <p className="text-2xl font-semibold text-p-text">{price}<span className="text-sm text-p-text-muted">/mo</span></p>
            <button className="mt-2 rounded-control px-3 py-1.5 text-sm font-medium" style={featured ? { backgroundColor: "var(--p-primary)", color: "var(--p-on-primary)" } : { border: "1px solid var(--p-border)", color: "var(--p-text)" }}>Choose</button>
          </div>
        ))}
      </div>
    ),
  },
  {
    id: "auth",
    group: "Screens",
    title: "Sign in",
    render: () => (
      <div className="mx-auto flex max-w-xs flex-col gap-3 rounded-control border border-p-border p-4">
        <h3 className="font-display text-lg text-p-text">Welcome back</h3>
        <input placeholder="Email" className="rounded-control border border-p-border bg-p-bg px-3 py-2 text-sm text-p-text outline-none" />
        <input placeholder="Password" type="password" className="rounded-control border border-p-border bg-p-bg px-3 py-2 text-sm text-p-text outline-none" />
        <button className="rounded-control bg-p-primary px-3 py-2 text-sm font-medium text-p-on-primary">Sign in</button>
        <button className="rounded-control border border-p-border px-3 py-2 text-sm text-p-text">Continue with Google</button>
      </div>
    ),
  },
  {
    id: "dashboard",
    group: "Screens",
    title: "Dashboard",
    span: 3,
    render: () => (
      <div className="flex gap-3 rounded-control border border-p-border p-3" style={{ backgroundColor: "var(--p-bg)" }}>
        <div className="hidden w-32 shrink-0 flex-col gap-1 sm:flex">
          {["Overview", "Reports", "Customers", "Settings"].map((l, i) => (
            <span key={l} className="rounded-control px-2 py-1.5 text-sm" style={i === 0 ? { backgroundColor: "var(--p-surface-2)", color: "var(--p-text)" } : { color: "var(--p-text-soft)" }}>{l}</span>
          ))}
        </div>
        <div className="flex flex-1 flex-col gap-3">
          <div className="grid grid-cols-3 gap-3">
            {[["MRR", "$48k"], ["Users", "1.2k"], ["NPS", "62"]].map(([l, v]) => (
              <div key={l} className="rounded-control border border-p-border bg-p-surface p-2">
                <p className="text-xs text-p-text-muted">{l}</p>
                <p className="text-lg font-semibold text-p-text">{v}</p>
              </div>
            ))}
          </div>
          <div className="rounded-control border border-p-border bg-p-surface p-3">
            <svg viewBox="0 0 240 70" className="w-full">
              {[30, 45, 38, 60, 50, 68, 55].map((h, i) => (
                <rect key={i} x={10 + i * 33} y={68 - h} width="20" height={h} rx="3" fill={`var(--p-c${(i % 6) + 1})`} />
              ))}
            </svg>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "inbox",
    group: "Screens",
    title: "Inbox",
    span: 2,
    render: () => (
      <div className="flex h-48 overflow-hidden rounded-control border border-p-border">
        <div className="w-2/5 border-r border-p-border">
          {["Maya", "Ada", "Grace"].map((n, i) => (
            <div key={n} className="border-b border-p-border px-3 py-2" style={i === 0 ? { backgroundColor: "var(--p-surface-2)" } : undefined}>
              <p className="text-sm font-medium text-p-text">{n}</p>
              <p className="truncate text-xs text-p-text-muted">Re: the new palette…</p>
            </div>
          ))}
        </div>
        <div className="flex-1 p-3">
          <p className="text-sm font-medium text-p-text">Re: the new palette</p>
          <p className="mt-2 text-xs text-p-text-soft">Looks great — shipping it to the gallery now. The strata read beautifully in dark mode too.</p>
        </div>
      </div>
    ),
  },
  {
    id: "mobile",
    group: "Screens",
    title: "Mobile app",
    render: () => (
      <div className="mx-auto w-40 overflow-hidden rounded-[1.6rem] border-4 p-2" style={{ borderColor: "var(--p-text)", backgroundColor: "var(--p-bg)" }}>
        <div className="flex items-center justify-between px-1 py-1 text-[10px] text-p-text-muted">
          <span>9:41</span><span>●●●</span>
        </div>
        <div className="flex flex-col gap-2">
          <div className="h-14 rounded-control" style={{ background: "linear-gradient(135deg, var(--p-c1), var(--p-c4))" }} />
          {[1, 2].map((n) => (
            <div key={n} className="flex items-center gap-2 rounded-control border border-p-border p-1.5">
              <span className="h-6 w-6 rounded" style={{ backgroundColor: `var(--p-c${n + 1})` }} />
              <span className="h-2 flex-1 rounded bg-p-surface-2" />
            </div>
          ))}
          <div className="mt-1 flex justify-around border-t border-p-border pt-1.5 text-p-text-muted">
            <span className="h-4 w-4 rounded" style={{ backgroundColor: "var(--p-primary)" }} />
            <span className="h-4 w-4 rounded bg-p-surface-2" />
            <span className="h-4 w-4 rounded bg-p-surface-2" />
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "kanban",
    group: "Screens",
    title: "Kanban",
    span: 2,
    render: () => (
      <div className="grid grid-cols-3 gap-3">
        {[["To do", 2, "c1"], ["Doing", 1, "c3"], ["Done", 2, "c5"]].map(([col, n, c]) => (
          <div key={col as string} className="flex flex-col gap-2 rounded-control bg-p-surface-2 p-2">
            <p className="flex items-center gap-1.5 text-xs font-medium text-p-text-soft">
              <span className="h-2 w-2 rounded-pill" style={{ backgroundColor: `var(--p-${c})` }} />{col}
            </p>
            {Array.from({ length: n as number }).map((_, i) => (
              <div key={i} className="rounded-control border border-p-border bg-p-surface p-2">
                <span className="block h-2 w-3/4 rounded bg-p-surface-2" />
                <span className="mt-1.5 block h-2 w-1/2 rounded bg-p-surface-2" />
              </div>
            ))}
          </div>
        ))}
      </div>
    ),
  },
];
