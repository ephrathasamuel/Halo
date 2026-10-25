'use client';

import { use } from 'react';
import { useSession } from '@/hooks/useSession';
import { useStorageSync } from '@/hooks/useStorageSync';
import { STORAGE_KEYS } from '@/lib/storage/keys';
import { ListingForm } from '@/components/owner/ListingForm';
import { BackButton } from '@/components/ui/BackButton';

export default function EditListingPage({ params }) {
  const resolvedParams = use(params);
  const { id } = resolvedParams;
  const { session } = useSession();
  const { data: listings } = useStorageSync(STORAGE_KEYS.LISTINGS, []);

  const listing = listings.find((l) => l.id === id);

  if (!listing) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center space-y-4">
        <h2 className="text-xl font-semibold text-halo-ink">Listing Not Found</h2>
        <p className="text-halo-text-muted">The listing with ID #{id.slice(-6)} does not exist.</p>
        <BackButton fallback="/owner/listings" />
      </div>
    );
  }

  // Ownership Guard
  const isAdmin = session?.roles?.includes('admin');
  if (listing.ownerId !== session?.userId && !isAdmin) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center space-y-4">
        <div className="p-6 bg-red-50 border border-red-200 rounded-2xl max-w-md mx-auto">
          <h2 className="text-lg font-semibold text-red-700">Access Denied</h2>
          <p className="text-xs text-red-600 mt-1">
            Not yours: You cannot edit a listing belonging to another provider or owner.
          </p>
        </div>
        <BackButton fallback="/owner/listings" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-halo-border">
        <div>
          <h1 className="text-2xl font-semibold text-halo-ink">Edit Listing</h1>
          <p className="text-xs text-halo-text-muted mt-1">
            Editing &quot;{listing.title}&quot; (#{listing.id.slice(-6)})
          </p>
        </div>

        <BackButton fallback="/owner/listings" />
      </div>

      <ListingForm initialListing={listing} />
    </div>
  );
}
