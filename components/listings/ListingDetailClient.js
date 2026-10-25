'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';
import { getListingById } from '@/lib/domain/listings';
import { formatETB } from '@/lib/format';
import { SafeImage } from '@/components/ui/SafeImage';
import { StorefrontMap } from '@/components/maps/StorefrontMap';
import { EmptyState } from '@/components/states/EmptyState';
import { useSession } from '@/hooks/useSession';

/**
 * Client component for listing details.
 * @param {{ id: string }} props
 */
export function ListingDetailClient({ id }) {
  const router = useRouter();
  const listing = getListingById(id);
  const { session } = useSession();
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);

  if (!listing) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <EmptyState
          title="Listing Not Available"
          message="This listing does not exist, has been made inactive, or is pending approval."
          icon="📦"
        />
        <Link
          href="/browse"
          className="mt-6 inline-flex items-center justify-center px-4 py-2 bg-halo-primary text-white rounded-lg text-sm font-semibold hover:bg-halo-primary-light min-h-[44px]"
        >
          Browse All Active Listings
        </Link>
      </div>
    );
  }

  const provider = listing.provider;
  const isStudio = listing.type === 'studio';
  const isEquipment = listing.type === 'equipment';
  const isService = listing.type === 'service';
  const photos = listing.photos && listing.photos.length > 0 ? listing.photos : [''];

  const handleBookingAction = () => {
    if (isService) {
      router.push(`/studios/${provider.slug}/request-quote`);
    } else {
      if (!session) {
        router.push(`/signin?next=${encodeURIComponent(`/listings/${id}`)}`);
      } else {
        router.push(`/checkout?listingId=${id}`);
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="text-xs text-slate-500 flex items-center gap-2">
        <Link href="/" className="hover:text-slate-800">
          Home
        </Link>
        <span>/</span>
        <Link href="/studios" className="hover:text-slate-800">
          Studios
        </Link>
        <span>/</span>
        <Link href={`/studios/${provider.slug}`} className="hover:text-slate-800">
          {provider.name}
        </Link>
        <span>/</span>
        <span className="text-slate-800 font-semibold truncate max-w-[200px] sm:max-w-none">
          {listing.title}
        </span>
      </nav>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column: Media & Details */}
        <div className="lg:col-span-2 space-y-8">
          {/* Main Photo Gallery */}
          <div className="space-y-3">
            <div className="relative aspect-[16/10] w-full bg-slate-100 rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
              <SafeImage
                src={photos[selectedPhotoIndex]}
                alt={`${listing.title} photo`}
                fallbackType={listing.type}
                fill
                priority
                className="object-cover"
              />
              <span className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm text-slate-900 text-xs font-bold px-3 py-1 rounded-full shadow-sm capitalize border border-slate-200">
                {listing.type}
              </span>
            </div>

            {/* Thumbnail Strip (if multiple photos) */}
            {photos.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Photo thumbnails">
                {photos.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedPhotoIndex(idx)}
                    className={`relative w-20 h-16 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 min-h-[44px] min-w-[44px] ${
                      selectedPhotoIndex === idx
                        ? 'border-halo-primary ring-2 ring-halo-primary/30'
                        : 'border-slate-200 opacity-70 hover:opacity-100'
                    }`}
                    aria-label={`View photo ${idx + 1}`}
                    role="tab"
                    aria-selected={selectedPhotoIndex === idx}
                  >
                    <SafeImage
                      src={p}
                      alt={`Thumbnail ${idx + 1}`}
                      fallbackType={listing.type}
                      fill
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Title & Metadata Header */}
          <div className="space-y-2 border-b border-slate-200 pb-6">
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={`/studios/${provider.slug}`}
                className="text-sm font-bold hover:underline"
                style={{ color: provider.brandColor }}
              >
                {provider.name}
              </Link>
              <span className="text-slate-300">•</span>
              <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full">
                📍 {provider.neighbourhood}, Addis Ababa
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {listing.title}
            </h1>
          </div>

          {/* Description */}
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900">Description</h2>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed whitespace-pre-line">
              {listing.description}
            </p>
          </div>

          {/* Specific Technical Attributes */}
          <div className="space-y-4 pt-4 border-t border-slate-200">
            <h2 className="text-lg font-bold text-slate-900">Specifications & Features</h2>

            {/* Studio Specifications */}
            {isStudio && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                    Guest Capacity
                  </span>
                  <span className="text-base font-bold text-slate-800">
                    👥 Up to {listing.capacity} people
                  </span>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                    Booking Duration
                  </span>
                  <span className="text-base font-bold text-slate-800">
                    ⏱️ Minimum {listing.minHours || 2} hours required
                  </span>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                    Turnaround Buffer
                  </span>
                  <span className="text-base font-bold text-slate-800">
                    🔄 {listing.bufferMinutes || 30} mins cleaning buffer
                  </span>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                    Operating Hours
                  </span>
                  <span className="text-base font-bold text-slate-800">
                    🕐 {provider.hours.open} – {provider.hours.close}
                  </span>
                </div>
              </div>
            )}

            {/* Studio Amenities */}
            {isStudio && Array.isArray(listing.amenities) && listing.amenities.length > 0 && (
              <div className="space-y-2 pt-2">
                <h3 className="text-sm font-semibold text-slate-700">Included Amenities</h3>
                <div className="flex flex-wrap gap-2">
                  {listing.amenities.map((amenity, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200/60 text-xs px-3 py-1 rounded-lg font-medium"
                    >
                      <span>✓</span> {amenity}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Equipment Specifications */}
            {isEquipment && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                    Category
                  </span>
                  <span className="text-base font-bold text-slate-800">
                    🏷️ {listing.category}
                  </span>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                    Stock Quantity
                  </span>
                  <span className="text-base font-bold text-slate-800">
                    📦 {listing.quantity} units in stock
                  </span>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                    Unit Condition
                  </span>
                  <span className="text-base font-bold text-slate-800">
                    ✨ {listing.condition || 'Professional Grade'}
                  </span>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                    Refundable Deposit
                  </span>
                  <span className="text-base font-bold text-slate-800">
                    🛡️ {formatETB(listing.deposit || 0)}
                  </span>
                </div>
              </div>
            )}

            {/* Service Event Types */}
            {isService && Array.isArray(listing.eventTypes) && listing.eventTypes.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-slate-700">Covered Event Types</h3>
                <div className="flex flex-wrap gap-2">
                  {listing.eventTypes.map((evt, idx) => (
                    <span
                      key={idx}
                      className="bg-amber-50 text-amber-900 border border-amber-200 text-xs px-3 py-1 rounded-lg font-medium"
                    >
                      🎉 {evt}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Location with Leaflet and accessible fallback */}
          <div className="space-y-3 pt-6 border-t border-slate-200">
            <h2 className="text-lg font-bold text-slate-900">Studio & Pickup Location</h2>
            <StorefrontMap
              latitude={provider.latitude}
              longitude={provider.longitude}
              title={provider.name}
              neighbourhood={provider.neighbourhood}
              city={provider.city}
            />
          </div>
        </div>

        {/* Right Column: Pricing & Booking Panel */}
        <aside className="lg:sticky lg:top-6 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-lg space-y-6">
            {/* Price Headline */}
            <div className="border-b border-slate-100 pb-4">
              {isService ? (
                <div>
                  <span className="text-xs text-slate-500 font-semibold block uppercase tracking-wider">
                    Custom Quote Model
                  </span>
                  <div className="flex items-baseline gap-1.5 mt-1">
                    <span className="text-xs text-slate-400">Starting from</span>
                    <span className="text-2xl font-black text-slate-900">
                      {formatETB(listing.startingFromHint || 0)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Final pricing is customized through your scope review.
                  </p>
                </div>
              ) : (
                <div>
                  <span className="text-xs text-slate-500 font-semibold block uppercase tracking-wider">
                    Hourly Rental Rate
                  </span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-3xl font-black text-slate-900">
                      {formatETB(listing.hourlyRate || 0)}
                    </span>
                    <span className="text-sm font-semibold text-slate-500">/ hour</span>
                  </div>
                </div>
              )}
            </div>

            {/* Clear breakdown preview */}
            {!isService && (
              <div className="space-y-2 text-xs text-slate-600 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                <div className="flex justify-between">
                  <span>Platform Commission (10%)</span>
                  <span className="font-semibold text-slate-800">Included in checkout</span>
                </div>
                {isEquipment && listing.deposit > 0 && (
                  <div className="flex justify-between pt-1 border-t border-slate-200/60 text-slate-700">
                    <span>Security Deposit (Refundable)</span>
                    <span className="font-bold text-slate-900">{formatETB(listing.deposit)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-1 border-t border-slate-200/60 text-slate-500 italic">
                  <span>Cancellation Policy</span>
                  <span>Free up to 24h prior</span>
                </div>
              </div>
            )}

            {/* Action CTA Button */}
            <button
              onClick={handleBookingAction}
              className="w-full inline-flex items-center justify-center px-6 py-3.5 rounded-xl font-bold text-white text-base shadow-md transition-all hover:shadow-lg hover:opacity-95 min-h-[44px]"
              style={{ backgroundColor: provider.brandColor || '#1E3A5F' }}
            >
              {isService ? 'Request Event Quote' : 'Book Time Slot'}
            </button>

            <p className="text-[11px] text-center text-slate-400">
              Demo marketplace simulation • No actual payment collected
            </p>
          </div>

          {/* Provider Mini Profile Card */}
          <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white text-lg shadow-sm"
                style={{ backgroundColor: provider.brandColor }}
              >
                {provider.name.charAt(0)}
              </div>
              <div>
                <h3 className="font-bold text-slate-900 leading-tight">
                  <Link href={`/studios/${provider.slug}`} className="hover:underline">
                    {provider.name}
                  </Link>
                </h3>
                <p className="text-xs text-slate-500">{provider.neighbourhood}, Addis Ababa</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
              {provider.about}
            </p>

            <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-500">
                🕐 {provider.hours.open} – {provider.hours.close}
              </span>
              <Link
                href={`/studios/${provider.slug}`}
                className="hover:underline flex items-center gap-1 min-h-[44px]"
                style={{ color: provider.brandColor }}
              >
                View Storefront →
              </Link>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
