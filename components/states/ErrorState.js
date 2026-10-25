/**
 * Error state component.
 * @param {{ title?: string, message?: string, onRetry?: () => void }} props
 */
export function ErrorState({ title = 'Something went wrong', message = 'Please try again.', onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <span className="text-5xl mb-4" role="img" aria-hidden="true">⚠️</span>
      <h3 className="text-lg font-semibold text-halo-error mb-1">{title}</h3>
      <p className="text-sm text-halo-text-muted max-w-md mb-4">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-halo-primary text-white rounded-md hover:bg-halo-primary-light transition-colors min-h-[44px]"
        >
          Try Again
        </button>
      )}
    </div>
  );
}
