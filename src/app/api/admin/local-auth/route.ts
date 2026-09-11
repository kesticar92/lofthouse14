import { NextResponse } from "next/server";
import {
  createLocalAdminToken,
  isLocalAdminMode,
  LOCAL_ADMIN_COOKIE,
  LOCAL_ADMIN_COOKIE_OPTIONS,
  localAdminEmail,
  verifyLocalAdminCredentials,
  verifyLocalAdminToken,
} from "@/lib/local-admin";

export async function GET(req: Request) {
  const cookie = req.headers
    .get("cookie")
    ?.split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${LOCAL_ADMIN_COOKIE}=`))
    ?.slice(LOCAL_ADMIN_COOKIE.length + 1);

  const token = cookie ? decodeURIComponent(cookie) : null;
  if (await verifyLocalAdminToken(token)) {
    return NextResponse.json({
      ok: true,
      mode: "local",
      user: localAdminEmail(),
      role: "super_admin",
    });
  }

  return NextResponse.json({
    ok: false,
    mode: isLocalAdminMode() ? "local" : "supabase",
  });
}

export async function POST(req: Request) {
  if (!isLocalAdminMode()) {
    return NextResponse.json(
      { error: "El modo admin local no está activo" },
      { status: 400 },
    );
  }

  let body: { email?: string; password?: string; action?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  if (body.action === "logout") {
    const res = NextResponse.json({ ok: true });
    res.cookies.set(LOCAL_ADMIN_COOKIE, "", {
      ...LOCAL_ADMIN_COOKIE_OPTIONS,
      maxAge: 0,
    });
    return res;
  }

  const email = String(body.email ?? "");
  const password = String(body.password ?? "");
  if (!verifyLocalAdminCredentials(email, password)) {
    return NextResponse.json(
      { error: "Correo o contraseña incorrectos" },
      { status: 401 },
    );
  }

  const token = await createLocalAdminToken();
  const res = NextResponse.json({
    ok: true,
    mode: "local",
    user: localAdminEmail(),
    role: "super_admin",
  });
  res.cookies.set(LOCAL_ADMIN_COOKIE, token, LOCAL_ADMIN_COOKIE_OPTIONS);
  return res;
}
