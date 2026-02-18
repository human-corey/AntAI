import { cn } from "@/lib/utils/cn";

export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-xl border border-[var(--border)] bg-[var(--card)] p-5", className)}>
      <div className="animate-shimmer h-4 w-3/4 rounded mb-3" />
      <div className="animate-shimmer h-3 w-full rounded mb-2" />
      <div className="animate-shimmer h-3 w-1/2 rounded mb-4" />
      <div className="flex gap-2">
        <div className="animate-shimmer h-5 w-16 rounded-full" />
        <div className="animate-shimmer h-5 w-12 rounded-full" />
      </div>
    </div>
  );
}

export function GridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} className="h-48" />
      ))}
    </div>
  );
}
