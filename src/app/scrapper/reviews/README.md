# Reseñas en el sitio

Los JSON de esta carpeta se importan en el build de Next.js (`build-testimonials.ts`).
Lo que ve el visitante es **exactamente** lo que hay aquí, sin botón en vivo.

## Archivos

| Archivo | Plataforma |
|---------|------------|
| `reseñas_google.json` | Google Travel / Maps |
| `reseñas_booking.json` | Booking.com |
| `reseñas_airbnb.json` | Airbnb (todos los listings) |
| `airbnb_listings.json` | URLs de lofts (no tocar sin motivo) |

## Actualizar (manual o mensual)

Desde la raíz del proyecto:

```bash
npm run reviews:scrape
```

O:

```bash
cd src/app/scrapper && python3 run_all_reviews.py
```

Requisitos: Python 3.11+, `pip install playwright` y Chrome instalado en el sistema
(los scrapers usan `channel="chrome"` como Booking/Airbnb). Opcional: `.venv` en la raíz
y `playwright install chromium` si no hay Chrome.

Los scrapers **fusionan** reseñas nuevas con las existentes (no borran historial).
Después de un scrape exitoso:

1. **Supabase (recomendado en producción):** `npm run reviews:sync-supabase`  
   (requiere migración `016_guest_reviews` y variables `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`).  
   La web lee `/api/public/reviews` desde la tabla `guest_reviews`; si falla, usa el JSON embebido.

2. **Despliega** el sitio para publicar también los JSON en el bundle (respaldo offline).

El workflow diario de GitHub ejecuta scrape → sync Supabase (si hay secrets) → commit JSON.

## Conteo esperado

Booking y Airbnb suelen traer decenas de reseñas cada uno.
Google Travel en scrape automático puede mostrar pocas en pantalla; el JSON conserva
las fusionadas. Maps a veces carga solo el mapa sin abrir la ficha — el scraper intenta
abrirla por pin o búsqueda. Depuración:

```bash
cd src/app/scrapper
HEADLESS=0 GOOGLE_MAPS_DEBUG_SCREENSHOT=1 .venv/bin/python scrape_google_reviews.py
```

Para ampliar Google más allá del límite público (~10), hace falta Places API o export manual.
