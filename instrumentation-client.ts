import * as Sentry from "@sentry/nextjs";

/**
 * Client-side Sentry init (Next.js loads this automatically). No-op until a
 * public DSN is provided.
 */
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN),
  tracesSampleRate: 1.0,
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
