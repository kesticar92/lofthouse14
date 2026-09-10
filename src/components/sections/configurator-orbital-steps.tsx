"use client";

import { useEffect, useState } from "react";
import {
  CalendarCheck,
  CheckCircle,
  Compass,
  House,
  Sparkle,
  Users,
} from "@phosphor-icons/react";
import { cn } from "@/lib/cn";

export const CONFIGURATOR_STEP_NODES = [
  { label: "Tu viaje", icon: Compass },
  { label: "Fechas", icon: CalendarCheck },
  { label: "Huéspedes", icon: Users },
  { label: "Loft", icon: House },
  { label: "Extras", icon: Sparkle },
  { label: "Confirmar", icon: CheckCircle },
] as const;

type ConfiguratorOrbitalStepsProps = {
  activeStep: number;
  /** Pasos cubiertos/saltados que deben verse oscurecidos aunque no se hayan visitado. */
  coveredSteps?: ReadonlySet<number> | number[];
  onStepSelect?: (index: number) => void;
  className?: string;
};

function isCovered(
  index: number,
  activeStep: number,
  coveredSteps?: ReadonlySet<number> | number[],
) {
  if (index < activeStep) return true;
  if (!coveredSteps) return false;
  if (Array.isArray(coveredSteps)) return coveredSteps.includes(index);
  return coveredSteps.has(index);
}

function StepGlyph({
  index,
  activeStep,
  covered,
  size = "md",
}: {
  index: number;
  activeStep: number;
  covered: boolean;
  size?: "sm" | "md";
}) {
  const node = CONFIGURATOR_STEP_NODES[index];
  const Icon = node.icon;
  const isActive = index === activeStep;
  const isDone = covered && !isActive;
  const dim = size === "sm";

  return (
    <>
      {isActive ? (
        <div className="absolute -inset-3 animate-pulse rounded-full bg-amber-500/25 blur-md" />
      ) : null}
      <div
        className={cn(
          "relative z-10 flex items-center justify-center rounded-full border transition-all duration-500",
          dim ? "h-10 w-10" : "h-11 w-11 sm:h-12 sm:w-12",
          isActive
            ? "scale-110 border-amber-400 bg-amber-600 text-white shadow-[0_0_24px_rgba(217,119,6,0.45)]"
            : isDone
              ? "border-zinc-800/80 bg-zinc-900 text-white dark:border-white/40 dark:bg-zinc-950 dark:text-white"
              : "border-zinc-200/80 bg-white/70 text-zinc-400 backdrop-blur-md dark:border-white/10 dark:bg-zinc-900/50 dark:text-zinc-500",
        )}
      >
        <Icon
          size={dim ? 18 : 22}
          weight={isActive || isDone ? "fill" : "regular"}
        />
      </div>
    </>
  );
}

/**
 * Fila horizontal permanente (desktop) / scroll compacto (móvil).
 * La animación orbital vive en `ConfiguratorOrbitalTransition`.
 */
export function ConfiguratorOrbitalSteps({
  activeStep,
  coveredSteps,
  onStepSelect,
  className,
}: ConfiguratorOrbitalStepsProps) {
  const total = CONFIGURATOR_STEP_NODES.length;

  return (
    <div
      className={cn("w-full max-w-2xl shrink-0", className)}
      aria-label={`Paso ${activeStep + 1} de ${total}: ${CONFIGURATOR_STEP_NODES[activeStep]?.label}`}
    >
      <ol
        className={cn(
          "flex items-start justify-between gap-1 sm:gap-2",
          "max-sm:-mx-1 max-sm:overflow-x-auto max-sm:px-1 max-sm:pb-1",
          "max-sm:[scrollbar-width:none] max-sm:[&::-webkit-scrollbar]:hidden",
        )}
      >
        {CONFIGURATOR_STEP_NODES.map((node, index) => {
          const isActive = index === activeStep;
          const covered = isCovered(index, activeStep, coveredSteps);
          // Solo pasos actuales o previos; no reabrir Tu viaje si quedó cubierto/saltado.
          const selectable =
            Boolean(onStepSelect) &&
            index <= activeStep &&
            !(index === 0 && covered && !isActive && activeStep > 0);

          return (
            <li
              key={node.label}
              className="flex min-w-[4.25rem] flex-1 flex-col items-center sm:min-w-0"
            >
              <button
                type="button"
                disabled={!selectable}
                onClick={() => selectable && onStepSelect?.(index)}
                className={cn(
                  "relative flex flex-col items-center transition-all duration-300",
                  selectable ? "cursor-pointer" : "cursor-default",
                )}
                aria-current={isActive ? "step" : undefined}
                title={node.label}
              >
                <StepGlyph
                  index={index}
                  activeStep={activeStep}
                  covered={covered}
                  size="sm"
                />
                <span
                  className={cn(
                    "mt-2 max-w-[4.75rem] text-center text-[9px] font-bold uppercase leading-tight tracking-wide sm:max-w-none sm:text-[10px]",
                    isActive
                      ? "text-amber-700 dark:text-amber-400"
                      : covered
                        ? "text-zinc-800 dark:text-zinc-200"
                        : "text-zinc-400/80",
                  )}
                >
                  {node.label}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

type OrbitalTransitionProps = {
  activeStep: number;
  coveredSteps?: ReadonlySet<number> | number[];
  className?: string;
};

/** Anillo orbital giratorio — solo para overlay de transición entre etapas. */
export function ConfiguratorOrbitalTransition({
  activeStep,
  coveredSteps,
  className,
}: OrbitalTransitionProps) {
  const total = CONFIGURATOR_STEP_NODES.length;
  const [rotationAngle, setRotationAngle] = useState(
    () => 270 - (activeStep / total) * 360,
  );

  useEffect(() => {
    const base = 270 - (activeStep / total) * 360;
    setRotationAngle(base);
    let frame = 0;
    let raf = 0;
    const tick = () => {
      frame += 1;
      setRotationAngle((prev) => prev + 1.2);
      if (frame < 70) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [activeStep, total]);

  const radius = 108;

  return (
    <div
      className={cn(
        "relative mx-auto flex h-[min(280px,72vw)] w-[min(280px,72vw)] items-center justify-center",
        className,
      )}
      aria-hidden
    >
      <div className="relative flex h-full w-full items-center justify-center">
        <div className="absolute h-[216px] w-[216px] rounded-full border border-zinc-300/80 dark:border-white/20" />

        <div className="absolute flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 shadow-[0_0_40px_rgba(245,158,11,0.35)]">
          <div className="absolute h-20 w-20 animate-ping rounded-full border border-amber-500/30 opacity-50" />
          <div className="flex h-8 w-8 items-center justify-center rounded-full border border-white/30 bg-white/20 backdrop-blur-md">
            <div className="h-2 w-2 rounded-full bg-white shadow-[0_0_10px_white]" />
          </div>
        </div>

        {CONFIGURATOR_STEP_NODES.map((node, index) => {
          const angle = ((index / total) * 360 + rotationAngle) % 360;
          const rad = (angle * Math.PI) / 180;
          const x = radius * Math.cos(rad);
          const y = radius * Math.sin(rad);
          const isActive = index === activeStep;
          const covered = isCovered(index, activeStep, coveredSteps);

          return (
            <div
              key={node.label}
              className="absolute flex flex-col items-center"
              style={{ transform: `translate(${x}px, ${y}px)` }}
            >
              <StepGlyph
                index={index}
                activeStep={activeStep}
                covered={covered}
              />
              <span
                className={cn(
                  "mt-2 max-w-[4.5rem] text-center text-[9px] font-bold uppercase leading-tight tracking-wide",
                  isActive
                    ? "text-amber-700 dark:text-amber-400"
                    : covered
                      ? "text-zinc-700 dark:text-zinc-200"
                      : "text-zinc-400",
                )}
              >
                {node.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
