"use client";

import { useState } from "react";
import Link from "next/link";
import type { Roles, Swatch } from "@/lib/palettes/types";
import {
  exportText,
  FILE_EXT,
  FREE_FORMATS,
  TEXT_FORMATS,
  toAse,
  type TextFormat,
} from "@/lib/palettes/export";
import { CopyButton } from "@/components/ui/CopyButton";
import { clsx } from "@/lib/cn";

function download(filename: string, data: string | Uint8Array, type: string) {
  const url = URL.createObjectURL(new Blob([data as unknown as BlobPart], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function ExportPanel({
  roles,
  swatches,
  name,
  slug,
  pro,
}: {
  roles: Roles;
  swatches: Swatch[];
  name: string;
  slug: string;
  pro: boolean;
}) {
  const [format, setFormat] = useState<TextFormat>("CSS");
  const locked = !pro && !FREE_FORMATS.includes(format);
  const code = exportText(format, roles, swatches, name);
  const base = slug || "palette";

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-1.5">
        {TEXT_FORMATS.map((f) => {
          const isLocked = !pro && !FREE_FORMATS.includes(f);
          return (
            <button
              key={f}
              type="button"
              onClick={() => setFormat(f)}
              className={clsx(
                "rounded-pill px-3 py-1 text-sm transition-colors",
                f === format ? "bg-text text-canvas" : "text-text-soft hover:text-text",
              )}
            >
              {f}
              {isLocked ? " ·" : ""}
            </button>
          );
        })}
      </div>

      {locked ? (
        <div className="flex flex-col items-start gap-3 rounded-control border border-border bg-surface-2 p-5">
          <p className="text-sm text-text-soft">
            {format} export is a Pro feature.
          </p>
          <Link
            href="/pricing"
            className="rounded-pill bg-text px-4 py-2 text-sm font-medium text-canvas"
          >
            Go Pro
          </Link>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-end gap-2">
            <CopyButton
              value={code}
              label="Copy"
              copiedLabel="Copied"
              className="rounded-pill border border-border px-3 py-1 text-text hover:bg-surface-2"
            />
            <button
              type="button"
              onClick={() =>
                download(`${base}.${FILE_EXT[format]}`, code, "text/plain")
              }
              className="rounded-pill border border-border px-3 py-1 text-sm text-text hover:bg-surface-2"
            >
              Download
            </button>
          </div>
          <pre className="max-h-72 overflow-auto rounded-control border border-border bg-surface-2 p-4 font-mono text-xs leading-relaxed text-text">
            <code>{code}</code>
          </pre>
        </>
      )}

      {/* Binary exports */}
      <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3">
        <span className="text-xs uppercase tracking-wide text-text-muted">Files</span>
        {pro ? (
          <>
            <button
              type="button"
              onClick={() =>
                download(
                  `${base}.ase`,
                  toAse(swatches),
                  "application/octet-stream",
                )
              }
              className="rounded-pill border border-border px-3 py-1 text-sm text-text hover:bg-surface-2"
            >
              .ase (Adobe)
            </button>
            <a
              href={`/api/export/png/${slug}`}
              className="rounded-pill border border-border px-3 py-1 text-sm text-text hover:bg-surface-2"
            >
              .png sheet
            </a>
          </>
        ) : (
          <Link href="/pricing" className="text-sm text-text-soft underline underline-offset-4">
            ASE + PNG with Pro →
          </Link>
        )}
      </div>
    </div>
  );
}
