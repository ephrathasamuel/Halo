'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default Leaflet icon paths in bundlers (copies served from public/images)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: '/images/marker-icon-2x.png',
  iconUrl: '/images/marker-icon.png',
  shadowUrl: '/images/marker-shadow.png',
});

/**
 * Inner Leaflet map component initialized on the client.
 * @param {{
 *   latitude: number,
 *   longitude: number,
 *   title: string,
 *   neighbourhood?: string,
 *   city?: string,
 *   zoom?: number
 * }} props
 */
export default function StorefrontMapInner({
  latitude,
  longitude,
  title,
  neighbourhood = '',
  city = '',
  zoom = 15,
}) {
  const containerRef = useRef(null);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;
    if (mapInstanceRef.current) return;

    const lat = Number(latitude) || 9.0054;
    const lng = Number(longitude) || 38.7636;

    const map = L.map(containerRef.current, {
      scrollWheelZoom: false,
    }).setView([lat, lng], zoom);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    const marker = L.marker([lat, lng]).addTo(map);
    // Built from DOM nodes, not an HTML string: provider names are user input
    const popup = document.createElement('div');
    const name = document.createElement('strong');
    name.textContent = title;
    popup.append(name, document.createElement('br'), `${neighbourhood}, ${city}`);
    marker.bindPopup(popup).openPopup();

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [latitude, longitude, title, neighbourhood, city, zoom]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full min-h-[260px] rounded-xl overflow-hidden border border-halo-border z-0"
      aria-label={`Interactive map showing location of ${title}`}
      role="application"
    />
  );
}
