"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Strata } from "@/components/palette/Strata";
import type { UseCaseData } from "@/lib/onboarding";

const MAX_PICKS = 5;

export function OnboardingFlow({
  name,
  useCases,
}: {
  name: string | null;
  useCases: UseCaseData[];
}) {
  const router = useRouter();
  const [step, setStep] = useState<0 | 1>(0);
  const [useCaseId, setUseCaseId] = useState<string | null>(null);
  const [picks, setPicks] = useState<string[]>([]);
  const [pending, startTransition] = useTransition();

  const useCase = useMemo(
    () => useCases.find((u) => u.id === useCaseId) ?? null,
    [useCases, useCaseId],
  );

  const firstName = name?.trim().split(/\s+/)[0] ?? null;

  function choose(id: string) {
    setUseCaseId(id);
    setPicks([]);
    setStep(1);
  }

  function togglePick(slug: string) {
    setPicks((prev) => {
      if (prev.includes(slug)) return prev.filter((s) => s !== slug);
      if (prev.length >= MAX_PICKS) return prev;
      return [...prev, slug];
    });
  }

  function finish(slugs: string[]) {
    startTransition(async () => {
      try {
        await fetch("/api/onboarding/complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slugs }),
        });
      } catch {
        /* even if seeding fails, don't trap the user here */
      }
      router.replace("/dashboard");
      router.refresh();
    });
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col px-5 py-12 sm:px-8 sm:py-16">
      {/* Progress */}
      <div className="flex items-center gap-3">
        <span className="text-xs font-medium uppercase tracking-[0.2em] text-text-muted">
          Step {step + 1} of 2
        </span>
        <div className="flex flex-1 gap-1.5">
          {[0, 1].map((i) => (
            <span
              key={i}
              className={`h-1 flex-1 rounded-pill transition-colors ${
                i <= step ? "bg-text" : "bg-border"
              }`}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={() => finish([])}
          disabled={pending}
          className="text-sm text-text-muted underline-offset-4 transition-colors hover:text-text disabled:opacity-50"
        >
          Skip
        </button>
      </div>

      {step === 0 ? (
        <section className="mt-10 flex flex-col gap-8">
          <header className="flex flex-col gap-2">
            <h1 className="font-display text-4xl text-text sm:text-5xl">
              Welcome{firstName ? `, ${firstName}` : ""}.
            </h1>
            <p className="max-w-xl text-lg text-text-soft">
              What are you working on? We&apos;ll line up palettes that tend to
              suit it — you can explore everything afterwards.
            </p>
          </header>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {useCases.map((uc) => (
              <button
                key={uc.id}
                type="button"
                onClick={() => choose(uc.id)}
                className="group flex flex-col gap-3 rounded-card border border-border bg-surface p-4 text-left transition-colors hover:border-text"
              >
                <Strata
                  hexes={(uc.palettes[0]?.hexes ?? []).slice(0, 6)}
                  className="h-14"
                />
                <div>
                  <p className="font-display text-lg text-text">{uc.label}</p>
                  <p className="text-sm text-text-soft">{uc.blurb}</p>
                </div>
              </button>
            ))}
          </div>
        </section>
      ) : (
        <section className="mt-10 flex flex-col gap-8">
          <header className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => setStep(0)}
              className="self-start text-sm text-text-muted underline-offset-4 transition-colors hover:text-text"
            >
              ← Different focus
            </button>
            <h1 className="font-display text-4xl text-text sm:text-5xl">
              Picks for {useCase?.label.toLowerCase()}.
            </h1>
            <p className="max-w-xl text-lg text-text-soft">
              Tap a few to seed your dashboard — they&apos;ll be saved and dropped
              into a starter collection. Pick up to {MAX_PICKS}.
            </p>
          </header>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(useCase?.palettes ?? []).map((p) => {
              const selected = picks.includes(p.slug);
              const atLimit = !selected && picks.length >= MAX_PICKS;
              return (
                <button
                  key={p.slug}
                  type="button"
                  onClick={() => togglePick(p.slug)}
                  aria-pressed={selected}
                  disabled={atLimit}
                  className={`flex flex-col gap-3 rounded-card border bg-surface p-3 text-left transition-all ${
                    selected
                      ? "border-text ring-2 ring-text"
                      : "border-border hover:border-text"
                  } ${atLimit ? "cursor-not-allowed opacity-40" : ""}`}
                >
                  <Strata hexes={p.hexes} className="h-24" />
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-display text-text">{p.name}</p>
                      <p className="truncate text-xs text-text-muted">{p.tagline}</p>
                    </div>
                    <span
                      className={`mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-pill border text-[11px] ${
                        selected
                          ? "border-text bg-text text-canvas"
                          : "border-border-strong text-transparent"
                      }`}
                      aria-hidden="true"
                    >
                      ✓
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => finish(picks)}
              disabled={pending}
              className="rounded-pill bg-text px-6 py-2.5 text-sm font-medium text-canvas transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {pending
                ? "Setting up…"
                : picks.length > 0
                  ? `Save ${picks.length} & go to dashboard`
                  : "Go to dashboard"}
            </button>
            <span className="text-sm text-text-muted">
              {picks.length}/{MAX_PICKS} selected
            </span>
          </div>
        </section>
      )}
    </div>
  );
}
