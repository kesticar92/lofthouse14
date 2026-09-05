"use client";

import Image from "next/image";
import { site } from "@/lib/site";
import type { InventarioItemResultado } from "@/lib/inventarios-store";

export type PrintableInventoryProps = {
  /** Folio único formato AAAAMMDDHHMM. */
  folio: string;
  /** ISO datetime de emisión. */
  emisionISO: string;
  loft: number;
  persona: string;
  fecha: string; // yyyy-mm-dd
  items: InventarioItemResultado[];
};

function fmtFechaLarga(iso: string): string {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return new Date(y, m - 1, d).toLocaleDateString("es-CO", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function fmtEmision(iso: string): string {
  try {
    return new Date(iso).toLocaleString("es-CO", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function PrintableInventory({
  folio,
  emisionISO,
  loft,
  persona,
  fecha,
  items,
}: PrintableInventoryProps) {
  const totales = {
    total: items.length,
    marcados: items.filter((i) => i.estado !== "").length,
    presente: items.filter((i) => i.estado === "Presente").length,
    ausente: items.filter((i) => i.estado === "Ausente").length,
    danado: items.filter((i) => i.estado === "Dañado").length,
    noAplica: items.filter((i) => i.estado === "No aplica").length,
    funcionaNo: items.filter((i) => i.funciona === "No").length,
    atencion: items.filter((i) => i.requiereAtencion).length,
  };

  const danios = items.filter((i) => i.requiereAtencion);

  // Agrupar por zona para la tabla.
  const porZona = items.reduce<Record<string, InventarioItemResultado[]>>(
    (acc, it) => {
      (acc[it.zona] = acc[it.zona] ?? []).push(it);
      return acc;
    },
    {},
  );

  const loftLabel = loft === 4 ? "Loft 4 (bodega)" : `Loft ${loft}`;

  return (
    <div className="printable-quote printable-inventory">
      <div className="pq-page">
        <header className="pq-header">
          <div className="pq-brand">
            <Image
              src="/logo-lofthouse.png"
              alt="LOFTHOUSE 14"
              width={180}
              height={64}
              className="pq-logo"
              style={{ width: "auto", height: 64 }}
              priority
            />
            <p className="pq-brand-line">
              Inventario por loft · Reporte oficial
            </p>
          </div>
          <div className="pq-meta">
            <p className="pq-meta-row">
              <span>Reporte N°</span>
              <strong>{folio}</strong>
            </p>
            <p className="pq-meta-row">
              <span>Emitido</span>
              <strong>{fmtEmision(emisionISO)}</strong>
            </p>
            <p className="pq-meta-row">
              <span>Fecha de revisión</span>
              <strong>{fmtFechaLarga(fecha)}</strong>
            </p>
          </div>
        </header>

        <div className="pq-grid-2">
          <section className="pq-card">
            <h2 className="pq-card-title">Establecimiento</h2>
            <dl className="pq-dl">
              <dt>Razón social</dt>
              <dd>{site.legal.razonSocial}</dd>
              <dt>NIT</dt>
              <dd>{site.legal.nit}</dd>
              <dt>Dirección</dt>
              <dd>
                {site.addressLine}
                <br />
                {site.neighborhood} · {site.city}
              </dd>
            </dl>
          </section>

          <section className="pq-card">
            <h2 className="pq-card-title">Unidad inspeccionada</h2>
            <dl className="pq-dl">
              <dt>Loft</dt>
              <dd>
                <strong>{loftLabel}</strong>
              </dd>
              <dt>Revisado por</dt>
              <dd>{persona || "—"}</dd>
              <dt>Fecha</dt>
              <dd>{fmtFechaLarga(fecha)}</dd>
            </dl>
          </section>
        </div>

        <section className="pq-section">
          <h2 className="pq-section-title">Resumen del inventario</h2>
          <table className="pq-summary-table">
            <tbody>
              <tr>
                <td>Total de ítems del catálogo</td>
                <td className="pq-num">{totales.total}</td>
              </tr>
              <tr>
                <td>Ítems revisados</td>
                <td className="pq-num">
                  {totales.marcados} / {totales.total}
                </td>
              </tr>
              <tr>
                <td>Presentes y en buen estado</td>
                <td className="pq-num pq-ok">{totales.presente}</td>
              </tr>
              <tr>
                <td>Ausentes</td>
                <td className="pq-num pq-warn">{totales.ausente}</td>
              </tr>
              <tr>
                <td>Dañados</td>
                <td className="pq-num pq-bad">{totales.danado}</td>
              </tr>
              <tr>
                <td>No funcionan</td>
                <td className="pq-num pq-bad">{totales.funcionaNo}</td>
              </tr>
              <tr>
                <td>No aplica para este loft</td>
                <td className="pq-num">{totales.noAplica}</td>
              </tr>
              <tr className="pq-row-total">
                <td>Requieren atención</td>
                <td className="pq-num">{totales.atencion}</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section className="pq-section">
          <h2 className="pq-section-title">Checklist completo por zona</h2>
          {Object.entries(porZona).map(([zona, list]) => (
            <div key={zona} className="pq-zone-block">
              <h3 className="pq-zone-title">{zona}</h3>
              <table className="pq-table pq-table-compact">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Ítem</th>
                    <th>Estado</th>
                    <th>¿Funciona?</th>
                    <th>Detalles</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((it) => (
                    <tr
                      key={it.orden}
                      className={
                        it.requiereAtencion
                          ? "pq-row-attention"
                          : it.estado === "No aplica"
                            ? "pq-row-na"
                            : ""
                      }
                    >
                      <td>{it.orden}</td>
                      <td>{it.item}</td>
                      <td>{it.estado || "—"}</td>
                      <td>{it.funciona || "—"}</td>
                      <td>{it.detalles || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </section>

        {danios.length > 0 && (
          <section className="pq-section pq-damages">
            <h2 className="pq-section-title">
              Daños y novedades ({danios.length})
            </h2>
            {danios.map((it) => (
              <article key={it.orden} className="pq-damage-card">
                <header className="pq-damage-header">
                  <div>
                    <p className="pq-damage-zone">{it.zona}</p>
                    <h3 className="pq-damage-item">
                      #{it.orden} · {it.item}
                    </h3>
                  </div>
                  <div className="pq-damage-tags">
                    {it.estado && (
                      <span
                        className={`pq-tag ${
                          it.estado === "Dañado"
                            ? "pq-tag-bad"
                            : it.estado === "Ausente"
                              ? "pq-tag-warn"
                              : ""
                        }`}
                      >
                        {it.estado}
                      </span>
                    )}
                    {it.funciona === "No" && (
                      <span className="pq-tag pq-tag-bad">No funciona</span>
                    )}
                  </div>
                </header>
                {it.detalles && (
                  <p className="pq-damage-notes">
                    <strong>Observaciones:</strong> {it.detalles}
                  </p>
                )}
                {it.fotos && it.fotos.length > 0 ? (
                  <div className="pq-damage-photos">
                    {it.fotos.map((f, i) => (
                      <figure key={f.id} className="pq-damage-photo">
                        {/* Usamos <img> nativo en lugar de next/image para
                            que el navegador renderice el data URL en el PDF
                            sin pasar por el optimizador. */}
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={f.dataUrl} alt={`Evidencia ${i + 1}`} />
                        <figcaption>
                          {f.caption || `Evidencia ${i + 1}`}
                        </figcaption>
                      </figure>
                    ))}
                  </div>
                ) : (
                  <p className="pq-damage-no-photo">
                    Sin fotografía de evidencia adjunta.
                  </p>
                )}
              </article>
            ))}
          </section>
        )}

        <footer className="pq-footer">
          <p>
            Reporte generado automáticamente por la plataforma de administración
            de {site.name}. Las fotografías de evidencia están embebidas en este
            PDF y forman parte del soporte del inventario.
          </p>
          <p className="pq-footer-brand">
            {site.legal.razonSocial} · NIT {site.legal.nit} · {site.addressLine}
            , {site.city} · {site.phoneDisplay} · {site.email}
          </p>
        </footer>
      </div>
    </div>
  );
}
