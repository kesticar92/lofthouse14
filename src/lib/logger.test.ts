import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { logger } from "./logger";

describe("logger", () => {
  let logSpy: ReturnType<typeof vi.spyOn>;
  let warnSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    logSpy.mockRestore();
    warnSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it("info usa console.log", () => {
    logger.info({ msg: "hello" });
    expect(logSpy).toHaveBeenCalledTimes(1);
  });

  it("warn usa console.warn", () => {
    logger.warn({ msg: "ojo" });
    expect(warnSpy).toHaveBeenCalledTimes(1);
  });

  it("error usa console.error", () => {
    logger.error({ msg: "kaboom" });
    expect(errorSpy).toHaveBeenCalledTimes(1);
  });

  it("child(ctx) acumula contexto", () => {
    const child = logger.child({ module: "pms", reqId: "abc" });
    child.info({ msg: "synced", n: 3 });
    expect(logSpy).toHaveBeenCalledTimes(1);
    const arg = String(logSpy.mock.calls[0]?.[0] ?? "");
    expect(arg).toContain("synced");
    expect(arg).toContain("pms");
  });

  it("child(child) puede anidar contextos", () => {
    const a = logger.child({ module: "x" });
    const b = a.child({ reqId: "r1" });
    b.info({ msg: "ok" });
    expect(logSpy).toHaveBeenCalledTimes(1);
  });
});
