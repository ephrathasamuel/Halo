'use client';

import { ListingForm } from '@/components/owner/ListingForm';
import { BackButton } from '@/components/ui/BackButton';

export default function NewListingPage() {
  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-halo-border">
        <div>
          <h1 className="text-2xl font-semibold text-halo-ink">Create New Listing</h1>
          <p className="text-xs text-halo-text-muted mt-1">
            Add a studio room, camera kit, lighting package, or event filming service.
          </p>
        </div>

        <BackButton fallback="/owner/listings" />
      </div>

      <ListingForm />
    </div>
  );
}
