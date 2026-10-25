'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';
import {
  BadgeCheck,
  CalendarClock,
  Check,
  Clock,
  Layers,
  MapPin,
  Package,
  PackageX,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
  Star,
  Tag,
  Users,
} from 'lucide-react';
import { getListingById } from '@/lib/domain/listings';
import { getProviderReviews } from '@/lib/domain/providers';
import { formatHours, formatMoney, formatPrice, LISTING_TYPE_LABELS } from '@/lib/format';
import { countryName, providerLocation } from '@/lib/geo';
import { SafeImage } from '@/components/ui/SafeImage';
import { StorefrontMap } from '@/components/maps/StorefrontMap';
import { EmptyState } from '@/components/states/EmptyState';
import { useSession } from '@/hooks/useSession';
import { useHydrated } from '@/hooks/useHydrated';
import { BookingPanel } from '@/components/booking/BookingPanel';
import { PurchasePanel } from '@/components/booking/PurchasePanel';
import { BackButton } from '@/components/ui/BackButton';
import { ProviderLogo } from '@/components/ui/ProviderLogo';

/**
 * One fact in the "at a glance" grid.
 * @param {{ icon: import('react').ComponentType<{ className?: string }>, label: string, value: string }} props
 */
function Fact({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 h-5 w-5 shrink-0 text-halo-ink" strokeWidth={1.75} aria-hidden="true" />
      <div>
        <dt className="text-sm text-halo-text-muted">{label}</dt>
        <dd className="font-medium text-halo-ink">{value}</dd>
      </div>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse" aria-hidden="true">
      <div className="h-4 w-48 rounded bg-halo-placeholder" />
      <div className="mt-4 h-9 w-2/3 rounded bg-halo-placeholder" />
      <div className="mt-6 aspect-[16/9] rounded-2xl bg-halo-placeholder" />
    </div>
  );
}

/**
 * Client component for listing details.
 * @param {{ id: string }} props
 */
export function ListingDetailClient({ id }) {
  const router = useRouter();
  const hydrated = useHydrated();
  const { session } = useSession();
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);

  // Listings come from browser storage for now: read after mount to avoid a hydration mismatch
  if (!hydrated) return <DetailSkeleton />;

  const listing = getListingById(id);

  if (!listing) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16">
        <EmptyState
          icon={PackageX}
          title="This listing isn't available"
          message="It may have been removed, paused by the provider, or still be waiting for approval."
        >
          <Link
            href="/browse"
            className="inline-flex items-center px-4 bg-halo-ink text-white rounded-lg text-sm font-semibold hover:bg-halo-ink-soft"
          >
            Browse listings
          </Link>
        </EmptyState>
      </div>
    );
  }

  const provider = listing.provider;
  const isStudio = listing.type === 'studio';
  const isEquipment = listing.type === 'equipment';
  const isService = listing.type === 'service';
  const isSale = listing.type === 'sale';
  const photos = listing.photos && listing.photos.length > 0 ? listing.photos : [''];
  const reviews = getProviderReviews(provider.id);
  const averageRating =
    reviews.length > 0
      ? (reviews.reduce((acc, r) => acc + (r.rating || 0), 0) / reviews.length).toFixed(1)
      : null;
  const typeLabel = LISTING_TYPE_LABELS[listing.type] || listing.type;
  const loc = providerLocation(provider);

  const handleQuoteRequest = () => {
    const target = `/studios/${provider.slug}/request-quote`;
    router.push(session ? target : `/signin?next=${encodeURIComponent(target)}`);
  };

  const facts = isStudio
    ? [
        { icon: Users, label: 'Capacity', value: `Up to ${listing.capacity} people` },
        { icon: Clock, label: 'Minimum booking', value: `${listing.minHours || 2} hours` },
        { icon: RefreshCcw, label: 'Cleanup between bookings', value: `${listing.bufferMinutes || 30} minutes` },
        { icon: CalendarClock, label: 'Open', value: formatHours(provider.hours) },
      ]
    : isEquipment
      ? [
          ...(listing.category ? [{ icon: Tag, label: 'Category', value: listing.category }] : []),
          { icon: Package, label: 'In stock', value: `${listing.quantity} ${listing.quantity === 1 ? 'unit' : 'units'}` },
          { icon: Sparkles, label: 'Condition', value: listing.condition || 'Professional grade' },
          { icon: ShieldCheck, label: 'Refundable deposit', value: formatMoney(listing.deposit || 0, loc.currency) },
        ]
      : isSale
        ? [
            { icon: Sparkles, label: 'Condition', value: listing.condition || 'Used' },
            { icon: Package, label: 'Available', value: `${listing.quantity} ${listing.quantity === 1 ? 'item' : 'items'}` },
            { icon: Tag, label: 'Price', value: listing.negotiable ? 'Negotiable' : 'Fixed' },
            ...(listing.category ? [{ icon: Layers, label: 'Category', value: listing.category }] : []),
          ]
        : [
            { icon: Layers, label: 'Pricing', value: 'Custom quote for your event' },
            { icon: CalendarClock, label: 'Office hours', value: formatHours(provider.hours) },
          ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-28 lg:pb-12">
      <BackButton fallback="/browse" />

      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="mt-2 text-sm text-halo-text-muted">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li>
            <Link href="/browse" className="hover:text-halo-ink min-h-0">Browse</Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link href={`/browse?type=${listing.type}`} className="hover:text-halo-ink min-h-0">{typeLabel}</Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link href={`/studios/${provider.slug}`} className="hover:text-halo-ink min-h-0">{provider.name}</Link>
          </li>
        </ol>
      </nav>

      {/* Title row */}
      <div className="mt-3">
        <h1 className="text-3xl sm:text-4xl font-semibold text-halo-ink">{listing.title}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[15px] text-halo-text-muted">
          {averageRating && (
            <span className="inline-flex items-center gap-1 text-halo-ink">
              <Star className="h-4 w-4 fill-halo-gold text-halo-gold" aria-hidden="true" />
              <span className="font-semibold tabular">{averageRating}</span>
              <span className="text-halo-text-muted">
                ({reviews.length} {reviews.length === 1 ? 'review' : 'reviews'})
              </span>
            </span>
          )}
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-4 w-4" aria-hidden="true" />
            {provider.neighbourhood}, {loc.city}, {countryName(loc.country)}
          </span>
          <span className="inline-flex items-center gap-1">
            <BadgeCheck className="h-4 w-4 text-halo-success" aria-hidden="true" />
            Verified provider
          </span>
        </div>
      </div>

      {/* Gallery */}
      <div className="mt-6">
        <div className="relative aspect-[16/10] sm:aspect-[16/8] w-full overflow-hidden rounded-2xl bg-halo-placeholder">
          <SafeImage
            src={photos[selectedPhotoIndex]}
            alt={`${listing.title}, photo ${selectedPhotoIndex + 1} of ${photos.length}`}
            fallbackType={listing.type}
            fill
            priority
            className="object-cover"
            sizes="(max-width: 1280px) 100vw, 1216px"
          />
        </div>
        {photos.length > 1 && (
          <div className="mt-3 flex gap-2 overflow-x-auto no-scrollbar" role="group" aria-label="Photos">
            {photos.map((p, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedPhotoIndex(idx)}
                className={`relative h-16 w-24 shrink-0 overflow-hidden rounded-lg transition ${
                  selectedPhotoIndex === idx ? 'ring-2 ring-halo-ink ring-offset-2' : 'opacity-70 hover:opacity-100'
                }`}
                aria-label={`Show photo ${idx + 1}`}
                aria-pressed={selectedPhotoIndex === idx}
              >
                <SafeImage src={p} alt="" fallbackType={listing.type} fill className="object-cover" sizes="96px" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="mt-10 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_380px] gap-10 lg:gap-14 items-start">
        {/* Details */}
        <div className="space-y-10">
          <section className="flex items-center justify-between gap-4 border-b border-halo-border pb-8">
            <div>
              <h2 className="text-xl font-semibold text-halo-ink">
                {typeLabel} by {provider.name}
              </h2>
              <p className="mt-0.5 text-halo-text-muted">{provider.tagline}</p>
            </div>
            <Link href={`/studios/${provider.slug}`} className="shrink-0 rounded-full" aria-label={`Visit ${provider.name}`}>
              <ProviderLogo provider={provider} size={56} rounded="rounded-full" />
            </Link>
          </section>

          <section aria-labelledby="facts-heading">
            <h2 id="facts-heading" className="sr-only">At a glance</h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {facts.map((f) => (
                <Fact key={f.label} {...f} />
              ))}
            </dl>
          </section>

          {Array.isArray(listing.details) && listing.details.length > 0 && (
            <section aria-labelledby="details-heading" className="border-t border-halo-border pt-8">
              <h2 id="details-heading" className="text-xl font-semibold text-halo-ink">Details</h2>
              <dl className="mt-4 divide-y divide-halo-border rounded-xl border border-halo-border">
                {listing.details.map((d) => (
                  <div key={d.label} className="grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)] gap-4 px-4 py-3">
                    <dt className="text-halo-text-muted">{d.label}</dt>
                    <dd className="text-halo-ink">{d.value}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}

          <section aria-labelledby="about-heading" className="border-t border-halo-border pt-8">
            <h2 id="about-heading" className="text-xl font-semibold text-halo-ink">About this {isSale ? 'item' : typeLabel.toLowerCase()}</h2>
            <p className="mt-3 text-halo-ink/85 leading-relaxed whitespace-pre-line max-w-[68ch]">
              {listing.description}
            </p>
          </section>

          {isStudio && Array.isArray(listing.amenities) && listing.amenities.length > 0 && (
            <section aria-labelledby="amenities-heading" className="border-t border-halo-border pt-8">
              <h2 id="amenities-heading" className="text-xl font-semibold text-halo-ink">What&apos;s included</h2>
              <ul className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                {listing.amenities.map((amenity) => (
                  <li key={amenity} className="flex items-center gap-3 text-halo-ink">
                    <Check className="h-5 w-5 text-halo-success" aria-hidden="true" />
                    {amenity}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {isService && Array.isArray(listing.eventTypes) && listing.eventTypes.length > 0 && (
            <section aria-labelledby="events-heading" className="border-t border-halo-border pt-8">
              <h2 id="events-heading" className="text-xl font-semibold text-halo-ink">Events covered</h2>
              <ul className="mt-4 flex flex-wrap gap-2">
                {listing.eventTypes.map((evt) => (
                  <li key={evt} className="rounded-full border border-halo-border-strong px-3.5 py-1.5 text-sm text-halo-ink">
                    {evt}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section aria-labelledby="location-heading" className="border-t border-halo-border pt-8">
            <h2 id="location-heading" className="text-xl font-semibold text-halo-ink">
              {isEquipment ? 'Pickup location' : 'Location'}
            </h2>
            <div className="mt-4">
              <StorefrontMap
                latitude={provider.latitude}
                longitude={provider.longitude}
                title={provider.name}
                neighbourhood={provider.neighbourhood}
                city={provider.city}
              />
            </div>
          </section>
        </div>

        {/* Booking */}
        <aside id="book" className="lg:sticky lg:top-24 space-y-4 scroll-mt-24">
          {isService ? (
            <div className="rounded-2xl border border-halo-border bg-white p-6 shadow-[0_8px_30px_rgba(22,24,29,0.08)]">
              <p className="text-halo-text-muted">Packages from</p>
              <p className="text-3xl font-semibold text-halo-ink tabular">
                {formatPrice(listing.startingFromHint || 0, loc.currency)}
              </p>
              <p className="mt-2 text-sm text-halo-text-muted">
                Tell {provider.name} the date, venue and what you need. They reply with a fixed quote you
                can accept or decline.
              </p>
              <button
                onClick={handleQuoteRequest}
                className="mt-5 w-full rounded-xl bg-halo-ink py-3.5 text-[15px] font-semibold text-white hover:bg-halo-ink-soft min-h-[48px]"
              >
                Request a quote
              </button>
            </div>
          ) : isSale ? (
            <PurchasePanel listing={listing} provider={provider} />
          ) : (
            <BookingPanel listing={listing} provider={provider} />
          )}
        </aside>
      </div>

      {/* Phone: price and action always in reach */}
      <div className="lg:hidden fixed inset-x-0 bottom-0 z-30 border-t border-halo-border bg-white/95 backdrop-blur px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <p className="text-halo-ink tabular">
            {isService ? (
              <>
                <span className="text-sm text-halo-text-muted">From </span>
                <span className="font-semibold">{formatPrice(listing.startingFromHint || 0, loc.currency)}</span>
              </>
            ) : isSale ? (
              <span className="font-semibold">{formatPrice(listing.salePrice || 0, loc.currency)}</span>
            ) : (
              <>
                <span className="font-semibold">{formatPrice(listing.hourlyRate || 0, loc.currency)}</span>
                <span className="text-sm text-halo-text-muted"> per hour</span>
              </>
            )}
          </p>
          {isService ? (
            <button
              onClick={handleQuoteRequest}
              className="rounded-xl bg-halo-ink px-5 text-sm font-semibold text-white min-h-[44px]"
            >
              Request a quote
            </button>
          ) : (
            <a
              href="#book"
              className="inline-flex items-center rounded-xl bg-halo-ink px-5 text-sm font-semibold text-white"
            >
              {isSale ? 'Buy this item' : 'Check availability'}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
