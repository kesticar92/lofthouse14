-- Tarifas de cotización en app_settings (sustituye localStorage pricing.config)

insert into public.app_settings (key, value)
values (
  'cotizaciones_pricing',
  jsonb_build_object(
    'tarifaLJ', 80000,
    'tarifaVD', 100000,
    'recargoHuesped', 30000,
    'aseoCorta', 30000,
    'aseoMedia', 60000,
    'aseoSemanal', 30000,
    'descuentoSemanal', 0.2,
    'descuentoMensual', 0.4
  )
)
on conflict (key) do nothing;
