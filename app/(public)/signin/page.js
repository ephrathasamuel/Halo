'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { safeReturnPath } from '@/lib/safeReturnPath';
import { SignInForm } from '@/components/ui/SignInForm';

function SignInContent() {
  const searchParams = useSearchParams();
  const nextParam = searchParams.get('next');
  return <SignInForm portal="customer" returnPath={safeReturnPath(nextParam)} nextParam={nextParam} errorCode={searchParams.get('error') || ''} />;
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="min-h-[60vh]" aria-busy="true" />}>
      <SignInContent />
    </Suspense>
  );
}
