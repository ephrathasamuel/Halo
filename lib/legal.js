// Shown on the privacy and terms pages. The contact email is public, so it
// comes from its own setting rather than the admin's sign-in email.
export const LEGAL_UPDATED = '30 October 2026';
export const CONTACT_EMAIL = (process.env.NEXT_PUBLIC_HALO_CONTACT_EMAIL || '').trim();
