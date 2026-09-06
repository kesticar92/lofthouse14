"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/cn";

export function ThemeToggle({ className }: { className?: string }) {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <span
        className={cn(
          "inline-flex h-9 w-9 rounded-full border border-black/10 dark:border-white/10 sm:h-10 sm:w-10",
          className,
        )}
      />
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.95 }}
      aria-label={isDark ? "Activar modo claro" : "Activar modo oscuro"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-full border border-black/10 bg-white/70 text-sm font-medium backdrop-blur-md transition hover:bg-white dark:border-white/10 dark:bg-zinc-900/70 dark:hover:bg-zinc-900 sm:h-10 sm:w-10",
        className,
      )}
    >
      {isDark ? "☀︎" : "☾"}
    </motion.button>
  );
}
