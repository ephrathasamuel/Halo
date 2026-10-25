import { readStorage } from '@/lib/storage/readStorage';
import { STORAGE_KEYS } from '@/lib/storage/keys';

/**
 * Convert HH:mm to minutes from midnight.
 * @param {string} timeStr - "HH:mm"
 * @returns {number}
 */
export function timeToMinutes(timeStr) {
  if (!timeStr || typeof timeStr !== 'string') return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

/**
 * Convert minutes from midnight to HH:mm string.
 * @param {number} totalMinutes
 * @returns {string}
 */
export function minutesToTime(totalMinutes) {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Check if a date and time is in the past.
 * Dates are compared against current date in Africa/Addis_Ababa.
 * @param {string} dateStr - YYYY-MM-DD
 * @param {string} [timeStr] - HH:mm
 * @returns {boolean}
 */
export function isDateInPast(dateStr, timeStr = '00:00') {
  if (!dateStr) return true;
  const now = new Date();
  const currentIsoDate = now.toISOString().slice(0, 10);
  if (dateStr < currentIsoDate) return true;

  if (dateStr === currentIsoDate) {
    const currentMins = now.getHours() * 60 + now.getMinutes();
    const targetMins = timeToMinutes(timeStr);
    if (targetMins <= currentMins) return true;
  }

  return false;
}

/**
 * Check availability for a studio listing.
 * Rule: booking occupies [start - buffer, end + buffer].
 * Confirmed or in_progress bookings cannot overlap.
 *
 * @param {{
 *   listing: object,
 *   provider: object,
 *   date: string,
 *   startTime: string,
 *   endTime: string,
 *   hours: number,
 *   excludeBookingId?: string
 * }} params
 * @returns {{ available: boolean, reason?: string }}
 */
export function checkStudioAvailability({
  listing,
  provider,
  date,
  startTime,
  endTime,
  hours,
  excludeBookingId,
}) {
  if (!listing || listing.type !== 'studio') {
    return { available: false, reason: 'Invalid studio listing' };
  }
  if (!date || !startTime || !endTime) {
    return { available: false, reason: 'Missing booking date or time' };
  }

  // 1. Past date check
  if (isDateInPast(date, startTime)) {
    return { available: false, reason: 'Selected date and time is in the past' };
  }

  // 2. Minimum hours check
  const minHours = listing.minHours || 2;
  if (Number(hours) < minHours) {
    return {
      available: false,
      reason: `Studio booking requires a minimum of ${minHours} hours`,
    };
  }

  // 3. Blocked dates check
  if (Array.isArray(listing.blockedDates) && listing.blockedDates.includes(date)) {
    return { available: false, reason: 'Studio is closed or blocked on this date' };
  }

  // 4. Provider opening hours check
  if (provider?.hours) {
    const openMins = timeToMinutes(provider.hours.open);
    const closeMins = timeToMinutes(provider.hours.close);
    const reqStartMins = timeToMinutes(startTime);
    const reqEndMins = timeToMinutes(endTime);

    if (reqStartMins < openMins || reqEndMins > closeMins) {
      return {
        available: false,
        reason: `Studio operates between ${provider.hours.open} and ${provider.hours.close}`,
      };
    }
  }

  // 5. Overlap and buffer check
  const buffer = Number(listing.bufferMinutes) || 0;
  const reqStart = timeToMinutes(startTime) - buffer;
  const reqEnd = timeToMinutes(endTime) + buffer;

  const { data: bookings } = readStorage(STORAGE_KEYS.BOOKINGS, []);

  for (const b of bookings) {
    // Only compare same listing and same date
    if (b.id === excludeBookingId) continue;
    if (b.date !== date) continue;

    // Only confirmed and in_progress block the calendar
    if (!['confirmed', 'in_progress'].includes(b.status)) continue;

    const hasItem = b.items?.some((i) => i.listingId === listing.id);
    if (!hasItem) continue;

    const existingStart = timeToMinutes(b.startTime) - buffer;
    const existingEnd = timeToMinutes(b.endTime) + buffer;

    // Overlap condition: max(startA, startB) < min(endA, endB)
    const overlaps = Math.max(reqStart, existingStart) < Math.min(reqEnd, existingEnd);
    if (overlaps) {
      return {
        available: false,
        reason: `Time slot unavailable: conflicts with existing booking (${b.startTime} - ${b.endTime}) including ${buffer}m cleaning buffer`,
      };
    }
  }

  return { available: true };
}

/**
 * Check equipment stock availability.
 * Rule: sum of active units across overlapping window cannot exceed item quantity.
 *
 * @param {{
 *   listing: object,
 *   date: string,
 *   startTime: string,
 *   endTime: string,
 *   requestedQty: number,
 *   excludeBookingId?: string
 * }} params
 * @returns {{ available: boolean, remainingStock?: number, reason?: string }}
 */
export function checkEquipmentAvailability({
  listing,
  date,
  startTime,
  endTime,
  requestedQty = 1,
  excludeBookingId,
}) {
  if (!listing || listing.type !== 'equipment') {
    return { available: false, reason: 'Invalid equipment listing' };
  }
  if (!date || !startTime || !endTime) {
    return { available: false, reason: 'Missing booking date or time' };
  }

  if (isDateInPast(date, startTime)) {
    return { available: false, reason: 'Selected date and time is in the past' };
  }

  const totalStock = Number(listing.quantity) || 0;
  if (requestedQty > totalStock) {
    return {
      available: false,
      reason: `Requested quantity (${requestedQty}) exceeds total inventory (${totalStock})`,
    };
  }

  const reqStart = timeToMinutes(startTime);
  const reqEnd = timeToMinutes(endTime);

  const { data: bookings } = readStorage(STORAGE_KEYS.BOOKINGS, []);
  let bookedUnits = 0;

  for (const b of bookings) {
    if (b.id === excludeBookingId) continue;
    if (b.date !== date) continue;
    if (!['confirmed', 'in_progress'].includes(b.status)) continue;

    const bStart = timeToMinutes(b.startTime);
    const bEnd = timeToMinutes(b.endTime);

    // Check window overlap
    const overlaps = Math.max(reqStart, bStart) < Math.min(reqEnd, bEnd);
    if (overlaps) {
      const matchItem = b.items?.find((i) => i.listingId === listing.id);
      if (matchItem) {
        bookedUnits += Number(matchItem.qty) || 1;
      }
    }
  }

  const remaining = totalStock - bookedUnits;

  if (requestedQty > remaining) {
    return {
      available: false,
      remainingStock: remaining,
      reason: `Insufficient equipment stock for this time window. Available: ${remaining}, Requested: ${requestedQty}`,
    };
  }

  return { available: true, remainingStock: remaining };
}
