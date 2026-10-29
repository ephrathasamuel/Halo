/*
 * Place search inside a city: neighbourhoods, streets and landmarks, for the
 * "Area" a provider works from. Uses Photon (https://photon.komoot.io), a free
 * search over OpenStreetMap data (ODbL; credit shown under the suggestions).
 *
 * Photon is fair-use with no key or guarantee. With heavy traffic, point
 * PLACES_URL at a self-hosted Photon or swap this one function for a paid
 * service (Geoapify, Mapbox, Google Places); callers only see `searchPlaces`.
 */

const PLACES_URL = 'https://photon.komoot.io/api/';
const CITY_RADIUS = 0.25; // degrees around the city centre, about 25 km

/** Words shown under each suggestion, from OpenStreetMap's place types */
const KIND = {
  suburb: 'Neighbourhood',
  neighbourhood: 'Neighbourhood',
  quarter: 'Neighbourhood',
  administrative: 'District',
  village: 'Area',
  hamlet: 'Area',
  locality: 'Area',
  commercial: 'Business area',
  industrial: 'Industrial area',
  retail: 'Shopping area',
  mall: 'Mall',
};

/**
 * @typedef {{ name: string, detail: string, lat: number, lng: number }} Place
 */

/**
 * Places matching `query` in one city.
 * @param {string} query at least 2 characters
 * @param {{ city: string, coords?: { lat: number, lng: number } | null, signal?: AbortSignal }} where
 * @returns {Promise<Place[]>}
 */
export async function searchPlaces(query, { city, coords, signal }) {
  const q = String(query || '').trim();
  if (q.length < 2) return [];

  const params = new URLSearchParams({ q, limit: '10', lang: 'en' });
  if (coords) {
    params.set('lat', String(coords.lat));
    params.set('lon', String(coords.lng));
    const r = CITY_RADIUS;
    params.set('bbox', [coords.lng - r, coords.lat - r, coords.lng + r, coords.lat + r].join(','));
  } else {
    // No centre known: the city's name in the query keeps results local
    params.set('q', `${q}, ${city}`);
  }

  const res = await fetch(`${PLACES_URL}?${params}`, { signal });
  if (!res.ok) throw new Error('Place search is unavailable right now');
  const data = await res.json();

  const seen = new Set();
  const places = [];
  for (const f of data.features || []) {
    const p = f.properties || {};
    if (!p.name || ['country', 'state'].includes(p.type)) continue;
    const kind = p.type === 'street' ? 'Street' : KIND[p.osm_value] || 'Place';
    const within = [p.district, p.locality].find((part) => part && part !== p.name);
    const detail = [kind, within].filter(Boolean).join(', ');
    const key = `${p.name}|${kind}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const [lng, lat] = f.geometry?.coordinates || [];
    places.push({ name: p.name, detail, lat, lng });
  }
  return places.slice(0, 6);
}
