"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { GuestBottomNav } from "@/components/guest/guest-bottom-nav";
import { site } from "@/lib/site";

type Msg = {
  id: string;
  role: "guest" | "staff" | "system";
  body: string;
  created_at: string;
};

type Thread = {
  reservation_code: string;
  guest_name: string;
  messages: Msg[];
};

export default function MensajesPage() {
  const [code, setCode] = useState("");
  const [thread, setThread] = useState<Thread | null>(null);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (raw: string) => {
    const c = raw.trim().toUpperCase();
    if (!c) {
      setError("Escribe tu código de reserva");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/public/messages/${encodeURIComponent(c)}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((data as { error?: string }).error ?? `Error ${res.status}`);
        setThread(null);
        return;
      }
      setThread((data as { thread: Thread }).thread);
      setCode(c);
    } catch {
      setError("Error de red");
    } finally {
      setLoading(false);
    }
  }, []);

  async function send() {
    if (!thread || !text.trim()) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/public/messages/${encodeURIComponent(thread.reservation_code)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ body: text }),
        },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((data as { error?: string }).error ?? `Error ${res.status}`);
        return;
      }
      setThread((data as { thread: Thread }).thread);
      setText("");
    } catch {
      setError("No se pudo enviar");
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <main className="mx-auto min-h-[70vh] max-w-lg px-4 py-16 pb-28 md:pb-16">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
          {site.name}
        </p>
        <h1 className="mt-2 font-display text-4xl tracking-tight text-zinc-900 dark:text-zinc-100">
          Mensajes
        </h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Centro de mensajes stub por código de reserva (sin WhatsApp Cloud).
        </p>

        <form
          className="mt-8 flex flex-wrap gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            void load(code);
          }}
        >
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="LH-XXXXXX"
            className="min-w-[10rem] flex-1 rounded-xl border border-zinc-300 bg-white px-3 py-2.5 font-mono text-sm dark:border-zinc-600 dark:bg-zinc-900"
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded-full bg-zinc-900 px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-white disabled:opacity-50 dark:bg-white dark:text-zinc-900"
          >
            {loading ? "…" : "Abrir"}
          </button>
        </form>

        {error ? (
          <p className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-800 dark:text-red-100">
            {error}
          </p>
        ) : null}

        {thread ? (
          <div className="mt-8 space-y-4">
            <p className="text-xs text-zinc-500">
              Thread {thread.reservation_code} · {thread.guest_name}
            </p>
            <ul className="max-h-[50vh] space-y-3 overflow-y-auto rounded-2xl border border-zinc-200 bg-white/70 p-4 dark:border-zinc-700 dark:bg-zinc-900/50">
              {thread.messages.map((m) => (
                <li
                  key={m.id}
                  className={
                    m.role === "guest"
                      ? "ml-6 rounded-xl bg-amber-900/10 px-3 py-2 text-sm"
                      : m.role === "staff"
                        ? "mr-6 rounded-xl bg-zinc-900/5 px-3 py-2 text-sm dark:bg-white/5"
                        : "rounded-lg border border-dashed border-zinc-300 px-3 py-2 text-xs text-zinc-500 dark:border-zinc-600"
                  }
                >
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                    {m.role}
                  </span>
                  <p className="mt-0.5 whitespace-pre-wrap text-zinc-800 dark:text-zinc-100">
                    {m.body}
                  </p>
                </li>
              ))}
            </ul>
            <div className="flex gap-2">
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Escribe un mensaje…"
                className="flex-1 rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm dark:border-zinc-600 dark:bg-zinc-900"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    void send();
                  }
                }}
              />
              <button
                type="button"
                disabled={sending || !text.trim()}
                onClick={() => void send()}
                className="rounded-full bg-amber-900 px-4 py-2.5 text-xs font-semibold text-white disabled:opacity-50 dark:bg-amber-500 dark:text-zinc-950"
              >
                Enviar
              </button>
            </div>
          </div>
        ) : null}

        <p className="mt-10 text-sm">
          <Link href="/mi-reserva" className="font-semibold underline">
            Volver a mi reserva
          </Link>
        </p>
      </main>
      <GuestBottomNav />
    </>
  );
}
