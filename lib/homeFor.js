// Where each kind of account starts after signing in.
export function homeFor(roles = [], fallback = '/') {
  if (roles.includes('admin') || roles.includes('regional_admin')) return '/admin';
  if (roles.includes('owner')) return '/owner';
  return fallback;
}
