'use client';

import { useSession } from '@/hooks/useSession';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

/**
 * Wrapper component that enforces role-based access.
 * Redirects to /signin if not signed in, shows blocked message if suspended.
 * @param {{ role: string, children: React.ReactNode }} props
 */
export function RequireRole({ role, children }) {
  const { session, isSignedIn } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!isSignedIn) {
      const currentPath = typeof window !== 'undefined' ? window.location.pathname : '/';
      router.push(`/signin?next=${encodeURIComponent(currentPath)}`);
    }
  }, [isSignedIn, router]);

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
          <p className="text-red-600">Your account has been suspended. You cannot perform demo actions.</p>
        </div>
      </div>
    );
  }

  // Check role
  if (!session?.roles?.includes(role)) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center p-8 bg-yellow-50 rounded-lg max-w-md">
          <h2 className="text-xl font-bold text-yellow-700 mb-2">Access Denied</h2>
          <p className="text-yellow-600">You need the <strong>{role}</strong> role to access this page.</p>
        </div>
      </div>
    );
  }

  return children;
}
