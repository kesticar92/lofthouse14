import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { staffCanAccessAdminPath } from "@/lib/api/admin-modules";
import { isSupabaseAuthUnreachable } from "@/lib/supabase/auth-errors";
import {
  isStaffRole,
  type StaffRole,
  supabasePublicEnv,
} from "@/lib/supabase/env";
import type { Database } from "@/types/database.types";

type TypedClient = SupabaseClient<Database>;

async function getSessionUser(
  supabase: TypedClient,
): Promise<{ unreachable: true } | { unreachable: false; user: User | null }> {
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error && isSupabaseAuthUnreachable(error)) {
      return { unreachable: true };
    }
    return { unreachable: false, user: data?.user ?? null };
  } catch (err) {
    if (!isSupabaseAuthUnreachable(err)) {
      console.error("[middleware] getSessionUser inesperado:", err);
    }
    return { unreachable: true };
  }
}

async function loadStaffProfile(
  supabase: TypedClient,
  userId: string,
): Promise<
  | { unreachable: true }
  | {
      unreachable: false;
      profile: null | {
        role: StaffRole;
        status: string;
        allowed_modules: string[];
      };
    }
> {
  try {
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("role, status, allowed_modules")
      .eq("id", userId)
      .maybeSingle();
    if (error && isSupabaseAuthUnreachable(error)) {
      return { unreachable: true };
    }
    if (error || !profile?.role || !isStaffRole(profile.role)) {
      return { unreachable: false, profile: null };
    }
    return {
      unreachable: false,
      profile: {
        role: profile.role,
        status: String(profile.status ?? ""),
        allowed_modules: Array.isArray(profile.allowed_modules)
          ? profile.allowed_modules
          : [],
      },
    };
  } catch (err) {
    if (!isSupabaseAuthUnreachable(err)) {
      console.error("[middleware] loadStaffProfile inesperado:", err);
    }
    return { unreachable: true };
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api/admin")) {
    const { adminApiClientKey, allowAdminApiRequest } =
      await import("@/lib/admin-rate-limit");
    const { apiRateLimited } = await import("@/lib/api/response");
    if (!allowAdminApiRequest(adminApiClientKey(request))) {
      return apiRateLimited(60);
    }
  }

  const { url, key, ok } = supabasePublicEnv();

  if (!ok) {
    if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
    return NextResponse.next();
  }

  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient<Database>(url, key, {
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

  const auth = await getSessionUser(supabase);

  if (auth.unreachable) {
    if (
      pathname.startsWith("/admin/login") ||
      pathname.startsWith("/admin/registro")
    ) {
      return response;
    }
    if (pathname.startsWith("/admin")) {
      return NextResponse.redirect(
        new URL("/admin/login?error=supabase_unreachable", request.url),
      );
    }
    return response;
  }

  const user = auth.user;

  if (pathname.startsWith("/admin/registro")) {
    return response;
  }

  if (pathname.startsWith("/admin/login")) {
    if (user) {
      const sp = await loadStaffProfile(supabase, user.id);
      if (sp.unreachable) {
        return response;
      }
      const profile = sp.profile;
      if (profile && profile.status === "active") {
        return NextResponse.redirect(new URL("/admin", request.url));
      }
      if (profile && profile.status === "pending") {
        return NextResponse.redirect(
          new URL("/admin/login?error=pending_approval", request.url),
        );
      }
      await supabase.auth.signOut();
    }
    return response;
  }

  if (pathname.startsWith("/admin")) {
    if (!user) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
    const sp = await loadStaffProfile(supabase, user.id);
    if (sp.unreachable) {
      return NextResponse.redirect(
        new URL("/admin/login?error=supabase_unreachable", request.url),
      );
    }
    const profile = sp.profile;
    if (!profile) {
      await supabase.auth.signOut();
      return NextResponse.redirect(
        new URL("/admin/login?error=no_profile", request.url),
      );
    }
    if (profile.status === "pending") {
      await supabase.auth.signOut();
      return NextResponse.redirect(
        new URL("/admin/login?error=pending_approval", request.url),
      );
    }
    if (profile.status === "suspended") {
      await supabase.auth.signOut();
      return NextResponse.redirect(
        new URL("/admin/login?error=suspended", request.url),
      );
    }
    if (
      !staffCanAccessAdminPath(
        {
          role: profile.role,
          allowed_modules: profile.allowed_modules,
        },
        pathname,
      )
    ) {
      return NextResponse.redirect(new URL("/admin", request.url));
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
