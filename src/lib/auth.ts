"use client";

import { KEYS, safeGet, safeRemove, safeSet } from "./storage";

/**
 * Autenticación sencilla para el panel de administrador.
 * Usuario y contraseña se leen de variables de entorno públicas:
 *   NEXT_PUBLIC_ADMIN_USER  (default: "admin")
 *   NEXT_PUBLIC_ADMIN_PASS  (default: "lofthouse14")
 * Son editables en `.env.local` antes de desplegar.
 * La sesión expira a las 12 horas o al cerrar sesión.
 */

const DEFAULT_USER = process.env.NEXT_PUBLIC_ADMIN_USER || "admin";
const DEFAULT_PASS = process.env.NEXT_PUBLIC_ADMIN_PASS || "lofthouse14";
const TTL_MS = 12 * 60 * 60 * 1000;

export type AuthSession = {
  user: string;
  createdAt: number;
};

export function login(user: string, pass: string): boolean {
  if (user.trim() !== DEFAULT_USER || pass !== DEFAULT_PASS) return false;
  const session: AuthSession = { user: user.trim(), createdAt: Date.now() };
  safeSet(KEYS.auth, session);
  return true;
}

export function logout() {
  safeRemove(KEYS.auth);
}

export function getSession(): AuthSession | null {
  const session = safeGet<AuthSession | null>(KEYS.auth, null);
  if (!session) return null;
  if (Date.now() - session.createdAt > TTL_MS) {
    safeRemove(KEYS.auth);
    return null;
  }
  return session;
}

export function isAuthed(): boolean {
  return !!getSession();
}
