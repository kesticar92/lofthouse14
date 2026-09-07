import { z } from "zod";

import type { MarketingCategory, RoomStatus } from "@/lib/catalog/seed";

export type { MarketingCategory, RoomStatus };

export const MARKETING_CATEGORIES = ["vista", "atrio", "cielo"] as const;

export const ROOM_STATUSES = [
  "active",
  "inactive",
  "maintenance",
  "storage",
] as const;

export function isMarketingCategory(s: string): s is MarketingCategory {
  return (MARKETING_CATEGORIES as readonly string[]).includes(s);
}

export function isRoomStatus(s: string): s is RoomStatus {
  return (ROOM_STATUSES as readonly string[]).includes(s);
}

/** PATCH body: actualizar room_type y/o room del tenant. */
export const catalogPatchSchema = z
  .object({
    room_type: z
      .object({
        id: z.string().uuid(),
        name: z.string().trim().min(1).max(120).optional(),
        short_label: z.string().trim().max(40).optional(),
        tagline: z.string().trim().max(200).optional(),
        max_guests: z.number().int().min(1).max(20).optional(),
        sort_order: z.number().int().min(0).max(100).optional(),
      })
      .optional(),
    room: z
      .object({
        id: z.string().uuid(),
        name: z.string().trim().min(1).max(120).optional(),
        room_type_id: z.string().uuid().nullable().optional(),
        max_guests: z.number().int().min(1).max(20).optional(),
        status: z.enum(ROOM_STATUSES).optional(),
      })
      .optional(),
  })
  .refine((b) => Boolean(b.room_type || b.room), {
    message: "Indica room_type o room",
  });

export type CatalogPatchInput = z.infer<typeof catalogPatchSchema>;

/**
 * Resuelve room_type_id a marketing_category (para alinear UI).
 */
export function marketingCategoryFromRoomTypeCode(
  code: string | null | undefined,
): MarketingCategory | null {
  if (!code) return null;
  return isMarketingCategory(code) ? code : null;
}
