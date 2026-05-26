"use client";

/**
 * Capa de servicio: tarifas de cotización (Supabase app_settings).
 * Sustituye localStorage para datos operativos compartidos entre dispositivos.
 */

import { apiClient } from "@/lib/api/client";
import type { PricingConfig } from "@/lib/pricing";

export async function fetchCotizacionesPricing(): Promise<PricingConfig> {
  const res = await apiClient<{ pricing: PricingConfig }>(
    "/api/admin/app-settings/cotizaciones-pricing",
  );
  return res.pricing;
}

export async function saveCotizacionesPricing(
  patch: Partial<PricingConfig>,
): Promise<PricingConfig> {
  const res = await apiClient<{ pricing: PricingConfig }>(
    "/api/admin/app-settings/cotizaciones-pricing",
    {
      method: "PATCH",
      body: JSON.stringify(patch),
    },
  );
  return res.pricing;
}
