"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { cn } from "@/lib/cn";

/** Segundos antes del fin del clip exterior para iniciar solape + crossfade al interior. */
const HANDOFF_LEAD_SEC = 1;
const CROSSFADE_MS = 900;

/**
 * Vista móvil: ciclo exterior → interior → exterior → … con crossfade entre clips.
 */
export function HeroMobileBackdrop() {
  const [showInterior, setShowInterior] = useState(false);
  const handoffStarted = useRef(false);
  const exteriorRef = useRef<HTMLVideoElement>(null);
  const interiorRef = useRef<HTMLVideoElement>(null);

  const startHandoff = useCallback(() => {
    if (handoffStarted.current) return;
    handoffStarted.current = true;
    const inn = interiorRef.current;
    if (inn) {
      inn.currentTime = 0;
      void inn.play().catch(() => {});
    }
    setShowInterior(true);
  }, []);

  const onInteriorEnded = useCallback(() => {
    const ext = exteriorRef.current;
    const inn = interiorRef.current;
    handoffStarted.current = false;
    setShowInterior(false);
    if (inn) {
      inn.pause();
      inn.currentTime = 0;
    }
    if (ext) {
      ext.currentTime = 0;
      void ext.play().catch(() => {});
    }
  }, []);

  const onExteriorTimeUpdate = useCallback(() => {
    const ext = exteriorRef.current;
    if (!ext || handoffStarted.current) return;
    const { duration, currentTime } = ext;
    if (!Number.isFinite(duration) || duration <= 0) return;
    if (duration - currentTime <= HANDOFF_LEAD_SEC) {
      startHandoff();
    }
  }, [startHandoff]);

  useEffect(() => {
    if (!showInterior) return;
    const id = window.setTimeout(() => {
      exteriorRef.current?.pause();
    }, CROSSFADE_MS + 120);
    return () => window.clearTimeout(id);
  }, [showInterior]);

  return (
    <div className="absolute inset-0 md:hidden">
      <video
        ref={exteriorRef}
        muted
        playsInline
        preload="auto"
        autoPlay
        onTimeUpdate={onExteriorTimeUpdate}
        aria-hidden={true}
        className={cn(
          "absolute inset-0 h-full w-full object-cover object-center transition-opacity duration-[900ms] ease-in-out motion-reduce:transition-none",
          showInterior ? "opacity-0" : "opacity-100",
        )}
      >
        <source src="/hero-mobile-exterior.mp4" type="video/mp4" />
        <source src="/hero-mobile-exterior.mov" type="video/quicktime" />
      </video>
      <video
        ref={interiorRef}
        muted
        playsInline
        preload="auto"
        onEnded={onInteriorEnded}
        aria-hidden={true}
        className={cn(
          "absolute inset-0 h-full w-full object-cover object-center transition-opacity duration-[900ms] ease-in-out motion-reduce:transition-none",
          showInterior ? "opacity-100" : "opacity-0",
        )}
      >
        <source src="/hero-mobile.mp4" type="video/mp4" />
        <source src="/hero-mobile.mov" type="video/quicktime" />
      </video>
    </div>
  );
}
