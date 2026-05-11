"use client";

import { useEffect, useState, useCallback } from "react";
import { AdminShell, AdminCard } from "@/components/admin/admin-shell";
import { fetchAdminSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

type UserProfile = {
  id: string;
  email: string;
  full_name: string;
  role: "super_admin" | "admin" | "staff";
  status: "pending" | "active" | "suspended";
  allowed_modules: string[];
  created_at: string;
};

const ALL_MODULES = [
  { key: "cotizaciones", label: "Cotizaciones" },
  { key: "inventario", label: "Inventario" },
  { key: "reservas", label: "Reservas" },
  { key: "gastos", label: "Gastos" },
  { key: "aseos", label: "Aseos del día" },
];

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: "Pendiente", color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300" },
  active: { label: "Activo", color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300" },
  suspended: { label: "Suspendido", color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300" },
};

const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  staff: "Staff",
};

export default function UsuariosPage() {
  const router = useRouter();
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [editUser, setEditUser] = useState<UserProfile | null>(null);
  const [editModules, setEditModules] = useState<string[]>([]);
  const [editRole, setEditRole] = useState<string>("");
  const [editStatus, setEditStatus] = useState<string>("");
  /** Por defecto «Pendientes»: es donde llegan las solicitudes de /admin/registro. */
  const [filter, setFilter] = useState<"all" | "pending" | "active" | "suspended">("pending");

  useEffect(() => {
    fetchAdminSession().then((s) => {
      if (!s) { router.replace("/admin/login"); return; }
      if (s.role !== "super_admin" && s.role !== "admin") {
        router.replace("/admin");
        return;
      }
      setIsSuperAdmin(s.role === "super_admin");
      setIsAdmin(s.role === "admin");
    });
  }, [router]);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/users");
    if (res.ok) {
      const json = await res.json() as { users: UserProfile[] };
      setUsers(json.users);
    }
    setLoading(false);
  }, []);

  useEffect(() => { void loadUsers(); }, [loadUsers]);

  async function patchUser(id: string, patch: Partial<UserProfile>) {
    setSaving(id);
    await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...patch }),
    });
    setSaving(null);
    await loadUsers();
  }

  function openEdit(u: UserProfile) {
    setEditUser(u);
    setEditModules(u.allowed_modules ?? []);
    setEditRole(u.role);
    setEditStatus(u.status);
  }

  async function saveEdit() {
    if (!editUser) return;
    await patchUser(editUser.id, {
      role: editRole as UserProfile["role"],
      status: editStatus as UserProfile["status"],
      allowed_modules: editModules,
    });
    setEditUser(null);
  }

  function toggleModule(key: string) {
    setEditModules((prev) =>
      prev.includes(key) ? prev.filter((m) => m !== key) : [...prev, key]
    );
  }

  const filtered = users.filter((u) => filter === "all" || u.status === filter);
  const pendingCount = users.filter((u) => u.status === "pending").length;

  return (
    <AdminShell>
      <AdminCard
        title="Gestión de usuarios"
        subtitle="Aprueba nuevas cuentas, asigna roles y módulos por usuario"
        actions={
          <div className="flex gap-2">
            {(["all", "pending", "active", "suspended"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide transition ${
                  filter === f
                    ? "bg-zinc-900 text-white dark:bg-[#f2f0eb] dark:text-zinc-900"
                    : "border border-black/10 text-zinc-600 hover:bg-black/5 dark:border-white/10 dark:text-zinc-300"
                }`}
              >
                {f === "all" ? "Todos" : f === "pending" ? `Pendientes ${pendingCount > 0 ? `(${pendingCount})` : ""}` : f === "active" ? "Activos" : "Suspendidos"}
              </button>
            ))}
          </div>
        }
      >
        {loading ? (
          <p className="py-8 text-center text-sm text-zinc-500">Cargando usuarios…</p>
        ) : filtered.length === 0 ? (
          <p className="py-8 text-center text-sm text-zinc-500">No hay usuarios en esta categoría.</p>
        ) : (
          <div className="space-y-3">
            {filtered.map((u) => {
              const statusInfo = STATUS_LABELS[u.status] ?? STATUS_LABELS.pending;
              return (
                <div
                  key={u.id}
                  className="flex flex-col gap-3 rounded-xl border border-black/8 bg-white/60 p-4 dark:border-white/8 dark:bg-zinc-900/40 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                        {u.full_name || "Sin nombre"}
                      </p>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${statusInfo.color}`}>
                        {statusInfo.label}
                      </span>
                      <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                        {ROLE_LABELS[u.role] ?? u.role}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">{u.email}</p>
                    {u.allowed_modules?.length > 0 && (
                      <p className="text-xs text-zinc-400">
                        Módulos: {u.allowed_modules.map((m) => ALL_MODULES.find((x) => x.key === m)?.label ?? m).join(", ")}
                      </p>
                    )}
                    {u.status === "pending" && (
                      <p className="text-xs text-amber-700 dark:text-amber-400">
                        Esperando aprobación · {new Date(u.created_at).toLocaleDateString("es-CO")}
                      </p>
                    )}
                  </div>

                  {isSuperAdmin && (
                    <div className="flex flex-wrap gap-2">
                      {u.status === "pending" && (
                        <button
                          disabled={saving === u.id}
                          onClick={() => patchUser(u.id, { status: "active" })}
                          className="rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                        >
                          Aprobar
                        </button>
                      )}
                      {u.status === "active" && (
                        <button
                          disabled={saving === u.id}
                          onClick={() => patchUser(u.id, { status: "suspended" })}
                          className="rounded-full bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-500/20 disabled:opacity-50 dark:text-red-400"
                        >
                          Suspender
                        </button>
                      )}
                      {u.status === "suspended" && (
                        <button
                          disabled={saving === u.id}
                          onClick={() => patchUser(u.id, { status: "active" })}
                          className="rounded-full bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-500/20 disabled:opacity-50 dark:text-emerald-400"
                        >
                          Reactivar
                        </button>
                      )}
                      <button
                        onClick={() => openEdit(u)}
                        className="rounded-full border border-black/10 px-3 py-1.5 text-xs font-semibold text-zinc-700 transition hover:bg-black/5 dark:border-white/10 dark:text-zinc-200"
                      >
                        Editar permisos
                      </button>
                    </div>
                  )}

                  {isAdmin && !isSuperAdmin && (
                    <span className="text-xs text-zinc-400">Solo visualización</span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </AdminCard>

      {/* Modal de edición */}
      {editUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-black/10 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-zinc-900">
            <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
              Editar usuario
            </h3>
            <p className="mt-0.5 text-sm text-zinc-500">{editUser.email}</p>

            <div className="mt-5 space-y-4">
              {/* Estado */}
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                  Estado
                </label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm dark:border-white/10 dark:bg-zinc-800"
                >
                  <option value="pending">Pendiente</option>
                  <option value="active">Activo</option>
                  <option value="suspended">Suspendido</option>
                </select>
              </div>

              {/* Rol */}
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                  Rol
                </label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                  className="w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm dark:border-white/10 dark:bg-zinc-800"
                >
                  <option value="staff">Staff</option>
                  <option value="admin">Admin</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>

              {/* Módulos (solo para staff) */}
              {editRole === "staff" && (
                <div>
                  <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                    Módulos permitidos
                  </label>
                  <div className="space-y-2">
                    {ALL_MODULES.map((m) => (
                      <label key={m.key} className="flex cursor-pointer items-center gap-3 rounded-lg border border-black/8 px-3 py-2 hover:bg-black/3 dark:border-white/8">
                        <input
                          type="checkbox"
                          checked={editModules.includes(m.key)}
                          onChange={() => toggleModule(m.key)}
                          className="h-4 w-4 rounded accent-amber-800"
                        />
                        <span className="text-sm text-zinc-700 dark:text-zinc-200">{m.label}</span>
                      </label>
                    ))}
                  </div>
                  <p className="mt-1.5 text-[11px] text-zinc-400">
                    Admin y Super Admin tienen acceso a todos los módulos automáticamente.
                  </p>
                </div>
              )}
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setEditUser(null)}
                className="flex-1 rounded-full border border-black/10 py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-black/5 dark:border-white/10 dark:text-zinc-200"
              >
                Cancelar
              </button>
              <button
                onClick={saveEdit}
                disabled={saving === editUser.id}
                className="flex-1 rounded-full bg-zinc-900 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-60 dark:bg-[#f2f0eb] dark:text-zinc-900"
              >
                {saving === editUser.id ? "Guardando…" : "Guardar cambios"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
