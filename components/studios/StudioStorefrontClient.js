'use client';

import Link from 'next/link';
import {
  getProviderBySlug,
  getProviderPortfolio,
  getProviderReviews,
} from '@/lib/domain/providers';
import { getPublicListings } from '@/lib/domain/listings';
import { ListingCard } from '@/components/listings/ListingCard';
import { SafeImage } from '@/components/ui/SafeImage';
import { StorefrontMap } from '@/components/maps/StorefrontMap';
import { EmptyState } from '@/components/states/EmptyState';
import { formatDate } from '@/lib/format';

/**
 * Client component rendering the provider storefront from storage.
 * @param {{ slug: string }} props
 */
export function StudioStorefrontClient({ slug }) {
  const provider = getProviderBySlug(slug);

  if (!provider) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <EmptyState
          title="Studio Not Found"
          message="This provider either does not exist, is pending administrative verification, or is inactive."
          icon="🏢"
        />
        <Link
          href="/studios"
          className="mt-6 inline-flex items-center justify-center px-4 py-2 bg-halo-primary text-white rounded-lg text-sm font-semibold hover:bg-halo-primary-light min-h-[44px]"
        >
          Browse All Studios
        </Link>
      </div>
    );
  }

  // Retrieve listings, portfolio, and reviews for this provider
  const { items: allListings } = getPublicListings({ pageSize: 100 });
  const providerListings = allListings.filter((l) => l.providerId === provider.id);
  const portfolioItems = getProviderPortfolio(provider.id);
  const reviews = getProviderReviews(provider.id);

  const studios = providerListings.filter((l) => l.type === 'studio');
  const equipment = providerListings.filter((l) => l.type === 'equipment');
  const services = providerListings.filter((l) => l.type === 'service');

  const averageRating =
    reviews.length > 0
      ? (reviews.reduce((acc, r) => acc + (r.rating || 0), 0) / reviews.length).toFixed(1)
      : null;

  return (
    <div className="pb-16 space-y-12">
      {/* Hero Cover Banner */}
      <div className="relative w-full h-56 sm:h-72 md:h-80 bg-slate-900 overflow-hidden">
        <SafeImage
          src={provider.cover}
          alt={`${provider.name} Cover`}
          fallbackType="provider"
          fill
          priority
          className="object-cover opacity-85"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/30 to-transparent" />

        {/* Hero Floating Title on banner bottom */}
        <div className="absolute bottom-6 left-0 right-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-end justify-between">
          <div className="flex items-center gap-4">
            <div
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl border-4 border-white shadow-xl flex items-center justify-center font-bold text-2xl sm:text-3xl text-white select-none"
              style={{ backgroundColor: provider.brandColor }}
            >
              {provider.name.charAt(0)}
            </div>
            <div className="text-white">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight">
                  {provider.name}
                </h1>
                <span
                  className="px-2 py-0.5 rounded text-[11px] font-bold tracking-wide uppercase text-slate-900 bg-amber-400"
                  title="Approved Provider in Addis Ababa"
                >
                  Verified
                </span>
              </div>
              <p className="text-slate-200 text-sm sm:text-base mt-0.5">
                {provider.tagline}
              </p>
            </div>
          </div>

          {services.length > 0 && (
            <Link
              href={`/studios/${slug}/request-quote`}
              className="hidden sm:inline-flex items-center justify-center px-4 py-2.5 rounded-lg text-sm font-bold text-white shadow-lg transition-transform hover:scale-105 min-h-[44px]"
              style={{ backgroundColor: provider.brandColor }}
            >
              Request Filming Quote
            </Link>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Overview & Contact Strip */}
        <section
          aria-label="Provider Overview and Contact"
          className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start"
        >
          {/* About Text */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-xl font-bold text-slate-900">About the Studio</h2>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed whitespace-pre-line">
              {provider.about}
            </p>

            <div className="flex flex-wrap gap-4 pt-2 text-sm text-slate-600">
              <span className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-lg">
                <span>📍</span> {provider.neighbourhood}, {provider.city}
              </span>
              <span className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-lg">
                <span>🕐</span> Operating Hours: {provider.hours.open} – {provider.hours.close}
              </span>
              {averageRating && (
                <span className="flex items-center gap-1.5 bg-amber-50 text-amber-800 px-3 py-1.5 rounded-lg font-semibold">
                  <span>★</span> {averageRating} / 5.0 ({reviews.length} {reviews.length === 1 ? 'review' : 'reviews'})
                </span>
              )}
            </div>
          </div>

          {/* Direct Contact Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
            <h3 className="font-bold text-slate-900 text-base">Direct Studio Contact</h3>
            <div className="space-y-2.5 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-slate-400">📞 Phone:</span>
                <a
                  href={`tel:${provider.contact.phone}`}
                  className="font-semibold text-slate-900 hover:underline min-h-[44px] flex items-center"
                >
                  {provider.contact.phone}
                </a>
              </div>

              {provider.contact.whatsapp && (
                <div className="flex items-center gap-2">
                  <span className="text-emerald-600">💬 WhatsApp:</span>
                  <a
                    href={`https://wa.me/${provider.contact.whatsapp.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-emerald-700 hover:underline min-h-[44px] flex items-center"
                  >
                    Chat on WhatsApp
                  </a>
                </div>
              )}

              {provider.contact.telegram && (
                <div className="flex items-center gap-2">
                  <span className="text-sky-500">✈️ Telegram:</span>
                  <a
                    href={`https://t.me/${provider.contact.telegram.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-sky-700 hover:underline min-h-[44px] flex items-center"
                  >
                    {provider.contact.telegram}
                  </a>
                </div>
              )}
            </div>

            {services.length > 0 && (
              <div className="pt-2">
                <Link
                  href={`/studios/${slug}/request-quote`}
                  className="w-full inline-flex items-center justify-center px-4 py-2.5 rounded-lg text-sm font-semibold text-white shadow-sm min-h-[44px]"
                  style={{ backgroundColor: provider.brandColor }}
                >
                  Request a Quote
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* Studio Spaces Section */}
        {studios.length > 0 && (
          <section aria-labelledby="studios-heading" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 id="studios-heading" className="text-2xl font-bold text-slate-900">
                Studio Spaces ({studios.length})
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {studios.map((listing) => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  brandColor={provider.brandColor}
                  showProvider={false}
                />
              ))}
            </div>
          </section>
        )}

        {/* Equipment Rentals Section */}
        {equipment.length > 0 && (
          <section aria-labelledby="equipment-heading" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 id="equipment-heading" className="text-2xl font-bold text-slate-900">
                Equipment & Kits ({equipment.length})
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {equipment.map((listing) => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  brandColor={provider.brandColor}
                  showProvider={false}
                />
              ))}
            </div>
          </section>
        )}

        {/* Filming Services Section */}
        {services.length > 0 && (
          <section aria-labelledby="services-heading" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 id="services-heading" className="text-2xl font-bold text-slate-900">
                Filming & Production Services ({services.length})
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map((listing) => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  brandColor={provider.brandColor}
                  showProvider={false}
                />
              ))}
            </div>
          </section>
        )}

        {/* Portfolio Preview Section */}
        {portfolioItems.length > 0 && (
          <section aria-labelledby="portfolio-heading" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 id="portfolio-heading" className="text-2xl font-bold text-slate-900">
                Recent Work & Portfolio
              </h2>
              <Link
                href={`/studios/${slug}/portfolio`}
                className="text-sm font-bold hover:underline min-h-[44px] flex items-center"
                style={{ color: provider.brandColor }}
              >
                View Full Gallery ({portfolioItems.length}) →
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {portfolioItems.slice(0, 3).map((item) => (
                <div
                  key={item.id}
                  className="group relative rounded-xl overflow-hidden aspect-video bg-slate-100 border border-slate-200 shadow-sm"
                >
                  <SafeImage
                    src={item.mediaUrl}
                    alt={item.title}
                    fallbackType="service"
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex flex-col justify-end p-4">
                    <span className="text-[11px] font-semibold text-amber-300 capitalize mb-0.5">
                      {item.eventType}
                    </span>
                    <h3 className="text-white font-bold text-sm leading-snug">
                      {item.title}
                    </h3>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Client Reviews Section */}
        <section aria-labelledby="reviews-heading" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 id="reviews-heading" className="text-2xl font-bold text-slate-900">
              Verified Client Reviews
            </h2>
            {averageRating && (
              <span className="text-sm text-slate-500">
                Rated <strong className="text-slate-800">{averageRating}</strong> out of 5
              </span>
            )}
          </div>

          {reviews.length === 0 ? (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 text-center text-slate-500 text-sm">
              No reviews yet for this studio. Be the first to book and share your experience!
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((r) => (
                <div
                  key={r.id}
                  className="bg-white border border-slate-200 rounded-xl p-5 space-y-3 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="text-amber-500 font-bold" aria-label={`${r.rating} stars`}>
                        {'★'.repeat(r.rating)}
                        {'☆'.repeat(5 - r.rating)}
                      </span>
                      <span className="text-xs font-semibold text-slate-700 ml-1">
                        {r.rating}.0
                      </span>
                    </div>
                    <time className="text-xs text-slate-400">
                      {formatDate(r.createdAt.slice(0, 10))}
                    </time>
                  </div>

                  <p className="text-sm text-slate-700 leading-relaxed italic">
                    &ldquo;{r.comment}&rdquo;
                  </p>

                  {/* Owner Reply */}
                  {r.ownerReply && (
                    <div className="mt-3 pl-4 border-l-2 border-amber-400/80 bg-amber-50/50 p-3 rounded-r-lg space-y-1">
                      <span className="text-xs font-bold text-amber-900 block">
                        Response from {provider.name}:
                      </span>
                      <p className="text-xs text-slate-700">{r.ownerReply}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Location & Map Section with Text Fallback */}
        <section aria-labelledby="location-heading" className="space-y-4">
          <h2 id="location-heading" className="text-2xl font-bold text-slate-900">
            Studio Location
          </h2>
          <StorefrontMap
            latitude={provider.latitude}
            longitude={provider.longitude}
            title={provider.name}
            neighbourhood={provider.neighbourhood}
            city={provider.city}
          />
        </section>
      </div>
    </div>
  );
}
