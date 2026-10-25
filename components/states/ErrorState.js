import { AlertTriangle } from 'lucide-react';

/**
 * Error state component.
 * @param {{ title?: string, message?: string, onRetry?: () => void }} props
 */
export function ErrorState({ title = 'Something went wrong', message = 'Please try again.', onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center py-14 text-center">
      <span className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-halo-error">
        <AlertTriangle className="h-6 w-6" strokeWidth={1.75} aria-hidden="true" />
      </span>
      <h3 className="text-base font-semibold text-halo-text mb-1">{title}</h3>
      <p className="text-sm text-halo-text-muted max-w-md mb-4">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-halo-ink text-white rounded-lg text-sm font-semibold hover:bg-halo-ink-soft transition-colors min-h-[44px]"
        >
          Try again
        </button>
      )}
    </div>
  );
}
