/**
 * Loading spinner component.
 * @param {{ message?: string }} props
 */
export function LoadingState({ message = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="w-8 h-8 border-4 border-halo-primary border-t-transparent rounded-full animate-spin mb-4" role="status">
        <span className="sr-only">{message}</span>
      </div>
      <p className="text-sm text-halo-text-muted">{message}</p>
    </div>
  );
}
