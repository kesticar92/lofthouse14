# Estado de cumplimiento — Auditoría SEO Lofthouse 14

Fecha de revisión: 2026-09-05. Base: plan de 42 acciones del informe.

## Hecho en código (este repo)

| # | Acción | Estado |
|---|--------|--------|
| 1 | H1 con keyword en hero | Hecho |
| 2 | Meta description + precio + CTA | Hecho |
| 3 | GTM/GA4/Pixel/Clarity (vía env) | Hecho (GA4 por defecto; GTM/Pixel/Clarity con `.env`) |
| 4 | `lang="es-CO"` | Hecho |
| 5 | `robots.txt` Allow + sitemap | Hecho |
| 6 | `sitemap.xml` | Hecho (incluye lofts, blog, landings, salsa) |
| 8 | Open Graph + Twitter | Hecho |
| 9 | Canonical | Hecho |
| 10 | `llms.txt` / `llms-full.txt` | Hecho |
| 13 | Schema LodgingBusiness + AggregateRating | Hecho |
| 14 | Barra reservas fechas/huéspedes (home) | Hecho (configurador complejo solo en `/reservas`, inicia en fechas) |
| 15–17 | Galería, precio y badge reseñas en hero | Hecho |
| 18 | Alt text en galería/hero/avatares | Hecho / mejorado |
| 20 | WebP en galería principal | Parcial (immersive aún JPG) |
| 21 | H2 semánticos home | Hecho |
| 22 | FAQ + FAQPage | Hecho |
| 23 | NAP en footer + schema | Hecho |
| 24 | Eventos GA4 (WhatsApp, begin_checkout, view_item, scroll, purchase helper) | Hecho |
| 25–27 | Páginas por loft + HotelRoom + copy 150+ | Hecho |
| 28 | `/ubicacion-miraflores-cali` | Hecho |
| 29 | `/resenas` indexable + Review | Hecho |
| 31 | `/en` + hreflang | Hecho (landing EN ampliada) |
| 32 / 35 | Blog (4 artículos) | Hecho |
| 34 | Clarity (env) | Hecho (requiere `NEXT_PUBLIC_CLARITY_ID`) |
| 36 | Landings grupos / nómadas / médico / **salsa** | Hecho |
| 38 | Consent Mode v2 + banner | Hecho |
| 40 | BreadcrumbList + WebSite SearchAction | Hecho |
| — | Home liviana (límite reseñas, sin avatares remotos) | Hecho (corrige HTML ~8MB) |

## Parcial

| # | Acción | Nota |
|---|--------|------|
| 19 | Renombrar archivos de imagen | Alts con keywords listos; nombres físicos immersive aún genéricos |
| 20 | AVIF/WebP total | Parte de assets sigue en JPG |
| 30 | Core Web Vitals | Optimizaciones on-page; medir en PSI en producción |
| 31 | Sitio EN completo | Landing `/en` sólida, no 1:1 de todas las páginas |

## Fuera de código (manual / cuentas)

Estas **no se pueden cerrar solo con el repo**:

| # | Acción |
|---|--------|
| 7 | Enviar sitemap en Google Search Console |
| 11 | Completar Google Business Profile al 100% |
| 12 | Responder reseñas de Google |
| 33 | Alta TripAdvisor / Colombia.travel / Procolombia |
| 37 | Backlinks en blogs de viajes |
| 39 | Campañas retargeting Meta Ads |
| 41 | Google Ads + conversion tracking (IDs de conversión) |
| 42 | Optimizar con datos reales de GSC |

## Cómo correr en local

```bash
npm ci
cp .env.example .env.local   # opcional: GTM, Pixel, Clarity
npm run dev                  # http://127.0.0.1:3001
```
