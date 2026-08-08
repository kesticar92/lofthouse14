"use client";
import { useState, useEffect, useRef } from "react";
import {
  ArrowRightIcon,
  LinkIcon,
  ClockIcon,
  WhatsappLogo,
} from "@phosphor-icons/react";
import { Badge } from "./badge";
import { Button } from "./button";
import { Card, CardContent, CardHeader, CardTitle } from "./cards";
import { cn } from "@/lib/cn";
import { waLink } from "@/lib/site";

export interface TimelineItem {
  id: number;
  title: string;
  date: string;
  content: string;
  category: string;
  icon: React.ElementType;
  relatedIds: number[];
  status: "completed" | "in-progress" | "pending";
  duration: string;
}

interface RadialOrbitalTimelineProps {
  timelineData: TimelineItem[];
}

import useMediaQuery from "@/hooks/useMediaQuery";
import VerticalTimeline from "./VerticalTimeline";

export default function RadialOrbitalTimeline({
  timelineData,
}: RadialOrbitalTimelineProps) {
  const [expandedItems, setExpandedItems] = useState<Record<number, boolean>>(
    {},
  );

  const isMobile = useMediaQuery("(max-width: 1024px)");

  const [viewMode] = useState<"orbital">("orbital");
  const [rotationAngle, setRotationAngle] = useState<number>(0);
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const [pulseEffect, setPulseEffect] = useState<Record<number, boolean>>({});
  const [centerOffset] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });
  const [activeNodeId, setActiveNodeId] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const orbitRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<Record<number, HTMLDivElement | null>>({});

  useEffect(() => {
    let rotationTimer: NodeJS.Timeout;

    if (autoRotate && viewMode === "orbital") {
      rotationTimer = setInterval(() => {
        setRotationAngle((prev) => {
          const newAngle = (prev + 0.25) % 360;
          return Number(newAngle.toFixed(3));
        });
      }, 50);
    }

    return () => {
      if (rotationTimer) {
        clearInterval(rotationTimer);
      }
    };
  }, [autoRotate, viewMode]);

  const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === containerRef.current || e.target === orbitRef.current) {
      setExpandedItems({});
      setActiveNodeId(null);
      setPulseEffect({});
      setAutoRotate(true);
    }
  };

  const toggleItem = (id: number) => {
    setExpandedItems((prev) => {
      const newState = { ...prev };
      Object.keys(newState).forEach((key) => {
        if (parseInt(key) !== id) {
          newState[parseInt(key)] = false;
        }
      });

      newState[id] = !prev[id];

      if (!prev[id]) {
        setActiveNodeId(id);
        setAutoRotate(false);

        const relatedItems = getRelatedItems(id);
        const newPulseEffect: Record<number, boolean> = {};
        relatedItems.forEach((relId) => {
          newPulseEffect[relId] = true;
        });
        setPulseEffect(newPulseEffect);

        centerViewOnNode(id);
      } else {
        setActiveNodeId(null);
        setAutoRotate(true);
        setPulseEffect({});
      }

      return newState;
    });
  };

  const centerViewOnNode = (nodeId: number) => {
    if (viewMode !== "orbital" || !nodeRefs.current[nodeId]) return;

    const nodeIndex = timelineData.findIndex((item) => item.id === nodeId);
    const totalNodes = timelineData.length;
    const targetAngle = (nodeIndex / totalNodes) * 360;

    setRotationAngle(270 - targetAngle);
  };

  const calculateNodePosition = (index: number, total: number) => {
    const angle = ((index / total) * 360 + rotationAngle) % 360;
    const radius = 240;
    const radian = (angle * Math.PI) / 180;

    const x = parseFloat(
      (radius * Math.cos(radian) + centerOffset.x).toFixed(3),
    );
    const y = parseFloat(
      (radius * Math.sin(radian) + centerOffset.y).toFixed(3),
    );

    const zIndex = Math.round(100 + 50 * Math.cos(radian));

    const opacity = parseFloat(
      Math.max(
        0.8,
        Math.min(1, 0.8 + 0.2 * ((1 + Math.sin(radian)) / 2)),
      ).toFixed(3),
    );

    return { x, y, angle, zIndex, opacity };
  };

  const getRelatedItems = (itemId: number): number[] => {
    const currentItem = timelineData.find((item) => item.id === itemId);
    return currentItem ? currentItem.relatedIds : [];
  };

  const isRelatedToActive = (itemId: number): boolean => {
    if (!activeNodeId) return false;
    const relatedItems = getRelatedItems(activeNodeId);
    return relatedItems.includes(itemId);
  };

  return isMobile ? (
    <VerticalTimeline timelineData={timelineData} />
  ) : (
    <div
      className="w-full h-full flex flex-col items-center justify-center bg-transparent overflow-visible"
      ref={containerRef}
      onClick={handleContainerClick}
    >
      <div className="relative w-full max-w-4xl h-full flex items-center justify-center pointer-events-none">
        <div
          className="absolute w-full h-full flex items-center justify-center pointer-events-auto"
          ref={orbitRef}
          style={{
            perspective: "1200px",
          }}
        >
          {/* Central Orb - Branded Style */}
          <div className="absolute w-24 h-24 rounded-full bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 dark:from-amber-600 dark:via-amber-500 dark:to-amber-400 animate-pulse flex items-center justify-center z-10 shadow-[0_0_50px_rgba(245,158,11,0.4)]">
            <div className="absolute w-28 h-28 rounded-full border border-amber-500/30 animate-ping opacity-60"></div>
            <div
              className="absolute w-36 h-36 rounded-full border border-amber-500/20 animate-ping opacity-40"
              style={{ animationDelay: "0.5s" }}
            ></div>
            <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
              <div className="w-2.5 h-2.5 rounded-full bg-white shadow-[0_0_12px_white]"></div>
            </div>
          </div>

          {/* Orbit Ring */}
          <div className="absolute w-[480px] h-[480px] rounded-full border border-zinc-200 dark:border-white/5 opacity-40"></div>

          {timelineData.map((item, index) => {
            const position = calculateNodePosition(index, timelineData.length);
            const isExpanded = expandedItems[item.id];
            const isRelated = isRelatedToActive(item.id);
            const isPulsing = pulseEffect[item.id];
            const isFirstStep = item.id === 1;
            const Icon = item.icon;

            const nodeStyle = {
              transform: `translate(${position.x}px, ${position.y}px)`,
              zIndex: isExpanded ? 200 : position.zIndex,
              opacity: isExpanded ? 1 : position.opacity,
            };

            return (
              <div
                key={item.id}
                ref={(el) => {
                  nodeRefs.current[item.id] = el;
                }}
                className="absolute transition-all duration-700 cursor-pointer"
                style={nodeStyle}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleItem(item.id);
                }}
              >
                {/* Special Glow for Step 1 */}
                {isFirstStep && (
                  <div className="absolute inset-0 -m-8 rounded-full bg-amber-500/20 blur-2xl animate-pulse z-0" />
                )}

                {/* Interaction Pulse Effect */}
                <div
                  className={cn(
                    "absolute rounded-full -inset-2 transition-opacity duration-700",
                    isPulsing || (isFirstStep && !activeNodeId)
                      ? "animate-pulse opacity-100"
                      : "opacity-0",
                  )}
                  style={{
                    background: `radial-gradient(circle, rgba(245,158,11,0.3) 0%, rgba(245,158,11,0) 70%)`,
                    width: `96px`,
                    height: `96px`,
                    left: `-24px`,
                    top: `-24px`,
                  }}
                ></div>

                {/* Node Orb - Styled like site icons/buttons */}
                <div
                  className={cn(
                    "w-14 h-14 rounded-full flex items-center justify-center transition-all duration-500 transform border relative z-10",
                    isExpanded
                      ? "bg-amber-600 text-white scale-125 shadow-[0_0_30px_rgba(217,119,6,0.5)] border-amber-400"
                      : isRelated
                        ? "bg-zinc-900 text-white border-amber-500/50 dark:bg-white dark:text-zinc-950"
                        : isFirstStep
                          ? "bg-amber-600 text-white border-amber-400 shadow-[0_0_20px_rgba(217,119,6,0.3)]"
                          : "bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md text-zinc-800 dark:text-zinc-200 border-zinc-200 dark:border-white/10 shadow-sm",
                    isRelated && !isExpanded && "animate-pulse",
                  )}
                >
                  <Icon
                    size={26}
                    weight={
                      isExpanded || isRelated || isFirstStep
                        ? "fill"
                        : "regular"
                    }
                  />
                </div>

                {/* Node Label */}
                <div
                  className={cn(
                    "absolute top-16 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-bold tracking-[0.2em] transition-all duration-300 uppercase",
                    isExpanded
                      ? "text-amber-600 dark:text-amber-500 scale-110 opacity-100"
                      : isFirstStep
                        ? "text-amber-700 dark:text-amber-400 opacity-100"
                        : "text-zinc-500 dark:text-zinc-400 opacity-80",
                  )}
                >
                  {item.title}
                </div>

                {/* Expanded Card - Glass Style */}
                {isExpanded && (
                  <Card className="absolute top-20 left-1/2 -translate-x-1/2 w-72 bg-white/95 dark:bg-black/80 backdrop-blur-xl border border-zinc-200 dark:border-white/10 shadow-2xl overflow-visible z-[300] rounded-2xl p-1">
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-px h-3 bg-amber-500/50"></div>
                    <CardHeader className="pb-3 pt-5 px-5">
                      <div className="flex justify-between items-center mb-1">
                        <Badge className="px-2.5 py-0.5 text-[9px] font-bold tracking-[0.1em] rounded-full border-none bg-amber-500/10 text-amber-600 dark:text-amber-400">
                          PASO {item.id}
                        </Badge>
                        <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-[0.2em]">
                          {item.date}
                        </span>
                      </div>
                      <CardTitle className="text-lg font-display tracking-wide text-zinc-900 dark:text-white">
                        {item.title.toUpperCase()}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-5 pb-6">
                      <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
                        {item.content}
                      </p>

                      {/* WhatsApp Button for Step 1 */}
                      {isFirstStep && (
                        <div className="mt-5">
                          <Button
                            asChild
                            className="w-full bg-[#25D366] hover:bg-[#20ba5a] text-white font-bold tracking-wide rounded-xl py-6 shadow-lg shadow-emerald-500/20 group transition-all"
                          >
                            <a
                              href={waLink()}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-center gap-2"
                            >
                              <WhatsappLogo
                                size={20}
                                weight="fill"
                                className="group-hover:scale-110 transition-transform"
                              />
                              ESCRIBIR A WHATSAPP
                            </a>
                          </Button>
                        </div>
                      )}

                      {/* Time Duration Section */}
                      <div className="mt-5 pt-4 border-t border-zinc-100 dark:border-white/5">
                        <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-400">
                          <span className="flex items-center gap-1.5">
                            <ClockIcon
                              size={14}
                              className="text-amber-500"
                              weight="fill"
                            />
                            Tiempo estimado
                          </span>
                          <span className="text-amber-600 dark:text-amber-400 font-mono">
                            {item.duration}
                          </span>
                        </div>
                      </div>

                      {item.relatedIds.length > 0 && !isFirstStep && (
                        <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-white/5">
                          <div className="flex items-center mb-3">
                            <LinkIcon
                              size={14}
                              className="text-zinc-400 mr-1.5"
                            />
                            <h4 className="text-[9px] uppercase tracking-[0.2em] font-bold text-zinc-400">
                              Siguiente Paso
                            </h4>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {item.relatedIds.map((relatedId) => {
                              const relatedItem = timelineData.find(
                                (i) => i.id === relatedId,
                              );
                              if (!relatedItem || relatedItem.id <= item.id)
                                return null;
                              return (
                                <Button
                                  key={relatedId}
                                  variant="outline"
                                  size="sm"
                                  className="flex items-center h-9 px-4 text-[10px] rounded-full border-zinc-200 dark:border-white/10 bg-transparent hover:bg-amber-600 hover:text-white hover:border-amber-600 transition-all font-bold tracking-[0.1em]"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleItem(relatedId);
                                  }}
                                >
                                  {relatedItem?.title.toUpperCase()}
                                  <ArrowRightIcon
                                    size={12}
                                    className="ml-1.5"
                                  />
                                </Button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
