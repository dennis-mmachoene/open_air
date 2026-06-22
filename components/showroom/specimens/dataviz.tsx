import type { Specimen } from "../registry";

const bars = [40, 65, 52, 80, 60, 95];

export const dataviz: Specimen[] = [
  {
    id: "bar-chart",
    group: "Data",
    title: "Bar chart",
    render: () => (
      <svg viewBox="0 0 200 110" className="w-full">
        <line x1="10" y1="100" x2="195" y2="100" stroke="var(--p-border)" />
        {bars.map((h, i) => (
          <rect key={i} x={16 + i * 30} y={100 - h} width="18" height={h} rx="3" fill={`var(--p-c${i + 1})`} />
        ))}
      </svg>
    ),
  },
  {
    id: "line-area",
    group: "Data",
    title: "Line & area",
    render: () => {
      const pts = [10, 35, 22, 48, 30, 60, 44, 75].map((v, i) => `${i * 28 + 6},${90 - v}`).join(" ");
      return (
        <svg viewBox="0 0 200 100" className="w-full">
          <polygon points={`6,90 ${pts} 202,90`} fill="var(--p-c2)" opacity="0.18" />
          <polyline points={pts} fill="none" stroke="var(--p-c2)" strokeWidth="2.5" />
          <polyline points={[5, 20, 14, 30, 22, 40, 30, 52].map((v, i) => `${i * 28 + 6},${90 - v}`).join(" ")} fill="none" stroke="var(--p-c4)" strokeWidth="2.5" strokeDasharray="4 3" />
        </svg>
      );
    },
  },
  {
    id: "donut",
    group: "Data",
    title: "Donut",
    render: () => {
      const data = [35, 25, 20, 12, 8];
      const C = 2 * Math.PI * 30;
      let offset = 0;
      return (
        <svg viewBox="0 0 100 100" className="mx-auto h-28 w-28 -rotate-90">
          {data.map((v, i) => {
            const len = (v / 100) * C;
            const el = (
              <circle key={i} cx="50" cy="50" r="30" fill="none" stroke={`var(--p-c${i + 1})`} strokeWidth="16" strokeDasharray={`${len} ${C - len}`} strokeDashoffset={-offset} />
            );
            offset += len;
            return el;
          })}
        </svg>
      );
    },
  },
  {
    id: "spark-gauge",
    group: "Data",
    title: "Sparkline & gauge",
    render: () => (
      <div className="flex items-center justify-between gap-4">
        <svg viewBox="0 0 120 40" className="h-10 flex-1">
          <polyline points={[8, 18, 12, 26, 16, 30, 22, 36, 28].map((v, i) => `${i * 14 + 4},${38 - v}`).join(" ")} fill="none" stroke="var(--p-c1)" strokeWidth="2" />
        </svg>
        <svg viewBox="0 0 60 36" className="h-10 w-16">
          <path d="M6 32 A24 24 0 0 1 54 32" fill="none" stroke="var(--p-border)" strokeWidth="6" strokeLinecap="round" />
          <path d="M6 32 A24 24 0 0 1 44 12" fill="none" stroke="var(--p-primary)" strokeWidth="6" strokeLinecap="round" />
        </svg>
      </div>
    ),
  },
  {
    id: "kpi",
    group: "Data",
    title: "KPI trend tiles",
    render: () => (
      <div className="grid grid-cols-2 gap-3">
        {[["Sessions", "12.4k", "c1"], ["Signups", "842", "c3"]].map(([l, v, c]) => (
          <div key={l} className="rounded-control border border-p-border p-2">
            <p className="text-xs text-p-text-muted">{l}</p>
            <p className="text-lg font-semibold text-p-text">{v}</p>
            <svg viewBox="0 0 80 16" className="mt-1 h-4 w-full">
              <polyline points="2,12 18,8 34,10 50,5 66,7 78,2" fill="none" stroke={`var(--p-${c})`} strokeWidth="2" />
            </svg>
          </div>
        ))}
      </div>
    ),
  },
  {
    id: "legend",
    group: "Data",
    title: "Legend & heatmap",
    render: () => (
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-3 text-xs text-p-text-soft">
          {["Mon", "Tue", "Wed", "Thu"].map((d, i) => (
            <span key={d} className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: `var(--p-c${i + 1})` }} />{d}
            </span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 28 }).map((_, i) => (
            <span key={i} className="aspect-square rounded-sm" style={{ backgroundColor: "var(--p-primary)", opacity: 0.15 + ((i * 7) % 10) / 12 }} />
          ))}
        </div>
      </div>
    ),
  },
];
