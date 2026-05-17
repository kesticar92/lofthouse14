// =============================================================================
// src/lib/logger.ts
// -----------------------------------------------------------------------------
// Logger estructurado mínimo, sin dependencias externas.
//
// - En desarrollo: salida legible con colores.
// - En producción / en servidor: JSON line por evento (parseable por Datadog,
//   Loki, Sentry breadcrumbs, etc.).
// - Permite construir loggers "hijos" con contexto adicional fijo (`reqId`,
//   `userId`, `module`).
//
// Uso:
//   import { logger } from "@/lib/logger";
//   logger.info({ msg: "expense.created", expenseId, amount });
//   logger.error({ msg: "ical.sync_failed", error: e.message });
//
//   const log = logger.child({ module: "pms", reqId });
//   log.warn({ msg: "stale_cache" });
//
// Sentry captura errores no controlados vía SDK (`instrumentation` +
// `sentry.*.config`). Para errores explícitos usa `captureException` desde
// `@/lib/monitoring`.
// =============================================================================

type LogLevel = "debug" | "info" | "warn" | "error";

type LogPayload = {
  msg?: string;
  [key: string]: unknown;
};

type LoggerContext = Record<string, unknown>;

const isProd = process.env.NODE_ENV === "production";
const isServer = typeof window === "undefined";

const LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

function envLevel(): LogLevel {
  const raw = (process.env.LOG_LEVEL ?? "").toLowerCase();
  if (raw === "debug" || raw === "info" || raw === "warn" || raw === "error") {
    return raw;
  }
  return isProd ? "info" : "debug";
}

const ACTIVE_LEVEL = envLevel();

function shouldLog(level: LogLevel): boolean {
  return LEVEL_PRIORITY[level] >= LEVEL_PRIORITY[ACTIVE_LEVEL];
}

const COLORS: Record<LogLevel, string> = {
  debug: "\x1b[90m",
  info: "\x1b[36m",
  warn: "\x1b[33m",
  error: "\x1b[31m",
};
const RESET = "\x1b[0m";

function emit(level: LogLevel, ctx: LoggerContext, payload: LogPayload) {
  if (!shouldLog(level)) return;

  const record = {
    ts: new Date().toISOString(),
    level,
    ...ctx,
    ...payload,
  };

  // En servidor producción → JSON line. En cliente o dev → legible.
  if (isServer && isProd) {
    const line = JSON.stringify(record);
    if (level === "error") console.error(line);
    else if (level === "warn") console.warn(line);
    else if (level === "debug") console.debug(line);
    else console.log(line);
    return;
  }

  const color = isServer ? COLORS[level] : "";
  const reset = isServer ? RESET : "";
  const prefix = `${color}[${level.toUpperCase()}]${reset}`;
  const tag = ctx.module ? ` (${ctx.module})` : "";
  const msg = payload.msg ?? "";
  const rest: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(payload)) {
    if (k !== "msg") rest[k] = v;
  }
  for (const [k, v] of Object.entries(ctx)) {
    if (k !== "module") rest[k] = v;
  }
  const restStr = Object.keys(rest).length > 0 ? ` ${JSON.stringify(rest)}` : "";

  if (level === "error") console.error(`${prefix}${tag} ${msg}${restStr}`);
  else if (level === "warn") console.warn(`${prefix}${tag} ${msg}${restStr}`);
  else if (level === "debug") console.debug(`${prefix}${tag} ${msg}${restStr}`);
  else console.log(`${prefix}${tag} ${msg}${restStr}`);
}

export type Logger = {
  debug: (payload: LogPayload) => void;
  info: (payload: LogPayload) => void;
  warn: (payload: LogPayload) => void;
  error: (payload: LogPayload) => void;
  child: (extraCtx: LoggerContext) => Logger;
};

function makeLogger(ctx: LoggerContext = {}): Logger {
  return {
    debug: (p) => emit("debug", ctx, p),
    info: (p) => emit("info", ctx, p),
    warn: (p) => emit("warn", ctx, p),
    error: (p) => emit("error", ctx, p),
    child: (extra) => makeLogger({ ...ctx, ...extra }),
  };
}

export const logger: Logger = makeLogger();
