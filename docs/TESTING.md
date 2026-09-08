# Testing

```bash
npm run test          # Vitest unitarios
npm run typecheck
npm run lint
```

## Cobertura crítica añadida (Fases 3–11)

| Área | Archivo |
|------|---------|
| Availability / double book | `src/lib/availability/engine.test.ts` |
| Booking local | `src/lib/booking/create-reservation.test.ts` |
| Pricing unificado | `src/lib/pricing/unified.test.ts` |
| PMS metrics | `src/lib/pms/metrics.test.ts` |
| CRM templates | `src/lib/crm/templates.test.ts` |
| Analytics stubs | `src/lib/analytics/reports.test.ts` |

## Manual

1. Wizard → RESERVAR → confirmación.
2. Availability API con categoría.
3. Admin canales simulador.
4. Admin pagos intent stub.
5. Analytics CSV download (autenticado).
