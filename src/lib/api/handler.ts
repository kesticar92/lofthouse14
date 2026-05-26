// =============================================================================
// src/lib/api/handler.ts
// -----------------------------------------------------------------------------
// Wrapper para route handlers que centraliza:
//   - validación de body (zod)
//   - validación de query (zod)
//   - validación de params (zod)
//   - autorización staff (`requireStaff`) opcional
//   - manejo uniforme de errores → ApiResponse
//   - log estructurado en caso de excepción
//
// Uso típico (route handler):
//
//     export const POST = apiHandler({
//       auth: "staff",
//       body: z.object({ amount: z.number().positive() }),
//       handler: async ({ body, ctx, request }) => {
//         const inserted = await ctx.supabase
//           .from("expenses")
//           .insert({ amount: body.amount, ... })
//           .select()
//           .single();
//         return inserted.data;
//       },
//     });
//
// El handler devuelve `data` directamente y `apiHandler` lo envuelve en
// `apiOk(data)`. Si lanza un Error, se loggea y se devuelve apiErr 500.
// Si lanza un `ApiHandlerError`, se respeta su status/code/details.
// =============================================================================

import type { NextRequest } from "next/server";
import type { ZodTypeAny, infer as ZodInfer } from "zod";
import { ZodError } from "zod";

import { apiBadRequest, apiErr, apiOk, apiValidationError } from "./response";
import type { AdminModuleKey } from "./admin-modules";
import {
  enforceStaffModule,
  requireStaff,
  type StaffContext,
} from "./require-staff";
import { logger } from "@/lib/logger";
import { captureException } from "@/lib/monitoring";

export class ApiHandlerError extends Error {
  status: number;
  code?: string;
  details?: unknown;
  constructor(
    message: string,
    init?: { status?: number; code?: string; details?: unknown },
  ) {
    super(message);
    this.name = "ApiHandlerError";
    this.status = init?.status ?? 500;
    this.code = init?.code;
    this.details = init?.details;
  }
}

type AuthMode = "staff" | "none";

type HandlerArgs<TBody, TQuery, TParams, TAuth extends AuthMode> = {
  request: NextRequest;
  body: TBody;
  query: TQuery;
  params: TParams;
  ctx: TAuth extends "staff" ? StaffContext : null;
};

export function apiHandler<
  TBodySchema extends ZodTypeAny | undefined = undefined,
  TQuerySchema extends ZodTypeAny | undefined = undefined,
  TParamsSchema extends ZodTypeAny | undefined = undefined,
  TAuth extends AuthMode = "staff",
  TResult = unknown,
>(opts: {
  auth?: TAuth;
  /** Con `auth: "staff"` (por defecto): comprueba `profiles.allowed_modules`. */
  module?: AdminModuleKey;
  body?: TBodySchema;
  query?: TQuerySchema;
  params?: TParamsSchema;
  handler: (
    args: HandlerArgs<
      TBodySchema extends ZodTypeAny ? ZodInfer<TBodySchema> : unknown,
      TQuerySchema extends ZodTypeAny ? ZodInfer<TQuerySchema> : unknown,
      TParamsSchema extends ZodTypeAny ? ZodInfer<TParamsSchema> : unknown,
      TAuth
    >,
  ) => Promise<TResult> | TResult;
}) {
  const auth: AuthMode = opts.auth ?? "staff";

  return async function routeHandler(
    request: NextRequest,
    routeCtx: { params: Promise<unknown> },
  ): Promise<Response> {
    const startedAt = Date.now();
    const reqId =
      request.headers.get("x-request-id") ??
      Math.random().toString(36).slice(2, 10);
    const log = logger.child({ reqId, path: request.nextUrl.pathname });

    try {
      let ctx: StaffContext | null = null;
      if (auth === "staff") {
        const guard = await requireStaff();
        if (!guard.ok) return guard.response;
        ctx = guard.ctx;
        if (opts.module) {
          const denied = enforceStaffModule(ctx, opts.module);
          if (denied) return denied;
        }
      }

      let body: unknown = undefined;
      if (opts.body) {
        let raw: unknown = {};
        if (
          request.method !== "GET" &&
          request.method !== "HEAD" &&
          request.method !== "DELETE"
        ) {
          const text = await request.text();
          if (text.trim()) {
            try {
              raw = JSON.parse(text) as unknown;
            } catch {
              return apiBadRequest("Body JSON inválido");
            }
          }
        }
        const parsed = opts.body.safeParse(raw);
        if (!parsed.success) {
          return apiValidationError(formatZodError(parsed.error));
        }
        body = parsed.data;
      }

      let query: unknown = undefined;
      if (opts.query) {
        const obj = Object.fromEntries(request.nextUrl.searchParams.entries());
        const parsed = opts.query.safeParse(obj);
        if (!parsed.success) {
          return apiValidationError(formatZodError(parsed.error));
        }
        query = parsed.data;
      }

      let params: unknown = undefined;
      if (opts.params) {
        const rawParams = (await routeCtx.params) ?? {};
        const parsed = opts.params.safeParse(rawParams);
        if (!parsed.success) {
          return apiValidationError(formatZodError(parsed.error));
        }
        params = parsed.data;
      }

      const data = await opts.handler({
        request,
        body: body as never,
        query: query as never,
        params: params as never,
        ctx: ctx as never,
      });

      log.info({ msg: "ok", ms: Date.now() - startedAt });
      return apiOk(data);
    } catch (err) {
      const ms = Date.now() - startedAt;
      if (err instanceof ApiHandlerError) {
        log.warn({
          msg: "handler_error",
          ms,
          status: err.status,
          code: err.code,
          error: err.message,
        });
        return apiErr(err.message, {
          status: err.status,
          code: err.code,
          details: err.details,
        });
      }
      if (err instanceof ZodError) {
        log.warn({ msg: "zod_error", ms, issues: err.issues });
        return apiValidationError(formatZodError(err));
      }
      const message = err instanceof Error ? err.message : "Error interno";
      log.error({
        msg: "uncaught",
        ms,
        error: message,
        stack: err instanceof Error ? err.stack : undefined,
      });
      if (process.env.NODE_ENV === "production") {
        captureException(err instanceof Error ? err : new Error(message), {
          reqId,
          path: request.nextUrl.pathname,
        });
      }
      return apiErr(message, { status: 500, code: "INTERNAL" });
    }
  };
}

function formatZodError(err: ZodError) {
  return err.issues.map((i) => ({
    path: i.path.join("."),
    code: i.code,
    message: i.message,
  }));
}
