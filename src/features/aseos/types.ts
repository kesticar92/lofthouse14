// =============================================================================
// src/features/aseos/types.ts
// -----------------------------------------------------------------------------
// Tipos del feature de aseos. Estos shapes corresponden al JSON legacy de las
// rutas; cuando migremos a `apiHandler` los actualizamos.
// =============================================================================

export type CleaningTask = {
  id: string;
  property_id: string;
  property_name?: string;
  reservation_id: string | null;
  task_date: string;
  type: string;
  status: string;
  assigned_to: string | null;
  guests: number;
  source: string;
  guest_name: string;
  check_in: string | null;
  check_out: string | null;
  notes: string;
  bed_setup_notes: string;
  cleaning_price: number | null;
  estimated_time_label: string;
};

export type CleaningStaff = {
  id: string;
  full_name: string;
  email: string | null;
  role: string;
};

export type CleaningPricing = {
  base_cop: number;
  guest_threshold: number;
  extra_per_guest_cop: number;
};

export type CleaningSummary = {
  today: {
    cleaning: number;
    preparation: number;
    manual: number;
    revenue_scheduled_cop: number;
    revenue_done_cop: number;
  };
  month_totals: {
    revenue_scheduled_cop: number;
    revenue_done_cop: number;
    task_count: number;
  };
};
