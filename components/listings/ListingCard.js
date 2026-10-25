'use client';

import Link from 'next/link';
import { formatETB } from '@/lib/format';
import { SafeImage } from '@/components/ui/SafeImage';

/**
 * Reusable listing card for catalogues, storefronts, and featured listings.
 * @param {{
 *   listing: object,
 *   brandColor?: string,
 *   showProvider?: boolean
 * }} props
 */
export function ListingCard({ listing, brandColor, showProvider = true }) {
  if (!listing) return null;

  const provider = listing._provider || listing.provider;
  const isService = listing.type === 'service';
  const effectiveBrandColor = brandColor || provider?.brandColor || '#1E3A5F';

  return (
    <article className="group bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col h-full focus-within:ring-2 focus-within:ring-halo-primary">
      {/* Media Image */}
      <Link
        href={`/listings/${listing.id}`}
        className="block relative aspect-[4/3] w-full overflow-hidden bg-slate-100 min-h-[180px]"
        tabIndex={-1}
        aria-hidden="true"
      >
        <SafeImage
          src={listing.photos?.[0]}
          alt={listing.title}
          fallbackType={listing.type}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />

        {/* Type Badge */}
        <span className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm text-slate-800 text-xs font-semibold px-2.5 py-1 rounded-full shadow-sm capitalize border border-slate-200/60">
          {listing.type}
        </span>

        {/* Neighbourhood Badge */}
        {provider?.neighbourhood && (
          <span className="absolute bottom-3 left-3 bg-slate-900/80 backdrop-blur-sm text-white text-xs px-2.5 py-0.5 rounded-md flex items-center gap-1">
            <span>📍</span> {provider.neighbourhood}
          </span>
        )}
      </Link>

      {/* Card Content */}
      <div className="p-4 flex flex-col flex-1 justify-between gap-3">
        <div>
          {/* Provider attribution */}
          {showProvider && provider && (
            <Link
              href={`/studios/${provider.slug}`}
              className="text-xs font-semibold hover:underline line-clamp-1 mb-1 block"
              style={{ color: effectiveBrandColor }}
            >
              {provider.name}
            </Link>
          )}

          {/* Title */}
          <h3 className="font-bold text-slate-900 text-base leading-snug line-clamp-1 group-hover:text-halo-primary transition-colors">
            <Link href={`/listings/${listing.id}`} className="focus:outline-none">
              {listing.title}
            </Link>
          </h3>

          {/* Description */}
          <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
            {listing.description}
          </p>

          {/* Metadata chips */}
          <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
            {listing.type === 'studio' && (
              <>
                <span className="text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                  👥 Up to {listing.capacity} people
                </span>
                <span className="text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                  ⏱️ Min {listing.minHours || 2}h
                </span>
              </>
            )}
            {listing.type === 'equipment' && (
              <>
                <span className="text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                  📦 {listing.quantity} available
                </span>
                <span className="text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                  🏷️ {listing.category}
                </span>
              </>
            )}
            {listing.type === 'service' && listing.eventTypes && (
              <span className="text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded line-clamp-1">
                🎉 {listing.eventTypes.slice(0, 2).join(', ')}
              </span>
            )}
          </div>
        </div>

        {/* Pricing & Call to Action */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between mt-auto">
          <div>
            {isService ? (
              <div className="flex flex-col">
                <span className="text-[11px] text-slate-400 font-medium">Starting from</span>
                <span className="text-sm font-bold text-slate-900">
                  {formatETB(listing.startingFromHint || 0)}
                </span>
              </div>
            ) : (
              <div className="flex items-baseline gap-1">
                <span className="text-base font-bold text-slate-900">
                  {formatETB(listing.hourlyRate || 0)}
                </span>
                <span className="text-xs text-slate-500 font-medium">/hr</span>
              </div>
            )}
          </div>

          <Link
            href={`/listings/${listing.id}`}
            className="inline-flex items-center justify-center px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white transition-opacity hover:opacity-90 min-h-[44px]"
            style={{ backgroundColor: effectiveBrandColor }}
          >
            {isService ? 'Request Quote' : 'View Details'}
          </Link>
        </div>
      </div>
    </article>
  );
}
