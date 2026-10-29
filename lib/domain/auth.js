import { readStorage } from '@/lib/storage/readStorage';
import { writeStorage } from '@/lib/storage/writeStorage';
import { STORAGE_KEYS } from '@/lib/storage/keys';
import { generateId } from '@/lib/ids';
import { DEFAULT_COUNTRY, getCountry } from '@/lib/geo';
import { isValidPhone } from '@/lib/phone';

/**
 * Get the current session from sessionStorage.
 * @returns {{ userId: string, name: string, email: string, roles: string[] } | null}
 */
export function getCurrentSession() {
  const { data } = readStorage(STORAGE_KEYS.SESSION, null, 'session');
  return data;
}

/**
 * Sign in as a demo user by user ID.
 * @param {string} userId
 * @returns {{ ok: boolean, data?: object, error?: string }}
 */
export function signInAsDemo(userId) {
  const { data: users } = readStorage(STORAGE_KEYS.USERS, []);
  const user = users.find((u) => u.id === userId);
  if (!user) {
    return { ok: false, error: 'User not found' };
  }
  if (user.status === 'suspended') {
    return { ok: false, error: 'This account has been suspended' };
  }
  const session = {
    userId: user.id,
    name: user.name,
    email: user.email,
    roles: user.roles,
    country: user.country || DEFAULT_COUNTRY,
    avatar: user.avatar || '',
    // Regional admins only: the country they administer
    ...(user.adminScope ? { adminScope: user.adminScope } : {}),
  };
  const result = writeStorage(STORAGE_KEYS.SESSION, session, 'session');
  if (!result.ok) {
    return { ok: false, error: result.error };
  }
  return { ok: true, data: session };
}

/**
 * Sign in by email lookup (demo, no password).
 * @param {string} email
 * @returns {{ ok: boolean, data?: object, error?: string }}
 */
export function signInByEmail(email) {
  if (!email || typeof email !== 'string') {
    return { ok: false, error: 'Email is required' };
  }
  const { data: users } = readStorage(STORAGE_KEYS.USERS, []);
  const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase().trim());
  if (!user) {
    return { ok: false, error: 'No account found with that email' };
  }
  return signInAsDemo(user.id);
}

/**
 * Sign out. Clears session keys.
 */
export function signOut() {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(STORAGE_KEYS.SESSION);
  sessionStorage.removeItem(STORAGE_KEYS.CHECKOUT_DRAFT);
}

/**
 * Check if a user has a specific role.
 * @param {object} user
 * @param {string} role
 * @returns {boolean}
 */
export function hasRole(user, role) {
  return Array.isArray(user?.roles) && user.roles.includes(role);
}

/**
 * Require a specific role from the current session.
 * @param {string} role
 * @returns {{ ok: boolean, session?: object, error?: string }}
 */
export function requireRole(role) {
  const session = getCurrentSession();
  if (!session) {
    return { ok: false, error: 'Not signed in' };
  }
  if (!hasRole(session, role)) {
    return { ok: false, error: `Requires ${role} role` };
  }
  return { ok: true, session };
}

/**
 * Shared checks for any new account. Returns an error message or null.
 * @param {{ name?: string, email?: string, phone?: string, country?: string }} input
 * @param {Array<object>} users
 */
function validateNewAccount({ name, email, phone, country }, users) {
  if (!name || !name.trim()) return 'Name is required';
  if (!email || !email.trim()) return 'Email is required';
  if (!phone || !phone.trim()) return 'Phone number is required';
  if (!isValidPhone(phone)) return 'Enter a full phone number with its country code';
  if (country && !getCountry(country)) return 'Choose a country Halo operates in';
  if (users.some((u) => u.email.toLowerCase() === email.toLowerCase().trim())) {
    return 'An account with this email already exists';
  }
  return null;
}

/**
 * Sign up a new renter. Never grants an admin role.
 * @param {{ name: string, email: string, phone: string, country?: string }} input
 * @returns {{ ok: boolean, data?: object, error?: string }}
 */
export function signUp(input) {
  const { name, email, phone, country } = input || {};
  const { data: users } = readStorage(STORAGE_KEYS.USERS, []);
  const error = validateNewAccount({ name, email, phone, country }, users);
  if (error) return { ok: false, error };

  const newUser = {
    id: generateId(),
    name: name.trim(),
    email: email.toLowerCase().trim(),
    phone: phone.trim(),
    country: country || DEFAULT_COUNTRY,
    roles: ['renter'],
    status: 'active',
    createdAt: new Date().toISOString(),
  };

  const updated = [...users, newUser];
  const writeResult = writeStorage(STORAGE_KEYS.USERS, updated);
  if (!writeResult.ok) {
    return { ok: false, error: writeResult.error };
  }

  // Auto sign in
  return signInAsDemo(newUser.id);
}

/**
 * Sign up a provider from any country Halo operates in. Creates the account
 * (owner + renter) and a storefront in "pending" status; that country's admin
 * approves it before it appears publicly. Never grants an admin role.
 * @param {{
 *   name: string, email: string, phone: string,
 *   businessName: string, country: string, region: string, city: string, neighbourhood: string,
 *   latitude?: number, longitude?: number
 * }} input
 * @returns {{ ok: boolean, data?: object, error?: string }}
 */
export function signUpProvider(input) {
  const { name, email, phone, businessName, country, region, city, neighbourhood, latitude, longitude } = input || {};
  const { data: users } = readStorage(STORAGE_KEYS.USERS, []);
  const error = validateNewAccount({ name, email, phone, country }, users);
  if (error) return { ok: false, error };
  if (!country) return { ok: false, error: 'Country is required' };
  if (!businessName || !businessName.trim()) return { ok: false, error: 'Business name is required' };
  if (!region || !region.trim()) return { ok: false, error: 'Choose your region' };
  if (!city || !city.trim()) return { ok: false, error: 'Choose your city' };
  if (!neighbourhood || !neighbourhood.trim()) return { ok: false, error: 'Neighbourhood or area is required' };

  const { data: providers } = readStorage(STORAGE_KEYS.PROVIDERS, []);
  const baseSlug =
    businessName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'studio';
  let slug = baseSlug;
  for (let n = 2; providers.some((p) => p.slug === slug); n++) slug = `${baseSlug}-${n}`;

  const now = new Date().toISOString();
  const newUser = {
    id: generateId(),
    name: name.trim(),
    email: email.toLowerCase().trim(),
    phone: phone.trim(),
    country,
    roles: ['renter', 'owner'],
    status: 'active',
    createdAt: now,
  };
  const newProvider = {
    id: generateId(),
    ownerId: newUser.id,
    slug,
    name: businessName.trim(),
    tagline: '',
    about: '',
    logo: '',
    cover: '',
    brandColor: '#B7791F',
    country,
    region: region.trim(),
    city: city.trim(),
    neighbourhood: neighbourhood.trim(),
    // From the picked area (or city), so the storefront map opens in the right place
    ...(Number.isFinite(latitude) && Number.isFinite(longitude) ? { latitude, longitude } : {}),
    contact: { phone: phone.trim(), whatsapp: '', telegram: '' },
    hours: { open: '08:00', close: '20:00' },
    status: 'pending',
    createdAt: now,
  };

  const usersResult = writeStorage(STORAGE_KEYS.USERS, [...users, newUser]);
  if (!usersResult.ok) return { ok: false, error: usersResult.error };
  const providersResult = writeStorage(STORAGE_KEYS.PROVIDERS, [...providers, newProvider]);
  if (!providersResult.ok) return { ok: false, error: providersResult.error };

  return signInAsDemo(newUser.id);
}
