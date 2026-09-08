/** Folio / cuenta de huésped (local stub — sin facturación electrónica). */

export type FolioChargeKind =
  | "room"
  | "extra"
  | "addon"
  | "tax"
  | "adjustment"
  | "other";

export type FolioPaymentMethod =
  | "cash"
  | "transfer"
  | "card_stub"
  | "wompi_mock"
  | "other"
  | "adjustment";

export type FolioCharge = {
  id: string;
  kind: FolioChargeKind;
  label: string;
  amount: number;
  quantity: number;
  created_at: string;
  notes?: string;
};

export type FolioPaymentLine = {
  id: string;
  method: FolioPaymentMethod;
  amount: number;
  created_at: string;
  notes?: string;
};

export type GuestFolio = {
  reservation_code: string;
  organization_id: string;
  guest_name: string;
  check_in: string;
  check_out: string;
  nights: number;
  charges: FolioCharge[];
  payments: FolioPaymentLine[];
  currency: string;
  created_at: string;
  updated_at: string;
};

export type FolioBalance = {
  charges_total: number;
  payments_total: number;
  balance: number;
};
