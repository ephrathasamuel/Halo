import { Inbox } from 'lucide-react';

/**
 * Empty state component for when no data matches.
 * @param {{
 *   title?: string,
 *   message?: string,
 *   icon?: import('react').ComponentType<{ className?: string }>,
 *   children?: import('react').ReactNode
 * }} props
 */
export function EmptyState({
  title = 'Nothing here yet',
  message = 'Check back later or adjust your search.',
  icon: Icon = Inbox,
  children,
}) {
  // Older callers passed an emoji string; those get the default icon instead.
  const Glyph = typeof Icon === 'string' ? Inbox : Icon;
  return (
    <div className="flex flex-col items-center justify-center py-14 text-center">
      <span className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-halo-placeholder text-halo-text-muted">
        <Glyph className="h-6 w-6" strokeWidth={1.75} aria-hidden="true" />
      </span>
      <h3 className="text-base font-semibold text-halo-text mb-1">{title}</h3>
      <p className="text-sm text-halo-text-muted max-w-md">{message}</p>
      {children && <div className="mt-5">{children}</div>}
    </div>
  );
}
