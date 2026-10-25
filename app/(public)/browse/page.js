'use client';

import { Suspense, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getPublicListings } from '@/lib/domain/listings';
import { BrowseFilterBar } from '@/components/listings/BrowseFilterBar';
import { ListingCard } from '@/components/listings/ListingCard';
import { Pagination } from '@/components/ui/Pagination';
import { EmptyState } from '@/components/states/EmptyState';

function BrowseContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Parse initial filters from URL params
  const [filters, setFilters] = useState(() => ({
    query: searchParams.get('q') || '',
    type: searchParams.get('type') || '',
    neighbourhood: searchParams.get('neighbourhood') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    capacity: searchParams.get('capacity') || '',
    date: searchParams.get('date') || '',
    sort: searchParams.get('sort') || 'popularity',
    page: parseInt(searchParams.get('page') || '1', 10),
  }));

  // Sync state changes to URL query string
  const updateUrlParams = useCallback(
    (newFilters) => {
      const params = new URLSearchParams();
      if (newFilters.query) params.set('q', newFilters.query);
      if (newFilters.type) params.set('type', newFilters.type);
      if (newFilters.neighbourhood) params.set('neighbourhood', newFilters.neighbourhood);
      if (newFilters.minPrice) params.set('minPrice', newFilters.minPrice);
      if (newFilters.maxPrice) params.set('maxPrice', newFilters.maxPrice);
      if (newFilters.capacity) params.set('capacity', newFilters.capacity);
      if (newFilters.date) params.set('date', newFilters.date);
      if (newFilters.sort && newFilters.sort !== 'popularity') params.set('sort', newFilters.sort);
      if (newFilters.page && newFilters.page > 1) params.set('page', String(newFilters.page));

      const queryString = params.toString();
      const targetUrl = queryString ? `/browse?${queryString}` : '/browse';
      router.replace(targetUrl, { scroll: false });
    },
    [router]
  );

  const handleFilterChange = (updated) => {
    setFilters(updated);
    updateUrlParams(updated);
  };

  const handleResetFilters = () => {
    const reset = {
      query: '',
      type: '',
      neighbourhood: '',
      minPrice: '',
      maxPrice: '',
      capacity: '',
      date: '',
      sort: 'popularity',
      page: 1,
    };
    setFilters(reset);
    updateUrlParams(reset);
  };

  const handlePageChange = (newPage) => {
    const updated = { ...filters, page: newPage };
    setFilters(updated);
    updateUrlParams(updated);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Query domain logic
  const { items, total, totalPages, page } = getPublicListings({
    query: filters.query,
    type: filters.type,
    neighbourhood: filters.neighbourhood,
    minPrice: filters.minPrice ? Number(filters.minPrice) : undefined,
    maxPrice: filters.maxPrice ? Number(filters.maxPrice) : undefined,
    capacity: filters.capacity ? Number(filters.capacity) : undefined,
    date: filters.date,
    sort: filters.sort,
    page: filters.page,
    pageSize: 6,
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Page Title & Context */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Browse Creative Spaces & Gear
        </h1>
        <p className="text-slate-500 mt-1 text-sm sm:text-base">
          Discover verified studios, cinema equipment, and event crews across Addis Ababa.
        </p>
      </div>

      {/* Filter and Search Controls */}
      <BrowseFilterBar
        filters={filters}
        onFilterChange={handleFilterChange}
        onReset={handleResetFilters}
        totalResults={total}
      />

      {/* Results grid or Empty State */}
      {items.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center my-6">
          <EmptyState
            title="No matching listings found"
            message="Try broadening your search criteria, clearing selected filters, or checking back soon."
            icon="🔎"
          />
          <button
            onClick={handleResetFilters}
            className="mt-4 inline-flex items-center justify-center px-4 py-2 bg-halo-primary text-white rounded-lg text-sm font-semibold hover:bg-halo-primary-light transition-colors min-h-[44px]"
          >
            Reset All Filters
          </button>
        </div>
      ) : (
        <>
          <div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            role="region"
            aria-label="Listings Catalogue"
          >
            {items.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>

          {/* Pagination */}
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </>
      )}
    </div>
  );
}

export default function BrowsePage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto px-4 py-16 text-center text-slate-500">
          Loading listings catalogue...
        </div>
      }
    >
      <BrowseContent />
    </Suspense>
  );
}
