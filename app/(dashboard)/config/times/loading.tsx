import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-9 w-[140px]" />
          <Skeleton className="h-4 w-[280px]" />
        </div>
        <Skeleton className="h-10 w-[120px]" />
      </div>
      <Skeleton className="h-[300px] w-full rounded-3xl" />
    </div>
  );
}
