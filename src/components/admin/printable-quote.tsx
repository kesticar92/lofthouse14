"use client";

import Image from "next/image";
import { site } from "@/lib/site";
import { formatCOP, type QuoteResult } from "@/lib/pricing";
import { numeroALetras } from "@/lib/numero-a-letras";

export type PrintableQuoteProps = {
  /** Folio único formato AAAAMMDDHHMM (12 dígitos). */
  folio: string;
  /** ISO datetime de emisión. Por defecto, ahora. */
  emisionISO: string;
  cliente: {
    nombre: string;
    documento: string;
    telefono: string;
    email?: string;
  };
  estadia: {
    checkIn: string; // yyyy-mm-dd
    checkOut: string; // yyyy-mm-dd
    huespedes: number;
    lofts: number;
  };
  result: QuoteResult;
  observaciones?: string;
};

function fmtFechaLarga(iso: string): string {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString("es-CO", {
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

function fmtVigencia(emisionISO: string, dias: number): string {
  try {
    const d = new Date(emisionISO);
    d.setDate(d.getDate() + dias);
    return d.toLocaleDateString("es-CO", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

function tipoAcomodacion(lofts: number, huespedes: number): string {
  const base =
    lofts === 1
      ? "Loft / apartaestudio"
      : `${lofts} lofts / apartaestudios`;
  return `${base} · capacidad para ${huespedes} huésped${huespedes === 1 ? "" : "es"}`;
}

/**
 * Genera un folio en formato AAAAMMDDHHMM (12 dígitos) para la fecha dada.
 */
export function generarFolio(date: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    String(date.getFullYear()) +
    pad(date.getMonth() + 1) +
    pad(date.getDate()) +
    pad(date.getHours()) +
    pad(date.getMinutes())
  );
}

export function PrintableQuote({
  folio,
  emisionISO,
  cliente,
  estadia,
  result,
  observaciones,
}: PrintableQuoteProps) {
  if (!result.ok) return null;

  const nochesLJ = result.nightByNight.filter((n) => !n.esFinDeSemana);
  const nochesVD = result.nightByNight.filter((n) => n.esFinDeSemana);
  const subLJ = nochesLJ.reduce((s, n) => s + n.tarifa, 0);
  const subVD = nochesVD.reduce((s, n) => s + n.tarifa, 0);
  const tarifaLJ = nochesLJ[0]?.tarifa ?? 0;
  const tarifaVD = nochesVD[0]?.tarifa ?? 0;

  return (
    <div className="printable-quote">
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
            <p className="pq-brand-line">Hospedaje y experiencias · Cali</p>
          </div>
          <div className="pq-meta">
            <p className="pq-meta-row">
              <span>Cotización N°</span>
              <strong>{folio}</strong>
            </p>
            <p className="pq-meta-row">
              <span>Fecha de emisión</span>
              <strong>{fmtEmision(emisionISO)}</strong>
            </p>
            <p className="pq-meta-row">
              <span>Válida hasta</span>
              <strong>
                {fmtVigencia(emisionISO, site.legal.vigenciaDias)} (
                {site.legal.vigenciaDias} días)
              </strong>
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
              <dt>Régimen</dt>
              <dd>{site.legal.regimen}</dd>
              <dt>Dirección</dt>
              <dd>
                {site.addressLine}
                <br />
                {site.neighborhood} · {site.city}
              </dd>
              <dt>Teléfono / WhatsApp</dt>
              <dd>{site.phoneDisplay}</dd>
              <dt>Correo</dt>
              <dd>{site.email}</dd>
            </dl>
          </section>

          <section className="pq-card">
            <h2 className="pq-card-title">Cliente</h2>
            <dl className="pq-dl">
              <dt>Nombre</dt>
              <dd>{cliente.nombre || "—"}</dd>
              <dt>Documento</dt>
              <dd>{cliente.documento || "—"}</dd>
              <dt>Teléfono</dt>
              <dd>{cliente.telefono || "—"}</dd>
              {cliente.email && (
                <>
                  <dt>Correo</dt>
                  <dd>{cliente.email}</dd>
                </>
              )}
            </dl>
          </section>
        </div>

        <section className="pq-section">
          <h2 className="pq-section-title">Detalles de la estadía</h2>
          <dl className="pq-dl pq-dl-cols">
            <dt>Check-in</dt>
            <dd>
              {fmtFechaLarga(estadia.checkIn)} · {site.checkIn}
            </dd>
            <dt>Check-out</dt>
            <dd>
              {fmtFechaLarga(estadia.checkOut)} · {site.checkOut}
            </dd>
            <dt>Total noches</dt>
            <dd>
              {result.noches} ({result.nochesLJ} entre semana ·{" "}
              {result.nochesVD} fin de semana)
            </dd>
            <dt>Acomodación</dt>
            <dd>{tipoAcomodacion(estadia.lofts, estadia.huespedes)}</dd>
            <dt>Huéspedes</dt>
            <dd>{estadia.huespedes}</dd>
          </dl>
        </section>

        <section className="pq-section">
          <h2 className="pq-section-title">Detalle de costos</h2>
          <table className="pq-table">
            <thead>
              <tr>
                <th>Concepto</th>
                <th className="pq-num">Detalle</th>
                <th className="pq-num">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {nochesLJ.length > 0 && (
                <tr>
                  <td>Tarifa entre semana (Lun–Jue)</td>
                  <td className="pq-num">
                    {nochesLJ.length} × {formatCOP(tarifaLJ)}
                  </td>
                  <td className="pq-num">{formatCOP(subLJ)}</td>
                </tr>
              )}
              {nochesVD.length > 0 && (
                <tr>
                  <td>Tarifa fin de semana (Vie–Dom)</td>
                  <td className="pq-num">
                    {nochesVD.length} × {formatCOP(tarifaVD)}
                  </td>
                  <td className="pq-num">{formatCOP(subVD)}</td>
                </tr>
              )}
              {result.recargoHuespedes > 0 && (
                <tr>
                  <td>Recargo por huésped(es) adicional(es)</td>
                  <td className="pq-num">{estadia.huespedes - 2} × {result.noches}</td>
                  <td className="pq-num">{formatCOP(result.recargoHuespedes)}</td>
                </tr>
              )}
              <tr>
                <td>Aseo</td>
                <td className="pq-num">{result.aseoDetalle}</td>
                <td className="pq-num">{formatCOP(result.aseoTotal)}</td>
              </tr>
              <tr className="pq-row-subtotal">
                <td colSpan={2}>Subtotal</td>
                <td className="pq-num">{formatCOP(result.subtotalReserva)}</td>
              </tr>
              {result.descuento < 0 && (
                <tr>
                  <td colSpan={2}>{result.descuentoDetalle}</td>
                  <td className="pq-num">{formatCOP(result.descuento)}</td>
                </tr>
              )}
              <tr className="pq-row-total">
                <td colSpan={2}>TOTAL A PAGAR ({site.legal.moneda})</td>
                <td className="pq-num">{formatCOP(result.totalReserva)}</td>
              </tr>
            </tbody>
          </table>
          <p className="pq-letras">
            <strong>Total en letras:</strong>{" "}
            <span className="pq-letras-text">
              {numeroALetras(result.totalReserva)} ({site.legal.monedaNombre})
            </span>
          </p>
          <p className="pq-impuestos">{site.legal.avisoImpuestos}</p>
        </section>

        <div className="pq-grid-2">
          <section className="pq-card">
            <h2 className="pq-card-title">Servicios incluidos</h2>
            <ul className="pq-ul">
              {site.legal.amenitiesIncluidos.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
          </section>

          <section className="pq-card">
            <h2 className="pq-card-title">Métodos de pago</h2>
            <ul className="pq-ul">
              {site.legal.metodosPago.map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
            <p className="pq-pago-nota">{site.legal.politicaPago}</p>
          </section>
        </div>

        <section className="pq-section">
          <h2 className="pq-section-title">Política de cancelación</h2>
          <ul className="pq-ul">
            {site.legal.politicaCancelacion.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </section>

        <section className="pq-section">
          <h2 className="pq-section-title">Horarios y cargos adicionales</h2>
          <p className="pq-text">
            Check-in: <strong>{site.checkIn}</strong> · Check-out:{" "}
            <strong>{site.checkOut}</strong>. El ingreso anticipado o la salida
            tardía requieren contratación previa de Early Check-in o Late
            Check-out, sujeto a disponibilidad y costo adicional. Solicitarlo
            con al menos 24 horas de anticipación vía WhatsApp.
          </p>
        </section>

        {observaciones && (
          <section className="pq-section">
            <h2 className="pq-section-title">Observaciones</h2>
            <p className="pq-text">{observaciones}</p>
          </section>
        )}

        <footer className="pq-footer">
          <p>
            Esta cotización es informativa y no constituye una factura. La
            reserva se confirma únicamente con el pago del anticipo del 50% y
            la verificación de identidad del huésped, según las{" "}
            <em>políticas vigentes de {site.name}</em>.
          </p>
          <p className="pq-footer-brand">
            {site.legal.razonSocial} · NIT {site.legal.nit} ·{" "}
            {site.addressLine}, {site.city} · {site.phoneDisplay} ·{" "}
            {site.email}
          </p>
        </footer>
      </div>
    </div>
  );
}
