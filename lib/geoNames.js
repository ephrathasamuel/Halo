/*
 * Name clean-up for places from GeoNames, shared by scripts/build-geo.mjs (which
 * writes the data) and lib/geo.js (which also tidies names saved before the
 * clean-up existed). No imports, so the build script can load it directly.
 */

/** Official names people don't use day to day */
const REGION_OVERRIDES = {
  ET: {
    Oromiya: 'Oromia',
    Āfar: 'Afar',
    'Bīnshangul Gumuz': 'Benishangul-Gumuz',
    "South West Ethiopia Peoples' Region": 'South West Ethiopia',
  },
  KE: {
    "Murang'A": "Murang'a",
  },
};

// "Nairobi County" reads as "Nairobi": the dropdown already says it's a region
const SUFFIX = /\s+(county|region|regional state|province|governorate|prefecture|oblast|voivodeship)$/i;

// "Western Region" would become just "Western", which says nothing on its own
const BARE_DIRECTIONS = new Set([
  'north', 'south', 'east', 'west', 'central', 'northern', 'southern', 'eastern', 'western',
  'north east', 'north west', 'south east', 'south west', 'northeast', 'northwest', 'southeast', 'southwest',
  'north-east', 'north-west', 'south-east', 'south-west', 'upper', 'lower', 'coast', 'capital',
]);

/**
 * @param {string} countryCode
 * @param {string} name region name as GeoNames (or an older Halo record) has it
 * @returns {string}
 */
export function cleanRegionName(countryCode, name) {
  const raw = String(name || '').trim().replace(/\s+-\s+/g, '-');
  const override = REGION_OVERRIDES[countryCode]?.[raw];
  if (override) return override;
  const short = raw.replace(SUFFIX, '').trim();
  if (!short || BARE_DIRECTIONS.has(short.toLowerCase())) return raw;
  return short;
}
