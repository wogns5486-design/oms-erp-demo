"use client";

import { useHydration } from "@/stores/use-hydration";
import { Skeleton } from "@/components/ui/skeleton";

export function HydrationProvider({ children }: { children: React.ReactNode }) {
  const isReady = useHydration();

  if (!isReady) {
    return (
      <div className="flex h-screen w-full">
        <div className="w-64 bg-gray-900 p-4 space-y-4">
          <Skeleton className="h-8 w-40 bg-gray-700" />
          <div className="space-y-2 mt-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full bg-gray-700" />
            ))}
          </div>
        </div>
        <div className="flex-1 bg-gray-50 p-6 space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-lg" />
            ))}
          </div>
          <Skeleton className="h-64 rounded-lg" />
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
