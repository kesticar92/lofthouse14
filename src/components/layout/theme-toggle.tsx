"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <span className="inline-flex h-10 w-10 rounded-full border border-[#1c1917]/18 bg-[#ebe6dc] dark:border-[#f2f0eb]/15 dark:bg-[#1c1917]" />
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.95 }}
      aria-label={isDark ? "Activar modo claro" : "Activar modo oscuro"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#1c1917]/18 bg-[#ebe6dc] text-sm font-medium text-[#141210] transition hover:bg-[#e2dccf] dark:border-[#f2f0eb]/15 dark:bg-[#1c1917] dark:text-[#f2f0eb] dark:hover:bg-[#25211d]"
    >
      {isDark ? "☀︎" : "☾"}
    </motion.button>
  );
}
