"use client";

import { useState } from "react";
import type { Roles } from "@/lib/palettes/types";
import { exportPalette, FREE_FORMATS, type FreeFormat } from "@/lib/palettes/export";
import { CopyButton } from "@/components/ui/CopyButton";
import { clsx } from "@/lib/cn";

export function ExportPanel({ roles }: { roles: Roles }) {
  const [format, setFormat] = useState<FreeFormat>("CSS");
  const code = exportPalette(roles, format);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex gap-1.5">
          {FREE_FORMATS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFormat(f)}
              className={clsx(
                "rounded-full px-3 py-1 text-sm transition-colors",
                f === format
                  ? "bg-text text-canvas"
                  : "text-text-soft hover:text-text",
              )}
            >
              {f}
            </button>
          ))}
        </div>
        <CopyButton
          value={code}
          label="Copy"
          copiedLabel="Copied"
          className="rounded-full border border-border px-3 py-1 text-text hover:bg-surface-2"
        />
      </div>
      <pre className="max-h-72 overflow-auto rounded-xl border border-border bg-surface-2 p-4 font-mono text-xs leading-relaxed text-text">
        <code>{code}</code>
      </pre>
      <p className="text-xs text-text-muted">
        SCSS, JSON, Figma tokens, SVG, PNG and ASE exports arrive with Pro.
      </p>
    </div>
  );
}
