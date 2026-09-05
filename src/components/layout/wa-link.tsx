"use client";

import { trackWhatsApp } from "@/lib/analytics";
import { waLink } from "@/lib/site";
import { cn } from "@/lib/cn";
import type { AnchorHTMLAttributes } from "react";

export function WaLink({
  message,
  placement,
  className,
  children,
  ...rest
}: {
  message?: string;
  placement: string;
} & AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <a
      {...rest}
      href={waLink(message)}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => trackWhatsApp(placement)}
      className={cn(className)}
    >
      {children}
    </a>
  );
}
