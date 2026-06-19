import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy Policy" };
export const revalidate = 86400;

export default function PrivacyPage() {
  return (
    <article className="mx-auto w-full max-w-2xl px-5 py-16 sm:px-8">
      <h1 className="font-display text-4xl text-text">Privacy Policy</h1>
      <div className="mt-6 flex flex-col gap-4 text-text-soft">
        <p>
          We collect the minimum needed to run Open Air: your email and name from
          sign-in, the palettes you save and create, and basic product analytics.
          Payment details are handled entirely by Stripe — we only store customer
          and subscription identifiers.
        </p>
        <p>
          We use your data to provide the service and improve it. We do not sell
          your personal data. Analytics are used in aggregate to understand usage.
        </p>
        <p>
          You can <strong>export</strong> all your data or <strong>delete</strong>{" "}
          your account at any time from the Account page (GDPR / POPIA). Deleting
          your account removes your saved palettes, collections, generated
          palettes and API keys.
        </p>
        <p className="text-sm text-text-muted">
          This is a concise summary intended as a starting point and not legal advice.
        </p>
      </div>
    </article>
  );
}
