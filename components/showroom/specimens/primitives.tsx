import type { Specimen } from "../registry";

const ring = "outline-none focus-visible:border-p-ring";

export const primitives: Specimen[] = [
  {
    id: "buttons",
    group: "Primitives",
    title: "Buttons",
    render: () => (
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <button className="rounded-lg bg-p-primary px-3 py-1.5 text-sm font-medium text-p-on-primary">Primary</button>
          <button className="rounded-lg bg-p-secondary px-3 py-1.5 text-sm font-medium text-p-on-secondary">Secondary</button>
          <button className="rounded-lg border border-p-border px-3 py-1.5 text-sm font-medium text-p-text">Ghost</button>
          <button className="rounded-lg bg-p-accent px-3 py-1.5 text-sm font-medium text-p-on-accent">Accent</button>
          <button className="rounded-lg px-3 py-1.5 text-sm font-medium text-white" style={{ backgroundColor: "var(--p-danger)" }}>Delete</button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button className="rounded-md bg-p-primary px-2 py-1 text-xs font-medium text-p-on-primary">Small</button>
          <button className="rounded-lg bg-p-primary px-4 py-2 text-base font-medium text-p-on-primary">Large</button>
          <button className="inline-flex items-center gap-1.5 rounded-lg bg-p-primary px-3 py-1.5 text-sm font-medium text-p-on-primary">
            <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
            Loading
          </button>
          <button disabled className="rounded-lg bg-p-primary px-3 py-1.5 text-sm font-medium text-p-on-primary opacity-40">Disabled</button>
        </div>
      </div>
    ),
  },
  {
    id: "form",
    group: "Primitives",
    title: "Inputs & form",
    render: () => (
      <div className="flex flex-col gap-3">
        <label className="text-xs font-medium text-p-text-soft">Email</label>
        <input placeholder="you@example.com" className={`w-full rounded-lg border border-p-border bg-p-bg px-3 py-2 text-sm text-p-text ${ring}`} />
        <textarea rows={2} placeholder="A short note…" className={`w-full rounded-lg border border-p-border bg-p-bg px-3 py-2 text-sm text-p-text ${ring}`} />
        <select className={`w-full rounded-lg border border-p-border bg-p-bg px-3 py-2 text-sm text-p-text ${ring}`}>
          <option>Choose a plan</option>
          <option>Pro</option>
        </select>
        <p className="text-xs text-p-text-muted">We&apos;ll never share your email.</p>
      </div>
    ),
  },
  {
    id: "selection",
    group: "Primitives",
    title: "Selection",
    render: () => (
      <div className="flex flex-col gap-3 text-sm text-p-text">
        <label className="flex items-center gap-2">
          <span className="flex h-4 w-4 items-center justify-center rounded border border-p-border" style={{ backgroundColor: "var(--p-primary)" }}>
            <span className="h-1.5 w-2.5 -translate-y-px rotate-[-45deg] border-b-2 border-l-2" style={{ borderColor: "var(--p-on-primary)" }} />
          </span>
          Checked
        </label>
        <label className="flex items-center gap-2">
          <span className="h-4 w-4 rounded border border-p-border" />
          Unchecked
        </label>
        <label className="flex items-center gap-2">
          <span className="flex h-4 w-4 items-center justify-center rounded-full border-2" style={{ borderColor: "var(--p-primary)" }}>
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: "var(--p-primary)" }} />
          </span>
          Radio selected
        </label>
        <div className="flex items-center gap-2">
          <span className="flex h-5 w-9 items-center rounded-full p-0.5" style={{ backgroundColor: "var(--p-primary)" }}>
            <span className="h-4 w-4 translate-x-4 rounded-full bg-white transition-transform" />
          </span>
          <span>Switch on</span>
        </div>
      </div>
    ),
  },
  {
    id: "badges",
    group: "Primitives",
    title: "Badges & tags",
    render: () => (
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full px-2 py-0.5 text-xs font-medium" style={{ backgroundColor: "var(--p-primary)", color: "var(--p-on-primary)" }}>Primary</span>
        <span className="rounded-full px-2 py-0.5 text-xs font-medium" style={{ backgroundColor: "var(--p-accent)", color: "var(--p-on-accent)" }}>Accent</span>
        <span className="rounded-full border border-p-border px-2 py-0.5 text-xs text-p-text-soft">Outline</span>
        <span className="inline-flex items-center gap-1 rounded-full bg-p-surface-2 px-2 py-0.5 text-xs text-p-text">
          Removable <span className="text-p-text-muted">×</span>
        </span>
        <span className="inline-flex items-center gap-1 text-xs text-p-text-soft">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: "var(--p-success)" }} /> Online
        </span>
      </div>
    ),
  },
  {
    id: "avatars",
    group: "Primitives",
    title: "Avatars",
    render: () => (
      <div className="flex items-center gap-3">
        {["AR", "DM", "KO"].map((i, n) => (
          <span key={i} className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-medium" style={{ backgroundColor: `var(--p-c${n + 1})`, color: "#fff" }}>{i}</span>
        ))}
        <div className="flex -space-x-2">
          {[1, 2, 3, 4].map((n) => (
            <span key={n} className="h-8 w-8 rounded-full border-2" style={{ backgroundColor: `var(--p-c${n})`, borderColor: "var(--p-surface)" }} />
          ))}
        </div>
        <span className="relative inline-flex">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-p-surface-2 text-xs text-p-text">JD</span>
          <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2" style={{ backgroundColor: "var(--p-success)", borderColor: "var(--p-surface)" }} />
        </span>
      </div>
    ),
  },
  {
    id: "feedback",
    group: "Primitives",
    title: "Spinner · skeleton · progress",
    render: () => (
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-p-border" style={{ borderTopColor: "var(--p-primary)" }} />
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-p-surface-2">
            <span className="block h-full w-2/3 rounded-full" style={{ backgroundColor: "var(--p-primary)" }} />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <span className="h-3 w-3/4 rounded bg-p-surface-2" />
          <span className="h-3 w-1/2 rounded bg-p-surface-2" />
        </div>
      </div>
    ),
  },
  {
    id: "misc",
    group: "Primitives",
    title: "Link · kbd · divider",
    render: () => (
      <div className="flex flex-col gap-3 text-sm text-p-text">
        <a className="font-medium underline underline-offset-4" style={{ color: "var(--p-accent)" }}>An inline link →</a>
        <div className="flex items-center gap-1">
          <kbd className="rounded border border-p-border bg-p-surface-2 px-1.5 py-0.5 font-mono text-xs text-p-text-soft">⌘</kbd>
          <kbd className="rounded border border-p-border bg-p-surface-2 px-1.5 py-0.5 font-mono text-xs text-p-text-soft">K</kbd>
          <span className="ml-1 text-p-text-muted">to search</span>
        </div>
        <hr className="border-p-border" />
      </div>
    ),
  },
];
