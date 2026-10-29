/*
 * Builds Halo's place data from GeoNames (https://www.geonames.org, CC BY 4.0).
 *
 *   1. Download into one folder from https://download.geonames.org/export/dump/:
 *      countryInfo.txt, admin1CodesASCII.txt, cities5000.zip (unzip it)
 *   2. node scripts/build-geo.mjs <that folder>
 *
 * Writes:
 *   lib/data/countries.json   every country: code, name, currency, dialling code
 *   public/geo/<CODE>.json    one country's regions, each with its cities and
 *                             their coordinates; loaded only when that country is picked
 *
 * Re-run it to refresh the data. The output is committed, so builds need no download.
 */

import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { cleanRegionName } from '../lib/geoNames.js';

const src = process.argv[2];
if (!src) {
  console.error('Usage: node scripts/build-geo.mjs <folder with the GeoNames files>');
  process.exit(1);
}

const rows = (file) =>
  readFileSync(join(src, file), 'utf8')
    .split('\n')
    .filter((line) => line && !line.startsWith('#'))
    .map((line) => line.split('\t'));

// Countries
const countries = rows('countryInfo.txt')
  .map((c) => ({
    code: c[0],
    name: c[4],
    capital: c[5],
    currency: c[10] || 'USD',
    // "1-809 and 1-829" (Dominican Republic): keep the first, shown as +1 809
    dial: (c[12] || '').split(/ and |,/)[0].trim().replace(/^\+/, '').replace('-', ' '),
  }))
  .filter((c) => c.code && c.name)
  .sort((a, b) => a.name.localeCompare(b.name));

// Regions (first-level divisions), keyed "ET.44"
const regionNames = new Map(rows('admin1CodesASCII.txt').map((r) => [r[0], r[1]]));

// Cities: populated places of 5000+ people. Skip parts of cities, abandoned and historical places.
const SKIP = new Set(['PPLX', 'PPLH', 'PPLQ', 'PPLW', 'PPLCH']);
const byCountry = new Map();
for (const c of rows('cities5000.txt')) {
  const [, name, , , lat, lng, , fcode, cc, , admin1, , , , population] = c;
  if (SKIP.has(fcode)) continue;
  const region = cleanRegionName(cc, regionNames.get(`${cc}.${admin1}`) || '');
  if (!byCountry.has(cc)) byCountry.set(cc, new Map());
  const regions = byCountry.get(cc);
  if (!regions.has(region)) regions.set(region, new Map());
  const cities = regions.get(region);
  const pop = Number(population) || 0;
  // Same name twice in one region: keep the bigger place
  if (!cities.has(name) || cities.get(name).pop < pop) {
    cities.set(name, { pop, lat: Number(Number(lat).toFixed(4)), lng: Number(Number(lng).toFixed(4)) });
  }
}

const outDir = 'public/geo';
rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });
mkdirSync('lib/data', { recursive: true });

let cityCount = 0;
for (const country of countries) {
  const regions = byCountry.get(country.code) || new Map();
  let list = [...regions.entries()]
    .map(([name, cities]) => ({
      // Cities GeoNames doesn't place in a region go under the country's name
      name: name || country.name,
      cities: [...cities.entries()]
        .map(([cityName, c]) => [cityName, c.lat, c.lng])
        .sort((a, b) => a[0].localeCompare(b[0])),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
  // Tiny territories without a 5000-person town still get their capital
  if (list.length === 0) list = [{ name: country.name, cities: [[country.capital || country.name, null, null]] }];
  cityCount += list.reduce((n, r) => n + r.cities.length, 0);
  writeFileSync(join(outDir, `${country.code}.json`), JSON.stringify({ regions: list }));
}

writeFileSync(
  'lib/data/countries.json',
  JSON.stringify(countries.map(({ code, name, currency, dial }) => ({ code, name, currency, dial })))
);
console.log(`${countries.length} countries, ${cityCount} cities`);
