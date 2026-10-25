'use client';

import { useState } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { Select } from '@/components/ui/Select';

const TYPES = [
  { value: '', label: 'All' },
  { value: 'studio', label: 'Studios' },
  { value: 'equipment', label: 'Equipment' },
  { value: 'service', label: 'Event filming' },
  { value: 'sale', label: 'For sale' },
];

const fieldClass =
  'w-full px-3 rounded-xl border border-halo-border-strong bg-halo-surface text-sm text-halo-ink focus:border-halo-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-gold';

const selectButtonClass =
  'min-h-[44px] px-3 rounded-xl border border-halo-border-strong bg-halo-surface text-sm hover:border-halo-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-gold';

/**
 * Filter and search controls for the browse catalogue.
 * @param {{
 *   filters: object,
 *   onFilterChange: (newFilters: object) => void,
 *   onReset: () => void,
 *   totalResults: number,
 *   regions?: { value: string, label: string }[],
 *   cities?: string[],
 *   neighbourhoods?: string[],
 *   regionForCity?: (city: string) => string,
 *   currency?: string
 * }} props
 */
export function BrowseFilterBar({
  filters,
  onFilterChange,
  onReset,
  totalResults,
  regions = [],
  cities = [],
  neighbourhoods = [],
  regionForCity = () => '',
  currency = '',
}) {
  const [panelOpen, setPanelOpen] = useState(false);

  const update = (field, value) => {
    onFilterChange({ ...filters, [field]: value, page: 1 });
  };

  // Choosing a broader place clears the narrower ones under it
  const setRegion = (region) => onFilterChange({ ...filters, region, city: '', neighbourhood: '', page: 1 });
  // Picking a city first fills in its region, so the region list stays in step
  const setCity = (city) =>
    onFilterChange({
      ...filters,
      region: city && !filters.region ? regionForCity(city) : filters.region,
      city,
      neighbourhood: '',
      page: 1,
    });

  const activeFilterCount = [
    filters.region,
    filters.city,
    filters.neighbourhood,
    filters.minPrice,
    filters.maxPrice,
    filters.date,
  ].filter(Boolean).length;
  const hasAnyFilter = Boolean(filters.query || filters.type || activeFilterCount);

  return (
    <div className="space-y-4">
      {/* Category pills */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0" role="group" aria-label="Category">
        {TYPES.map((t) => {
          const active = (filters.type || '') === t.value;
          return (
            <button
              key={t.value || 'all'}
              type="button"
              onClick={() => update('type', t.value)}
              aria-pressed={active}
              className={`shrink-0 px-4 rounded-full text-sm font-medium border transition-colors min-h-[40px] ${
                active
                  ? 'bg-halo-ink border-halo-ink text-white'
                  : 'bg-white border-halo-border-strong text-halo-ink hover:border-halo-ink'
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Search, filters toggle (phones) */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <label htmlFor="search-input" className="sr-only">
            Search listings
          </label>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-halo-text-muted pointer-events-none" aria-hidden="true" />
          <input
            id="search-input"
            type="search"
            value={filters.query || ''}
            onChange={(e) => update('query', e.target.value)}
            placeholder="Search by name, gear or style"
            className={`${fieldClass} pl-9 pr-9`}
          />
          {filters.query && (
            <button
              type="button"
              onClick={() => update('query', '')}
              className="absolute right-0 top-0 h-full px-3 text-halo-text-muted hover:text-halo-ink"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={() => setPanelOpen((o) => !o)}
          className="md:hidden inline-flex items-center gap-2 px-3.5 rounded-lg border border-halo-border-strong bg-white text-sm font-medium text-halo-ink"
          aria-expanded={panelOpen}
          aria-controls="browse-filters"
        >
          <SlidersHorizontal className="w-4 h-4" aria-hidden="true" />
          Filters
          {activeFilterCount > 0 && (
            <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-halo-ink px-1.5 text-[11px] font-semibold text-white">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Filters: always visible from tablet up, toggled on phones */}
      <div
        id="browse-filters"
        className={`${panelOpen ? 'grid' : 'hidden'} md:grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3`}
      >
        <Select
          label="Region"
          value={filters.region || ''}
          onChange={setRegion}
          options={[{ value: '', label: 'All regions' }, ...regions]}
          buttonClassName={selectButtonClass}
        />
        <Select
          label="City"
          value={filters.city || ''}
          onChange={setCity}
          options={[
            { value: '', label: 'All cities' },
            ...cities.map((c) => ({ value: c, label: c })),
          ]}
          buttonClassName={selectButtonClass}
        />
        <Select
          label="Area"
          value={filters.neighbourhood || ''}
          onChange={(v) => update('neighbourhood', v)}
          options={[
            { value: '', label: filters.city ? 'All areas' : 'Choose a city first' },
            ...neighbourhoods.map((n) => ({ value: n, label: n })),
          ]}
          className="col-span-2 md:col-span-1"
          buttonClassName={selectButtonClass}
        />
        <div>
          <label htmlFor="filter-min-price" className="block text-xs font-medium text-halo-text-muted mb-1">
            Min price{currency ? ` (${currency})` : ''}
          </label>
          <input
            id="filter-min-price"
            type="number"
            inputMode="numeric"
            min="0"
            step="50"
            placeholder="0"
            value={filters.minPrice || ''}
            onChange={(e) => update('minPrice', e.target.value)}
            className={fieldClass}
          />
        </div>
        <div>
          <label htmlFor="filter-max-price" className="block text-xs font-medium text-halo-text-muted mb-1">
            Max price{currency ? ` (${currency})` : ''}
          </label>
          <input
            id="filter-max-price"
            type="number"
            inputMode="numeric"
            min="0"
            step="50"
            placeholder="Any"
            value={filters.maxPrice || ''}
            onChange={(e) => update('maxPrice', e.target.value)}
            className={fieldClass}
          />
        </div>
        <div className="col-span-2 md:col-span-1">
          <label htmlFor="filter-date" className="block text-xs font-medium text-halo-text-muted mb-1">
            Available on
          </label>
          <input
            id="filter-date"
            type="date"
            value={filters.date || ''}
            onChange={(e) => update('date', e.target.value)}
            className={fieldClass}
          />
        </div>
      </div>

      {/* Result count, reset, sort */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-halo-border pt-4">
        <div className="flex items-center gap-3 text-sm">
          <p className="text-halo-ink" aria-live="polite">
            <span className="font-semibold tabular">{totalResults}</span>{' '}
            {totalResults === 1 ? 'listing' : 'listings'}
          </p>
          {hasAnyFilter && (
            <button
              type="button"
              onClick={onReset}
              className="text-sm font-medium text-halo-text-muted underline underline-offset-2 hover:text-halo-ink min-h-[36px]"
            >
              Clear all
            </button>
          )}
        </div>
        <Select
          label="Sort"
          hideLabel
          align="right"
          value={filters.sort || 'popularity'}
          onChange={(v) => update('sort', v)}
          options={[
            { value: 'popularity', label: 'Most popular' },
            { value: 'price_asc', label: 'Price, low to high' },
            { value: 'price_desc', label: 'Price, high to low' },
            { value: 'newest', label: 'Newest' },
          ]}
          buttonClassName="min-h-[40px] gap-3 px-3.5 rounded-xl border border-halo-border-strong bg-halo-surface text-sm font-medium hover:border-halo-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-gold"
        />
      </div>
    </div>
  );
}
