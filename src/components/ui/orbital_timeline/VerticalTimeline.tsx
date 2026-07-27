// src/components/ui/orbital_timeline/VerticalTimeline.tsx
"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "./cards";
import { Badge } from "./badge";
import { cn } from "@/lib/cn";
import { TimelineItem } from "./RadialOrbitalTimeline";
import { Clock as ClockIcon, ArrowRight as ArrowRightIcon } from "@phosphor-icons/react";

/**
 * Simple vertical timeline for mobile devices.
 * Receives the same timelineData as the orbital view and renders
 * a stacked list of cards with a connecting line.
 */
export default function VerticalTimeline({
  timelineData,
}: {
  timelineData: TimelineItem[];
}) {
  return (
    <div className="relative max-w-2xl mx-auto py-8">
      {/* Vertical line */}
      <div className="absolute left-8 top-0 w-px h-full bg-zinc-200 dark:bg-zinc-700" />
      {timelineData.map((item) => (
        <div key={item.id} className="relative flex items-start mb-12 last:mb-0">
          {/* Circle connector */}
          <div
            className={cn(
              "flex items-center justify-center w-6 h-6 rounded-full ring-2 ring-amber-500",
              item.status === "completed" ? "bg-amber-500" : "bg-white dark:bg-zinc-800"
            )}
          >
            {/* Icon placeholder */}
            <item.icon
              size={16}
              className={cn(
                "text-white",
                item.status === "completed" ? "" : "text-amber-500"
              )}
            />
          </div>
          <div className="ml-4 flex-1">
            <Card className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <Badge className="bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
                    Paso {item.id}
                  </Badge>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">
                    {item.date}
                  </span>
                </div>
                <CardTitle className="mt-2 text-lg font-semibold text-zinc-900 dark:text-white">
                  {item.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-zinc-600 dark:text-zinc-300">
                  {item.content}
                </p>
                {item.relatedIds.length > 0 && (
                  <CardFooter className="flex flex-wrap gap-2 mt-2">
                    {item.relatedIds.map((relId) => {
                      const related = timelineData.find((i) => i.id === relId);
                      if (!related) return null;
                      return (
                        <button
                          key={relId}
                          onClick={() => {}}
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-amber-600 bg-amber-50 rounded hover:bg-amber-100"
                        >
                          {related.title}
                          <ArrowRightIcon size={12} weight="bold" />
                        </button>
                      );
                    })}
                  </CardFooter>
                )}
                <div className="mt-2 flex items-center text-xs text-zinc-500 dark:text-zinc-400">
                  <ClockIcon size={14} className="mr-1" />
                  {item.duration}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      ))}
    </div>
  );
}
