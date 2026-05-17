import { describe, expect, it } from "vitest";

import { isSupabaseAuthUnreachable } from "./auth-errors";

describe("isSupabaseAuthUnreachable", () => {
  it("detecta AuthRetryableFetchError", () => {
    expect(
      isSupabaseAuthUnreachable({ name: "AuthRetryableFetchError", message: "x" }),
    ).toBe(true);
  });

  it("detecta fetch failed y ENOTFOUND en mensaje o causa", () => {
    expect(
      isSupabaseAuthUnreachable({
        name: "TypeError",
        message: "fetch failed",
        cause: new Error("getaddrinfo ENOTFOUND x.supabase.co"),
      }),
    ).toBe(true);
  });

  it("no marca errores de credenciales típicos", () => {
    expect(
      isSupabaseAuthUnreachable({
        message: "Invalid login credentials",
      }),
    ).toBe(false);
  });
});
