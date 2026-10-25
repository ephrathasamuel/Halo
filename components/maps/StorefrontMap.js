'use client';

import dynamic from 'next/dynamic';

const MapWithNoSSR = dynamic(() => import('./StorefrontMapInner'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[260px] bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 text-sm border border-slate-200">
      <span className="flex items-center gap-2">
        <span className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
        Loading map preview...
      </span>
    </div>
  ),
});

/**
 * StorefrontMap with dynamic Leaflet loading and permanent text fallback.
 * @param {{
 *   latitude: number,
 *   longitude: number,
 *   title: string,
 *   neighbourhood?: string,
 *   city?: string,
 *   className?: string
 * }} props
 */
export function StorefrontMap({
  latitude,
  longitude,
  title,
  neighbourhood = 'Bole',
  city = 'Addis Ababa',
  className = '',
}) {
  const safeLat = typeof latitude === 'number' ? latitude : 9.0054;
  const safeLng = typeof longitude === 'number' ? longitude : 38.7636;

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Dynamic Leaflet Map (client-only) */}
      <div className="h-[260px] w-full relative">
        <MapWithNoSSR
          latitude={safeLat}
          longitude={safeLng}
          title={title}
          neighbourhood={neighbourhood}
        />
      </div>

      {/* Accessible text fallback - ALWAYS VISIBLE */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 text-sm space-y-1">
        <div className="flex items-start gap-2 text-slate-800 font-medium">
          <span className="text-amber-600 select-none" aria-hidden="true">📍</span>
          <span>
            {neighbourhood}, {city}
          </span>
        </div>
        <p className="text-xs text-slate-500 font-mono pl-6">
          Coordinates: {safeLat.toFixed(4)}° N, {safeLng.toFixed(4)}° E
        </p>
        <p className="text-xs text-amber-700 bg-amber-50 rounded px-2 py-1 mt-1 inline-block">
          Simulation: Coordinates and location points are seeded for demonstration in Addis Ababa.
        </p>
      </div>
    </div>
  );
}
