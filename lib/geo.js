/*
 * Where Halo operates: countries, their regions and cities, and the currency
 * prices are shown in. Providers belong to one country/region/city (plus a
 * neighbourhood they type themselves); renters pick a country and can narrow by
 * region and city. Add a country here and it appears in every picker.
 *
 * When the backend moves to Supabase this becomes a `countries`/`regions`/`cities`
 * table set; the shape below maps one to one.
 */

/** @typedef {{ name: string, cities: string[] }} Region */
/** @typedef {{ code: string, name: string, currency: string, regions: Region[] }} Country */

/** @type {Country[]} */
export const COUNTRIES = [
  {
    code: 'ET',
    name: 'Ethiopia',
    currency: 'ETB',
    regions: [
      { name: 'Addis Ababa', cities: ['Addis Ababa'] },
      { name: 'Oromia', cities: ['Adama', 'Bishoftu', 'Jimma', 'Shashamane'] },
      { name: 'Amhara', cities: ['Bahir Dar', 'Gondar', 'Dessie'] },
      { name: 'Sidama', cities: ['Hawassa'] },
      { name: 'Tigray', cities: ['Mekelle'] },
      { name: 'Dire Dawa', cities: ['Dire Dawa'] },
    ],
  },
  {
    code: 'KE',
    name: 'Kenya',
    currency: 'KES',
    regions: [
      { name: 'Nairobi County', cities: ['Nairobi'] },
      { name: 'Mombasa County', cities: ['Mombasa'] },
      { name: 'Kisumu County', cities: ['Kisumu'] },
      { name: 'Nakuru County', cities: ['Nakuru'] },
    ],
  },
  {
    code: 'RW',
    name: 'Rwanda',
    currency: 'RWF',
    regions: [
      { name: 'Kigali', cities: ['Kigali'] },
      { name: 'Southern Province', cities: ['Huye'] },
    ],
  },
  {
    code: 'UG',
    name: 'Uganda',
    currency: 'UGX',
    regions: [
      { name: 'Central Region', cities: ['Kampala', 'Entebbe'] },
      { name: 'Western Region', cities: ['Mbarara'] },
    ],
  },
  {
    code: 'TZ',
    name: 'Tanzania',
    currency: 'TZS',
    regions: [
      { name: 'Dar es Salaam', cities: ['Dar es Salaam'] },
      { name: 'Arusha', cities: ['Arusha'] },
      { name: 'Zanzibar', cities: ['Zanzibar City'] },
    ],
  },
  {
    code: 'NG',
    name: 'Nigeria',
    currency: 'NGN',
    regions: [
      { name: 'Lagos', cities: ['Lagos', 'Ikeja'] },
      { name: 'Federal Capital Territory', cities: ['Abuja'] },
      { name: 'Rivers', cities: ['Port Harcourt'] },
    ],
  },
  {
    code: 'GH',
    name: 'Ghana',
    currency: 'GHS',
    regions: [
      { name: 'Greater Accra', cities: ['Accra', 'Tema'] },
      { name: 'Ashanti', cities: ['Kumasi'] },
    ],
  },
  {
    code: 'ZA',
    name: 'South Africa',
    currency: 'ZAR',
    regions: [
      { name: 'Gauteng', cities: ['Johannesburg', 'Pretoria'] },
      { name: 'Western Cape', cities: ['Cape Town'] },
      { name: 'KwaZulu-Natal', cities: ['Durban'] },
    ],
  },
  {
    code: 'EG',
    name: 'Egypt',
    currency: 'EGP',
    regions: [
      { name: 'Cairo', cities: ['Cairo', 'Giza'] },
      { name: 'Alexandria', cities: ['Alexandria'] },
    ],
  },
  {
    code: 'AE',
    name: 'United Arab Emirates',
    currency: 'AED',
    regions: [
      { name: 'Dubai', cities: ['Dubai'] },
      { name: 'Abu Dhabi', cities: ['Abu Dhabi'] },
    ],
  },
  {
    code: 'GB',
    name: 'United Kingdom',
    currency: 'GBP',
    regions: [
      { name: 'England', cities: ['London', 'Manchester', 'Birmingham'] },
      { name: 'Scotland', cities: ['Edinburgh', 'Glasgow'] },
    ],
  },
  {
    code: 'US',
    name: 'United States',
    currency: 'USD',
    regions: [
      { name: 'New York', cities: ['New York City'] },
      { name: 'California', cities: ['Los Angeles', 'San Francisco'] },
      { name: 'Georgia', cities: ['Atlanta'] },
    ],
  },
];

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
 * @param {string} countryCode
 * @returns {string[]}
 */
export function regionsOf(countryCode) {
  return (getCountry(countryCode)?.regions || []).map((r) => r.name);
}

/**
 * Cities in one region, or in the whole country when no region is given.
 * @param {string} countryCode
 * @param {string} [regionName]
 * @returns {string[]}
 */
export function citiesOf(countryCode, regionName) {
  const regions = getCountry(countryCode)?.regions || [];
  const picked = regionName ? regions.filter((r) => r.name === regionName) : regions;
  return picked.flatMap((r) => r.cities);
}

/**
 * Region a city belongs to, for filling in the region from a chosen city.
 * @param {string} countryCode
 * @param {string} city
 * @returns {string}
 */
export function regionOfCity(countryCode, city) {
  return (getCountry(countryCode)?.regions || []).find((r) => r.cities.includes(city))?.name || '';
}

/**
 * Location fields for a provider, with Ethiopia/Addis Ababa defaults for records
 * saved before providers had a country.
 * @param {object} provider
 * @returns {{ country: string, region: string, city: string, currency: string }}
 */
export function providerLocation(provider) {
  const country = provider?.country || DEFAULT_COUNTRY;
  const city = provider?.city || 'Addis Ababa';
  return {
    country,
    region: provider?.region || regionOfCity(country, city) || city,
    city,
    currency: currencyFor(country),
  };
}
