"use client";

import Link from "next/link";
import { useMemo, useState, type CSSProperties } from "react";
import type { Palette } from "@/lib/palettes/types";
import { rolesToVars } from "@/lib/palettes/types";

export interface ShowroomPalette {
  slug: string;
  name: string;
  roles: Palette["roles"];
}
import { clsx } from "@/lib/cn";
import { GROUPS, REGISTRY, type SpecimenGroup } from "./registry";
import { SpecimenCard } from "./SpecimenCard";

type Surface = "light" | "dark";
type Density = "comfortable" | "compact";
type Filter = SpecimenGroup | "All";

/** Representative specimen ids shown in the free preview. */
const PREVIEW_IDS = new Set(["buttons", "form", "card", "alert", "bar-chart", "hero"]);

function Segmented<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: [T, string][];
}) {
  return (
    <div className="inline-flex rounded-pill border border-border bg-surface p-0.5">
      {options.map(([v, label]) => (
        <button
          key={v}
          type="button"
          onClick={() => onChange(v)}
          className={clsx(
            "rounded-pill px-3 py-1 text-sm transition-colors",
            v === value ? "bg-text text-canvas" : "text-text-soft hover:text-text",
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

export function Showroom({
  palettes,
  lockedSlug,
  preview = false,
}: {
  palettes: ShowroomPalette[];
  lockedSlug?: string;
  preview?: boolean;
}) {
  const [slug, setSlug] = useState(lockedSlug ?? palettes[0]?.slug);
  const [surface, setSurface] = useState<Surface>("light");
  const [filter, setFilter] = useState<Filter>("All");
  const [density, setDensity] = useState<Density>("comfortable");

  const palette = palettes.find((p) => p.slug === slug) ?? palettes[0];
  const roles = surface === "dark" ? palette.roles.dark : palette.roles.light;

  const style = {
    ...rolesToVars(roles),
    "--sp": density === "compact" ? "0.75rem" : "1.25rem",
    backgroundColor: "var(--p-bg)",
    color: "var(--p-text)",
    borderColor: "var(--p-border)",
  } as CSSProperties;

  const items = useMemo(() => {
    let list = REGISTRY.filter((s) => filter === "All" || s.group === filter);
    if (preview) list = list.filter((s) => PREVIEW_IDS.has(s.id));
    return list;
  }, [filter, preview]);

  const shownGroups = GROUPS.filter((g) => items.some((s) => s.group === g));

  return (
    <div className="flex flex-col gap-4">
      {/* Controls — app chrome, sit outside the themed surface */}
      <div className="flex flex-wrap items-center gap-2">
        {!lockedSlug ? (
          <select
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            aria-label="Palette"
            className="rounded-pill border border-border bg-surface px-3 py-1.5 text-sm text-text outline-none focus-visible:border-text"
          >
            {palettes.map((p) => (
              <option key={p.slug} value={p.slug}>
                {p.name}
              </option>
            ))}
          </select>
        ) : null}
        <Segmented
          value={surface}
          onChange={setSurface}
          options={[
            ["light", "Light"],
            ["dark", "Dark"],
          ]}
        />
        <Segmented
          value={density}
          onChange={setDensity}
          options={[
            ["comfortable", "Comfortable"],
            ["compact", "Compact"],
          ]}
        />
        <div className="flex flex-wrap gap-1">
          {(["All", ...GROUPS] as Filter[]).map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setFilter(g)}
              className={clsx(
                "rounded-pill border px-3 py-1 text-sm transition-colors",
                filter === g
                  ? "border-text bg-text text-canvas"
                  : "border-border text-text-soft hover:border-text hover:text-text",
              )}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* Themed surface — one assignment re-themes every specimen */}
      <div
        data-showroom
        data-density={density}
        style={style}
        className="rounded-card border p-5 sm:p-7"
      >
        {shownGroups.map((group) => (
          <section key={group} className="mb-10 last:mb-0">
            <h3
              className="mb-4 font-display text-lg"
              style={{ color: "var(--p-text)" }}
            >
              {group}
            </h3>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {items
                .filter((s) => s.group === group)
                .map((s) => (
                  <SpecimenCard key={s.id} title={s.title} span={s.span}>
                    {s.render()}
                  </SpecimenCard>
                ))}
            </div>
          </section>
        ))}

        {preview ? (
          <div
            className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-control border p-4 text-sm"
            style={{ borderColor: "var(--p-border)", color: "var(--p-text-soft)" }}
          >
            <span>This is a preview. The full Showroom — every specimen and screen — is a Pro feature.</span>
            <Link
              href="/pricing"
              className="rounded-pill px-4 py-1.5 text-sm font-medium"
              style={{ backgroundColor: "var(--p-primary)", color: "var(--p-on-primary)" }}
            >
              Go Pro
            </Link>
          </div>
        ) : null}
      </div>
    </div>
  );
}
