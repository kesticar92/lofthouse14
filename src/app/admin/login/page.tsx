"use client";

import { useState, useEffect, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { fetchAdminSession, loginAdmin } from "@/lib/auth-client";
import { KEYS, safeRemove } from "@/lib/storage";
import { supabasePublicEnv } from "@/lib/supabase/env";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const q = searchParams.get("error");
    if (q === "no_profile") {
      setError(
        "Tu cuenta no tiene perfil de staff válido. Contacta al administrador.",
      );
    } else if (q === "supabase_unreachable") {
      setError(
        "No pudimos conectar con Supabase (red, DNS o URL incorrecta). Comprueba tu internet y NEXT_PUBLIC_SUPABASE_URL en .env.local.",
      );
    } else if (q === "no_access") {
      setError("No tienes acceso al panel con esta cuenta.");
    } else if (q === "pending_approval") {
      setError(
        "Tu cuenta está pendiente de aprobación. Un administrador debe activar tu acceso y asignarte los módulos correspondientes.",
      );
    } else if (q === "suspended") {
      setError("Tu cuenta ha sido suspendida. Contacta al administrador.");
    }
  }, [searchParams]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const session = await fetchAdminSession();
      if (!cancelled && session) router.replace("/admin");
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (!supabasePublicEnv().ok) {
        setError(
          "Supabase no está configurado: añade NEXT_PUBLIC_SUPABASE_URL y la clave pública en .env.local.",
        );
        return;
      }
      const result = await loginAdmin(email, pass);
      if (result === "bad_credentials") {
        setError("Correo o contraseña incorrectos.");
        return;
      }
      if (result === "no_profile") {
        setError(
          "Tu usuario no tiene un rol válido. Contacta al administrador.",
        );
        return;
      }
      if (result === "pending_approval") {
        setError(
          "Tu cuenta está pendiente de aprobación por un administrador.",
        );
        return;
      }
      if (result === "suspended") {
        setError("Tu cuenta ha sido suspendida. Contacta al administrador.");
        return;
      }
      if (result === "network") {
        setError(
          "No hay conexión con el servidor. Revisa tu red e intenta de nuevo.",
        );
        return;
      }
      if (result === "server") {
        setError(
          "Error de servidor. Abre DevTools (F12) → Consola para ver el error exacto de Supabase.",
        );
        return;
      }
      safeRemove(KEYS.auth);
      window.location.assign("/admin");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-5 py-12">
      <Link href="/" className="mb-8 flex flex-col items-center gap-2">
        <Image
          src="/logo-lofthouse.png"
          alt="LOFTHOUSE 14"
          width={160}
          height={56}
          className="h-14 w-auto"
          style={{ width: "auto" }}
          priority
        />
        <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-amber-900 dark:text-amber-400">
          Panel administrador
        </span>
      </Link>

      <div className="w-full rounded-3xl border border-black/10 bg-white/75 p-7 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.25)] backdrop-blur-xl dark:border-white/10 dark:bg-zinc-900/70">
        <h1 className="text-xl font-semibold">Iniciar sesión</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
          Accede con el correo y contraseña del staff (Supabase Auth).
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block">
            <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
              Correo
            </span>
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-black/10 bg-white/80 px-4 py-3 text-sm outline-none ring-amber-800/25 focus:ring-2 dark:border-white/10 dark:bg-zinc-900/70"
              placeholder="staff@ejemplo.com"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
              Contraseña
            </span>
            <div className="flex items-stretch gap-2">
              <input
                type={show ? "text" : "password"}
                autoComplete="current-password"
                required
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                className="w-full rounded-xl border border-black/10 bg-white/80 px-4 py-3 text-sm outline-none ring-amber-800/25 focus:ring-2 dark:border-white/10 dark:bg-zinc-900/70"
                placeholder="••••••••"
              />
              <button
                type="button"
                aria-label={show ? "Ocultar contraseña" : "Mostrar contraseña"}
                onClick={() => setShow((v) => !v)}
                className="rounded-xl border border-black/10 bg-white/80 px-3 text-xs font-semibold uppercase tracking-wider text-zinc-600 hover:bg-white dark:border-white/10 dark:bg-zinc-900/70 dark:text-zinc-300"
              >
                {show ? "Ocultar" : "Ver"}
              </button>
            </div>
          </label>

          {error && (
            <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-300">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-zinc-900 px-4 py-3 text-sm font-semibold uppercase tracking-wider text-white shadow-lg shadow-zinc-900/20 transition hover:bg-zinc-800 disabled:opacity-60 dark:bg-[#f2f0eb] dark:text-zinc-900 dark:hover:bg-white"
          >
            {loading ? "Ingresando…" : "Entrar al panel"}
          </button>
        </form>

        <div className="mt-6 space-y-2 text-xs text-zinc-500 dark:text-zinc-400">
          <p>
            ¿Eres nuevo en el equipo?{" "}
            <Link
              href="/admin/registro"
              className="font-semibold text-amber-800 underline hover:text-amber-900 dark:text-amber-400"
            >
              Solicitar acceso
            </Link>
          </p>
          <p>
            <Link href="/" className="underline hover:text-amber-800">
              Volver a la página principal
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f2f0eb] text-zinc-900 dark:bg-[#141210] dark:text-zinc-100">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[length:40px_40px] bg-grid-fade opacity-[0.25] dark:bg-grid-fade-dark dark:opacity-10" />
      <div className="pointer-events-none absolute -left-24 top-40 -z-10 h-80 w-80 rounded-full bg-amber-300/30 blur-3xl dark:bg-amber-500/10" />
      <div className="pointer-events-none absolute -right-24 bottom-20 -z-10 h-96 w-96 rounded-full bg-orange-200/30 blur-3xl dark:bg-orange-500/10" />

      <Suspense
        fallback={
          <div className="flex min-h-screen items-center justify-center text-sm text-zinc-500">
            Cargando…
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </div>
  );
}
