import { readStorage } from '@/lib/storage/readStorage';
import { STORAGE_KEYS } from '@/lib/storage/keys';

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
