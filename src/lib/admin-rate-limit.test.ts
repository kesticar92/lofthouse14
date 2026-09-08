import { afterEach, describe, expect, it } from "vitest";
import {
  __resetRateLimitBucketsForTests,
  allowAdminApiRequest,
  allowPublicApiRequest,
  allowRequest,
  adminApiClientKey,
  publicApiClientKey,
} from "./admin-rate-limit";

afterEach(() => {
  __resetRateLimitBucketsForTests();
  delete process.env.ADMIN_API_RATE_LIMIT_PER_MINUTE;
  delete process.env.PUBLIC_API_RATE_LIMIT_PER_MINUTE;
});

describe("allowRequest", () => {
  it("permite hasta max y luego bloquea", () => {
    expect(allowRequest("t:1", 2)).toBe(true);
    expect(allowRequest("t:1", 2)).toBe(true);
    expect(allowRequest("t:1", 2)).toBe(false);
  });

  it("aisla buckets por clave", () => {
    expect(allowRequest("a", 1)).toBe(true);
    expect(allowRequest("a", 1)).toBe(false);
    expect(allowRequest("b", 1)).toBe(true);
  });
});

describe("admin / public wrappers", () => {
  it("respeta env de admin", () => {
    process.env.ADMIN_API_RATE_LIMIT_PER_MINUTE = "1";
    expect(allowAdminApiRequest("admin:1.1.1.1")).toBe(true);
    expect(allowAdminApiRequest("admin:1.1.1.1")).toBe(false);
  });

  it("respeta env de public", () => {
    process.env.PUBLIC_API_RATE_LIMIT_PER_MINUTE = "1";
    expect(allowPublicApiRequest("public:2.2.2.2")).toBe(true);
    expect(allowPublicApiRequest("public:2.2.2.2")).toBe(false);
  });
});

describe("client keys", () => {
  it("extrae IP de x-forwarded-for", () => {
    const headers = new Headers({ "x-forwarded-for": "10.0.0.9, 10.0.0.1" });
    expect(adminApiClientKey({ headers })).toBe("admin:10.0.0.9");
    expect(publicApiClientKey({ headers })).toBe("public:10.0.0.9");
  });
});
