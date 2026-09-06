# Cumplimiento de auditoría SEO — Lofthouse 14

Documento de seguimiento de las **42 acciones** del informe (agosto 2026), aplicado sobre el baseline de producción.

## Implementado en código (esta entrega)

| # | Acción | Estado |
|---|--------|--------|
| 1 | H1 con keyword en hero | Hecho |
| 2 | Meta description + keywords | Hecho |
| 3 | GA4 + Consent Mode + Meta Pixel (env) | Hecho (`NEXT_PUBLIC_META_PIXEL_ID`) |
| 4 | `lang="es-CO"` | Hecho |
| 5 | robots.txt | Hecho |
| 6 | sitemap.xml completo | Hecho |
| 8 | Open Graph / Twitter | Hecho |
| 9 | Canonical + hreflang ES/EN | Hecho |
| 10 | llms.txt | Hecho |
| 13 | Schema LodgingBusiness + AggregateRating | Hecho |
| 14 | Barra sticky de reserva | Hecho |
| 15–17 | Galería temprano, precio y badge reseñas en hero | Hecho |
| 18 | Alt text en galería / lofts | Hecho (alts con keywords locales) |
| 19–20 | Renombrar archivos + WebP | Hecho (`scripts/optimize-gallery-images.mjs`) |
| 21–23 | H2, FAQ schema, NAP en footer | Hecho |
| 24 | Eventos WA / begin_checkout / view_item | Hecho |
| 25–27 | Subpáginas loft + HotelRoom schema | Hecho |
| 28 | Página ubicación | Hecho (`/ubicacion-miraflores-cali`) |
| 29 | Página reseñas + Review schema | Hecho (`/resenas`) |
| 30 | PageSpeed / CWV | Hecho en código + guía `docs/CWV-PAGESPEED.md` (medir en prod) |
| 31 | Versión EN + hreflang | Hecho (`/en`) |
| 32 | Primer artículo(s) de blog | Hecho |
| 34 | Hotjar / Clarity | Hecho vía env + consentimiento (`NEXT_PUBLIC_CLARITY_ID` / `NEXT_PUBLIC_HOTJAR_ID`) |
| 36 | Landings grupos / nómadas / médico / salsa | Hecho |
| 38 | Consent Mode v2 | Hecho |
| 40 | BreadcrumbList + WebSite SearchAction | Hecho |
| 404 personalizado | Hecho |

## Manual / off-site (requiere cuentas humanas)

| # | Acción | Notas |
|---|--------|------|
| 7 | Enviar sitemap en Google Search Console | Tras deploy: `https://www.lofthouse14.com/sitemap.xml` |
| 11–12 | Google Business Profile al 100% + responder reseñas | NAP: Carrera 26 # 2 - 91, Miraflores, Cali · +57 318 158 5801 |
| 33 | TripAdvisor / Colombia.travel / Procolombia | Crear perfiles y citar NAP |
| 35 | Cadencia blog 2/mes | Plantilla lista en `/blog` |
| 37 | Backlinks locales | Outreach manual |
| 39 | Retargeting Meta Ads | Activar con Pixel ID en env |
| 41 | Google Ads conversion | Vincular GA4/GTM en cuenta Ads |
| 42 | Optimización con datos GSC | Tras 2–4 semanas de datos |

## Variables de entorno recomendadas

```bash
NEXT_PUBLIC_SITE_URL=https://www.lofthouse14.com
NEXT_PUBLIC_GA_ID=G-R9M0QWD1H3
NEXT_PUBLIC_META_PIXEL_ID=   # opcional hasta tener Pixel
NEXT_PUBLIC_CLARITY_ID=      # opcional — Microsoft Clarity
NEXT_PUBLIC_HOTJAR_ID=       # opcional — Hotjar site id
```

## Imágenes (#19–20)

```bash
npm run images:optimize
```

Convierte JPG/PNG de `/public/gallery` a WebP, renombra archivos con keywords y actualiza referencias en `src/`.

## Verificación local

```bash
npm run dev    # http://127.0.0.1:3001
npm run typecheck
npm run lint
```
