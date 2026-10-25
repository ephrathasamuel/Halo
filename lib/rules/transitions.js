/**
 * State machine transition tables.
 * Each machine maps a current state to an array of valid next states.
 */

/** @type {Record<string, string[]>} */
export const BOOKING_TRANSITIONS = {
  requested: ['confirmed', 'declined', 'cancelled'],
  confirmed: ['in_progress', 'cancelled'],
  in_progress: ['completed', 'disputed'],
  completed: ['reviewed', 'disputed'],
  disputed: ['resolved'],
  // Terminal states
  declined: [],
  cancelled: [],
  reviewed: [],
  resolved: [],
};

/** @type {Record<string, string[]>} */
export const EVENT_TRANSITIONS = {
  submitted: ['under_review', 'declined'],
  under_review: ['quoted', 'declined'],
  quoted: ['quoted', 'accepted', 'declined', 'expired', 'cancelled'],
  accepted: ['confirmed'],
  confirmed: ['in_progress', 'disputed'],
  in_progress: ['completed', 'disputed'],
  completed: ['delivered', 'disputed'],
  delivered: ['reviewed', 'disputed'],
  disputed: ['resolved'],
  // Terminal states
  declined: [],
  expired: [],
  cancelled: [],
  reviewed: [],
  resolved: [],
};

/** @type {Record<string, string[]>} */
export const LISTING_TRANSITIONS = {
  draft: ['pending'],
  pending: ['approved', 'rejected'],
  approved: ['inactive', 'pending'],
  rejected: ['pending'],
  inactive: ['pending'],
};

/** @type {Record<string, string[]>} */
export const PROVIDER_TRANSITIONS = {
  pending: ['approved', 'suspended'],
  approved: ['suspended'],
  suspended: ['approved'],
};

/**
 * Assert a state transition is valid.
 * @param {Record<string, string[]>} machine - The transition table
 * @param {string} from - Current state
 * @param {string} to - Desired next state
 * @returns {{ ok: boolean, error?: string }}
 */
export function assertTransition(machine, from, to) {
  const allowed = machine[from];
  if (!allowed) {
    return { ok: false, error: `Unknown state: ${from}` };
  }
  if (!allowed.includes(to)) {
    return {
      ok: false,
      error: `Invalid transition: ${from} → ${to}. Allowed: ${allowed.join(', ') || 'none (terminal state)'}`,
    };
  }
  return { ok: true };
}
