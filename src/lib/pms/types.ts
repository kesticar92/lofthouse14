export type ReservationStatus = "confirmed" | "blocked" | "cancelled";

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

export type PropertyRow = {
  id: string;
  name: string;
  ical_token: string;
  created_at: string;
  updated_at: string;
};

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
