'use client';

import Link from 'next/link';
import { ListingForm } from '@/components/owner/ListingForm';

export default function NewListingPage() {
  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Create New Listing</h1>
          <p className="text-xs text-slate-500 mt-1">
            Add a studio room, camera kit, lighting package, or event filming service.
          </p>
        </div>

        <Link
          href="/owner/listings"
          className="text-xs font-bold text-slate-600 hover:text-slate-900 min-h-[44px] flex items-center"
        >
          ← Back to Listings
        </Link>
      </div>

      <ListingForm />
    </div>
  );
}
