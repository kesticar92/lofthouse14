"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState, type ReactNode } from "react";

import { ApiClientError } from "@/lib/api/client";

/**
 * Provider de React Query para el panel admin.
 *
 * Configuración por defecto:
 * - `staleTime: 30s` → cache razonable, no machaca el servidor.
 * - `refetchOnWindowFocus: false` → menos sobresaltos en el panel.
 * - `retry`: 1 reintento, salvo errores 4xx que NUNCA se reintentan.
 * - DevTools solo en desarrollo (no llega al bundle de producción).
 */
export function QueryProvider({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            gcTime: 5 * 60_000,
            refetchOnWindowFocus: false,
            retry: (failureCount, error) => {
              if (error instanceof ApiClientError) {
                if (error.status >= 400 && error.status < 500) return false;
              }
              return failureCount < 1;
            },
          },
          mutations: {
            retry: 0,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={client}>
      {children}
      {process.env.NODE_ENV === "development" ? (
        <ReactQueryDevtools
          initialIsOpen={false}
          buttonPosition="bottom-left"
        />
      ) : null}
    </QueryClientProvider>
  );
}
