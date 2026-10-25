import { describe, it, expect } from 'vitest';
import {
  BOOKING_TRANSITIONS,
  EVENT_TRANSITIONS,
  assertTransition,
} from '@/lib/rules/transitions';

describe('assertTransition', () => {
  describe('booking transitions', () => {
    it('allows requested -> confirmed', () => {
      expect(assertTransition(BOOKING_TRANSITIONS, 'requested', 'confirmed').ok).toBe(true);
    });

    it('allows requested -> declined', () => {
      expect(assertTransition(BOOKING_TRANSITIONS, 'requested', 'declined').ok).toBe(true);
    });

    it('allows requested -> cancelled', () => {
      expect(assertTransition(BOOKING_TRANSITIONS, 'requested', 'cancelled').ok).toBe(true);
    });

    it('rejects requested -> completed (skip ahead)', () => {
      const result = assertTransition(BOOKING_TRANSITIONS, 'requested', 'completed');
      expect(result.ok).toBe(false);
      expect(result.error).toContain('Invalid transition');
    });

    it('rejects transitions from terminal state declined', () => {
      const result = assertTransition(BOOKING_TRANSITIONS, 'declined', 'requested');
      expect(result.ok).toBe(false);
      expect(result.error).toContain('terminal');
    });

    it('rejects transitions from terminal state cancelled', () => {
      const result = assertTransition(BOOKING_TRANSITIONS, 'cancelled', 'confirmed');
      expect(result.ok).toBe(false);
    });

    it('allows in_progress -> disputed', () => {
      expect(assertTransition(BOOKING_TRANSITIONS, 'in_progress', 'disputed').ok).toBe(true);
    });

    it('allows disputed -> resolved', () => {
      expect(assertTransition(BOOKING_TRANSITIONS, 'disputed', 'resolved').ok).toBe(true);
    });

    it('returns error for unknown state', () => {
      const result = assertTransition(BOOKING_TRANSITIONS, 'nonexistent', 'confirmed');
      expect(result.ok).toBe(false);
      expect(result.error).toContain('Unknown state');
    });
  });

  describe('event transitions', () => {
    it('allows submitted -> under_review', () => {
      expect(assertTransition(EVENT_TRANSITIONS, 'submitted', 'under_review').ok).toBe(true);
    });

    it('allows quoted -> accepted', () => {
      expect(assertTransition(EVENT_TRANSITIONS, 'quoted', 'accepted').ok).toBe(true);
    });

    it('allows quoted -> quoted (revision)', () => {
      expect(assertTransition(EVENT_TRANSITIONS, 'quoted', 'quoted').ok).toBe(true);
    });

    it('allows delivered -> reviewed', () => {
      expect(assertTransition(EVENT_TRANSITIONS, 'delivered', 'reviewed').ok).toBe(true);
    });

    it('rejects submitted -> confirmed (skip ahead)', () => {
      const result = assertTransition(EVENT_TRANSITIONS, 'submitted', 'confirmed');
      expect(result.ok).toBe(false);
    });

    it('rejects expired -> accepted', () => {
      const result = assertTransition(EVENT_TRANSITIONS, 'expired', 'accepted');
      expect(result.ok).toBe(false);
    });
  });
});
