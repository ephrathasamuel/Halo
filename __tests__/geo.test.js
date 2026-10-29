import { describe, expect, it } from 'vitest';
import { COUNTRIES, cityCoords, cityNames, currencyFor, dialCodeOf, providerLocation, regionForCity, regionNames } from '@/lib/geo';
import { cleanRegionName } from '@/lib/geoNames';
import { isValidPhone, joinPhone, splitPhone } from '@/lib/phone';

const PLACES = {
  regions: [
    { name: 'Addis Ababa', cities: [['Addis Ababa', 9.025, 38.7469]] },
    { name: 'Oromia', cities: [['Adama', 8.54, 39.27], ['Bishoftu', 8.75, 38.98]] },
  ],
};

describe('Countries, regions and cities', () => {
  it('lists every country with its currency and dialling code', () => {
    expect(COUNTRIES.length).toBeGreaterThan(240);
    expect(currencyFor('KE')).toBe('KES');
    expect(dialCodeOf('ET')).toBe('+251');
  });

  it('drops "County" and "Region" from region names, but keeps names that would mean nothing alone', () => {
    expect(cleanRegionName('KE', 'Nairobi County')).toBe('Nairobi');
    expect(cleanRegionName('ET', 'Sidama Region')).toBe('Sidama');
    expect(cleanRegionName('ET', 'Oromiya')).toBe('Oromia');
    expect(cleanRegionName('UG', 'Western Region')).toBe('Western Region');
  });

  it('reads regions and cities from a loaded country', () => {
    expect(regionNames(PLACES)).toEqual(['Addis Ababa', 'Oromia']);
    expect(cityNames(PLACES, 'Oromia')).toEqual(['Adama', 'Bishoftu']);
    expect(cityNames(PLACES)).toEqual(['Adama', 'Addis Ababa', 'Bishoftu']);
    expect(regionForCity(PLACES, 'Adama')).toBe('Oromia');
    expect(cityCoords(PLACES, 'Addis Ababa')).toEqual({ lat: 9.025, lng: 38.7469 });
  });

  it('shows older saved region names in today\'s form', () => {
    expect(providerLocation({ country: 'KE', region: 'Nairobi County', city: 'Nairobi' }).region).toBe('Nairobi');
  });
});

describe('Phone numbers', () => {
  it('joins a country code and number, dropping the leading 0', () => {
    expect(joinPhone('ET', '0911 234567')).toBe('+251 911 234567');
    expect(joinPhone('ET', '')).toBe('');
  });

  it('splits a saved number back into country and number', () => {
    expect(splitPhone('+251 911234567')).toEqual({ country: 'ET', local: '911234567' });
    expect(splitPhone('+254712345678')).toEqual({ country: 'KE', local: '712345678' });
    // +1 is shared: the country already picked wins
    expect(splitPhone('+1 8095551234', 'US').country).toBe('US');
  });

  it('accepts only full international numbers', () => {
    expect(isValidPhone('+251 911 234567')).toBe(true);
    expect(isValidPhone('12345')).toBe(false);
    expect(isValidPhone('+251 abc')).toBe(false);
  });
});
