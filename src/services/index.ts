/**
 * Capa de servicios (cliente → API → Supabase).
 *
 * - `src/app/`          Rutas y páginas (público, admin, API)
 * - `src/lib/`          Utilidades, Supabase server/client, dominio compartido
 * - `src/features/`     Módulos UI + hooks + API client por dominio
 * - `src/services/`     Facades delgados para persistencia remota
 * - `src/components/`   UI reutilizable
 * - `src/hooks/`        Hooks transversales (auth, permisos)
 * - `src/types/`        Tipos generados (Supabase)
 */

export {
  fetchCotizacionesPricing,
  saveCotizacionesPricing,
} from "./cotizaciones-pricing";
