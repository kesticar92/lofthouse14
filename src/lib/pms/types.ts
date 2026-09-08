export type ReservationStatus =
  | "pending"
  | "confirmed"
  | "blocked"
  | "cancelled"
  | "checked_in"
  | "checked_out"
  | "no_show";

export type ReservationSource =
  | "airbnb"
  | "booking"
  | "expedia"
  | "lofthouse14.com"
  | "direct"
  | "referral"
  /** Legado: tratado como directa en UI y colores */
  | "manual"
  | string;

export type UnitOperationalStatus =
  | "active"
  | "inactive"
  | "maintenance"
  | "storage"
  | "out_of_service"
  | string;

export type PropertyRow = {
  id: string;
  name: string;
  ical_token: string;
  created_at: string;
  updated_at: string;
  /** Estado operativo del room bridged (021+); opcional si no hay catálogo. */
  unit_status?: UnitOperationalStatus | null;
  room_id?: string | null;
};

export type BlockType =
  | "manual"
  | "maintenance"
  | "out_of_service"
  | "owner"
  | "other";

export type ReservationRow = {
  id: string;
  property_id: string;
  source: string;
  external_id: string | null;
  guest_name: string;
  guest_phone: string;
  check_in: string;
  check_out: string;
  guests: number;
  price: number | null;
  status: ReservationStatus;
  notes: string;
  ical_summary: string | null;
  /** Presente tras migración `006_reservations_referral` */
  referrer_name?: string;
  commission_amount?: number | null;
  /** Fase 4+ / booking engine */
  reservation_code?: string | null;
  guest_email?: string | null;
  payment_status?: string | null;
  created_at: string;
  updated_at: string;
};

export type AvailabilityBlockRow = {
  id: string;
  property_id: string;
  start_date: string;
  end_date: string;
  reason: string;
  created_by: string | null;
  created_at: string;
  /** Presente tras migración 021 */
  block_type?: BlockType | string | null;
  organization_id?: string | null;
};

export type IcalSourceRow = {
  id: string;
  property_id: string;
  url: string;
  last_sync: string | null;
  created_at: string;
  updated_at: string;
};

export type SuspiciousGapAlert = {
  property_id: string;
  property_name?: string;
  gap_start: string;
  gap_end: string;
  nights: number;
  message: string;
};
