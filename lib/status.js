/**
 * One colour language for every status in the app, grouped by meaning
 * instead of one colour per status:
 *   waiting  (someone needs to act)      amber
 *   good     (confirmed, approved, paid) green
 *   active   (happening now)             blue
 *   done     (finished)                  neutral
 *   closed   (declined, cancelled)       grey
 *   problem  (disputed, suspended)       red
 */
const TONES = {
  waiting: 'bg-amber-50 text-amber-800 border-amber-200',
  good: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  active: 'bg-sky-50 text-sky-800 border-sky-200',
  done: 'bg-stone-100 text-stone-800 border-stone-200',
  closed: 'bg-white text-stone-500 border-stone-200',
  problem: 'bg-red-50 text-red-700 border-red-200',
};

const STATUS_GROUP = {
  // waiting on someone
  requested: 'waiting',
  submitted: 'waiting',
  under_review: 'waiting',
  pending: 'waiting',
  quoted: 'waiting',
  open: 'waiting',
  // good
  confirmed: 'good',
  accepted: 'good',
  approved: 'good',
  active: 'good',
  paid: 'good',
  // happening now
  in_progress: 'active',
  investigating: 'active',
  // finished
  completed: 'done',
  delivered: 'done',
  reviewed: 'done',
  resolved: 'done',
  refunded: 'done',
  // closed
  declined: 'closed',
  cancelled: 'closed',
  expired: 'closed',
  inactive: 'closed',
  rejected: 'closed',
  // problems
  disputed: 'problem',
  suspended: 'problem',
};

/**
 * Status -> Tailwind classes for a badge.
 * @type {Record<string, string>}
 */
export const STATUS_TONES = Object.fromEntries(
  Object.entries(STATUS_GROUP).map(([status, group]) => [status, TONES[group]])
);

/**
 * Badge classes for any status, neutral when the status is unknown.
 * @param {string} status
 * @returns {string}
 */
export function statusTone(status) {
  return STATUS_TONES[status] || TONES.done;
}

/**
 * "in_progress" -> "In progress"
 * @param {string} status
 * @returns {string}
 */
export function statusLabel(status) {
  if (!status) return '';
  const text = String(status).replace(/_/g, ' ');
  return text.charAt(0).toUpperCase() + text.slice(1);
}
