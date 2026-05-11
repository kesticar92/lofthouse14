"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { supabasePublicEnv } from "@/lib/supabase/env";

export default function RegistroPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [passConfirm, setPassConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!fullName.trim()) {
      setError("El nombre completo es obligatorio.");
      return;
    }
    if (pass.length < 8) {
      setError("La contraseña debe tener mínimo 8 caracteres.");
      return;
    }
    if (pass !== passConfirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    if (!supabasePublicEnv().ok) {
      setError("Error de configuración del servidor.");
      return;
    }

    setLoading(true);
    try {
      const supabase = getSupabaseBrowser();
      if (!supabase) {
        setError("Error de conexión.");
        return;
      }

      const { error: signUpErr } = await supabase.auth.signUp({
        email: email.trim(),
        password: pass,
        options: {
          data: { full_name: fullName.trim() },
        },
      });

      if (signUpErr) {
        if (signUpErr.message.toLowerCase().includes("already")) {
          setError("Ya existe una cuenta con este correo.");
        } else {
          setError(`Error: ${signUpErr.message}`);
        }
        return;
      }

      setSuccess(true);
    } catch {
      setError("Error de red. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f2f0eb] text-zinc-900 dark:bg-[#141210] dark:text-zinc-100">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[length:40px_40px] bg-grid-fade opacity-[0.25] dark:bg-grid-fade-dark dark:opacity-10" />
      <div className="pointer-events-none absolute -left-24 top-40 -z-10 h-80 w-80 rounded-full bg-amber-300/30 blur-3xl dark:bg-amber-500/10" />

      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-5 py-12">
        <Link href="/admin/login" className="mb-8 flex flex-col items-center gap-2">
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
          {success ? (
            <div className="space-y-4 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                <svg viewBox="0 0 24 24" className="h-7 w-7 text-emerald-600" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m5 12 4 4 10-10" />
                </svg>
              </div>
              <h1 className="text-xl font-semibold">Solicitud enviada</h1>
              <p className="text-sm text-zinc-600 dark:text-zinc-300">
                Tu cuenta fue creada con estado <strong>pendiente de aprobación</strong>.
                Los administradores reciben un aviso en la campana del panel y pueden
                aprobar en <strong>Usuarios → Pendientes</strong>.
              </p>
              <p className="text-xs text-zinc-500">
                No enviamos correo automático: cuando activen tu cuenta podrás iniciar
                sesión con el mismo correo y contraseña que registraste.
              </p>
              <Link
                href="/admin/login"
                className="inline-flex items-center justify-center rounded-full bg-zinc-900 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800 dark:bg-[#f2f0eb] dark:text-zinc-900"
              >
                Volver al login
              </Link>
            </div>
          ) : (
            <>
              <h1 className="text-xl font-semibold">Solicitar acceso al panel</h1>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
                Crea tu cuenta. Un administrador la activará y asignará tus módulos.
              </p>

              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <label className="block">
                  <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
                    Nombre completo
                  </span>
                  <input
                    type="text"
                    autoComplete="name"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full rounded-xl border border-black/10 bg-white/80 px-4 py-3 text-sm outline-none ring-amber-800/25 focus:ring-2 dark:border-white/10 dark:bg-zinc-900/70"
                    placeholder="Tu nombre y apellido"
                  />
                </label>

                <label className="block">
                  <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
                    Correo electrónico
                  </span>
                  <input
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-black/10 bg-white/80 px-4 py-3 text-sm outline-none ring-amber-800/25 focus:ring-2 dark:border-white/10 dark:bg-zinc-900/70"
                    placeholder="tucorreo@ejemplo.com"
                  />
                </label>

                <label className="block">
                  <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
                    Contraseña
                  </span>
                  <div className="flex items-stretch gap-2">
                    <input
                      type={show ? "text" : "password"}
                      autoComplete="new-password"
                      required
                      minLength={8}
                      value={pass}
                      onChange={(e) => setPass(e.target.value)}
                      className="w-full rounded-xl border border-black/10 bg-white/80 px-4 py-3 text-sm outline-none ring-amber-800/25 focus:ring-2 dark:border-white/10 dark:bg-zinc-900/70"
                      placeholder="Mínimo 8 caracteres"
                    />
                    <button
                      type="button"
                      onClick={() => setShow((v) => !v)}
                      className="rounded-xl border border-black/10 bg-white/80 px-3 text-xs font-semibold uppercase tracking-wider text-zinc-600 hover:bg-white dark:border-white/10 dark:bg-zinc-900/70 dark:text-zinc-300"
                    >
                      {show ? "Ocultar" : "Ver"}
                    </button>
                  </div>
                </label>

                <label className="block">
                  <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
                    Confirmar contraseña
                  </span>
                  <input
                    type={show ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    value={passConfirm}
                    onChange={(e) => setPassConfirm(e.target.value)}
                    className="w-full rounded-xl border border-black/10 bg-white/80 px-4 py-3 text-sm outline-none ring-amber-800/25 focus:ring-2 dark:border-white/10 dark:bg-zinc-900/70"
                    placeholder="Repite la contraseña"
                  />
                </label>

                {error && (
                  <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-300">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-full bg-zinc-900 px-4 py-3 text-sm font-semibold uppercase tracking-wider text-white shadow-lg transition hover:bg-zinc-800 disabled:opacity-60 dark:bg-[#f2f0eb] dark:text-zinc-900 dark:hover:bg-white"
                >
                  {loading ? "Creando cuenta…" : "Solicitar acceso"}
                </button>
              </form>

              <p className="mt-5 text-xs text-zinc-500 dark:text-zinc-400">
                ¿Ya tienes cuenta?{" "}
                <Link href="/admin/login" className="font-semibold text-amber-800 underline hover:text-amber-900 dark:text-amber-400">
                  Iniciar sesión
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
