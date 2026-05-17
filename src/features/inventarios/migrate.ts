"use client";

// =============================================================================
// src/features/inventarios/migrate.ts
// -----------------------------------------------------------------------------
// Migración de inventarios desde localStorage a Postgres + Supabase Storage.
//
// Por cada inventario local:
//   1. Crea la cabecera + items en una sola llamada POST /api/admin/inventarios.
//   2. Por cada foto base64 del LS, hace un fetch al data URL para obtener un
//      Blob, y la sube vía POST /.../items/{itemId}/fotos.
//   3. Si TODOS los inventarios se subieron sin error fatal, archiva el LS y
//      lo borra. Si hubo errores, conserva el LS para reintentar.
//
// El proceso es secuencial (no paralelo) para no saturar el browser ni el
// servidor de Storage.
// =============================================================================

import { createInventario, uploadFoto } from "./api";
import { listarInventarios } from "@/lib/inventarios-store";
import { KEYS, safeRemove } from "@/lib/storage";
import type { InventarioRevisionCreateInput } from "./schemas";

export type InventarioMigrationReport = {
  scanned: number;
  uploaded: number;
  fotosUploaded: number;
  fotosFailed: number;
  errors: { localId: string; message: string }[];
};

export function hasLocalInventarios(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = window.localStorage.getItem(KEYS.inventarios);
    if (!raw) return false;
    const arr = JSON.parse(raw);
    return Array.isArray(arr) && arr.length > 0;
  } catch {
    return false;
  }
}

async function dataUrlToFile(
  dataUrl: string,
  filename: string,
): Promise<File | null> {
  try {
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    return new File([blob], filename, { type: blob.type || "image/jpeg" });
  } catch {
    return null;
  }
}

export async function migrateLocalInventariosToServer(): Promise<InventarioMigrationReport> {
  const local = listarInventarios();
  const report: InventarioMigrationReport = {
    scanned: local.length,
    uploaded: 0,
    fotosUploaded: 0,
    fotosFailed: 0,
    errors: [],
  };
  if (local.length === 0) return report;

  for (const inv of local) {
    try {
      const payload: InventarioRevisionCreateInput = {
        loft_id: String(inv.loft),
        persona: inv.persona ?? "",
        fecha: inv.fecha,
        items: inv.items.map((it) => ({
          orden: it.orden ?? 0,
          zona: it.zona,
          item: it.item,
          estado: it.estado,
          funciona: it.funciona,
          detalles: it.detalles ?? "",
          requiere_atencion: it.requiereAtencion ?? false,
        })),
      };

      const created = await createInventario(payload);
      report.uploaded++;

      // Subir fotos: emparejar por zona+ítem (estable aunque cambie el orden del catálogo).
      const itemsByKey = new Map<string, string>();
      for (const cit of created.items) {
        const key = `${cit.zona}|${cit.item}`;
        itemsByKey.set(key, cit.id);
      }

      for (const localItem of inv.items) {
        const fotos = localItem.fotos ?? [];
        if (fotos.length === 0) continue;
        const key = `${localItem.zona}|${localItem.item}`;
        const newItemId = itemsByKey.get(key);
        if (!newItemId) {
          report.fotosFailed += fotos.length;
          continue;
        }
        for (let i = 0; i < fotos.length; i++) {
          const f = fotos[i];
          const filename = `legacy-${i + 1}.jpg`;
          const file = await dataUrlToFile(f.dataUrl, filename);
          if (!file) {
            report.fotosFailed++;
            continue;
          }
          try {
            await uploadFoto(created.id, newItemId, file, f.caption ?? "");
            report.fotosUploaded++;
          } catch {
            report.fotosFailed++;
          }
        }
      }
    } catch (err) {
      report.errors.push({
        localId: inv.id,
        message: err instanceof Error ? err.message : "Error desconocido",
      });
    }
  }

  // Si TODOS los inventarios se subieron sin error fatal, archivamos el LS.
  // Las fotos fallidas no bloquean el archivado (el usuario puede re-subirlas
  // desde la UI más tarde).
  if (report.errors.length === 0 && report.uploaded > 0) {
    try {
      const stamp = new Date().toISOString().replace(/[:.]/g, "-");
      window.localStorage.setItem(
        `${KEYS.inventarios}.archived.${stamp}`,
        JSON.stringify(local),
      );
      safeRemove(KEYS.inventarios);
    } catch {
      /* ignore archivado fallido */
    }
  }

  return report;
}
