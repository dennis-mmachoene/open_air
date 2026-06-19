import type { Pairing } from "@/lib/color/contrast";
import { clsx } from "@/lib/cn";

const GRADE_STYLES: Record<string, string> = {
  AAA: "bg-p-success text-p-on-primary",
  AA: "bg-p-success text-p-on-primary",
  "AA Large": "bg-p-warning text-p-on-primary",
  Fail: "bg-p-danger text-p-on-primary",
};

export function AccessibilityReport({ pairings }: { pairings: Pairing[] }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-text-muted">
            <th className="px-4 py-3 font-medium">Pairing</th>
            <th className="px-4 py-3 font-medium">Sample</th>
            <th className="px-4 py-3 font-medium">Ratio</th>
            <th className="px-4 py-3 font-medium">Grade</th>
          </tr>
        </thead>
        <tbody>
          {pairings.map((p) => (
            <tr key={p.label} className="border-b border-border last:border-0">
              <td className="px-4 py-3 text-text">{p.label}</td>
              <td className="px-4 py-3">
                <span
                  className="inline-flex items-center rounded-md px-2 py-1 font-mono text-xs"
                  style={{ backgroundColor: p.bg, color: p.fg }}
                >
                  Aa
                </span>
              </td>
              <td className="px-4 py-3 font-mono text-text-soft">{p.ratio.toFixed(2)}</td>
              <td className="px-4 py-3">
                <span
                  className={clsx(
                    "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
                    GRADE_STYLES[p.grade] ?? "bg-surface-2 text-text",
                  )}
                >
                  {p.grade}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
