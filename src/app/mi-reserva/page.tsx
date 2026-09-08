"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { site } from "@/lib/site";

export default function MiReservaPage() {
  const [code, setCode] = useState("");
  const router = useRouter();

  return (
    <main className="mx-auto min-h-[70vh] max-w-lg px-4 py-16">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
        {site.name}
      </p>
      <h1 className="mt-2 font-display text-4xl tracking-tight">Mi reserva</h1>
      <p className="mt-3 text-sm text-zinc-600">
        Ingresa el código (ej. LH-XXXXXX) para ver el estado de tu reserva.
      </p>
      <form
        className="mt-8 flex flex-col gap-3 sm:flex-row"
        onSubmit={(e) => {
          e.preventDefault();
          const c = code.trim().toUpperCase();
          if (!c) return;
          router.push(`/confirmacion/${encodeURIComponent(c)}`);
        }}
      >
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="LH-XXXXXX"
          className="flex-1 rounded-full border border-zinc-300 bg-white px-4 py-2.5 text-sm dark:border-zinc-600 dark:bg-zinc-900"
        />
        <button
          type="submit"
          className="rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white dark:bg-white dark:text-zinc-900"
        >
          Buscar
        </button>
      </form>
      <Link href="/" className="mt-8 inline-block text-sm text-zinc-500 underline">
        Volver
      </Link>
    </main>
  );
}
