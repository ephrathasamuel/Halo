'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getProviderBySlug, getProviderPortfolio } from '@/lib/domain/providers';
import { SafeImage } from '@/components/ui/SafeImage';
import { EmptyState } from '@/components/states/EmptyState';
import { formatDate } from '@/lib/format';

export default function ProviderPortfolioPage() {
  const { slug } = useParams();
  const provider = getProviderBySlug(slug);
  const [selectedTag, setSelectedTag] = useState('all');

  if (!provider) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <EmptyState
          title="Studio Not Found"
          message="This provider either does not exist or is not available."
        />
        <Link
          href="/studios"
          className="mt-4 inline-flex items-center text-halo-primary hover:underline"
        >
          Browse All Studios
        </Link>
      </div>
    );
  }

  const allItems = getProviderPortfolio(provider.id);

  // Extract distinct event types
  const eventTypes = ['all', ...new Set(allItems.map((i) => i.eventType).filter(Boolean))];

  const filteredItems =
    selectedTag === 'all'
      ? allItems
      : allItems.filter((i) => i.eventType === selectedTag);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header with back link */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <Link
            href={`/studios/${slug}`}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1 mb-2 min-h-[44px]"
          >
            ← Back to {provider.name}
          </Link>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {provider.name} Portfolio Gallery
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Showcase of commercial productions, weddings, fashion shoots, and creative projects.
          </p>
        </div>

        {/* Filter tags */}
        <div className="flex flex-wrap items-center gap-1.5" role="toolbar" aria-label="Portfolio filters">
          {eventTypes.map((tag) => {
            const isSelected = selectedTag === tag;
            return (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold capitalize min-h-[44px] transition-colors ${
                  isSelected
                    ? 'text-white shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
                style={isSelected ? { backgroundColor: provider.brandColor } : undefined}
                aria-pressed={isSelected}
              >
                {tag}
              </button>
            );
          })}
        </div>
      </div>

      {/* Gallery Grid */}
      {filteredItems.length === 0 ? (
        <EmptyState
          title="No portfolio items found"
          message={`No items categorized under "${selectedTag}".`}
          icon="🖼️"
        />
      ) : (
        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          role="region"
          aria-label="Portfolio media grid"
        >
          {filteredItems.map((item) => (
            <article
              key={item.id}
              className="group bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col"
            >
              <div className="relative aspect-video w-full bg-slate-100 overflow-hidden">
                <SafeImage
                  src={item.mediaUrl}
                  alt={item.title}
                  fallbackType="service"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <span className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-sm text-white text-[11px] font-semibold px-2 py-0.5 rounded capitalize">
                  {item.eventType}
                </span>
              </div>
              <div className="p-4 flex-1 flex flex-col justify-between">
                <h2 className="text-base font-bold text-slate-900 leading-snug">
                  {item.title}
                </h2>
                <div className="pt-2 text-xs text-slate-400">
                  Added on {formatDate(item.createdAt.slice(0, 10))}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
