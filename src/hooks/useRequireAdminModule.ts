"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import {
  adminModuleForPath,
  isAdminOnlyAdminPath,
  staffCanAccessAdminPath,
} from "@/lib/api/admin-modules";
import { fetchAdminSession } from "@/lib/auth-client";
import type { StaffRole } from "@/lib/supabase/env";

/**
 * Redirige a `/admin/login` o `/admin` si el usuario no puede ver la ruta actual.
 * Devuelve `ready` cuando la sesión está validada y la ruta es accesible.
 */
export function useRequireAdminModule(): {
  ready: boolean;
  role: StaffRole | "";
} {
  const pathname = usePathname();
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [role, setRole] = useState<StaffRole | "">("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const session = await fetchAdminSession();
      if (cancelled) return;
      if (!session) {
        router.replace("/admin/login");
        return;
      }
      const profile = {
        role: session.role as StaffRole,
        allowed_modules: session.allowedModules,
      };
      const path = pathname ?? "/admin";
      if (
        isAdminOnlyAdminPath(path) &&
        !staffCanAccessAdminPath(profile, path)
      ) {
        router.replace("/admin");
        return;
      }
      const mod = adminModuleForPath(path);
      if (mod && !staffCanAccessAdminPath(profile, path)) {
        router.replace("/admin");
        return;
      }
      setRole(profile.role);
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [pathname, router]);

  return { ready, role };
}
