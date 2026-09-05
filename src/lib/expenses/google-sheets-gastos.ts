import { google } from "googleapis";

import {
  formatFechaForSheet,
  formatMontoForSheet,
  normalizeGastosCategory,
} from "@/lib/expenses/gastos-sheet-constants";
import { getGoogleServiceAccountJwt } from "@/lib/expenses/google-service-account";

export {
  GASTOS_SHEET_CATEGORIES,
  normalizeGastosCategory,
} from "@/lib/expenses/gastos-sheet-constants";

const HEADER_ROW = [
  "FECHA",
  "CATEGORIA",
  "DESCRIPCION",
  "RESPONSABLE",
  "MONTO",
  "MÉTODO DE PAGO",
  "FACTURA",
] as const;

export function isGastosSheetConfigured(): boolean {
  return Boolean(process.env.GOOGLE_SHEETS_GASTOS_SPREADSHEET_ID?.trim());
}

function escapeSheetTitle(title: string): string {
  return `'${title.replace(/'/g, "''")}'`;
}

async function ensureMonthlyTab(
  spreadsheetId: string,
  tabName: string,
): Promise<void> {
  const auth = getGoogleServiceAccountJwt();
  if (!auth) throw new Error("Google no configurado");
  const sheets = google.sheets({ version: "v4", auth });

  const { data: meta } = await sheets.spreadsheets.get({
    spreadsheetId,
    fields: "sheets.properties.title",
  });

  const exists = (meta.sheets ?? []).some(
    (s) => s.properties?.title === tabName,
  );
  if (exists) return;

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [{ addSheet: { properties: { title: tabName } } }],
    },
  });

  const range = `${escapeSheetTitle(tabName)}!A1:G1`;
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [HEADER_ROW.slice()],
    },
  });
}

export type AppendGastoRowInput = {
  expenseDateISO: string;
  category: string;
  description: string;
  responsible: string;
  amount: number;
  paymentMethod: string;
  /** Enlaces a comprobantes en Drive (uno por línea si hay varios). */
  facturaUrls: string[];
};

/**
 * Añade una fila en la pestaña `YYYY-MM` del spreadsheet GASTOS.
 * Requiere que la cuenta de servicio tenga acceso de Editor al archivo.
 */
export async function appendGastoRowToSheet(
  input: AppendGastoRowInput,
): Promise<void> {
  const spreadsheetId = process.env.GOOGLE_SHEETS_GASTOS_SPREADSHEET_ID?.trim();
  if (!spreadsheetId) {
    throw new Error("Falta GOOGLE_SHEETS_GASTOS_SPREADSHEET_ID");
  }

  const d = input.expenseDateISO.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) {
    throw new Error(`Fecha inválida para Sheets: ${input.expenseDateISO}`);
  }
  const tabName = d.slice(0, 7);

  await ensureMonthlyTab(spreadsheetId, tabName);

  const auth = getGoogleServiceAccountJwt();
  if (!auth) throw new Error("Google no configurado");
  const sheets = google.sheets({ version: "v4", auth });

  const row = [
    formatFechaForSheet(d),
    normalizeGastosCategory(input.category),
    input.description.trim(),
    input.responsible.trim() || "LOFTHOUSE",
    formatMontoForSheet(input.amount),
    input.paymentMethod.trim() || "Transferencia ACH",
    input.facturaUrls.filter(Boolean).join("\n"),
  ];

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${escapeSheetTitle(tabName)}!A:G`,
    valueInputOption: "USER_ENTERED",
    insertDataOption: "INSERT_ROWS",
    requestBody: {
      values: [row],
    },
  });
}
