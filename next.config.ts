import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["172.20.10.*", "192.168.1.*"],
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
      disableLogger: true,
    })
  : nextConfig;
