'use client';

import Link from 'next/link';
import { ArrowRight, BadgeCheck, Clock, MapPin, MessageCircle, Phone, Send, Star } from 'lucide-react';
import {
  getProviderBySlug,
  getProviderPortfolio,
  getProviderReviews,
} from '@/lib/domain/providers';
import { getPublicListings } from '@/lib/domain/listings';
import { ListingCard } from '@/components/listings/ListingCard';
import { SafeImage } from '@/components/ui/SafeImage';
import { StarRating } from '@/components/ui/StarRating';
import { StorefrontMap } from '@/components/maps/StorefrontMap';
import { formatDate, formatHours } from '@/lib/format';
import { useHydrated } from '@/hooks/useHydrated';
import { ProviderLogo } from '@/components/ui/ProviderLogo';

/**
 * A titled grid of this provider's listings of one type.
 * @param {{ id: string, title: string, listings: object[] }} props
 */
function ListingSection({ id, title, listings }) {
  if (listings.length === 0) return null;
  return (
    <section aria-labelledby={id}>
      <h2 id={id} className="text-2xl font-semibold text-halo-ink">
        {title} <span className="text-halo-text-muted font-normal tabular">{listings.length}</span>
      </h2>
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10">
        {listings.map((listing) => (
          <ListingCard key={listing.id} listing={listing} showProvider={false} />
        ))}
      </div>
    </section>
  );
}

/**
 * Provider storefront: who they are, what they rent, their work and reviews.
 * @param {{ slug: string }} props
 */
export function StudioStorefrontClient({ slug }) {
  const hydrated = useHydrated();
  if (!hydrated) return null;

  // The storefront layout already shows "not available" for unknown or unapproved slugs
  const provider = getProviderBySlug(slug);
  if (!provider) return null;

  const { items: allListings } = getPublicListings({ pageSize: 100 });
  const providerListings = allListings.filter((l) => l.providerId === provider.id);
  const portfolioItems = getProviderPortfolio(provider.id);
  const reviews = getProviderReviews(provider.id);

  const studios = providerListings.filter((l) => l.type === 'studio');
  const equipment = providerListings.filter((l) => l.type === 'equipment');
  const services = providerListings.filter((l) => l.type === 'service');
  const forSale = providerListings.filter((l) => l.type === 'sale');

  const averageRating =
    reviews.length > 0
      ? (reviews.reduce((acc, r) => acc + (r.rating || 0), 0) / reviews.length).toFixed(1)
      : null;

  const contact = provider.contact || {};
  const whatsappNumber = contact.whatsapp?.replace(/[^0-9]/g, '');
  const telegramHandle = contact.telegram?.replace('@', '');

  return (
    <div className="pb-20">
      {/* Cover */}
      <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 sm:pt-6">
        <div className="relative h-48 sm:h-72 lg:h-80 w-full overflow-hidden sm:rounded-2xl bg-halo-placeholder">
          <SafeImage
            src={provider.cover}
            alt={`Inside ${provider.name}`}
            fallbackType="provider"
            fill
            priority
            className="object-cover"
            sizes="(max-width: 1280px) 100vw, 1216px"
          />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Identity and contact */}
        <div className="relative flex flex-col lg:flex-row lg:items-end justify-between gap-6 mt-4">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4">
            <span className="relative shrink-0 self-start -mt-14 sm:-mt-16 rounded-2xl border-4 border-halo-bg shadow-sm">
              <ProviderLogo provider={provider} size={88} rounded="rounded-xl" />
            </span>
            <div className="pb-1">
              <div className="flex items-center gap-2">
                <h1 className="text-3xl sm:text-4xl font-semibold text-halo-ink">{provider.name}</h1>
                <BadgeCheck className="h-6 w-6 text-halo-success" aria-label="Verified provider" />
              </div>
              <p className="mt-1 text-halo-text-muted">{provider.tagline}</p>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-halo-text-muted">
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-4 w-4" aria-hidden="true" />
                  {provider.neighbourhood}, {provider.city}
                </span>
                {provider.hours && (
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-4 w-4" aria-hidden="true" />
                    {formatHours(provider.hours)}
                  </span>
                )}
                {averageRating && (
                  <a href="#reviews" className="inline-flex items-center gap-1 text-halo-ink hover:underline min-h-0">
                    <Star className="h-4 w-4 fill-halo-gold text-halo-gold" aria-hidden="true" />
                    <span className="font-semibold tabular">{averageRating}</span>
                    <span className="text-halo-text-muted">
                      ({reviews.length} {reviews.length === 1 ? 'review' : 'reviews'})
                    </span>
                  </a>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {contact.phone && (
              <a
                href={`tel:${contact.phone}`}
                className="inline-flex items-center gap-2 px-4 rounded-xl border border-halo-border-strong bg-white text-sm font-semibold text-halo-ink hover:border-halo-ink"
              >
                <Phone className="h-4 w-4" aria-hidden="true" />
                Call
              </a>
            )}
            {whatsappNumber && (
              <a
                href={`https://wa.me/${whatsappNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 rounded-xl border border-halo-border-strong bg-white text-sm font-semibold text-halo-ink hover:border-halo-ink"
              >
                <MessageCircle className="h-4 w-4" aria-hidden="true" />
                WhatsApp
              </a>
            )}
            {telegramHandle && (
              <a
                href={`https://t.me/${telegramHandle}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 rounded-xl border border-halo-border-strong bg-white text-sm font-semibold text-halo-ink hover:border-halo-ink"
              >
                <Send className="h-4 w-4" aria-hidden="true" />
                Telegram
              </a>
            )}
            {services.length > 0 && (
              <Link
                href={`/studios/${slug}/request-quote`}
                className="inline-flex items-center px-5 rounded-xl bg-halo-ink text-sm font-semibold text-white hover:bg-halo-ink-soft"
              >
                Request a quote
              </Link>
            )}
          </div>
        </div>

        <div className="mt-14 space-y-16">
          <ListingSection id="studios-heading" title="Studios" listings={studios} />
          <ListingSection id="equipment-heading" title="Equipment" listings={equipment} />
          <ListingSection id="services-heading" title="Event filming" listings={services} />
          <ListingSection id="sale-heading" title="For sale" listings={forSale} />

          {portfolioItems.length > 0 && (
            <section aria-labelledby="portfolio-heading">
              <div className="flex items-end justify-between gap-4">
                <h2 id="portfolio-heading" className="text-2xl font-semibold text-halo-ink">
                  Recent work
                </h2>
                <Link
                  href={`/studios/${slug}/portfolio`}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-halo-ink hover:underline"
                >
                  All {portfolioItems.length} projects
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {portfolioItems.slice(0, 3).map((item) => (
                  <figure key={item.id}>
                    <div className="relative aspect-[3/2] overflow-hidden rounded-xl bg-halo-placeholder">
                      <SafeImage src={item.mediaUrl} alt={item.title} fallbackType="service" fill className="object-cover" />
                    </div>
                    <figcaption className="mt-2">
                      <span className="block font-medium text-halo-ink">{item.title}</span>
                      <span className="block text-sm text-halo-text-muted capitalize">{item.eventType}</span>
                    </figcaption>
                  </figure>
                ))}
              </div>
            </section>
          )}

          <section id="reviews" aria-labelledby="reviews-heading" className="scroll-mt-24">
            <h2 id="reviews-heading" className="text-2xl font-semibold text-halo-ink">
              {averageRating ? (
                <span className="inline-flex items-center gap-2">
                  <Star className="h-6 w-6 fill-halo-gold text-halo-gold" aria-hidden="true" />
                  <span className="tabular">{averageRating}</span>
                  <span className="text-halo-text-muted font-normal">
                    {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
                  </span>
                </span>
              ) : (
                'Reviews'
              )}
            </h2>

            {reviews.length === 0 ? (
              <p className="mt-4 text-halo-text-muted">
                No reviews yet. Reviews appear here after completed bookings.
              </p>
            ) : (
              <ul className="mt-6 grid gap-x-12 gap-y-8 md:grid-cols-2">
                {reviews.map((r) => (
                  <li key={r.id}>
                    <div className="flex items-center gap-3">
                      <StarRating rating={r.rating} />
                      <time className="text-sm text-halo-text-muted" dateTime={r.createdAt}>
                        {formatDate(r.createdAt.slice(0, 10))}
                      </time>
                    </div>
                    <p className="mt-2 text-halo-ink/85 leading-relaxed">{r.comment}</p>
                    {r.ownerReply && (
                      <div className="mt-3 border-l-2 border-halo-border-strong pl-4">
                        <p className="text-sm font-medium text-halo-ink">Reply from {provider.name}</p>
                        <p className="text-sm text-halo-text-muted">{r.ownerReply}</p>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section aria-labelledby="about-heading" className="grid gap-10 lg:grid-cols-2 border-t border-halo-border pt-12">
            <div>
              <h2 id="about-heading" className="text-2xl font-semibold text-halo-ink">
                About {provider.name}
              </h2>
              <p className="mt-3 text-halo-ink/85 leading-relaxed whitespace-pre-line">{provider.about}</p>
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-halo-ink">Where to find us</h2>
              <div className="mt-3">
                <StorefrontMap
                  latitude={provider.latitude}
                  longitude={provider.longitude}
                  title={provider.name}
                  neighbourhood={provider.neighbourhood}
                  city={provider.city}
                />
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
