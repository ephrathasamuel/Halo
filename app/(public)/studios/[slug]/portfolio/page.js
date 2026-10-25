'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { ImageOff } from 'lucide-react';
import { getProviderBySlug, getProviderPortfolio } from '@/lib/domain/providers';
import { SafeImage } from '@/components/ui/SafeImage';
import { EmptyState } from '@/components/states/EmptyState';
import { formatDate } from '@/lib/format';

export default function ProviderPortfolioPage() {
  const { slug } = useParams();
  const [selectedTag, setSelectedTag] = useState('all');

  // The storefront layout only renders this page after mount, for an approved provider
  const provider = getProviderBySlug(slug);
  if (!provider) return null;

  const allItems = getProviderPortfolio(provider.id);
  const eventTypes = ['all', ...new Set(allItems.map((i) => i.eventType).filter(Boolean))];
  const filteredItems =
    selectedTag === 'all' ? allItems : allItems.filter((i) => i.eventType === selectedTag);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl sm:text-4xl font-semibold text-halo-ink">Work by {provider.name}</h1>
          <p className="mt-2 text-halo-text-muted">
            Weddings, fashion, music videos and commercial projects they have shot.
          </p>
        </div>

        {eventTypes.length > 2 && (
          <div className="flex gap-2 overflow-x-auto no-scrollbar" role="group" aria-label="Filter by type of work">
            {eventTypes.map((tag) => {
              const isSelected = selectedTag === tag;
              return (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(tag)}
                  aria-pressed={isSelected}
                  className={`shrink-0 px-4 rounded-full text-sm font-medium border capitalize min-h-[40px] transition-colors ${
                    isSelected
                      ? 'bg-halo-ink border-halo-ink text-white'
                      : 'bg-white border-halo-border-strong text-halo-ink hover:border-halo-ink'
                  }`}
                >
                  {tag === 'all' ? 'All work' : tag}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-10">
        {filteredItems.length === 0 ? (
          <EmptyState
            icon={ImageOff}
            title="No projects here yet"
            message={
              selectedTag === 'all'
                ? `${provider.name} hasn't added any work yet.`
                : `Nothing tagged "${selectedTag}" yet.`
            }
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10" role="region" aria-label="Portfolio">
            {filteredItems.map((item) => (
              <figure key={item.id}>
                <div className="relative aspect-[3/2] w-full overflow-hidden rounded-xl bg-halo-placeholder">
                  <SafeImage src={item.mediaUrl} alt={item.title} fallbackType="service" fill className="object-cover" />
                </div>
                <figcaption className="mt-3">
                  <span className="block font-semibold text-halo-ink">{item.title}</span>
                  <span className="block text-sm text-halo-text-muted">
                    <span className="capitalize">{item.eventType}</span>, {formatDate(item.createdAt.slice(0, 10))}
                  </span>
                </figcaption>
              </figure>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
