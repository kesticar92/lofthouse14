import * as Sentry from "@sentry/nextjs";

import { defaultSentryTracesSampleRate } from "@/lib/sentry-config";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: defaultSentryTracesSampleRate,
    integrations: [Sentry.browserTracingIntegration()],
  });
}
