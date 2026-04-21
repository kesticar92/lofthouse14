import { cn } from "@/lib/cn";

export function GlassPanel({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-black/10 bg-white/55 p-6 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.25)] backdrop-blur-xl dark:border-white/10 dark:bg-zinc-950/45 dark:shadow-[0_8px_40px_-12px_rgba(0,0,0,0.65)]",
        className,
      )}
    >
      {children}
    </div>
  );
}
