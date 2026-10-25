import { readStorage } from '@/lib/storage/readStorage';
import { writeStorage } from '@/lib/storage/writeStorage';
import { STORAGE_KEYS } from '@/lib/storage/keys';
import { getCurrentSession } from './auth';
import { generateId } from '@/lib/ids';
import { EVENT_TRANSITIONS, assertTransition } from '@/lib/rules/transitions';
import { canAdminProvider, isAdminRole } from './adminScope';

/**
 * Submit a new event filming quote request.
 * Guarded write: session -> renter role -> not suspended -> valid inputs.
 *
 * @param {{
 *   providerId: string,
 *   listingId: string,
 *   eventType: string,
 *   date: string,
 *   startTime: string,
 *   durationHours: number,
 *   location: string,
 *   coverage: string,
 *   budgetHint?: number,
 *   notes?: string
 * }} input
 * @returns {{ ok: boolean, data?: object, error?: string }}
 */
export function submitEventRequest(input) {
  const session = getCurrentSession();
  if (!session) return { ok: false, error: 'Not signed in: Sign in to request a quote' };

  const isRenter = session.roles?.includes('renter');
  if (!isRenter) return { ok: false, error: 'Not allowed: Requires renter role to request quotes' };

  const { data: users } = readStorage(STORAGE_KEYS.USERS, []);
  const user = users.find((u) => u.id === session.userId);
  if (user?.status === 'suspended') return { ok: false, error: 'Account suspended' };

  const { data: providers } = readStorage(STORAGE_KEYS.PROVIDERS, []);
  const provider = providers.find((p) => p.id === input.providerId);
  if (!provider) return { ok: false, error: 'Provider not found' };

  // Validation
  if (!input.eventType?.trim()) return { ok: false, error: 'Event type is required' };
  if (!input.date) return { ok: false, error: 'Event date is required' };
  if (!input.startTime) return { ok: false, error: 'Start time is required' };
  if (!input.location?.trim()) return { ok: false, error: 'Event location / venue is required' };
  if (!input.coverage?.trim()) return { ok: false, error: 'Desired coverage description is required' };

  const todayStr = new Date().toISOString().slice(0, 10);
  if (input.date < todayStr) return { ok: false, error: 'Event date cannot be in the past' };

  const durationHours = Math.max(1, Number(input.durationHours) || 4);

  const { data: requests } = readStorage(STORAGE_KEYS.EVENT_REQUESTS, []);

  const newRequest = {
    id: generateId(),
    providerId: provider.id,
    listingId: input.listingId,
    renterId: session.userId,
    ownerId: provider.ownerId,
    eventType: input.eventType.trim(),
    date: input.date,
    startTime: input.startTime,
    durationHours,
    location: input.location.trim(),
    coverage: input.coverage.trim(),
    budgetHint: Number(input.budgetHint) || null,
    notes: input.notes?.trim() || '',
    agreedAmount: null,
    status: 'submitted',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const updated = [newRequest, ...requests];
  const res = writeStorage(STORAGE_KEYS.EVENT_REQUESTS, updated);
  if (!res.ok) return { ok: false, error: res.error };

  return { ok: true, data: newRequest };
}

/**
 * Get an event request by ID with ownership guard.
 * Only renter, owner, or admin can access.
 * @param {string} requestId
 * @returns {object|null}
 */
export function getEventRequestById(requestId) {
  const session = getCurrentSession();
  if (!session) return null;

  const { data: requests } = readStorage(STORAGE_KEYS.EVENT_REQUESTS, []);
  const req = requests.find((r) => r.id === requestId);
  if (!req) return null;

  const isRenter = req.renterId === session.userId;
  const isOwner = req.ownerId === session.userId;
  const isAdmin = canAdminProvider(session, req.providerId);

  if (!isRenter && !isOwner && !isAdmin) return null;

  return req;
}

/**
 * Get quotes associated with an event request.
 * @param {string} requestId
 * @returns {Array<object>}
 */
export function getQuotesForRequest(requestId) {
  const { data: quotes } = readStorage(STORAGE_KEYS.QUOTES, []);
  return quotes.filter((q) => q.requestId === requestId);
}

/**
 * Send an official quote from owner to client.
 * Guarded write: session -> owner role -> ownership check.
 *
 * @param {string} requestId
 * @param {{
 *   amount: number,
 *   inclusions: string[],
 *   validUntil: string
 * }} quoteData
 * @returns {{ ok: boolean, data?: object, error?: string }}
 */
export function sendQuote(requestId, quoteData) {
  const session = getCurrentSession();
  if (!session) return { ok: false, error: 'Not signed in' };

  const isOwner = session.roles?.includes('owner');
  const isAdmin = isAdminRole(session);
  if (!isOwner && !isAdmin) return { ok: false, error: 'Not allowed: Requires owner role' };

  const { data: requests } = readStorage(STORAGE_KEYS.EVENT_REQUESTS, []);
  const req = requests.find((r) => r.id === requestId);
  if (!req) return { ok: false, error: 'Event request not found' };

  if (req.ownerId !== session.userId && !canAdminProvider(session, req.providerId)) {
    return { ok: false, error: 'Not yours: You do not own this provider request' };
  }

  const amount = Number(quoteData.amount);
  if (isNaN(amount) || amount <= 0) return { ok: false, error: 'Quote amount must be greater than 0 ETB' };
  if (!Array.isArray(quoteData.inclusions) || quoteData.inclusions.length === 0) {
    return { ok: false, error: 'Please specify at least one inclusion' };
  }
  if (!quoteData.validUntil) return { ok: false, error: 'Quote validity expiry date is required' };

  const todayStr = new Date().toISOString().slice(0, 10);
  if (quoteData.validUntil <= todayStr) {
    return { ok: false, error: 'Quote validity date must be in the future' };
  }

  const { data: quotes } = readStorage(STORAGE_KEYS.QUOTES, []);
  const existingQuotesForReq = quotes.filter((q) => q.requestId === requestId);
  const version = existingQuotesForReq.length + 1;

  // Mark older quotes as revised
  const updatedExistingQuotes = quotes.map((q) => {
    if (q.requestId === requestId && q.status === 'sent') {
      return { ...q, status: 'revised' };
    }
    return q;
  });

  const newQuote = {
    id: generateId(),
    requestId,
    amount,
    inclusions: quoteData.inclusions,
    validUntil: quoteData.validUntil,
    version,
    status: 'sent',
    createdAt: new Date().toISOString(),
  };

  writeStorage(STORAGE_KEYS.QUOTES, [newQuote, ...updatedExistingQuotes]);

  // Advance event request state to quoted
  const updatedReq = {
    ...req,
    status: 'quoted',
    updatedAt: new Date().toISOString(),
  };
  const updatedRequests = requests.map((r) => (r.id === requestId ? updatedReq : r));
  writeStorage(STORAGE_KEYS.EVENT_REQUESTS, updatedRequests);

  return { ok: true, data: newQuote };
}

/**
 * Respond to an event quote (client accepts or declines).
 * Guarded write: renter only. Checks quote expiry!
 *
 * @param {string} quoteId
 * @param {'accept' | 'decline'} decision
 * @returns {{ ok: boolean, error?: string }}
 */
export function respondToQuote(quoteId, decision) {
  const session = getCurrentSession();
  if (!session) return { ok: false, error: 'Not signed in' };

  const { data: quotes } = readStorage(STORAGE_KEYS.QUOTES, []);
  const quote = quotes.find((q) => q.id === quoteId);
  if (!quote) return { ok: false, error: 'Quote not found' };

  const { data: requests } = readStorage(STORAGE_KEYS.EVENT_REQUESTS, []);
  const req = requests.find((r) => r.id === quote.requestId);
  if (!req) return { ok: false, error: 'Request not found' };

  const isRenter = req.renterId === session.userId;
  const isAdmin = canAdminProvider(session, req.providerId);
  if (!isRenter && !isAdmin) {
    return { ok: false, error: 'Not allowed: Only the requesting renter can accept or decline quotes' };
  }

  if (quote.status !== 'sent') {
    return { ok: false, error: `Quote is no longer active (status: ${quote.status})` };
  }

  // Check validity expiry (Rule 2.5)
  const todayStr = new Date().toISOString().slice(0, 10);
  if (quote.validUntil < todayStr) {
    // Auto expire
    const expiredQuotes = quotes.map((q) => (q.id === quoteId ? { ...q, status: 'expired' } : q));
    writeStorage(STORAGE_KEYS.QUOTES, expiredQuotes);
    return { ok: false, error: 'This quote has expired and can no longer be accepted' };
  }

  if (decision === 'accept') {
    const updatedQuotes = quotes.map((q) => (q.id === quoteId ? { ...q, status: 'accepted' } : q));
    writeStorage(STORAGE_KEYS.QUOTES, updatedQuotes);

    const updatedRequests = requests.map((r) =>
      r.id === req.id
        ? { ...r, status: 'accepted', agreedAmount: quote.amount, updatedAt: new Date().toISOString() }
        : r
    );
    writeStorage(STORAGE_KEYS.EVENT_REQUESTS, updatedRequests);
  } else {
    const updatedQuotes = quotes.map((q) => (q.id === quoteId ? { ...q, status: 'declined' } : q));
    writeStorage(STORAGE_KEYS.QUOTES, updatedQuotes);

    const updatedRequests = requests.map((r) =>
      r.id === req.id
        ? { ...r, status: 'declined', updatedAt: new Date().toISOString() }
        : r
    );
    writeStorage(STORAGE_KEYS.EVENT_REQUESTS, updatedRequests);
  }

  return { ok: true };
}

/**
 * Advance event request state machine.
 * @param {string} requestId
 * @param {string} targetState
 * @returns {{ ok: boolean, data?: object, error?: string }}
 */
export function advanceEvent(requestId, targetState) {
  const session = getCurrentSession();
  if (!session) return { ok: false, error: 'Not signed in' };

  const { data: requests } = readStorage(STORAGE_KEYS.EVENT_REQUESTS, []);
  const req = requests.find((r) => r.id === requestId);
  if (!req) return { ok: false, error: 'Event request not found' };

  const isRenter = req.renterId === session.userId;
  const isOwner = req.ownerId === session.userId;
  const isAdmin = canAdminProvider(session, req.providerId);

  // Permission checks
  if (['under_review', 'confirmed', 'in_progress', 'completed', 'delivered'].includes(targetState) && !isOwner && !isAdmin) {
    return { ok: false, error: 'Not allowed: Only the provider owner can advance this production phase' };
  }

  if (targetState === 'reviewed' && !isRenter && !isAdmin) {
    return { ok: false, error: 'Not allowed: Only the renter can submit a review' };
  }

  if (targetState === 'disputed' && !isRenter && !isOwner && !isAdmin) {
    return { ok: false, error: 'Not allowed: Only participating parties can open a dispute' };
  }

  if (targetState === 'resolved' && !isAdmin) {
    return { ok: false, error: 'Not allowed: Only administrators can resolve disputes' };
  }

  // Validate state machine transition
  const check = assertTransition(EVENT_TRANSITIONS, req.status, targetState);
  if (!check.ok) return { ok: false, error: check.error };

  const updatedReq = {
    ...req,
    status: targetState,
    updatedAt: new Date().toISOString(),
  };

  const updatedList = requests.map((r) => (r.id === requestId ? updatedReq : r));
  writeStorage(STORAGE_KEYS.EVENT_REQUESTS, updatedList);

  return { ok: true, data: updatedReq };
}
