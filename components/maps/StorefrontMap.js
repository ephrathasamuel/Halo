'use client';

import dynamic from 'next/dynamic';
import { MapPin } from 'lucide-react';

const MapWithNoSSR = dynamic(() => import('./StorefrontMapInner'), {
  ssr: false,
  loading: () => <div className="w-full h-[260px] rounded-xl bg-halo-placeholder" aria-hidden="true" />,
});

/**
 * StorefrontMap with dynamic Leaflet loading and an always-visible text address.
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
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${safeLat},${safeLng}`;

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="h-[260px] w-full relative">
        <MapWithNoSSR latitude={safeLat} longitude={safeLng} title={title} neighbourhood={neighbourhood} />
      </div>

      {/* Text address for screen readers and when the map can't load */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-halo-ink">
          <MapPin className="h-4 w-4 text-halo-text-muted" aria-hidden="true" />
          {neighbourhood}, {city}
        </p>
        <a
          href={directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-semibold text-halo-ink underline underline-offset-2 min-h-[36px] inline-flex items-center"
        >
          Get directions
        </a>
      </div>
    </div>
  );
}
