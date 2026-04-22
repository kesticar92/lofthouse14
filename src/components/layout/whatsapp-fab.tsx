"use client";

import { motion } from "framer-motion";
import { waLink, site } from "@/lib/site";

export function WhatsAppFab() {
  return (
    <motion.a
      href={waLink()}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ scale: 1, opacity: 1 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 18 }}
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.96 }}
      className="fixed bottom-5 right-5 z-[60] flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg shadow-emerald-900/30 ring-2 ring-white/30 dark:ring-black/30"
      aria-label={`Reservar por WhatsApp — ${site.name}`}
    >
      <svg viewBox="0 0 32 32" className="h-8 w-8" aria-hidden>
        <path
          fill="currentColor"
          d="M16.003 3.2C9.372 3.2 4 8.572 4 15.2c0 2.232.584 4.344 1.6 6.184L4 28.8l7.616-1.992a12.88 12.88 0 006.384 1.688h.008c6.632 0 12-5.368 12-12 0-6.624-5.368-12-12-12zm0 2.4c5.304 0 9.6 4.296 9.6 9.6 0 5.304-4.296 9.6-9.6 9.6a10.56 10.56 0 01-5.392-1.48l-.384-.224-4.448 1.168 1.184-4.336-.24-.384A9.52 9.52 0 016.4 15.2c0-5.304 4.296-9.6 9.6-9.6zm5.44 4.16c-.144-.408-.832-.216-1.92.216-.528.216-1.008.336-1.472.352-.384 0-.8-.112-1.232-.336-.848-.432-1.76-.616-2.48-.432-1.36.304-2.368 1.68-2.368 3.008 0 .848.496 1.888 1.408 2.944.992 1.152 2.4 2.16 3.84 2.752 1.92.8 3.36.992 4.032.688.304-.128.528-.368.656-.704.128-.336.064-.624-.064-.832-.128-.208-.304-.368-.512-.528-.208-.16-.432-.336-.64-.512-.208-.176-.368-.352-.48-.528-.112-.176-.064-.4.064-.576.128-.176.288-.352.448-.528.16-.176.32-.352.432-.528.112-.176.176-.352.128-.576-.048-.224-.192-.448-.432-.624z"
        />
      </svg>
    </motion.a>
  );
}
