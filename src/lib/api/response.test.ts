import { describe, expect, it } from "vitest";

import {
  apiBadRequest,
  apiErr,
  apiForbidden,
  apiNotFound,
  apiOk,
  apiRateLimited,
  apiUnauthorized,
  apiValidationError,
} from "./response";

async function readJson<T>(res: Response): Promise<T> {
  return (await res.json()) as T;
}

describe("apiOk", () => {
  it("envuelve el data en { ok: true, data } con status 200 por defecto", async () => {
    const res = apiOk({ id: 1, name: "lofthouse" });
    expect(res.status).toBe(200);
    expect(await readJson(res)).toEqual({
      ok: true,
      data: { id: 1, name: "lofthouse" },
    });
  });

  it("respeta el status pasado en init", async () => {
    const res = apiOk({ created: true }, { status: 201 });
    expect(res.status).toBe(201);
  });
});

describe("apiErr y helpers", () => {
  it("apiErr aplica status, code y details", async () => {
    const res = apiErr("boom", {
      status: 418,
      code: "TEAPOT",
      details: { x: 1 },
    });
    expect(res.status).toBe(418);
    expect(await readJson(res)).toEqual({
      ok: false,
      error: { message: "boom", code: "TEAPOT", details: { x: 1 } },
    });
  });

  it("apiUnauthorized → 401 con UNAUTHORIZED", async () => {
    const res = apiUnauthorized();
    expect(res.status).toBe(401);
    const body = await readJson<{ ok: boolean; error: { code: string } }>(res);
    expect(body.error.code).toBe("UNAUTHORIZED");
  });

  it("apiForbidden → 403 con FORBIDDEN", async () => {
    const res = apiForbidden();
    expect(res.status).toBe(403);
  });

  it("apiNotFound → 404 con mensaje personalizado", async () => {
    const res = apiNotFound("Cotización");
    expect(res.status).toBe(404);
    const body = await readJson<{ ok: boolean; error: { message: string } }>(
      res,
    );
    expect(body.error.message).toBe("Cotización no encontrado");
  });

  it("apiBadRequest acepta details opcionales", async () => {
    const res = apiBadRequest("falta id", { field: "id" });
    expect(res.status).toBe(400);
    const body = await readJson<{ ok: boolean; error: { details: unknown } }>(
      res,
    );
    expect(body.error.details).toEqual({ field: "id" });
  });

  it("apiValidationError → 422 con VALIDATION_ERROR y details", async () => {
    const res = apiValidationError([{ path: "amount", message: "requerido" }]);
    expect(res.status).toBe(422);
    const body = await readJson<{ ok: boolean; error: { code: string } }>(res);
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });

  it("apiRateLimited incluye retry_after_sec", async () => {
    const res = apiRateLimited(60);
    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBe("60");
    const body = await readJson<{
      ok: boolean;
      error: { details: { retry_after_sec: number } };
    }>(res);
    expect(body.error.details.retry_after_sec).toBe(60);
  });
});
