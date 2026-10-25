/**
 * Loading spinner component.
 * @param {{ message?: string }} props
 */
export function LoadingState({ message = 'Loading' }) {
  return (
    <div className="flex flex-col items-center justify-center py-16" role="status">
      <div className="w-7 h-7 border-[3px] border-halo-border-strong border-t-halo-ink rounded-full animate-spin mb-3" />
      <p className="text-sm text-halo-text-muted">{message}</p>
    </div>
  );
}

/**
 * Card-shaped placeholders shown while listings load, so the page doesn't jump.
 * @param {{ count?: number }} props
 */
export function ListingGridSkeleton({ count = 6 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="animate-pulse">
          <div className="aspect-[4/3] rounded-xl bg-halo-placeholder" />
          <div className="mt-3 h-4 w-2/3 rounded bg-halo-placeholder" />
          <div className="mt-2 h-3 w-1/2 rounded bg-halo-placeholder" />
          <div className="mt-3 h-4 w-1/3 rounded bg-halo-placeholder" />
        </div>
      ))}
    </div>
  );
}
