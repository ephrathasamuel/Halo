'use client';

import Link from 'next/link';
import { formatPrice, LISTING_TYPE_LABELS } from '@/lib/format';
import { providerLocation } from '@/lib/geo';
import { SafeImage } from '@/components/ui/SafeImage';

/**
 * The one key fact shown under a listing title, so cards stay one line tall.
 * @param {object} listing
 * @returns {string}
 */
function keyFact(listing) {
  if (listing.type === 'studio') {
    return `Up to ${listing.capacity} people, ${listing.minHours || 2} hour minimum`;
  }
  if (listing.type === 'equipment') {
    return [listing.category, `${listing.quantity} available`].filter(Boolean).join(', ');
  }
  if (listing.type === 'sale') {
    return [listing.condition, listing.negotiable ? 'price negotiable' : ''].filter(Boolean).join(', ');
  }
  if (listing.type === 'service' && listing.eventTypes?.length) {
    return listing.eventTypes.slice(0, 3).join(', ');
  }
  return '';
}

/**
 * Listing card for catalogues, storefronts, and featured rows.
 * The whole card is one link; the provider name is a second, separate link.
 * @param {{
 *   listing: object,
 *   brandColor?: string,
 *   showProvider?: boolean,
 *   priority?: boolean
 * }} props
 */
export function ListingCard({ listing, showProvider = true, priority = false }) {
  if (!listing) return null;

  const provider = listing._provider || listing.provider;
  const isService = listing.type === 'service';
  const href = `/listings/${listing.id}`;
  const fact = keyFact(listing);
  const { city, currency } = providerLocation(provider);

  return (
    <article className="group relative flex flex-col">
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-halo-placeholder">
        <SafeImage
          src={listing.photos?.[0]}
          alt=""
          fallbackType={listing.type}
          fill
          priority={priority}
          className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
        <span className="absolute top-3 left-3 rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold text-halo-ink shadow-sm">
          {LISTING_TYPE_LABELS[listing.type] || listing.type}
        </span>
      </div>

      <div className="mt-3 flex flex-1 flex-col">
        <div className="flex items-center gap-1.5 text-[13px] text-halo-text-muted">
          {showProvider && provider ? (
            <>
              <Link
                href={`/studios/${provider.slug}`}
                className="relative z-10 font-medium text-halo-ink hover:underline min-h-0 min-w-0"
              >
                {provider.name}
              </Link>
              {provider.neighbourhood && <span>in {provider.neighbourhood}</span>}
            </>
          ) : (
            provider?.neighbourhood && <span>{provider.neighbourhood}, {city}</span>
          )}
        </div>

        <h3 className="mt-0.5 text-[15px] font-semibold leading-snug text-halo-ink line-clamp-1">
          {/* Stretched link: the whole card is clickable, but only this text is announced */}
          <Link href={href} className="after:absolute after:inset-0 after:content-[''] min-h-0 min-w-0 focus-visible:outline-none">
            {listing.title}
          </Link>
        </h3>

        {fact && <p className="mt-0.5 text-[13px] text-halo-text-muted line-clamp-1">{fact}</p>}

        <p className="mt-2 text-[15px] text-halo-ink tabular">
          {isService ? (
            <>
              <span className="text-halo-text-muted">From </span>
              <span className="font-semibold">{formatPrice(listing.startingFromHint || 0, currency)}</span>
            </>
          ) : listing.type === 'sale' ? (
            <span className="font-semibold">{formatPrice(listing.salePrice || 0, currency)}</span>
          ) : (
            <>
              <span className="font-semibold">{formatPrice(listing.hourlyRate || 0, currency)}</span>
              <span className="text-halo-text-muted"> per hour</span>
            </>
          )}
        </p>
      </div>

      {/* Keyboard focus ring for the stretched link */}
      <span className="pointer-events-none absolute -inset-2 rounded-2xl ring-2 ring-halo-gold opacity-0 group-has-[a:focus-visible]:opacity-100" aria-hidden="true" />
    </article>
  );
}
