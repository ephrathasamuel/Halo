'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { safeReturnPath } from '@/lib/safeReturnPath';
import { SignInForm } from '@/components/ui/SignInForm';

// Admins and regional admins only, on a page of its own: no site header or
// footer, like the Addis Eats staff sign-in. Customers and providers use /signin.
function StaffSignInContent() {
  const searchParams = useSearchParams();
  const nextParam = searchParams.get('next');
  return (
    <SignInForm
      portal="staff"
      returnPath={nextParam ? safeReturnPath(nextParam) : ''}
      nextParam={nextParam}
      errorCode={searchParams.get('error') || ''}
    />
  );
}

export default function StaffSignInPage() {
  return (
    <main className="flex-1 flex flex-col">
      <div className="px-4 pt-6 sm:px-8">
        <Link href="/" className="text-[1.15rem] font-semibold tracking-[0.14em] text-halo-ink min-h-0">
          HALO
        </Link>
      </div>
      <div className="flex-1 flex flex-col justify-center">
        <div className="mx-auto mb-[-1rem] mt-6 flex w-full max-w-[420px] gap-2 px-4" aria-label="Admin accounts only">
          <span className="rounded-full bg-halo-ink px-3 py-1 text-xs font-semibold text-white">Admin</span>
          <span className="rounded-full border border-halo-border-strong px-3 py-1 text-xs font-semibold text-halo-ink">Regional admin</span>
        </div>
        <Suspense fallback={<div className="min-h-[60vh]" aria-busy="true" />}>
          <StaffSignInContent />
        </Suspense>
      </div>
    </main>
  );
}
