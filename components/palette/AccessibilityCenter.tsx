"use client";

import { contrast } from "@/lib/color/contrast";
import { CVD_LABELS, simulate, type CvdType } from "@/lib/color/cvd";
import type { Roles, Swatch } from "@/lib/palettes/types";
import { clsx } from "@/lib/cn";

const PAIRS: [string, keyof Roles, keyof Roles][] = [
  ["Text on background", "text", "bg"],
  ["Soft text on background", "textSoft", "bg"],
  ["Muted text on background", "textMuted", "bg"],
  ["Label on primary", "onPrimary", "primary"],
  ["Label on secondary", "onSecondary", "secondary"],
  ["Label on accent", "onAccent", "accent"],
];

const SEMANTIC: [string, keyof Roles][] = [
  ["Success", "success"],
  ["Warning", "warning"],
  ["Danger", "danger"],
  ["Info", "info"],
];

const CVDS: CvdType[] = ["protanopia", "deuteranopia", "tritanopia"];

function Tick({ ok }: { ok: boolean }) {
  return (
    <span className={clsx("text-sm", ok ? "text-p-success" : "text-p-danger")}>
      {ok ? "✓" : "✕"}
    </span>
  );
}

export function AccessibilityCenter({
  roles,
  swatches,
}: {
  roles: Roles;
  swatches: Swatch[];
}) {
  const rows = [
    ...PAIRS.map(([label, fg, bg]) => ({
      label,
      fg: roles[fg],
      bg: roles[bg],
      ratio: contrast(roles[fg], roles[bg]),
    })),
    ...SEMANTIC.map(([label, key]) => ({
      label: `${label} on surface`,
      fg: roles[key],
      bg: roles.surface,
      ratio: contrast(roles[key], roles.surface),
    })),
  ];

  const hexes = swatches.map((s) => s.hex);

  return (
    <div className="flex flex-col gap-6">
      <div className="overflow-hidden rounded-card border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-text-muted">
              <th className="px-4 py-3 font-medium">Pairing</th>
              <th className="px-4 py-3 font-medium">Sample</th>
              <th className="px-4 py-3 font-medium">Ratio</th>
              <th className="px-3 py-3 text-center font-medium">AA</th>
              <th className="px-3 py-3 text-center font-medium">AA Large</th>
              <th className="px-3 py-3 text-center font-medium">AAA</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.label} className="border-b border-border last:border-0">
                <td className="px-4 py-2.5 text-text">{r.label}</td>
                <td className="px-4 py-2.5">
                  <span
                    className="inline-flex items-center rounded-control px-2 py-1 font-mono text-xs"
                    style={{ backgroundColor: r.bg, color: r.fg }}
                  >
                    Aa
                  </span>
                </td>
                <td className="px-4 py-2.5 font-mono text-text-soft">{r.ratio.toFixed(2)}</td>
                <td className="px-3 py-2.5 text-center"><Tick ok={r.ratio >= 4.5} /></td>
                <td className="px-3 py-2.5 text-center"><Tick ok={r.ratio >= 3} /></td>
                <td className="px-3 py-2.5 text-center"><Tick ok={r.ratio >= 7} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-medium text-text">Color-blind simulation</h3>
        <div className="flex flex-col gap-2">
          {[
            { label: "Original", colors: hexes },
            ...CVDS.map((t) => ({
              label: CVD_LABELS[t],
              colors: hexes.map((h) => simulate(h, t)),
            })),
          ].map((row) => (
            <div key={row.label} className="flex items-center gap-3">
              <span className="w-44 shrink-0 text-xs text-text-muted">{row.label}</span>
              <div className="flex h-7 flex-1 overflow-hidden rounded-control border border-border">
                {row.colors.map((c, i) => (
                  <div key={i} className="flex-1" style={{ backgroundColor: c }} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
