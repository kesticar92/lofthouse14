import { describe, expect, it, beforeEach, afterEach } from "vitest";
import {
  checkCsrfOrigin,
  csrfAllowedOrigins,
  pathNeedsCsrf,
} from "./csrf";

describe("csrf Origin/Referer", () => {
  const prevStrict = process.env.CSRF_STRICT;
  const prevCheck = process.env.CSRF_ORIGIN_CHECK;
  const prevAllowed = process.env.CSRF_ALLOWED_ORIGINS;

  beforeEach(() => {
    delete process.env.CSRF_STRICT;
    delete process.env.CSRF_ORIGIN_CHECK;
    process.env.CSRF_ALLOWED_ORIGINS = "https://lofthouse14.com";
  });

  afterEach(() => {
    if (prevStrict === undefined) delete process.env.CSRF_STRICT;
    else process.env.CSRF_STRICT = prevStrict;
    if (prevCheck === undefined) delete process.env.CSRF_ORIGIN_CHECK;
    else process.env.CSRF_ORIGIN_CHECK = prevCheck;
    if (prevAllowed === undefined) delete process.env.CSRF_ALLOWED_ORIGINS;
    else process.env.CSRF_ALLOWED_ORIGINS = prevAllowed;
  });

  it("pathNeedsCsrf cubre admin y booking", () => {
    expect(pathNeedsCsrf("/api/admin/folio")).toBe(true);
    expect(pathNeedsCsrf("/api/public/booking")).toBe(true);
    expect(pathNeedsCsrf("/api/public/fx")).toBe(false);
  });

  it("permite Origin en allowlist", () => {
    const req = new Request("http://127.0.0.1:43127/api/public/booking", {
      method: "POST",
      headers: { Origin: "https://lofthouse14.com" },
    });
    expect(checkCsrfOrigin(req).ok).toBe(true);
  });

  it("rechaza Origin ajeno", () => {
    const req = new Request("http://127.0.0.1:43127/api/admin/x", {
      method: "POST",
      headers: { Origin: "https://evil.example" },
    });
    const r = checkCsrfOrigin(req);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe("CSRF");
  });

  it("acepta Referer válido sin Origin", () => {
    const req = new Request("http://127.0.0.1:43127/api/public/booking", {
      method: "POST",
      headers: { Referer: "https://lofthouse14.com/reservar" },
    });
    expect(checkCsrfOrigin(req).ok).toBe(true);
  });

  it("GET no exige Origin", () => {
    const req = new Request("http://127.0.0.1:43127/api/admin/x", {
      method: "GET",
      headers: { Origin: "https://evil.example" },
    });
    expect(checkCsrfOrigin(req).ok).toBe(true);
  });

  it("CSRF_STRICT rechaza sin headers", () => {
    process.env.CSRF_STRICT = "1";
    const req = new Request("http://127.0.0.1:43127/api/public/booking", {
      method: "POST",
    });
    expect(checkCsrfOrigin(req).ok).toBe(false);
  });

  it("permite trycloudflare preview tunnels", () => {
    const req = new Request("http://127.0.0.1:43127/api/public/booking", {
      method: "POST",
      headers: { Origin: "https://abc-def.trycloudflare.com" },
    });
    expect(checkCsrfOrigin(req).ok).toBe(true);
  });

  it("incluye localhost en defaults", () => {
    const origins = csrfAllowedOrigins();
    expect(origins.some((o) => o.includes("127.0.0.1"))).toBe(true);
  });
});
