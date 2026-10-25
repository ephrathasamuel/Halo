'use client';

import { Suspense, useState, useCallback, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { SearchX } from 'lucide-react';
import { getPublicListings } from '@/lib/domain/listings';
import { getPublicProviders } from '@/lib/domain/providers';
import { BrowseFilterBar } from '@/components/listings/BrowseFilterBar';
import { ListingCard } from '@/components/listings/ListingCard';
import { Pagination } from '@/components/ui/Pagination';
import { EmptyState } from '@/components/states/EmptyState';
import { ListingGridSkeleton } from '@/components/states/LoadingState';
import { useHydrated } from '@/hooks/useHydrated';
import { useCountry } from '@/hooks/useCountry';
import { cityOptions, countryName, currencyFor, regionForCity, regionOptions, regionsOf } from '@/lib/geo';

const PAGE_TITLES = {
  studio: 'Studios for hire',
  equipment: 'Equipment for rent',
  service: 'Event filming crews',
  sale: 'Gear for sale',
};

const EMPTY_FILTERS = {
  query: '',
  type: '',
  region: '',
  city: '',
  neighbourhood: '',
  minPrice: '',
  maxPrice: '',
  capacity: '',
  date: '',
  sort: 'popularity',
  page: 1,
};

/** @param {URLSearchParams} searchParams */
function filtersFromParams(searchParams) {
  return {
    query: searchParams.get('q') || '',
    type: searchParams.get('type') || '',
    region: searchParams.get('region') || '',
    city: searchParams.get('city') || '',
    neighbourhood: searchParams.get('neighbourhood') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    capacity: searchParams.get('capacity') || '',
    date: searchParams.get('date') || '',
    sort: searchParams.get('sort') || 'popularity',
    page: parseInt(searchParams.get('page') || '1', 10),
  };
}

function BrowseContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const hydrated = useHydrated();
  const { country } = useCountry();
  const ready = hydrated && country !== null;

  const [filters, setFilters] = useState(() => filtersFromParams(searchParams));

  // Links elsewhere (header categories, home search) change the URL while this page
  // stays mounted, so follow the URL whenever it changes.
  const paramsKey = searchParams.toString();
  useEffect(() => {
    setFilters(filtersFromParams(new URLSearchParams(paramsKey)));
  }, [paramsKey]);

  const updateUrlParams = useCallback(
    (newFilters) => {
      const params = new URLSearchParams();
      if (newFilters.query) params.set('q', newFilters.query);
      if (newFilters.type) params.set('type', newFilters.type);
      if (newFilters.region) params.set('region', newFilters.region);
      if (newFilters.city) params.set('city', newFilters.city);
      if (newFilters.neighbourhood) params.set('neighbourhood', newFilters.neighbourhood);
      if (newFilters.minPrice) params.set('minPrice', newFilters.minPrice);
      if (newFilters.maxPrice) params.set('maxPrice', newFilters.maxPrice);
      if (newFilters.capacity) params.set('capacity', newFilters.capacity);
      if (newFilters.date) params.set('date', newFilters.date);
      if (newFilters.sort && newFilters.sort !== 'popularity') params.set('sort', newFilters.sort);
      if (newFilters.page && newFilters.page > 1) params.set('page', String(newFilters.page));

      const queryString = params.toString();
      router.replace(queryString ? `/browse?${queryString}` : '/browse', { scroll: false });
    },
    [router]
  );

  // A region or city from another country makes no sense once the country changes
  useEffect(() => {
    if (!country || !filters.region || regionsOf(country).includes(filters.region)) return;
    const cleared = { ...filters, region: '', city: '', neighbourhood: '', page: 1 };
    setFilters(cleared);
    updateUrlParams(cleared);
  }, [country, filters, updateUrlParams]);

  const handleFilterChange = (updated) => {
    setFilters(updated);
    updateUrlParams(updated);
  };

  const handleResetFilters = () => {
    setFilters(EMPTY_FILTERS);
    updateUrlParams(EMPTY_FILTERS);
  };

  const handlePageChange = (newPage) => {
    const updated = { ...filters, page: newPage };
    setFilters(updated);
    updateUrlParams(updated);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Listings live in browser storage for now, so query only after mount
  const result = ready
    ? getPublicListings({
        query: filters.query,
        type: filters.type,
        country,
        region: filters.region,
        city: filters.city,
        neighbourhood: filters.neighbourhood,
        minPrice: filters.minPrice ? Number(filters.minPrice) : undefined,
        maxPrice: filters.maxPrice ? Number(filters.maxPrice) : undefined,
        capacity: filters.capacity ? Number(filters.capacity) : undefined,
        date: filters.date,
        sort: filters.sort,
        page: filters.page,
        pageSize: 9,
      })
    : { items: [], total: 0, totalPages: 0, page: 1 };

  // Region, then city, then the areas providers in that city actually use
  const regions = regionOptions(country);
  const cities = cityOptions(country, filters.region);
  const neighbourhoods = ready && filters.city
    ? [
        ...new Set(
          getPublicProviders({ country, region: filters.region, city: filters.city })
            .map((p) => p.neighbourhood)
            .filter(Boolean)
        ),
      ].sort()
    : [];
  const place = filters.city || filters.region || (country ? countryName(country) : '');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      <div className="mb-6">
        <h1 className="text-3xl sm:text-4xl font-semibold text-halo-ink">
          {PAGE_TITLES[filters.type] || 'Browse Halo'}
        </h1>
        <p className="mt-2 text-halo-text-muted">
          Verified studios, production gear and film crews{place ? ` in ${place}` : ''}.
        </p>
      </div>

      <BrowseFilterBar
        filters={filters}
        onFilterChange={handleFilterChange}
        onReset={handleResetFilters}
        totalResults={result.total}
        regions={regions}
        cities={cities}
        neighbourhoods={neighbourhoods}
        regionForCity={(city) => regionForCity(country, city)}
        currency={country ? currencyFor(country) : ''}
      />

      <div className="mt-8">
        {!ready ? (
          <ListingGridSkeleton count={6} />
        ) : result.items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-halo-border-strong bg-white">
            <EmptyState
              icon={SearchX}
              title="No listings match these filters"
              message="Try another area, a wider price range, or a different date."
            >
              <button
                onClick={handleResetFilters}
                className="inline-flex items-center px-4 bg-halo-ink text-white rounded-lg text-sm font-semibold hover:bg-halo-ink-soft"
              >
                Clear all filters
              </button>
            </EmptyState>
          </div>
        ) : (
          <>
            <div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10"
              role="region"
              aria-label="Listings"
            >
              {result.items.map((listing, i) => (
                <ListingCard key={listing.id} listing={listing} priority={i < 3} />
              ))}
            </div>
            <Pagination
              currentPage={result.page}
              totalPages={result.totalPages}
              onPageChange={handlePageChange}
            />
          </>
        )}
      </div>
    </div>
  );
}

export default function BrowsePage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <ListingGridSkeleton count={6} />
        </div>
      }
    >
      <BrowseContent />
    </Suspense>
  );
}
