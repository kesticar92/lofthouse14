/** Excluye integraciones que arrastran @prisma/instrumentation (no usamos Prisma). */
export function sentryIntegrationsWithoutPrisma<T extends { name: string }>(
  integrations: T[],
): T[] {
  return integrations.filter((i) => i.name !== "Prisma");
}

export const defaultSentryTracesSampleRate = Number(
  process.env.SENTRY_TRACES_SAMPLE_RATE ?? "0.05",
);
