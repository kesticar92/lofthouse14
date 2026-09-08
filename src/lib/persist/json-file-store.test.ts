import { describe, expect, it, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  clearJsonFile,
  durableStoreEnabled,
  loadJsonFile,
  saveJsonFile,
} from "./json-file-store";

describe("json-file-store", () => {
  let dir: string;
  const prevDir = process.env.LH_DATA_DIR;
  const prevFlag = process.env.LH_DURABLE_STORE;

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), "lh-data-"));
    process.env.LH_DATA_DIR = dir;
    process.env.LH_DURABLE_STORE = "1";
  });

  afterEach(() => {
    if (prevDir === undefined) delete process.env.LH_DATA_DIR;
    else process.env.LH_DATA_DIR = prevDir;
    if (prevFlag === undefined) delete process.env.LH_DURABLE_STORE;
    else process.env.LH_DURABLE_STORE = prevFlag;
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it("habilita durable con LH_DURABLE_STORE=1", () => {
    expect(durableStoreEnabled()).toBe(true);
  });

  it("persiste y lee JSON", () => {
    saveJsonFile("demo", { hello: "world", n: 1 });
    expect(loadJsonFile<{ hello: string; n: number }>("demo")).toEqual({
      hello: "world",
      n: 1,
    });
    clearJsonFile("demo");
    expect(loadJsonFile("demo")).toBeNull();
  });
});
