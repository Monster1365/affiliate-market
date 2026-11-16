export function ProductGridSkeleton({ count = 10 }: { count?: number }) {
  return (
    <ul className="grid grid-cols-2 gap-x-2 gap-y-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5" aria-hidden>
      {Array.from({ length: count }, (_, i) => (
        <li key={i} className="flex flex-col gap-2 p-2">
          <div className="aspect-square animate-pulse rounded-lg bg-muted" />
          <div className="h-4 w-4/5 animate-pulse rounded bg-muted" />
          <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
        </li>
      ))}
    </ul>
  );
}

export function PageSkeleton() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <div className="mb-6 h-7 w-40 animate-pulse rounded bg-muted" />
      <ProductGridSkeleton />
    </div>
  );
}
