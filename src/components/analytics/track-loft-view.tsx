"use client";

import { useEffect } from "react";
import { trackViewItem } from "@/lib/analytics";

export function TrackLoftView({ id, name }: { id: string; name: string }) {
  useEffect(() => {
    trackViewItem(id, name);
  }, [id, name]);
  return null;
}
