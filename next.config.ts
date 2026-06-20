import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

// PostHog (analytics) and Sentry (errors) are the only third-party browser
// origins. Stripe checkout/portal are full-page redirects (no embed), and
// next/font self-hosts fonts, so no extra font/frame origins are needed.
const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "img-src 'self' data: https:",
  "font-src 'self'",
  // Tailwind/Next inject inline styles; SVGs use style attributes.
  "style-src 'self' 'unsafe-inline'",
  // Next's bootstrap + the PostHog init snippet are inline; PostHog loads
  // array.js from *.posthog.com. (Kept report-only until verified in the
  // browser — promote to an enforced `Content-Security-Policy` then.)
  "script-src 'self' 'unsafe-inline' https://*.posthog.com",
  "connect-src 'self' https://*.posthog.com https://*.ingest.sentry.io https://*.ingest.us.sentry.io",
  "worker-src 'self' blob:",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
  // Report-only: observe violations without breaking anything. Once the report
  // stream is clean in production, rename to "Content-Security-Policy".
  { key: "Content-Security-Policy-Report-Only", value: csp },
];

const nextConfig: NextConfig = {
  allowedDevOrigins: ["172.20.10.*", "192.168.1.*"],
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

// Only wrap with Sentry when a DSN is configured, so builds without Sentry
// (e.g. CI, local) skip all Sentry build steps entirely.
const sentryEnabled = Boolean(
  process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,
);

export default sentryEnabled
  ? withSentryConfig(nextConfig, {
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      // Source-map upload needs an auth token. Without it, upload is skipped
      // (errors still report — stack traces are just minified), so this never
      // breaks a build that lacks the token.
      authToken: process.env.SENTRY_AUTH_TOKEN,
      silent: !process.env.CI,
      widenClientFileUpload: true,
    })
  : nextConfig;
