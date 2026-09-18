import { requireStaff, enforceStaffModule } from "@/lib/api/require-staff";
import {
  getLocalReservationByCode,
  listLocalReservations,
  upsertLocalReservation,
} from "@/lib/availability/local-store";
import {
  addFolioCharge,
  computeFolioBalance,
  ensureFolioForReservation,
  getFolio,
  listFolios,
  registerFolioPayment,
  settleFolioBalance,
} from "@/lib/folio/store";
import type { FolioPaymentMethod } from "@/lib/folio/types";
import { runAutomation } from "@/lib/crm/automation-runner";
import {
  getDraftInvoiceByCode,
  getEInvoicingProvider,
} from "@/lib/einvoicing/provider";
import {
  balanceForPayment,
  getLocalPaymentByCode,
} from "@/lib/payments/local-store";

function serialize(code: string) {
  const folio = getFolio(code) ?? null;
  if (!folio) return null;
  const payment = getLocalPaymentByCode(code);
  return {
    ...folio,
    balance: computeFolioBalance(folio),
    draft_invoice: getDraftInvoiceByCode(code),
    deposit: payment
      ? {
          percent: payment.deposit_percent,
          amount: payment.deposit_amount,
          status: payment.status,
          ...balanceForPayment(payment),
        }
      : null,
  };
}

export async function GET(req: Request) {
  const gate = await requireStaff();
  if (!gate.ok) return gate.response;
  const mod = enforceStaffModule(gate.ctx, "pagos");
  if (mod) return mod;

  const code = new URL(req.url).searchParams.get("code")?.trim().toUpperCase();

  if (code) {
    const res = getLocalReservationByCode(code);
    if (!res) {
      return Response.json(
        { error: "Reserva no encontrada en store local" },
        { status: 404 },
      );
    }
    const folio = ensureFolioForReservation(res);
    const payment = getLocalPaymentByCode(code);
    return Response.json({
      mode: "local",
      folio: {
        ...folio,
        balance: computeFolioBalance(folio),
        deposit: payment
          ? {
              percent: payment.deposit_percent,
              amount: payment.deposit_amount,
              status: payment.status,
              ...balanceForPayment(payment),
            }
          : null,
      },
      reservation: res,
      payment,
    });
  }

  // Asegura folios para reservas existentes
  for (const r of listLocalReservations()) {
    ensureFolioForReservation(r);
  }

  return Response.json({
    mode: "local",
    folios: listFolios().map((f) => ({
      ...f,
      balance: computeFolioBalance(f),
    })),
  });
}

export async function POST(req: Request) {
  const gate = await requireStaff();
  if (!gate.ok) return gate.response;
  const mod = enforceStaffModule(gate.ctx, "pagos");
  if (mod) return mod;

  let body: {
    reservation_code?: string;
    action?:
      | "add_charge"
      | "register_payment"
      | "settle"
      | "ensure"
      | "issue_draft_invoice";
    label?: string;
    amount?: number;
    kind?: string;
    method?: FolioPaymentMethod;
    notes?: string;
  };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "JSON inválido" }, { status: 400 });
  }

  const code = body.reservation_code?.trim().toUpperCase();
  if (!code) {
    return Response.json({ error: "reservation_code requerido" }, { status: 400 });
  }

  const res = getLocalReservationByCode(code);
  if (!res) {
    return Response.json(
      { error: "Reserva no encontrada — crea booking o import primero" },
      { status: 404 },
    );
  }

  ensureFolioForReservation(res);
  const action = body.action ?? "ensure";

  if (action === "add_charge") {
    const updated = addFolioCharge(code, {
      label: body.label ?? "Cargo adicional",
      amount: Number(body.amount ?? 0),
      kind: (body.kind as "addon") ?? "addon",
      notes: body.notes,
    });
    if (!updated) {
      return Response.json({ error: "No se pudo agregar cargo" }, { status: 400 });
    }
    return Response.json({ ok: true, folio: serialize(code) });
  }

  if (action === "register_payment") {
    const method = body.method ?? "cash";
    if (!["cash", "transfer", "card_stub", "other", "adjustment"].includes(method)) {
      return Response.json({ error: "method inválido" }, { status: 400 });
    }
    const updated = registerFolioPayment(code, {
      amount: Number(body.amount ?? 0),
      method,
      notes: body.notes,
    });
    if (!updated) {
      return Response.json({ error: "No se pudo registrar pago" }, { status: 400 });
    }
    const bal = computeFolioBalance(updated);
    const automation = runAutomation({
      eventType: "payment_received",
      payload: {
        reservation_code: code,
        guest_name: res.guest_name,
        amount: body.amount,
        method,
        balance: bal.balance,
      },
    });
    if (bal.balance <= 0) {
      res.payment_status = "paid";
      upsertLocalReservation(res);
    } else {
      res.payment_status = "pending";
      upsertLocalReservation(res);
    }
    return Response.json({ ok: true, folio: serialize(code), automation });
  }

  if (action === "settle") {
    const updated = settleFolioBalance(code);
    if (!updated) {
      return Response.json({ error: "No se pudo liquidar" }, { status: 400 });
    }
    res.payment_status = "paid";
    upsertLocalReservation(res);
    const automation = runAutomation({
      eventType: "payment_received",
      payload: {
        reservation_code: code,
        guest_name: res.guest_name,
        settled: true,
        balance: 0,
      },
    });
    return Response.json({ ok: true, folio: serialize(code), automation });
  }

  if (action === "issue_draft_invoice") {
    const folio = ensureFolioForReservation(res);
    const provider = getEInvoicingProvider();
    const invoice = await provider.issueDraft({
      reservationCode: code,
      guestName: folio.guest_name || res.guest_name,
      lines: folio.charges.map((c) => ({
        label: c.label,
        amount: c.amount,
        quantity: c.quantity,
      })),
    });
    return Response.json({
      ok: true,
      folio: serialize(code),
      invoice,
      note: invoice.message,
    });
  }

  return Response.json({ ok: true, folio: serialize(code) });
}
