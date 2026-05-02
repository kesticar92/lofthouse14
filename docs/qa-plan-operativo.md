# Plan QA operativo y seguridad

Fecha: 2026-04-30

## Objetivo

Verificar estabilidad operativa del panel admin y endurecer puntos críticos de seguridad antes de habilitar conexiones externas finales.

## Alcance de esta ronda

- Salud de build/lint/tests.
- Riesgo de dependencias vulnerables.
- Seguridad de rutas de carga de archivos.
- Validación de exposición de secretos y uso de service role.
- Registro de pendientes operativos.

## Ejecución paso a paso (realizada)

1. Ejecutar lint global.
2. Ejecutar tests automáticos.
3. Ejecutar build de producción completo.
4. Auditar dependencias (`npm audit --omit=dev`).
5. Revisar uso de `SUPABASE_SERVICE_ROLE_KEY` y variables de Google Drive para confirmar que solo viven en backend.
6. Endurecer endpoint de subida de adjuntos de gastos.
7. Repetir lint/tests/build/audit tras hardening.
8. Documentar pendiente de activación productiva de Google Drive.

## Hallazgos y correcciones aplicadas

- Dependencias: se detectaron vulnerabilidades moderadas transitivas por `uuid` vía `googleapis`.
  - Acción: actualización de `googleapis` a versión actual.
  - Estado: `npm audit --omit=dev` sin vulnerabilidades.
- Carga de archivos: faltaban límites duros.
  - Acción: en `src/app/api/admin/expenses/[id]/files/route.ts` se añadieron:
    - máximo de 12 archivos por request,
    - máximo de 20 MB por archivo,
    - allowlist de MIME (JPG/PNG/WEBP/HEIC/HEIF/PDF),
    - respuestas de error explícitas (`400`, `413`, `415`) con `partial`.
- Registro de pendiente operativo:
  - Acción: sección "Pendientes operativos" añadida en `README.md` para recordar activación real de Google Drive (envs + carpeta compartida + validación real).

## Pendientes siguientes (no ejecutados en esta ronda)

- Pruebas E2E de rutas admin autenticadas con Playwright/Cypress.
- Rate limiting por IP/usuario en endpoints de carga y retry.
- Integrar escaneo de malware/virus para adjuntos (si el negocio lo requiere).
- Alertas automáticas cuando `drive_backup_status='failed'` supere umbral diario.
