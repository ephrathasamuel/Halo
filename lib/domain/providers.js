import { readStorage } from '@/lib/storage/readStorage';
import { writeStorage } from '@/lib/storage/writeStorage';
import { STORAGE_KEYS } from '@/lib/storage/keys';
import { getCurrentSession } from './auth';
import { generateId } from '@/lib/ids';

/**
 * Returns all publicly visible providers.
 * Rule: only approved providers with active owners are public.
 * @returns {Array<object>}
 */
export function getPublicProviders() {
  const { data: providers } = readStorage(STORAGE_KEYS.PROVIDERS, []);
  const { data: users } = readStorage(STORAGE_KEYS.USERS, []);

  const activeUserIds = new Set(
    users.filter((u) => u.status === 'active').map((u) => u.id)
  );

  return providers.filter(
    (p) => p.status === 'approved' && activeUserIds.has(p.ownerId)
  );
}

/**
 * Get an approved public provider by slug.
 * @param {string} slug
 * @returns {object|null}
 */
export function getProviderBySlug(slug) {
  if (!slug) return null;
  const approved = getPublicProviders();
  return approved.find((p) => p.slug === slug) || null;
}

/**
 * Get provider portfolio items.
 * @param {string} providerId
 * @returns {Array<object>}
 */
export function getProviderPortfolio(providerId) {
  if (!providerId) return [];
  const { data: portfolio } = readStorage(STORAGE_KEYS.PORTFOLIO, []);
  return portfolio.filter((item) => item.providerId === providerId);
}

/**
 * Get provider reviews.
 * @param {string} providerId
 * @returns {Array<object>}
 */
export function getProviderReviews(providerId) {
  if (!providerId) return [];
  const { data: reviews } = readStorage(STORAGE_KEYS.REVIEWS, []);
  return reviews.filter((r) => r.providerId === providerId);
}

/**
 * Get provider for the currently signed-in user.
 * @returns {object|null}
 */
export function getProviderForCurrentUser() {
  const session = getCurrentSession();
  if (!session) return null;

  const { data: providers } = readStorage(STORAGE_KEYS.PROVIDERS, []);
  return providers.find((p) => p.ownerId === session.userId) || null;
}

/**
 * Save / update provider storefront metadata.
 * Guarded write: session -> role -> ownership -> input validation.
 * @param {object} providerData
 * @returns {{ ok: boolean, data?: object, error?: string }}
 */
export function saveProvider(providerData) {
  const session = getCurrentSession();
  if (!session) return { ok: false, error: 'Not signed in' };

  const isOwner = session.roles?.includes('owner');
  const isAdmin = session.roles?.includes('admin');
  if (!isOwner && !isAdmin) {
    return { ok: false, error: 'Not allowed: Requires owner role' };
  }

  const { data: users } = readStorage(STORAGE_KEYS.USERS, []);
  const user = users.find((u) => u.id === session.userId);
  if (user?.status === 'suspended') {
    return { ok: false, error: 'Account suspended' };
  }

  const { data: providers } = readStorage(STORAGE_KEYS.PROVIDERS, []);
  const existing = providers.find((p) => p.id === providerData?.id);
  if (!existing) {
    return { ok: false, error: 'Provider not found' };
  }

  // Ownership check
  if (existing.ownerId !== session.userId && !isAdmin) {
    return { ok: false, error: 'Not yours: You do not own this provider' };
  }

  // Validation
  if (!providerData.name?.trim()) return { ok: false, error: 'Provider name is required' };
  if (!providerData.tagline?.trim()) return { ok: false, error: 'Tagline is required' };
  if (!providerData.neighbourhood?.trim()) return { ok: false, error: 'Neighbourhood is required' };
  if (!providerData.contact?.phone?.trim()) return { ok: false, error: 'Contact phone is required' };

  const updatedProvider = {
    ...existing,
    name: providerData.name.trim(),
    tagline: providerData.tagline.trim(),
    about: providerData.about?.trim() || existing.about,
    brandColor: providerData.brandColor || existing.brandColor,
    city: providerData.city || existing.city || 'Addis Ababa',
    neighbourhood: providerData.neighbourhood.trim(),
    latitude: typeof providerData.latitude === 'number' ? providerData.latitude : existing.latitude,
    longitude: typeof providerData.longitude === 'number' ? providerData.longitude : existing.longitude,
    contact: {
      phone: providerData.contact.phone.trim(),
      whatsapp: providerData.contact.whatsapp?.trim() || '',
      telegram: providerData.contact.telegram?.trim() || '',
    },
    hours: providerData.hours || existing.hours || { open: '08:00', close: '20:00' },
  };

  const updatedList = providers.map((p) => (p.id === updatedProvider.id ? updatedProvider : p));
  const res = writeStorage(STORAGE_KEYS.PROVIDERS, updatedList);
  if (!res.ok) return { ok: false, error: res.error };

  return { ok: true, data: updatedProvider };
}

/**
 * Save or update a portfolio item for own provider.
 * Guarded write.
 * @param {object} itemData
 * @returns {{ ok: boolean, data?: object, error?: string }}
 */
export function savePortfolioItem(itemData) {
  const session = getCurrentSession();
  if (!session) return { ok: false, error: 'Not signed in' };

  const isOwner = session.roles?.includes('owner');
  const isAdmin = session.roles?.includes('admin');
  if (!isOwner && !isAdmin) {
    return { ok: false, error: 'Not allowed: Requires owner role' };
  }

  const { data: providers } = readStorage(STORAGE_KEYS.PROVIDERS, []);
  const provider = providers.find((p) => p.id === itemData?.providerId);
  if (!provider) {
    return { ok: false, error: 'Provider not found' };
  }

  if (provider.ownerId !== session.userId && !isAdmin) {
    return { ok: false, error: 'Not yours: Cannot add portfolio item for another provider' };
  }

  if (!itemData.title?.trim()) return { ok: false, error: 'Title is required' };
  if (!itemData.eventType?.trim()) return { ok: false, error: 'Event type is required' };

  const { data: portfolio } = readStorage(STORAGE_KEYS.PORTFOLIO, []);

  let updatedPortfolio;
  let savedItem;

  if (itemData.id) {
    const existing = portfolio.find((item) => item.id === itemData.id);
    if (!existing) return { ok: false, error: 'Portfolio item not found' };
    savedItem = {
      ...existing,
      title: itemData.title.trim(),
      mediaUrl: itemData.mediaUrl?.trim() || existing.mediaUrl,
      eventType: itemData.eventType.trim(),
    };
    updatedPortfolio = portfolio.map((item) => (item.id === savedItem.id ? savedItem : item));
  } else {
    savedItem = {
      id: generateId(),
      providerId: provider.id,
      title: itemData.title.trim(),
      mediaUrl: itemData.mediaUrl?.trim() || '/images/portfolio/b-light-wedding-1.jpg',
      eventType: itemData.eventType.trim(),
      createdAt: new Date().toISOString(),
    };
    updatedPortfolio = [savedItem, ...portfolio];
  }

  const res = writeStorage(STORAGE_KEYS.PORTFOLIO, updatedPortfolio);
  if (!res.ok) return { ok: false, error: res.error };

  return { ok: true, data: savedItem };
}

/**
 * Delete a portfolio item.
 * Guarded write.
 * @param {string} itemId
 * @returns {{ ok: boolean, error?: string }}
 */
export function deletePortfolioItem(itemId) {
  const session = getCurrentSession();
  if (!session) return { ok: false, error: 'Not signed in' };

  const { data: portfolio } = readStorage(STORAGE_KEYS.PORTFOLIO, []);
  const item = portfolio.find((i) => i.id === itemId);
  if (!item) return { ok: false, error: 'Portfolio item not found' };

  const { data: providers } = readStorage(STORAGE_KEYS.PROVIDERS, []);
  const provider = providers.find((p) => p.id === item.providerId);
  const isAdmin = session.roles?.includes('admin');

  if (provider?.ownerId !== session.userId && !isAdmin) {
    return { ok: false, error: 'Not yours: Cannot delete another provider portfolio item' };
  }

  const updatedPortfolio = portfolio.filter((i) => i.id !== itemId);
  return writeStorage(STORAGE_KEYS.PORTFOLIO, updatedPortfolio);
}
