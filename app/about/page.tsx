import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "About",
  description: `The mission, values, and vision behind ${site.name} — a living gallery of accessible color.`,
};
export const revalidate = 86400;

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-display text-2xl text-text">{title}</h2>
      <div className="flex flex-col gap-4 text-lg leading-relaxed text-text-soft">{children}</div>
    </section>
  );
}

export default function AboutPage() {
  return (
    <article className="mx-auto flex w-full max-w-2xl flex-col gap-12 px-5 py-20 sm:px-8">
      <header className="flex flex-col gap-4">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-text-muted">About</p>
        <h1 className="font-display text-4xl font-medium leading-tight tracking-tight text-text sm:text-5xl">
          {site.name}
        </h1>
        <p className="text-xl leading-relaxed text-text-soft">
          A living gallery of color — a museum of palettes you can put to work,
          built on a simple conviction: color should be beautiful, explainable,
          and accessible by default.
        </p>
      </header>

      <Section title="Our mission">
        <p>
          {site.name} exists to help designers, developers, and creatives find
          color they can actually ship — and understand <em>why</em> it works.
          We turn color from guesswork into a system: curated, explained, tested
          for contrast, and ready to dress real interfaces.
        </p>
      </Section>

      <Section title="The problem we solve">
        <p>
          Most color tools stop at a swatch. They hand you five pretty hex codes
          and leave the hard parts to you: Will this text be readable? Does this
          pairing meet accessibility requirements? How will it look across an
          actual product — buttons, forms, charts, empty states? Teams end up
          shipping palettes that look good in a row of squares and fail the
          moment they meet real UI.
        </p>
        <p>
          {site.name} closes that gap. Every palette is gated against WCAG AA
          contrast, explained in plain language, and previewed live across a
          complete component library in the Showroom — so what you choose is
          what you can confidently build.
        </p>
      </Section>

      <Section title="What you can do here">
        <p>
          Browse a curated <strong>Gallery</strong> of hand-tuned OKLCH palettes,
          filterable by mood, industry, family, style, and season. Open any
          palette to see its ramp, harmony, contrast pairings, and the reasoning
          behind it. Step into the <strong>Showroom</strong> and watch a single
          palette re-theme an entire UI — primitives, components, data
          visualization, and full screens — in real time.
        </p>
        <p>
          In the <strong>Studio</strong>, generate palettes instantly, extract a
          palette from any image (right in your browser), build gradients, and
          repair any palette to meet AA contrast while keeping its character.
          Save what you love, organize it into collections, and export to CSS,
          Tailwind, SCSS, JSON, Figma tokens, SVG, PNG, or ASE.
        </p>
      </Section>

      <Section title="What we value">
        <p>
          <strong>Honesty.</strong> We market what we have built and price it
          fairly. The whole gallery is free to browse; you pay only for the
          professional workflow.
        </p>
        <p>
          <strong>Craft.</strong> A quiet, neutral interface so every saturated
          pixel belongs to a palette. Details matter, from the contrast math to
          the copy.
        </p>
        <p>
          <strong>Accessibility as a default,</strong> not an add-on — for the
          color we publish and for our own interface.
        </p>
      </Section>

      <Section title="Security & privacy">
        <p>
          We collect the minimum we need to run accounts and billing, and we do
          not sell your data. Sign-in is passwordless, permissions are enforced
          on the server, payment data is handled by Stripe, and the images you
          analyze in the extraction tool never leave your device. Read the{" "}
          <Link href="/legal/privacy" className="text-text underline underline-offset-4">
            Privacy Policy
          </Link>{" "}
          and{" "}
          <Link href="/legal/data-processing" className="text-text underline underline-offset-4">
            Data Processing &amp; Security Statement
          </Link>{" "}
          for the details.
        </p>
      </Section>

      <Section title="How we build">
        <p>
          {site.name} is engineered to be fast, reliable, and maintainable: a
          statically rendered catalog that loads instantly, color computed in
          your browser, server-authoritative billing, automated tests on the
          paths that matter, and a green continuous-integration pipeline. We
          favor doing fewer things well over doing many things halfway.
        </p>
      </Section>

      <Section title="Where we're going">
        <p>
          Our vision is to become the accessible color layer that design systems
          and brands route through. On the roadmap, at a high level: full tonal
          scales documented for contrast, richer search, an API with proper docs
          and a usage dashboard, deeper data-visualization palettes, and — as
          demand grows — shared brand kits and team workspaces so groups can
          standardize on a single, provably accessible system.
        </p>
      </Section>

      <Section title="Support">
        <p>
          We believe support should be direct and human. Questions, feedback,
          and accessibility reports go straight to a real person and get a real
          reply. Reach us any time at{" "}
          <a
            href={`mailto:${site.email}`}
            className="text-text underline underline-offset-4"
          >
            {site.email}
          </a>
          .
        </p>
      </Section>

      <Section title="Why trust Open Air">
        <p>
          Because the promise is verifiable. Accessibility isn&apos;t a marketing
          line here — it&apos;s enforced in the catalog and protected by tests. The
          pricing is transparent, the data practices are documented, and the
          product does what it says. You can browse the entire gallery and reach
          the value before deciding to pay.
        </p>
      </Section>

      <hr className="border-border" />

      <footer className="flex flex-col gap-4 text-text-soft">
        <p>
          Questions or feedback? Reach {site.name} at{" "}
          <a
            href={`mailto:${site.email}`}
            className="font-medium text-text underline-offset-4 hover:underline"
          >
            {site.email}
          </a>
          .
        </p>
        <p className="text-sm text-text-muted">
          <Link href="/" className="underline-offset-4 hover:underline">
            ← Back to the gallery
          </Link>
          <span className="mx-2">·</span>
          <Link href="/legal" className="underline-offset-4 hover:underline">
            Policies &amp; terms
          </Link>
        </p>
      </footer>
    </article>
  );
}
