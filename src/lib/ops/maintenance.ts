/**
 * Ops: housekeeping + maintenance (Fase 8).
 * OUT_OF_SERVICE bloquea availability vía status de room / blocks.
 */

export type HkStatus =
  | "dirty"
  | "clean"
  | "inspected"
  | "in_progress"
  | "out_of_service";

export const HK_STATUSES: HkStatus[] = [
  "dirty",
  "clean",
  "inspected",
  "in_progress",
  "out_of_service",
];

export function hkBlocksAvailability(status: HkStatus): boolean {
  return status === "out_of_service";
}

export type MaintenanceTicketInput = {
  title: string;
  description?: string;
  priority?: "low" | "medium" | "high" | "urgent";
  roomId?: string | null;
  legacyPropertyId?: string | null;
  blocksAvailability?: boolean;
};

export type LocalMaintenanceTicket = MaintenanceTicketInput & {
  id: string;
  organization_id: string;
  status: "open" | "in_progress" | "blocked" | "resolved" | "cancelled";
  blocks_availability: boolean;
  created_at: string;
};

const g = globalThis as unknown as {
  __lhMaintenance?: LocalMaintenanceTicket[];
};

function store() {
  if (!g.__lhMaintenance) g.__lhMaintenance = [];
  return g.__lhMaintenance;
}

export function createLocalMaintenanceTicket(
  orgId: string,
  input: MaintenanceTicketInput,
): LocalMaintenanceTicket {
  const ticket: LocalMaintenanceTicket = {
    id: `mt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    organization_id: orgId,
    title: input.title,
    description: input.description ?? "",
    priority: input.priority ?? "medium",
    roomId: input.roomId,
    legacyPropertyId: input.legacyPropertyId,
    status: "open",
    blocks_availability: Boolean(input.blocksAvailability),
    created_at: new Date().toISOString(),
  };
  store().push(ticket);
  return ticket;
}

export function listLocalMaintenanceTickets(): LocalMaintenanceTicket[] {
  return [...store()];
}

export function resetLocalMaintenance() {
  g.__lhMaintenance = [];
}
