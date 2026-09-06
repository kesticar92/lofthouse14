# Core Web Vitals / PageSpeed (auditoría #30)

Optimizaciones ya aplicadas en código:

- Imágenes de galería en **WebP** con nombres SEO (#19–20)
- `next/image` con formatos AVIF/WebP, `minimumCacheTTL` y tamaños de dispositivo
- Cache largo (`immutable`) para `/gallery/*` y `/hero/*`
- Hero: `poster` estático + `preload="none"` en videos inactivos
- Fuentes con `display: "swap"`
- CSP y scripts de terceros condicionados a consentimiento

## Medición en producción (tras deploy)

1. Abrir [PageSpeed Insights](https://pagespeed.web.dev/) con `https://www.lofthouse14.com`
2. Revisar LCP, INP y CLS en móvil
3. Objetivos: LCP &lt; 2.5s · INP &lt; 200ms · CLS &lt; 0.1
4. Si LCP falla: comprimir videos del hero o usar imagen estática en móvil
5. Si CLS falla: fijar `width`/`height` o `aspect-ratio` en media

## Local

```bash
npm run dev   # http://127.0.0.1:3001
# Lighthouse en Chrome DevTools → Mode: Navigation · Mobile
```
