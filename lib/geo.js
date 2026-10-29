/*
 * Where Halo operates: every country, with its currency and dialling code, plus
 * each country's regions and cities. Data comes from GeoNames (CC BY 4.0) via
 * scripts/build-geo.mjs.
 *
 * The country list is small and bundled. Regions and cities are large, so each
 * country's file (public/geo/<CODE>.json) is fetched only when it's picked; see
 * loadPlaces() and the usePlaces hook.
 *
 * When the backend moves to Supabase these become countries/regions/cities tables
 * with the same shape.
 */

import COUNTRY_DATA from '@/lib/data/countries.json';
import { cleanRegionName } from '@/lib/geoNames';

/** @typedef {{ code: string, name: string, currency: string, dial: string }} Country */
/** @typedef {[name: string, lat: number|null, lng: number|null]} City */
/** @typedef {{ name: string, cities: City[] }} Region */
/** @typedef {{ regions: Region[] }} Places */

/** @type {Country[]} sorted A to Z */
export const COUNTRIES = COUNTRY_DATA;

export const DEFAULT_COUNTRY = 'ET';

const BY_CODE = new Map(COUNTRIES.map((c) => [c.code, c]));

/**
 * @param {string} code
 * @returns {Country | null}
 */
export function getCountry(code) {
  return BY_CODE.get(String(code || '').toUpperCase()) || null;
}

/** @param {string} code */
export function countryName(code) {
  return getCountry(code)?.name || code || '';
}

/** @param {string} code */
export function currencyFor(code) {
  return getCountry(code)?.currency || 'ETB';
}

/**
 * Dialling code with its plus sign, e.g. "+251". Empty when unknown.
 * @param {string} code
 */
export function dialCodeOf(code) {
  const dial = getCountry(code)?.dial;
  return dial ? `+${dial}` : '';
}

/* Regions and cities, fetched per country */

const placesCache = new Map();

/**
 * One country's regions and cities. Cached, so each file downloads once.
 * @param {string} code
 * @returns {Promise<Places>}
 */
export function loadPlaces(code) {
  const country = getCountry(code);
  if (!country) return Promise.resolve({ regions: [] });
  if (!placesCache.has(country.code)) {
    const request = fetch(`/geo/${country.code}.json`)
      .then((res) => {
        if (!res.ok) throw new Error(`Place data for ${country.code} failed to load`);
        return res.json();
      })
      .catch((err) => {
        placesCache.delete(country.code); // allow a retry
        throw err;
      });
    placesCache.set(country.code, request);
  }
  return placesCache.get(country.code);
}

/**
 * @param {Places | null} places
 * @returns {string[]}
 */
export function regionNames(places) {
  return (places?.regions || []).map((r) => r.name);
}

/**
 * City names in one region, or in the whole country when no region is given.
 * @param {Places | null} places
 * @param {string} [region]
 * @returns {string[]}
 */
export function cityNames(places, region) {
  const regions = (places?.regions || []).filter((r) => !region || r.name === region);
  const names = regions.flatMap((r) => r.cities.map((c) => c[0]));
  return region ? names : [...new Set(names)].sort((a, b) => a.localeCompare(b));
}

/**
 * The region a city is in.
 * @param {Places | null} places
 * @param {string} city
 * @returns {string}
 */
export function regionForCity(places, city) {
  return (places?.regions || []).find((r) => r.cities.some((c) => c[0] === city))?.name || '';
}

/**
 * A city's coordinates, used to centre maps and focus place search.
 * @param {Places | null} places
 * @param {string} city
 * @param {string} [region]
 * @returns {{ lat: number, lng: number } | null}
 */
export function cityCoords(places, city, region) {
  for (const r of places?.regions || []) {
    if (region && r.name !== region) continue;
    const found = r.cities.find((c) => c[0] === city);
    if (found && found[1] != null) return { lat: found[1], lng: found[2] };
  }
  return null;
}

/**
 * Location fields for a provider, with Ethiopia/Addis Ababa defaults for records
 * saved before providers had a country. Region names saved before the clean-up
 * ("Nairobi County") come back in today's form ("Nairobi").
 * @param {object} provider
 * @returns {{ country: string, region: string, city: string, currency: string }}
 */
export function providerLocation(provider) {
  const country = provider?.country || DEFAULT_COUNTRY;
  const city = provider?.city || 'Addis Ababa';
  return {
    country,
    region: cleanRegionName(country, provider?.region) || city,
    city,
    currency: currencyFor(country),
  };
}
