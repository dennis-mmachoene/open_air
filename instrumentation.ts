import * as Sentry from "@sentry/nextjs";

/**
 * Next.js instrumentation hook. Loads the Sentry config matching the runtime.
 * Initialization is a no-op unless SENTRY_DSN is set (see sentry.*.config.ts),
 * so this is safe to ship before Sentry is wired up.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

export const onRequestError = Sentry.captureRequestError;
