"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { login, isAuthed } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthed()) router.replace("/admin");
  }, [router]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = login(user, pass);
      if (result === "bad_credentials") {
        setError("Usuario o contraseña incorrectos.");
        return;
      }
      if (result === "storage_error") {
        setError(
          "No se pudo guardar la sesión en este navegador. Prueba sin modo privado/incógnito, permite almacenamiento local para este sitio o usa otro navegador.",
        );
        return;
      }
      // Navegación completa: evita quedarse en “Ingresando…” cuando el router del cliente no termina la transición.
      window.location.assign("/admin");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f2f0eb] text-zinc-900 dark:bg-[#141210] dark:text-zinc-100">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[length:40px_40px] bg-grid-fade opacity-[0.25] dark:bg-grid-fade-dark dark:opacity-10" />
      <div className="pointer-events-none absolute -left-24 top-40 -z-10 h-80 w-80 rounded-full bg-amber-300/30 blur-3xl dark:bg-amber-500/10" />
      <div className="pointer-events-none absolute -right-24 bottom-20 -z-10 h-96 w-96 rounded-full bg-orange-200/30 blur-3xl dark:bg-orange-500/10" />

      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-5 py-12">
        <Link href="/" className="mb-8 flex flex-col items-center gap-2">
          <Image
            src="/logo-lofthouse.png"
            alt="LOFTHOUSE 14"
            width={160}
            height={56}
            className="h-14 w-auto"
            priority
          />
          <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-amber-900 dark:text-amber-400">
            Panel administrador
          </span>
        </Link>

        <div className="w-full rounded-3xl border border-black/10 bg-white/75 p-7 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.25)] backdrop-blur-xl dark:border-white/10 dark:bg-zinc-900/70">
          <h1 className="text-xl font-semibold">Iniciar sesión</h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
            Ingresa con tu usuario para gestionar cotizaciones, inventario y
            aseos del día.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <label className="block">
              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
                Usuario
              </span>
              <input
                type="text"
                autoComplete="username"
                required
                value={user}
                onChange={(e) => setUser(e.target.value)}
                className="w-full rounded-xl border border-black/10 bg-white/80 px-4 py-3 text-sm outline-none ring-amber-800/25 focus:ring-2 dark:border-white/10 dark:bg-zinc-900/70"
                placeholder="admin"
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

          <p className="mt-6 text-xs text-zinc-500 dark:text-zinc-400">
            ¿Olvidaste los datos? Contacta al administrador del sitio.{" "}
            <Link href="/" className="underline hover:text-amber-800">
              Volver a la página principal
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
