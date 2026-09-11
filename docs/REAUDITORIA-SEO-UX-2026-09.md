# REAUDITORÍA SEO + UX + CONVERSIÓN — Lofthouse 14

**Fecha:** 2026-09-11  
**URL auditada (producción):** https://www.lofthouse14.com  
**Baseline:** auditoría / plan de 42 acciones (agosto 2026) — `docs/AUDITORIA-CUMPLIMIENTO.md`  
**Método:** inspección HTTP del sitio en vivo + revisión del código del repositorio.  
**PageSpeed API:** ⚠️ NO MEDIDO (cuota Google PSI agotada en este entorno).  
**GSC / GBP / Ahrefs:** ⚠️ NO VERIFICABLE (sin acceso a cuentas).

---

## Hallazgo estructural (crítico)

La producción **no refleja** el estado del código marcado como “Hecho” en agosto.

| Capa | Qué hay |
|------|---------|
| **Producción live** | Build antiguo: SPA con anclas `#`, HTML ~8.3 MB, ~3.7k `<img>`, canonical/OG/`json+ld` con `http://localhost:3000`, WhatsApp `317…`, sin `/lofts`, `/reservar`, `/blog`, `/en`, `/llms.txt` |
| **Código actual (repo)** | Arquitectura nueva: rutas indexables, SEO helpers, landings, blog, `/en`, motor `/reservar`, `llms.txt` |

**Consecuencia:** muchas acciones de agosto están 🟠 **PARCIALMENTE CORREGIDO** (hechas en código, no desplegadas) o 🔴 **PENDIENTE** en lo que Google/el usuario realmente ven.

---

## 1. Metadatos y HEAD (live)

| Elemento | Estado actual (live) | Problema | Recomendación | Prioridad | Estado vs ago |
|----------|----------------------|----------|---------------|-----------|---------------|
| Title | `LOFTHOUSE 14 \| Lofts en Miraflores, Cali` | Keyword débil vs “lofts en Cali / Parque del Perro” | Title del repo con cocina + barrio + marca | 🔴 | 🟠 |
| Meta description | Presente + CTA WhatsApp | OK-ish; precio no siempre visible | Incluir precio desde + CTA directo | 🟡 | 🟢/🟠 |
| Keywords meta | Presente | Bajo valor SEO | Mantener opcional | 🟢 | ⚪ |
| Canonical | `http://localhost:3000` | **Crítico** — señales rotas | Forzar `NEXT_PUBLIC_SITE_URL=https://www.lofthouse14.com` en build + guard anti-localhost | 🔴 | 🔴 NUEVO en prod |
| og:* / twitter:* | Presentes pero image/url → localhost | Compartir social roto | Misma corrección de SITE_URL + OG 1200×630 real | 🔴 | 🔴 |
| og:locale | `es_CO` | OK | — | 🟢 | 🟢 |
| html lang | `es-CO` | OK | — | 🟢 | 🟢 |
| charset / viewport | OK | — | — | 🟢 | 🟢 |
| favicon | `/favicon.ico` | apple-touch / theme-color ausentes en live | Añadir icons + themeColor (hecho en código) | 🟡 | 🟠 |
| geo.* / author | Ausentes / parcial | Menor | geo + author (hecho en código) | 🟡 | 🟠 |
| robots meta | `index,follow` | OK en home | noindex en rutas huésped | 🟡 | 🟠 |
| llms.txt | **404** | IA crawlers sin mapa | Desplegar `/llms.txt` | 🟠 | 🔴 en prod / 🟢 en repo |

---

## 2. Headings (live)

```
H1: Bienvenido a tu rincón en Cali   ← sin keyword principal
├── H2 ×7 (estadía, lofts, reseñas, entorno, FAQ, galería, social)
└── H3 ×124 (cards / lugares / UI)   ← ruido semántico
```

| Check | Live | Repo | Estado |
|-------|------|------|--------|
| 1 H1 | Sí | 1 H1 (desktop); móvil tipografía en `<p>` | 🟠 |
| Keyword en H1 | No | Sí (“Apartaestudios Dúplex… Miraflores”) | 🟠 |
| Jerarquía | H3 excesivos | Mejor, aún densa en cards | 🟠 |

---

## 3. Schema / JSON-LD

**Live:** LodgingBusiness embebido en payload RSC con **URLs localhost**, teléfono distinto al NAP del repo.  
**Repo:** `LodgingBusiness` + `WebSite` + `FAQPage` (solo home tras fix) + `HotelRoom` + `BreadcrumbList` + reviews.

| Tipo | ¿Aporta? | Estado |
|------|----------|--------|
| LodgingBusiness + AggregateRating | Sí | 🟠 (código OK / prod roto) |
| FAQPage global | No (spam risk) | 🟢 corregido en código (solo home) |
| SearchAction a `/lofts?q=` | No (no hay search) | 🟢 eliminado en código |
| HotelRoom por loft | Sí si hay URLs live | 🔴 prod sin páginas loft |

---

## 4. URLs / Sitemap

**Live `sitemap.xml`:** 15 URLs, muchas con **hash** (`/#lofts`, etc.), `lastmod` 2026-08-13, host **sin www**, sin `/reservar` ni lofts.

**Repo:** sitemap limpio con lofts, blog, landings, `/reservar`, `SITE_URL` www.

| Check | Live | Estado |
|-------|------|--------|
| Hashes en sitemap | Sí | 🔴 |
| www vs apex | robots → apex; sitio www | 🔴 |
| Arquitectura deep links | 404 en `/lofts`, `/reservar`, `/blog`, `/en`… | 🔴 |

---

## 5. Robots / crawl

Live `robots.txt`: Allow `/`, Disallow `/admin/`, `/api/`, `/preview-movil/`, Sitemap apex.  
llms.txt 404.  
GSC: ⚠️ NO VERIFICABLE.

---

## 6. Imágenes / CWV

| Señal | Live | Nota |
|-------|------|------|
| HTML size | **~8.3 MB** | Anomalía grave |
| `<img>` | ~3792 | Probable wall/social duplicado |
| alt | parcial; muchos “Airbnb” | Débil |
| LCP/INP/CLS / PSI | ⚠️ NO MEDIDO | — |
| WebP en repo | Sí (galería) | No garantiza en prod |

---

## 7. UX + Hero + reservas (live)

- Hero: mensaje cálido, **sin precio claro above-the-fold**, H1 no transaccional.
- CTA dominante: **WhatsApp** (no “Reservar” en copy).
- `/reservar` **404** → no hay motor self-serve en prod.
- Flujo real: llegar → WhatsApp → fricción alta, no tracking de funnel web completo.
- Repo: hero con precio + CTA `/reservar` + stepper guiado.

**Pasos live estimados a confirmación:** 1 web + N WhatsApp (opaco).  
**Pasos repo:** fechas → huéspedes → extras → WhatsApp/confirmación (medible).

---

## 8. Contenido / keywords

Live home habla Miraflores / Parque del Perro (bien local). Falta profundidad indexable (lofts, blog, landings) en prod.  
Canibalización: baja en prod (casi todo en `/`); riesgo futuro si landings no diferencian intención.

---

## 9. SEO local

| Ítem | Estado |
|------|--------|
| NAP web live | Carrera 26 # 2 - 91 · Miraflores · WA **317…** |
| NAP repo / llms | WA **318 158 5801** |
| Consistencia | 🔴 divergente |
| GBP / reseñas / Q&A | ⚠️ NO VERIFICABLE |

---

## 10. Analytics

Live: GA4 `G-R9M0QWD1H3` presente; Meta Pixel no detectado en HTML estático.  
Repo: Consent Mode v2 + GA4 + Pixel opcional + Clarity/Hotjar por consentimiento; eventos WA/checkout cableados en stepper (fix de esta entrega).  
Purchase: aún sin evento real de pago web.  
GSC/Ads: ⚠️ NO VERIFICABLE.

---

## 11. Off-page

⚠️ NO VERIFICABLE (sin Ahrefs/Semrush). Menciones Airbnb/Booking no auditadas aquí.

---

## 12. Internacionalización

Live `/en` → 404. Repo tiene `/en` + hreflang; `lang` global sigue `es-CO` en layout EN → 🟠.

---

## 13. Seguridad

Headers live: CSP, XFO DENY, nosniff, Referrer-Policy, Permissions-Policy.  
HSTS: no visto en respuesta muestreada → añadido en `next.config` (repo).  
HTTP→HTTPS: 301 OK.  
www/apex: sin redirect canónico unificado en prod.

---

## 14. Conversión directa

| Pregunta | Live | Ideal |
|----------|------|-------|
| ¿Qué vende? | Parcial | Claro |
| ¿Dónde? | Sí | Sí |
| ¿Cuánto? | Débil ATF | Precio en hero |
| ¿Reservar sin chat? | No | `/reservar` |
| ¿Incentivo vs OTA? | Débil | Precio directo + beneficio |

---

## 15. Comparación scores (metodología estable 0–10)

Scores **Antes** = estimación del baseline agosto (problemas listados en las 42 acciones).  
Scores **Ahora (live)** = lo medido hoy en producción.  
**Repo listo** = potencial tras deploy de esta rama.

| Categoría | Antes | Ahora (live) | Δ live | Estado |
|-----------|------:|-------------:|--------|--------|
| Metadatos | 4 | 2 | -2 | 🔴 (localhost) |
| Headings | 3 | 4 | +1 | 🟠 |
| Schema | 3 | 2 | -1 | 🔴 |
| URLs/Sitemap | 3 | 2 | -1 | 🔴 |
| Crawlability | 5 | 4 | -1 | 🟠 |
| Imágenes | 3 | 1 | -2 | 🔴 |
| UX/Reservas | 4 | 3 | -1 | 🔴 |
| Contenido | 4 | 4 | 0 | 🟠 |
| SEO Local | 5 | 4 | -1 | 🟠 NAP |
| Analytics | 3 | 5 | +2 | 🟠 |
| Off-page | 3 | 3 | 0 | ⚠️ |
| CWV | 3 | 1* | -2 | ⚠️/*proxy HTML |
| i18n | 1 | 1 | 0 | 🔴 |
| Seguridad | 6 | 7 | +1 | 🟢/🟠 |

\*CWV no medido con Lighthouse; penalización por peso HTML observado.

### Score general

| | /100 |
|--|-----:|
| SCORE ANTERIOR (ago, estimado) | **42** |
| SCORE ACTUAL LIVE | **34** |
| MEJORA LIVE | **-8** (regresión por deploy roto / no deploy) |
| SCORE REPO (post-fixes, pre-prod) | **72** (si se despliega con env correcta) |

---

## 16. Matriz de hallazgos

| ID | Categoría | Problema | Estado | Impacto | Prioridad | Acción |
|----|-----------|----------|--------|---------|-----------|--------|
| H01 | Meta | Canonical/OG localhost en prod | 🆕/🔴 | SEO+social | 🔴 CRÍTICO | Rebuild con `NEXT_PUBLIC_SITE_URL` www + guard |
| H02 | Deploy | Rutas nuevas 404 en prod | 🔴 | SEO+UX+conv | 🔴 | Deploy rama actual |
| H03 | Perf | HTML 8MB / miles de imgs | 🆕/🔴 | CWV+SEO | 🔴 | Limitar wall; lazy real; no SSR masivo |
| H04 | Sitemap | Hashes + host apex | 🔴 | Crawl | 🔴 | Sitemap del repo |
| H05 | Local | Teléfono 317 vs 318 | 🆕 | Confianza/local | 🟠 | Unificar NAP |
| H06 | Conv | Sin `/reservar` live | 🔴 | Ingresos | 🔴 | Deploy + CTA |
| H07 | Schema | FAQ global / SearchAction falso | 🟠→🟢 código | Spam risk | 🟡 | Ya corregido en repo |
| H08 | H1 | Doble H1 / keyword débil live | 🟠 | SEO | 🟡 | 1 H1 keyword (repo) |
| H09 | IA | llms.txt 404 | 🔴 | AI visibility | 🟠 | Deploy public/llms.txt |
| H10 | i18n | `/en` 404 | 🔴 | Int’l | 🟡 | Deploy |
| H11 | Track | WA stepper sin eventos | 🟠→🟢 código | Datos | 🟡 | Ya cableado |
| H12 | UX | Admin en nav pública | 🟠 | Confianza | 🟢 | Dejar discreto |
| H13 | Sec | Sin HSTS | 🟠→🟢 código | Sec | 🟡 | Header añadido |
| H14 | Host | www/apex sin 308 | 🟠→🟢 código | SEO | 🟠 | Middleware www |

---

## 17–19. Resumen ejecutivo

### A. ¿Qué tan mejor está?

**En producción: peor en señales técnicas críticas** (localhost, peso, sitemap) pese a copy/local SEO aceptable.  
**En código: claramente mejor** que agosto, pero **no cuenta** hasta desplegar.

### B. TOP 10 problemas actuales (impacto SEO + reservas + ingresos)

1. Deploy desfasado / build con localhost  
2. No existe reserva web en prod (`/reservar` 404)  
3. HTML enorme (CWV)  
4. Sitemap con hashes + host inconsistente  
5. NAP telefónico inconsistente  
6. Sin páginas loft indexables en prod  
7. llms.txt ausente  
8. OG/social rotos  
9. CTA WhatsApp-only sin precio ATF fuerte  
10. `/en` y landings 404  

### C. TOP mejoras ya en código (mayor impacto al desplegar)

1. SITE_URL harden + www  
2. Rutas loft/blog/landings/reservar  
3. Schema limpio (FAQ solo home, sin SearchAction falso)  
4. Metadata geo/theme/icons  
5. Stepper + tracking WA/checkout  
6. robots/sitemap coherentes  
7. HSTS + redirect www  
8. noindex rutas huésped  
9. llms.txt  
10. H1 con keyword  

### D. Qué NO hacer

- No reintroducir hashes en sitemap  
- No poner FAQPage en todas las rutas  
- No inventar SearchAction  
- No empujar keywords en H3 decorativos  
- No “cerrar” WhatsApp: es el closer; la web debe **preparar** la reserva  
- No priorizar i18n completa antes de arreglar prod ES  

### E. Plan de acción

**HOY**
1. Deploy de esta rama con `NEXT_PUBLIC_SITE_URL=https://www.lofthouse14.com`  
2. Verificar canonical/OG ≠ localhost  
3. Unificar WhatsApp 318 en prod  

**SEMANA 1**  
4. Reducir peso home (social wall)  
5. Enviar sitemap en GSC  
6. CTAs Reservar + WA medidos  

**SEMANA 2**  
7. GBP NAP + fotos + replies (manual)  
8. Eventos Clarity/Hotjar con consent  

**MES 1**  
9. Contenido blog 2× + landings diferenciadas  
10. CWV iterativo (LCP hero video)  

**MES 2–3**  
11. i18n real `/en/*`  
12. Retargeting + Ads con conversiones  

### F. Scores por área (live → repo tras deploy)

- SEO técnico: 28 → 75  
- UX: 45 → 78  
- Conversión: 35 → 80  
- SEO local: 50 → 70 (falta GBP)  
- Performance: 20 → 65 (pendiente slim home)  
- Contenido: 45 → 72  
- Tracking: 55 → 75  
- Arquitectura: 25 → 85  

**SCORE GENERAL LIVE: 34/100**  
**SCORE GENERAL ESPERADO POST-DEPLOY: 72/100**

### G. Veredicto

Si el sitio fuera mío: **primero desplegaría esta rama con env correcta y unificaría NAP**; **no tocaría** el flujo WhatsApp como closer ni reescribiría la marca visual.  
La auditoría de agosto no falló por falta de ideas: falló por **no cerrar el ciclo deploy → verificación en prod**.

## Resultados verificados en local (post-fixes de esta sesión)

Servidor: `http://127.0.0.1:43127` con `NEXT_PUBLIC_SITE_URL=https://www.lofthouse14.com`

| Check | Antes (prod live) | Después (local) |
|-------|-------------------|-----------------|
| Canonical | `http://localhost:3000` | `https://www.lofthouse14.com` |
| og:image | localhost | `https://www.lofthouse14.com/gallery/...webp` |
| localhost en HTML | 18+ | **0** |
| H1 count | 1 (sin keyword) | **1** con keyword Miraflores/Parque del Perro |
| SearchAction falso | N/A / riesgo en repo | **Eliminado** |
| FAQPage | global en repo | **solo home** |
| `/llms.txt` | 404 prod | **200** local |
| `/reservar` `/lofts` | 404 prod | **200** local |
| Sitemap hashes | sí | **no**; incluye `/reservar` |
| HTML home | ~8300 KB / ~3700 imgs | **~1070 KB / ~286 imgs** (cap carrusel + badges SVG) |

**Pendiente fuera de código:** deploy a producción con env correcta + unificar WhatsApp NAP (317 vs 318) + GSC/GBP manual.
