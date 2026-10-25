/**
 * Pricing calculations for Halo bookings.
 * Platform commission is 10% of subtotal.
 * Owner earnings = subtotal - commission.
 * Equipment deposits are refundable and not subject to commission.
 * @module pricing
 */

/**
 * Calculate item line total.
 * @param {number} rate - Hourly rate
 * @param {number} hours - Number of hours
 * @param {number} qty - Quantity of items
 * @returns {number}
 */
export function calculateLineTotal(rate, hours, qty = 1) {
  const safeRate = Number(rate) || 0;
  const safeHours = Number(hours) || 0;
  const safeQty = Number(qty) || 1;
  return Math.round(safeRate * safeHours * safeQty * 100) / 100;
}

/**
 * Calculate complete pricing summary for a booking.
 * @param {{
 *   items: Array<{ rateSnapshot: number, hours: number, qty: number, deposit?: number }>,
 * }} params
 * @returns {{
 *   subtotal: number,
 *   fee: number,
 *   deposit: number,
 *   ownerEarnings: number,
 *   total: number
 * }}
 */
export function calculateBookingPrice(params) {
  const items = params?.items || [];

  let subtotal = 0;
  let deposit = 0;

  for (const item of items) {
    const lineTotal = calculateLineTotal(item.rateSnapshot, item.hours, item.qty);
    subtotal += lineTotal;

    const itemDeposit = (Number(item.deposit) || 0) * (Number(item.qty) || 1);
    deposit += itemDeposit;
  }

  subtotal = Math.round(subtotal * 100) / 100;
  deposit = Math.round(deposit * 100) / 100;

  // Platform commission: 10% of subtotal
  const fee = Math.round(subtotal * 0.10 * 100) / 100;
  const ownerEarnings = Math.round((subtotal - fee) * 100) / 100;
  const total = Math.round((subtotal + fee + deposit) * 100) / 100;

  return {
    subtotal,
    fee,
    deposit,
    ownerEarnings,
    total,
  };
}
