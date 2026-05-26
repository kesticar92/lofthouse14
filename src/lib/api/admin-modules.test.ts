import { describe, expect, it } from "vitest";

import {
  ADMIN_MODULE_PATHS,
  adminModuleForPath,
  isAdminOnlyAdminPath,
  staffCanAccessAdminPath,
  staffHasModuleAccess,
} from "./admin-modules";

describe("adminModuleForPath", () => {
  it("resuelve módulos por prefijo de ruta", () => {
    expect(adminModuleForPath("/admin/cotizaciones")).toBe("cotizaciones");
    expect(adminModuleForPath("/admin/cotizaciones/extra")).toBe(
      "cotizaciones",
    );
    expect(adminModuleForPath("/admin")).toBeNull();
  });
});

describe("isAdminOnlyAdminPath", () => {
  it("marca usuarios como solo admin", () => {
    expect(isAdminOnlyAdminPath("/admin/usuarios")).toBe(true);
    expect(isAdminOnlyAdminPath("/admin/cotizaciones")).toBe(false);
  });
});

describe("staffHasModuleAccess", () => {
  it("admin tiene todos los módulos", () => {
    expect(
      staffHasModuleAccess(
        { role: "admin", allowed_modules: [] },
        "inventario",
      ),
    ).toBe(true);
  });

  it("staff necesita allowed_modules", () => {
    expect(
      staffHasModuleAccess(
        { role: "staff", allowed_modules: ["gastos"] },
        "gastos",
      ),
    ).toBe(true);
    expect(
      staffHasModuleAccess(
        { role: "staff", allowed_modules: ["gastos"] },
        "reservas",
      ),
    ).toBe(false);
  });
});

describe("staffCanAccessAdminPath", () => {
  it("bloquea staff sin módulo en la ruta", () => {
    expect(
      staffCanAccessAdminPath(
        { role: "staff", allowed_modules: ["cotizaciones"] },
        ADMIN_MODULE_PATHS.reservas,
      ),
    ).toBe(false);
  });

  it("usuarios solo para admin/super_admin", () => {
    expect(
      staffCanAccessAdminPath(
        { role: "staff", allowed_modules: ["usuarios"] },
        ADMIN_MODULE_PATHS.usuarios,
      ),
    ).toBe(false);
    expect(
      staffCanAccessAdminPath(
        { role: "admin", allowed_modules: [] },
        ADMIN_MODULE_PATHS.usuarios,
      ),
    ).toBe(true);
  });
});
