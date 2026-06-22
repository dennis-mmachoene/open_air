# Accessibility

*Accessibility is the product, not a feature — how Open Air guarantees it in the app and helps you ship it.*

## Purpose

Describe both halves of accessibility in Open Air: the **app's own** accessibility, and the **tools** that help users ship accessible color.

## Overview

Open Air treats accessible color as a first-class guarantee. The catalog is **AA-gated by construction**, the Studio includes contrast, color-vision-deficiency (CVD), gamut, and linting tools, and the application UI itself is built for keyboard and screen-reader users.

## Detailed explanation

### The app's accessibility

- **Focus** — a global `:focus-visible` ring with offset; the mobile drawer implements a full focus-trap, `Escape` to close, and focus restoration.
- **Announcements** — actions confirm through a single `aria-live="polite"` toast, so screen-reader users hear "Saved", "Invite sent", etc.
- **Forms** — every field has a visible or visually-hidden label (or `aria-label`).
- **Reduced motion** — a complete `prefers-reduced-motion` reset; feedback motion stays within it.
- **Color** — body and interactive text are ≥14px; chrome (badges, counts) stays smaller by design.

### The color-accessibility tools

| Tool | What it checks |
|---|---|
| **Color linter** (`/studio/lint`) | duplicates, perceptual collisions (OKLab ΔE), AAA text capability, over-saturation, naming |
| **Stress test** (`/studio/stress`) | deuteranopia/protanopia/tritanopia, achromatopsia, low light, glare |
| **Make accessible** (`/studio/accessible`) | repairs any palette to pass WCAG AA |
| **Gamut & print** (`/studio/output`) | P3 headroom + CMYK print preview |
| **Data-viz** (`/studio/dataviz`, `/studio/viz-repair`) | colorblind-safe categorical/sequential/diverging sets |

Contrast uses WCAG 2.1 ratios; perceptual distance uses OKLab via `culori`.

### Code example — contrast gating

```ts
import { bestOn } from "@/lib/color/contrast";
const { color, ratio } = bestOn("#1d4ed8");   // best of black/white
const passesAA = ratio >= 4.5;                // 3:1 for large text
```

## Best practices

- Run the **linter** on any palette before publishing; aim for zero errors.
- Use the **stress test** before shipping a data viz — same-lightness hues collapse under CVD.
- Prefer the role tokens (`--p-*`) so the Showroom's AA pairings carry into your UI.

## Notes & common pitfalls

- **AA text is always achievable** with black or white on any color; the linter therefore flags **AAA** capability (the meaningful signal).
- Hover-only affordances are unreachable on touch — provide a non-hover path for important actions.
- Large fills amplify glare from high-chroma colors; the gamut tool flags this.

## Related

- [architecture.md](./architecture.md) · the color engine
- [performance.md](./performance.md) · rendering & responsiveness
- The in-app **Accessibility** policy at `/legal/accessibility`
