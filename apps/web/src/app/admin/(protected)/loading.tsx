import { Skeleton } from "@repo/ui/components/skeleton";

export default function AdminLoading() {
  return (
    <div className="space-y-6" role="status" aria-label="Cargando">
      <div className="space-y-2">
        <Skeleton className="h-9 w-56" />
        <Skeleton className="h-5 w-80 max-w-full" />
      </div>
      <Skeleton className="h-10 w-full max-w-xs" />
      <div className="space-y-3">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    </div>
  );
}
