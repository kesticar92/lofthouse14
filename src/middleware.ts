import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isStaffRole, supabasePublicEnv } from "@/lib/supabase/env";
import {
  allowAdminApiRequest,
  allowPublicApiRequest,
  adminApiClientKey,
  publicApiClientKey,
} from "@/lib/admin-rate-limit";
import { checkCsrfOrigin, pathNeedsCsrf } from "@/lib/security/csrf";
import {
  LOCAL_ADMIN_COOKIE,
  verifyLocalAdminToken,
} from "@/lib/local-admin";

function isRateLimitedPublicApi(pathname: string): boolean {
  return (
    pathname.startsWith("/api/public/booking") ||
    pathname.startsWith("/api/public/availability") ||
    pathname.startsWith("/api/public/messages") ||
    pathname.startsWith("/api/public/coupons") ||
    pathname.startsWith("/api/public/fx") ||
    pathname.startsWith("/api/public/reviews")
  );
}

function hasLocalAdmin(request: NextRequest): Promise<boolean> {
  return verifyLocalAdminToken(
    request.cookies.get(LOCAL_ADMIN_COOKIE)?.value,
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Canonical host: apex → www (SEO + cookies).
  // Importante: no reutilizar request.nextUrl (trae el puerto interno :3000
  // detrás de nginx) o el navegador acaba en https://www…:3000 (timeout).
  const host = request.headers.get("host")?.split(":")[0]?.toLowerCase();
  if (host === "lofthouse14.com") {
    const dest = new URL(
      `${request.nextUrl.pathname}${request.nextUrl.search}`,
      "https://www.lofthouse14.com",
    );
    return NextResponse.redirect(dest, 308);
  }


  if (pathname.startsWith("/api/admin")) {
    if (!allowAdminApiRequest(adminApiClientKey(request))) {
      return NextResponse.json(
        { error: "Too many requests", code: "RATE_LIMIT" },
        { status: 429 },
      );
    }
  }

  if (isRateLimitedPublicApi(pathname)) {
    if (!allowPublicApiRequest(publicApiClientKey(request))) {
      return NextResponse.json(
        { error: "Too many requests", code: "RATE_LIMIT" },
        { status: 429 },
      );
    }
  }

  if (
    pathNeedsCsrf(pathname) &&
    !pathname.startsWith("/api/admin/local-auth")
  ) {
    const csrf = checkCsrfOrigin(request);
    if (!csrf.ok) {
      return NextResponse.json(
        { error: csrf.error, code: csrf.code },
        { status: csrf.status },
      );
    }
  }

  const { url, key, ok } = supabasePublicEnv();
  const localOk = await hasLocalAdmin(request);

  if (!ok) {
    if (pathname.startsWith("/admin/login")) {
      if (localOk) {
        return NextResponse.redirect(new URL("/admin", request.url));
      }
      return NextResponse.next();
    }
    if (pathname.startsWith("/admin")) {
      if (localOk) return NextResponse.next();
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
    if (
      pathname.startsWith("/api/admin") &&
      !pathname.startsWith("/api/admin/local-auth")
    ) {
      if (!localOk) {
        return NextResponse.json(
          { error: "No autorizado", code: "UNAUTHORIZED" },
          { status: 401 },
        );
      }
    }
    return NextResponse.next();
  }

  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        response = NextResponse.next({
          request: { headers: request.headers },
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  async function staffProfile() {
    if (!user) return null;
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    return profile?.role && isStaffRole(profile.role) ? profile.role : null;
  }

  if (pathname.startsWith("/admin/login")) {
    if (localOk) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    if (user) {
      const role = await staffProfile();
      if (role) {
        return NextResponse.redirect(new URL("/admin", request.url));
      }
      await supabase.auth.signOut();
    }
    return response;
  }

  if (pathname.startsWith("/admin")) {
    if (localOk) return response;
    if (!user) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
    const role = await staffProfile();
    if (!role) {
      await supabase.auth.signOut();
      return NextResponse.redirect(
        new URL("/admin/login?error=no_profile", request.url),
      );
    }
    return response;
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
