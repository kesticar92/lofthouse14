import { checkLiveAvailability, isValidCategoryId } from "@/lib/availability/live-check";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "JSON inválido" }, { status: 400 });
  }

  const b = body as Record<string, unknown>;
  const checkIn = String(b.check_in ?? "").trim();
  const checkOut = String(b.check_out ?? "").trim();
  const guests = Number(b.guests ?? 1);
  const loftsRaw = Number(b.lofts ?? 1);
  const categoryRaw = String(b.category_id ?? b.category ?? "").trim();

  if (!checkIn || !checkOut || checkOut <= checkIn) {
    return Response.json(
      { error: "check_in y check_out requeridos (fin exclusivo)" },
      { status: 400 },
    );
  }
  if (!Number.isFinite(guests) || guests < 1) {
    return Response.json({ error: "guests inválido" }, { status: 400 });
  }
  if (!isValidCategoryId(categoryRaw)) {
    return Response.json(
      { error: "category_id requerido (vista|atrio|cielo)" },
      { status: 400 },
    );
  }

  const result = await checkLiveAvailability({
    categoryId: categoryRaw,
    guests: Math.floor(guests),
    checkIn,
    checkOut,
    lofts: Number.isFinite(loftsRaw) ? Math.max(1, Math.floor(loftsRaw)) : 1,
  });

  return Response.json(result);
}

/** Misma verificación por query (útil para depuración). */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const checkIn = searchParams.get("check_in")?.trim() ?? "";
  const checkOut = searchParams.get("check_out")?.trim() ?? "";
  const guests = Number(searchParams.get("guests") ?? 1);
  const categoryRaw =
    searchParams.get("category_id")?.trim() ||
    searchParams.get("category")?.trim() ||
    "";

  if (!checkIn || !checkOut || checkOut <= checkIn) {
    return Response.json(
      { error: "check_in y check_out requeridos (fin exclusivo)" },
      { status: 400 },
    );
  }
  if (!isValidCategoryId(categoryRaw)) {
    return Response.json(
      { error: "category requerido (vista|atrio|cielo)" },
      { status: 400 },
    );
  }

  const result = await checkLiveAvailability({
    categoryId: categoryRaw,
    guests: Math.max(1, Math.floor(guests) || 1),
    checkIn,
    checkOut,
  });

  return Response.json(result);
}
