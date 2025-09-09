interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div 
      className={`animate-pulse bg-muted rounded-md ${className || ''}`}
      data-testid="skeleton"
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="border border-border rounded-lg p-6 space-y-4">
      <div className="flex items-center space-x-4">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-[200px]" />
          <Skeleton className="h-4 w-[160px]" />
        </div>
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-[80%]" />
      </div>
    </div>
  );
}

export function FormSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-6 w-[150px]" />
        <Skeleton className="h-4 w-[250px]" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-6 w-[180px]" />
        <Skeleton className="h-4 w-[200px]" />
        <Skeleton className="h-24 w-full" />
      </div>
    </div>
  );
}

export function ResultsSkeleton() {
  return (
    <div className="space-y-8">
      {/* Header skeleton */}
      <div className="text-center space-y-4">
        <Skeleton className="h-8 w-[300px] mx-auto" />
        <div className="flex justify-center gap-4">
          <Skeleton className="h-8 w-[120px]" />
          <Skeleton className="h-8 w-[140px]" />
        </div>
        <Skeleton className="h-4 w-[400px] mx-auto" />
      </div>
      
      {/* Cards skeleton */}
      <div className="grid gap-6">
        <CardSkeleton />
        <div className="grid lg:grid-cols-2 gap-6">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    </div>
  );
}

export function QuestionSkeleton() {
  return (
    <div className="border border-border rounded-lg p-6 space-y-4">
      <Skeleton className="h-6 w-[80%]" />
      <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
        <Skeleton className="h-12 w-[100px]" />
        <Skeleton className="h-12 w-[100px]" />
        <Skeleton className="h-12 w-[100px]" />
      </div>
    </div>
  );
}