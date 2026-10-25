/**
 * Empty state component for when no data matches.
 * @param {{ title?: string, message?: string, icon?: string }} props
 */
export function EmptyState({ title = 'Nothing here yet', message = 'Check back later or adjust your search.', icon = '📭' }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <span className="text-5xl mb-4" role="img" aria-hidden="true">{icon}</span>
      <h3 className="text-lg font-semibold text-halo-text mb-1">{title}</h3>
      <p className="text-sm text-halo-text-muted max-w-md">{message}</p>
    </div>
  );
}
