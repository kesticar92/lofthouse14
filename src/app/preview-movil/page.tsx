import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Vista móvil — previsualización",
  description:
    "Marco tipo teléfono para ver el panel admin en el navegador integrado de Cursor.",
  robots: { index: false, follow: false },
};

/**
 * Abre esta ruta en Cursor: ⌘⇧P → "Simple Browser: Show" →
 * http://localhost:3000/preview-movil
 * (o ejecuta la tarea "LOFTHOUSE: Simple Browser (vista móvil)" con el dev server en marcha).
 */
export default function PreviewMovilPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-zinc-950 p-6 text-zinc-200">
      <div className="max-w-md text-center text-sm leading-relaxed text-zinc-400">
        <p className="font-semibold text-zinc-100">Vista previa tipo celular</p>
        <p className="mt-2">
          En Cursor:{" "}
          <kbd className="rounded border border-zinc-600 bg-zinc-900 px-1.5 py-0.5 text-xs text-zinc-200">
            ⌘⇧P
          </kbd>{" "}
          → escribe{" "}
          <span className="whitespace-nowrap text-amber-200/90">
            Simple Browser: Show
          </span>{" "}
          → pega la misma URL que ves en la barra de direcciones (puerto 3000).
        </p>
        <p className="mt-2 text-xs text-zinc-500">
          El marco fija ~390×844 px; dentro va el panel real (misma sesión que
          localhost).
        </p>
      </div>

      <div
        className="rounded-[2.75rem] border-[12px] border-zinc-800 bg-zinc-900 p-1 shadow-[0_25px_80px_-12px_rgba(0,0,0,0.85)] ring-1 ring-white/10"
        aria-label="Simulación de pantalla de teléfono"
      >
        <iframe
          title="Panel administrador — vista móvil"
          src="/admin/login"
          className="block h-[844px] w-[390px] max-w-[calc(100vw-2rem)] rounded-[2rem] bg-[#f2f0eb] sm:max-w-none"
        />
      </div>
    </div>
  );
}
