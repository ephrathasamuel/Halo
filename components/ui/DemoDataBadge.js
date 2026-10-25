'use client';

/**
 * Visual badge indicating that the site runs in demo data mode.
 */
export function DemoDataBadge() {
  return (
    <div
      className="fixed bottom-4 right-4 z-50 bg-amber-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5"
      role="status"
      aria-label="This site uses demo data"
    >
      <span className="inline-block w-2 h-2 bg-white rounded-full animate-pulse" />
      Demo Data
    </div>
  );
}
