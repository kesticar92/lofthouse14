import * as Sentry from "@sentry/nextjs";

import {
  defaultSentryTracesSampleRate,
  sentryIntegrationsWithoutPrisma,
} from "@/lib/sentry-config";

const dsn = process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: defaultSentryTracesSampleRate,
    integrations: sentryIntegrationsWithoutPrisma,
  });
}
