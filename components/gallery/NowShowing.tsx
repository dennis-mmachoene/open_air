"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Palette } from "@/lib/palettes/types";
import { Strata } from "@/components/palette/Strata";

/** Full-bleed featured palette that advances on a slow wipe (honors reduced motion). */
export function NowShowing({ palettes }: { palettes: Palette[] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (palettes.length <= 1) return;
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    const id = setInterval(
      () => setIndex((i) => (i + 1) % palettes.length),
      6000,
    );
    return () => clearInterval(id);
  }, [palettes.length]);

  const current = palettes[index];
  if (!current) return null;

  return (
    <section className="relative overflow-hidden">
      <div className="relative h-[58vh] min-h-[420px] w-full">
        {palettes.map((p, i) => (
          <div
            key={p.slug}
            className="absolute inset-0 transition-opacity ease-standard duration-1000"
            style={{ opacity: i === index ? 1 : 0 }}
            aria-hidden={i !== index}
          >
            <Strata
              hexes={p.swatches.map((s) => s.hex)}
              rounded={false}
              className="h-full w-full"
            />
          </div>
        ))}

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />

        <div className="absolute inset-x-0 bottom-0 mx-auto flex w-full max-w-7xl flex-col gap-3 px-5 pb-10 sm:px-8">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-white/80">
            Now showing
          </p>
          <Link href={`/p/${current.slug}`} className="group max-w-2xl">
            <h2 className="font-display text-4xl text-white drop-shadow-sm sm:text-6xl">
              {current.name}
            </h2>
            <p className="mt-2 max-w-xl text-sm text-white/85 sm:text-base">
              {current.story}
            </p>
          </Link>
          <div className="mt-2 flex items-center gap-2">
            {palettes.map((p, i) => (
              <button
                key={p.slug}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Show ${p.name}`}
                aria-current={i === index}
                className="h-1.5 rounded-pill transition-all ease-standard"
                style={{
                  width: i === index ? 28 : 10,
                  backgroundColor:
                    i === index ? "#fff" : "rgba(255,255,255,0.5)",
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
