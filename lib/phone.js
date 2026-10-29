import { COUNTRIES, getCountry } from '@/lib/geo';

/*
 * Phone numbers are stored as one string, "+<dialling code> <number>", e.g.
 * "+251 911234567". These helpers split and join that form for PhoneInput.
 */

/**
 * Split a stored number into its country and the local part. Several countries
 * share a code (+1, +7, +44...), so `preferred` breaks ties.
 * @param {string} value
 * @param {string} [preferred] country code to prefer
 * @returns {{ country: string, local: string }}
 */
export function splitPhone(value, preferred = '') {
  const text = String(value || '').trim();
  if (!text.startsWith('+')) return { country: preferred, local: text };

  const digits = text.slice(1).replace(/\D/g, '');
  const preferredDial = getCountry(preferred)?.dial.replace(/\D/g, '');
  let best = preferredDial && digits.startsWith(preferredDial) ? { code: preferred, dial: preferredDial } : null;
  for (const c of best ? [] : COUNTRIES) {
    const dial = c.dial.replace(/\D/g, '');
    if (!dial || !digits.startsWith(dial)) continue;
    const better =
      !best || dial.length > best.dial.length || (dial.length === best.dial.length && c.code === preferred);
    if (better) best = { code: c.code, dial };
  }
  if (!best) return { country: preferred, local: text };

  // Drop the dialling code from the front, keeping the person's own spacing after it
  let seen = 0;
  let cut = 1;
  while (cut < text.length && seen < best.dial.length) {
    if (/\d/.test(text[cut])) seen += 1;
    cut += 1;
  }
  return { country: best.code, local: text.slice(cut).trim() };
}

/**
 * @param {string} country country code
 * @param {string} local number without the dialling code
 * @returns {string} '' when no number was typed
 */
export function joinPhone(country, local) {
  // A leading 0 is the domestic trunk prefix: +251 0911... is dialled as +251 911...
  const number = String(local || '').trim().replace(/^0+/, '');
  if (!number) return '';
  const dial = getCountry(country)?.dial;
  return dial ? `+${dial} ${number}` : number;
}

/**
 * International numbers have 8 to 15 digits including the country code (E.164).
 * @param {string} value
 */
export function isValidPhone(value) {
  const text = String(value || '').trim();
  const digits = text.replace(/\D/g, '');
  return /^\+?[\d\s()-]+$/.test(text) && digits.length >= 8 && digits.length <= 15;
}
