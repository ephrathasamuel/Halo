'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { safeReturnPath } from '@/lib/safeReturnPath';
import { SignInForm } from '@/components/ui/SignInForm';

// Admins, regional admins and studio owners sign in here, apart from customers.
function StaffSignInContent() {
  const searchParams = useSearchParams();
  const nextParam = searchParams.get('next');
  return <SignInForm portal="staff" returnPath={nextParam ? safeReturnPath(nextParam) : ''} nextParam={nextParam} />;
}

export default function StaffSignInPage() {
  return (
    <Suspense fallback={<div className="min-h-[60vh]" aria-busy="true" />}>
      <StaffSignInContent />
    </Suspense>
  );
}
