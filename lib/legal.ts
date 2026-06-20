import "server-only";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { marked } from "marked";

export interface LegalDoc {
  slug: string;
  title: string;
  summary: string;
}

/** Canonical order shown on the /legal index and used for static params. */
export const LEGAL_DOCS: LegalDoc[] = [
  { slug: "terms", title: "Terms & Conditions", summary: "The agreement governing your use of Open Air." },
  { slug: "privacy", title: "Privacy Policy", summary: "What personal information we collect, why, and your rights." },
  { slug: "cookies", title: "Cookie Policy", summary: "The cookies and local storage we use and how to control them." },
  { slug: "billing", title: "Subscription & Billing Terms", summary: "Plans, pricing, renewals, and how billing works." },
  { slug: "refunds", title: "Refund & Cancellation Policy", summary: "How to cancel and when refunds apply." },
  { slug: "acceptable-use", title: "Acceptable Use Policy", summary: "What you may and may not do on the Service." },
  { slug: "community", title: "Community & Content Guidelines", summary: "Standards for the content you create and store." },
  { slug: "ai", title: "AI Usage & Disclaimer", summary: "How the AI color assistant works and its limits." },
  { slug: "ip", title: "Copyright & Intellectual Property Policy", summary: "Who owns what, and how you may use it." },
  { slug: "dmca", title: "Copyright Infringement (DMCA) Policy", summary: "How to report infringing content and our process." },
  { slug: "data-processing", title: "Data Processing & Security Statement", summary: "How we process and protect data, and our sub-processors." },
  { slug: "accessibility", title: "Accessibility Statement", summary: "Our commitment to WCAG and how to report barriers." },
  { slug: "disclaimer", title: "Disclaimer", summary: "Important limitations on the information and tools we provide." },
  { slug: "contact", title: "Contact & Legal Information", summary: "How to reach us for support, privacy, and legal matters." },
];

export function getLegalDoc(slug: string): LegalDoc | null {
  return LEGAL_DOCS.find((d) => d.slug === slug) ?? null;
}

/** Render a legal document's Markdown source to HTML (authored by us; trusted). */
export function renderLegal(slug: string): string {
  const path = join(process.cwd(), "content", "legal", `${slug}.md`);
  const md = readFileSync(path, "utf8");
  return marked.parse(md, { async: false }) as string;
}
