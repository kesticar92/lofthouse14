"use client";

import { useEffect, useState } from "react";
import {
  CalendarCheck,
  CheckCircle,
  Compass,
  Sparkle,
  Users,
} from "@phosphor-icons/react";
import { cn } from "@/lib/cn";

const NODES = [
  { label: "Tu viaje", icon: Compass },
  { label: "Fechas", icon: CalendarCheck },
  { label: "Huéspedes", icon: Users },
  { label: "Extras", icon: Sparkle },
  { label: "Confirmar", icon: CheckCircle },
] as const;

type ConfiguratorOrbitalStepsProps = {
  activeStep: number;
  onStepSelect?: (index: number) => void;
  className?: string;
};

export function ConfiguratorOrbitalSteps({
  activeStep,
  onStepSelect,
  className,
}: ConfiguratorOrbitalStepsProps) {
  const [rotationAngle, setRotationAngle] = useState(0);
  const total = NODES.length;

  useEffect(() => {
    setRotationAngle(270 - (activeStep / total) * 360);
  }, [activeStep, total]);

  const radius = 108;

  return (
    <div
      className={cn(
        "relative mx-auto flex h-[min(280px,72vw)] w-[min(280px,72vw)] shrink-0 items-center justify-center",
        className,
      )}
      aria-label={`Paso ${activeStep + 1} de ${total}: ${NODES[activeStep]?.label}`}
    >
      <div className="relative flex h-full w-full items-center justify-center">
        <div className="absolute h-[216px] w-[216px] rounded-full border border-zinc-300/80 dark:border-white/10" />

        <div className="absolute flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 shadow-[0_0_40px_rgba(245,158,11,0.35)]">
          <div className="absolute h-20 w-20 animate-ping rounded-full border border-amber-500/30 opacity-50" />
          <div className="flex h-8 w-8 items-center justify-center rounded-full border border-white/30 bg-white/20 backdrop-blur-md">
            <div className="h-2 w-2 rounded-full bg-white shadow-[0_0_10px_white]" />
          </div>
        </div>

        {NODES.map((node, index) => {
          const angle = ((index / total) * 360 + rotationAngle) % 360;
          const rad = (angle * Math.PI) / 180;
          const x = radius * Math.cos(rad);
          const y = radius * Math.sin(rad);
          const isActive = index === activeStep;
          const isDone = index < activeStep;
          const Icon = node.icon;
          const canSelect = onStepSelect && index <= activeStep;

          return (
            <button
              key={node.label}
              type="button"
              disabled={!canSelect}
              onClick={() => canSelect && onStepSelect(index)}
              className={cn(
                "absolute flex flex-col items-center transition-all duration-700",
                canSelect ? "cursor-pointer" : "cursor-default",
              )}
              style={{
                transform: `translate(${x}px, ${y}px)`,
              }}
              aria-current={isActive ? "step" : undefined}
              title={node.label}
            >
              {isActive ? (
                <div className="absolute -inset-4 animate-pulse rounded-full bg-amber-500/25 blur-md" />
              ) : null}
              <div
                className={cn(
                  "relative z-10 flex h-11 w-11 items-center justify-center rounded-full border transition-all duration-500 sm:h-12 sm:w-12",
                  isActive
                    ? "scale-110 border-amber-400 bg-amber-600 text-white shadow-[0_0_24px_rgba(217,119,6,0.45)]"
                    : isDone
                      ? "border-amber-500/40 bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                      : "border-zinc-200 bg-white/90 text-zinc-600 backdrop-blur-md dark:border-white/10 dark:bg-zinc-900/80 dark:text-zinc-300",
                )}
              >
                <Icon size={22} weight={isActive || isDone ? "fill" : "regular"} />
              </div>
              <span
                className={cn(
                  "mt-2 max-w-[4.5rem] text-center text-[9px] font-bold uppercase leading-tight tracking-wide sm:max-w-none sm:text-[10px]",
                  isActive
                    ? "text-amber-700 dark:text-amber-400"
                    : isDone
                      ? "text-zinc-700 dark:text-zinc-200"
                      : "text-zinc-400",
                )}
              >
                {node.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
