'use client';

import { useState } from 'react';

/**
 * Filter and search bar for the browse catalogue.
 * @param {{
 *   filters: object,
 *   onFilterChange: (newFilters: object) => void,
 *   onReset: () => void,
 *   totalResults: number
 * }} props
 */
export function BrowseFilterBar({ filters, onFilterChange, onReset, totalResults }) {
  const [mobileExpanded, setMobileExpanded] = useState(false);

  const neighbourhoods = ['Bole', 'Arada', 'Kazanchis', 'Megenagna', 'Sarbet'];

  const handleInputChange = (field, value) => {
    onFilterChange({
      ...filters,
      [field]: value,
      page: 1, // Reset to page 1 on filter change
    });
  };

  const hasActiveFilters = Boolean(
    filters.query ||
    filters.type ||
    filters.neighbourhood ||
    filters.minPrice ||
    filters.maxPrice ||
    filters.capacity ||
    filters.date
  );

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 md:p-5 shadow-sm space-y-4">
      {/* Top row: Search input & Sort */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <label htmlFor="search-input" className="sr-only">
            Search listings by keyword or title
          </label>
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <span aria-hidden="true">🔍</span>
          </div>
          <input
            id="search-input"
            type="text"
            value={filters.query || ''}
            onChange={(e) => handleInputChange('query', e.target.value)}
            placeholder="Search studios, camera kits, lighting, filming..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 text-sm focus:border-halo-primary focus:ring-1 focus:ring-halo-primary min-h-[44px]"
          />
          {filters.query && (
            <button
              onClick={() => handleInputChange('query', '')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 text-sm min-h-[44px] min-w-[32px]"
              aria-label="Clear search input"
            >
              ✕
            </button>
          )}
        </div>

        {/* Sort Select */}
        <div className="flex items-center gap-2">
          <label htmlFor="sort-select" className="text-xs font-medium text-slate-600 whitespace-nowrap hidden sm:inline">
            Sort by:
          </label>
          <select
            id="sort-select"
            value={filters.sort || 'popularity'}
            onChange={(e) => handleInputChange('sort', e.target.value)}
            className="w-full sm:w-auto px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm font-medium bg-slate-50 focus:bg-white focus:border-halo-primary min-h-[44px]"
          >
            <option value="popularity">Most Popular</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="newest">Newest First</option>
          </select>
        </div>

        {/* Mobile Filter Toggle */}
        <button
          onClick={() => setMobileExpanded(!mobileExpanded)}
          className="sm:hidden inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 min-h-[44px]"
          aria-expanded={mobileExpanded}
          aria-controls="mobile-filter-drawer"
        >
          <span>⚙️</span>
          <span>Filters {hasActiveFilters ? '(Active)' : ''}</span>
          <span className="text-xs">{mobileExpanded ? '▲' : '▼'}</span>
        </button>
      </div>

      {/* Filter Options (Desktop always visible, Mobile toggleable) */}
      <div
        id="mobile-filter-drawer"
        className={`${mobileExpanded ? 'block' : 'hidden'} sm:block pt-3 border-t border-slate-100 space-y-3`}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Type Filter */}
          <div>
            <label htmlFor="filter-type" className="block text-xs font-semibold text-slate-700 mb-1">
              Category
            </label>
            <select
              id="filter-type"
              value={filters.type || ''}
              onChange={(e) => handleInputChange('type', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white min-h-[44px]"
            >
              <option value="">All Categories</option>
              <option value="studio">Studios</option>
              <option value="equipment">Equipment</option>
              <option value="service">Filming Services</option>
            </select>
          </div>

          {/* Neighbourhood Filter */}
          <div>
            <label htmlFor="filter-neighbourhood" className="block text-xs font-semibold text-slate-700 mb-1">
              Neighbourhood
            </label>
            <select
              id="filter-neighbourhood"
              value={filters.neighbourhood || ''}
              onChange={(e) => handleInputChange('neighbourhood', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white min-h-[44px]"
            >
              <option value="">All Areas (Addis Ababa)</option>
              {neighbourhoods.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>

          {/* Min Price Filter */}
          <div>
            <label htmlFor="filter-min-price" className="block text-xs font-semibold text-slate-700 mb-1">
              Min Price (ETB)
            </label>
            <input
              id="filter-min-price"
              type="number"
              min="0"
              step="50"
              placeholder="e.g. 200"
              value={filters.minPrice || ''}
              onChange={(e) => handleInputChange('minPrice', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm min-h-[44px]"
            />
          </div>

          {/* Max Price Filter */}
          <div>
            <label htmlFor="filter-max-price" className="block text-xs font-semibold text-slate-700 mb-1">
              Max Price (ETB)
            </label>
            <input
              id="filter-max-price"
              type="number"
              min="0"
              step="50"
              placeholder="e.g. 1000"
              value={filters.maxPrice || ''}
              onChange={(e) => handleInputChange('maxPrice', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm min-h-[44px]"
            />
          </div>

          {/* Date Filter */}
          <div>
            <label htmlFor="filter-date" className="block text-xs font-semibold text-slate-700 mb-1">
              Date Availability
            </label>
            <input
              id="filter-date"
              type="date"
              value={filters.date || ''}
              onChange={(e) => handleInputChange('date', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm min-h-[44px]"
            />
          </div>
        </div>

        {/* Status & Active Filter tags */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
          <div className="text-xs text-slate-500 font-medium">
            Showing <span className="font-bold text-slate-800">{totalResults}</span> active verified listings
          </div>

          {hasActiveFilters && (
            <button
              onClick={onReset}
              className="text-xs font-semibold text-red-600 hover:text-red-700 hover:underline min-h-[44px] flex items-center gap-1"
            >
              <span>✕</span> Clear all filters
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
