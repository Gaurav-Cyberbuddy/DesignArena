import { Skeleton } from "@/components/ui/skeleton";

export default function GalleryLoading() {
  return (
    <div className="space-y-8">
      <Skeleton className="h-10 w-64" />
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="aspect-[4/3] rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
