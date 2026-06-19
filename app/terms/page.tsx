import type { Metadata } from "next";

export const metadata: Metadata = { title: "Terms of Service" };
export const revalidate = 86400;

export default function TermsPage() {
  return (
    <article className="mx-auto w-full max-w-2xl px-5 py-16 sm:px-8">
      <h1 className="font-display text-4xl text-text">Terms of Service</h1>
      <div className="mt-6 flex flex-col gap-4 text-text-soft">
        <p>
          Welcome to Open Air. By using the service you agree to these terms.
          Open Air provides a gallery of colour palettes and related design
          tools, offered on free and paid plans.
        </p>
        <p>
          You may use exported palettes and assets in your own projects,
          commercial or otherwise. You may not resell access to Open Air itself
          or scrape the catalogue outside of the provided API.
        </p>
        <p>
          Paid plans renew automatically until cancelled. You can cancel any time
          from the billing portal; access continues until the end of the paid
          period. Refunds are handled case by case.
        </p>
        <p>
          The service is provided “as is”, without warranty. Open Air is not
          liable for indirect or consequential damages arising from its use.
        </p>
        <p className="text-sm text-text-muted">
          Questions? Reach out via the links in the footer. This is a concise
          summary intended as a starting point and not legal advice.
        </p>
      </div>
    </article>
  );
}
