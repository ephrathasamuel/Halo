'use client';

import { use } from 'react';
import Link from 'next/link';
import { useSession } from '@/hooks/useSession';
import { useStorageSync } from '@/hooks/useStorageSync';
import { STORAGE_KEYS } from '@/lib/storage/keys';
import { ListingForm } from '@/components/owner/ListingForm';

export default function EditListingPage({ params }) {
  const resolvedParams = use(params);
  const { id } = resolvedParams;
  const { session } = useSession();
  const { data: listings } = useStorageSync(STORAGE_KEYS.LISTINGS, []);

  const listing = listings.find((l) => l.id === id);

  if (!listing) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-800">Listing Not Found</h2>
        <p className="text-slate-500">The listing with ID #{id.slice(0, 8)} does not exist.</p>
        <Link href="/owner/listings" className="text-xs font-bold text-halo-primary hover:underline">
          Return to listings
        </Link>
      </div>
    );
  }

  // Ownership Guard
  const isAdmin = session?.roles?.includes('admin');
  if (listing.ownerId !== session?.userId && !isAdmin) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center space-y-4">
        <div className="p-6 bg-red-50 border border-red-200 rounded-2xl max-w-md mx-auto">
          <h2 className="text-lg font-black text-red-700">Access Denied</h2>
          <p className="text-xs text-red-600 mt-1">
            Not yours: You cannot edit a listing belonging to another provider or owner.
          </p>
        </div>
        <Link href="/owner/listings" className="text-xs font-bold text-slate-600 hover:underline">
          ← Return to your listings
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Edit Listing</h1>
          <p className="text-xs text-slate-500 mt-1">
            Editing &quot;{listing.title}&quot; (#{listing.id.slice(0, 8)})
          </p>
        </div>

        <Link
          href="/owner/listings"
          className="text-xs font-bold text-slate-600 hover:text-slate-900 min-h-[44px] flex items-center"
        >
          ← Back to Listings
        </Link>
      </div>

      <ListingForm initialListing={listing} />
    </div>
  );
}
