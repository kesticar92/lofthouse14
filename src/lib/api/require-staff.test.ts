import { describe, expect, it, vi, beforeEach } from "vitest";

import {
  enforceStaffModule,
  requireStaff,
  staffHasModule,
  type StaffProfile,
} from "./require-staff";

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(),
}));

import { createSupabaseServerClient } from "@/lib/supabase/server";

function profile(p: Partial<StaffProfile> & Pick<StaffProfile, "role">): StaffProfile {
  return {
    status: "active",
    allowed_modules: [],
    ...p,
  };
}

describe("staffHasModule", () => {
  it("admin y super_admin tienen todos los módulos", () => {
    expect(staffHasModule(profile({ role: "admin" }), "gastos")).toBe(true);
    expect(staffHasModule(profile({ role: "super_admin" }), "inventario")).toBe(
      true,
    );
  });

  it("staff necesita el módulo en allowed_modules", () => {
    expect(
      staffHasModule(
        profile({ role: "staff", allowed_modules: ["gastos"] }),
        "gastos",
      ),
    ).toBe(true);
    expect(
      staffHasModule(
        profile({ role: "staff", allowed_modules: ["cotizaciones"] }),
        "gastos",
      ),
    ).toBe(false);
  });
});

describe("enforceStaffModule", () => {
  it("devuelve null si hay permiso", () => {
    const ctx = {
      profile: profile({ role: "staff", allowed_modules: ["reservas"] }),
    } as Parameters<typeof enforceStaffModule>[0];
    expect(enforceStaffModule(ctx, "reservas")).toBeNull();
  });

  it("devuelve 403 FORBIDDEN_MODULE si falta el módulo", async () => {
    const ctx = {
      profile: profile({ role: "staff", allowed_modules: [] }),
    } as Parameters<typeof enforceStaffModule>[0];
    const res = enforceStaffModule(ctx, "aseos");
    expect(res).toBeInstanceOf(Response);
    expect(res!.status).toBe(403);
    const body = (await res!.json()) as {
      ok: boolean;
      error: { code?: string; message: string };
    };
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe("FORBIDDEN_MODULE");
  });
});

describe("requireStaff", () => {
  beforeEach(() => {
    vi.mocked(createSupabaseServerClient).mockReset();
  });

  it("401 si no hay usuario", async () => {
    const supabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: null,
        }),
      },
      from: vi.fn(),
    };
    vi.mocked(createSupabaseServerClient).mockResolvedValue(
      supabase as never,
    );
    const out = await requireStaff();
    expect(out.ok).toBe(false);
    if (!out.ok) expect(out.response.status).toBe(401);
  });

  it("403 FORBIDDEN_ACCOUNT_STATUS si el perfil está pending", async () => {
    const maybeSingle = vi.fn().mockResolvedValue({
      data: {
        role: "staff",
        status: "pending",
        allowed_modules: [],
      },
      error: null,
    });
    const eq = vi.fn().mockReturnValue({ maybeSingle });
    const select = vi.fn().mockReturnValue({ eq });
    const from = vi.fn().mockReturnValue({ select });

    const supabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "u1" } },
          error: null,
        }),
      },
      from,
    };
    vi.mocked(createSupabaseServerClient).mockResolvedValue(
      supabase as never,
    );

    const out = await requireStaff();
    expect(out.ok).toBe(false);
    if (!out.ok) {
      expect(out.response.status).toBe(403);
      const body = (await out.response.json()) as {
        error: { code?: string; message: string };
      };
      expect(body.error.code).toBe("FORBIDDEN_ACCOUNT_STATUS");
      expect(body.error.message).toContain("pendiente");
    }
  });

  it("403 FORBIDDEN_ACCOUNT_STATUS si el perfil está suspended", async () => {
    const maybeSingle = vi.fn().mockResolvedValue({
      data: {
        role: "staff",
        status: "suspended",
        allowed_modules: [],
      },
      error: null,
    });
    const eq = vi.fn().mockReturnValue({ maybeSingle });
    const select = vi.fn().mockReturnValue({ eq });
    const from = vi.fn().mockReturnValue({ select });

    const supabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "u1" } },
          error: null,
        }),
      },
      from,
    };
    vi.mocked(createSupabaseServerClient).mockResolvedValue(
      supabase as never,
    );

    const out = await requireStaff();
    expect(out.ok).toBe(false);
    if (!out.ok) {
      const body = (await out.response.json()) as {
        error: { message: string; code?: string };
      };
      expect(body.error.code).toBe("FORBIDDEN_ACCOUNT_STATUS");
      expect(body.error.message).toContain("suspendida");
    }
  });

  it("ok con staff active", async () => {
    const maybeSingle = vi.fn().mockResolvedValue({
      data: {
        role: "staff",
        status: "active",
        allowed_modules: ["gastos"],
      },
      error: null,
    });
    const eq = vi.fn().mockReturnValue({ maybeSingle });
    const select = vi.fn().mockReturnValue({ eq });
    const from = vi.fn().mockReturnValue({ select });

    const supabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "u1" } },
          error: null,
        }),
      },
      from,
    };
    vi.mocked(createSupabaseServerClient).mockResolvedValue(
      supabase as never,
    );

    const out = await requireStaff();
    expect(out.ok).toBe(true);
    if (out.ok) {
      expect(out.ctx.profile.status).toBe("active");
      expect(out.ctx.profile.allowed_modules).toEqual(["gastos"]);
    }
  });
});
