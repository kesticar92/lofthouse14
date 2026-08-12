import Image from "next/image";
import { cn } from "@/lib/cn";

/** Icono «Compartir» de Material Symbols (mismo glifo que iOS: cuadrado + flecha). */
export function ShareIosIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 -960 960 960"
      className={cn("size-[1.15rem]", className)}
      aria-hidden
    >
      <path
        fill="currentColor"
        d="M240-80q-33 0-56.5-23.5T160-160v-400q0-33 23.5-56.5T240-640h120v80H240v400h480v-400H600v-80h120q33 0 56.5 23.5T800-560v400q0 33-23.5 56.5T720-80H240Zm200-240v-447l-64 64-56-57 160-160 160 160-56 57-64-64v447h-80Z"
      />
    </svg>
  );
}

/** Logo oficial Google Maps (2020), Wikimedia Commons. */
export function GoogleMapsIcon({ className }: { className?: string }) {
  return (
    <Image
      src="/logos/google-maps.svg"
      alt=""
      width={92}
      height={132}
      className={cn("h-[1.35rem] w-auto", className)}
      aria-hidden
    />
  );
}

/** Logo oficial WhatsApp, Wikimedia Commons. */
export function WhatsAppLogoIcon({ className }: { className?: string }) {
  return (
    <Image
      src="/logos/whatsapp.svg"
      alt=""
      width={176}
      height={176}
      className={cn("size-[1.35rem]", className)}
      aria-hidden
    />
  );
}
