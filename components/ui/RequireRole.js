'use client';

import { useSession } from '@/hooks/useSession';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

/**
 * Wrapper component that enforces role-based access.
 * Redirects to /signin if not signed in, shows blocked message if suspended.
 * @param {{ role: string | string[], children: React.ReactNode }} props  any one of the roles is enough
 */
export function RequireRole({ role, children }) {
  const { session, isSignedIn, isLoaded } = useSession();
  const router = useRouter();

  useEffect(() => {
    // Only redirect once the stored session has actually been read
    if (isLoaded && !isSignedIn) {
      const currentPath = typeof window !== 'undefined' ? window.location.pathname : '/';
      // Admin and owner areas use the staff sign-in page.
      const roles = Array.isArray(role) ? role : [role];
      const staffArea = roles.some((r) => ['admin', 'regional_admin', 'owner'].includes(r));
      router.push(`${staffArea ? '/staff/signin' : '/signin'}?next=${encodeURIComponent(currentPath)}`);
    }
  }, [isLoaded, isSignedIn, router, role]);

  if (!isLoaded) {
    return <div className="min-h-[50vh]" aria-busy="true" />;
  }

  if (!isSignedIn) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-halo-text-muted">Redirecting to sign in...</p>
      </div>
    );
  }

  // Check for suspended status
  if (session?.status === 'suspended') {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center p-8 bg-red-50 rounded-lg max-w-md">
          <h2 className="text-xl font-bold text-red-700 mb-2">Access Blocked</h2>
          <p className="text-red-600">Your account has been suspended. Contact Halo support if you think this is a mistake.</p>
        </div>
      </div>
    );
  }

  // Check role
  const allowed = Array.isArray(role) ? role : [role];
  if (!allowed.some((r) => session?.roles?.includes(r))) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center p-8 bg-yellow-50 rounded-lg max-w-md">
          <h2 className="text-xl font-bold text-yellow-700 mb-2">Access Denied</h2>
          <p className="text-yellow-600">You don&apos;t have access to this page.</p>
        </div>
      </div>
    );
  }

  return children;
}
