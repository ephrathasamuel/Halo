'use client';

import { useParams } from 'next/navigation';
import { useStorageSync } from '@/hooks/useStorageSync';
import { STORAGE_KEYS } from '@/lib/storage/keys';
import { useListings } from '@/hooks/useListings';
import { formatETB } from '@/lib/format';
import Link from 'next/link';

/**
 * Provider storefront shell page displaying about info, listings, portfolio previews, and reviews.
 */
export default function StudioPage() {
  const { slug } = useParams();
  const { data: providers } = useStorageSync(STORAGE_KEYS.PROVIDERS, []);
  const { data: reviews } = useStorageSync(STORAGE_KEYS.REVIEWS, []);
  const { data: portfolio } = useStorageSync(STORAGE_KEYS.PORTFOLIO, []);
  const { listings } = useListings({ publicOnly: true });
  const provider = providers.find((p) => p.slug === slug && p.status === 'approved');

  if (!provider) return null; // Layout handles not-found

  const providerListings = listings.filter((l) => l.providerId === provider.id);
  const providerReviews = reviews.filter((r) => r.providerId === provider.id);
  const providerPortfolio = portfolio.filter((p) => p.providerId === provider.id);

  const studioListings = providerListings.filter((l) => l.type === 'studio');
  const equipmentListings = providerListings.filter((l) => l.type === 'equipment');
  const serviceListings = providerListings.filter((l) => l.type === 'service');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero / About */}
      <section className="mb-12">
        <div className="relative h-48 md:h-64 bg-gray-200 rounded-xl overflow-hidden mb-6">
          <div className="absolute inset-0 flex items-center justify-center text-gray-400">
            <span className="text-sm">Cover image</span>
          </div>
        </div>
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--brand-color)' }}>{provider.name}</h1>
            <p className="text-lg text-halo-text-muted mb-2">{provider.tagline}</p>
            <p className="text-halo-text mb-4">{provider.about}</p>
            <div className="flex flex-wrap gap-4 text-sm text-halo-text-muted">
              <span>📍 {provider.neighbourhood}, {provider.city}</span>
              <span>🕐 {provider.hours.open} — {provider.hours.close}</span>
            </div>
          </div>
          <div className="md:w-64">
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <h3 className="font-semibold">Contact</h3>
              <p className="text-sm">📞 {provider.contact.phone}</p>
              {provider.contact.whatsapp && <p className="text-sm">💬 WhatsApp: {provider.contact.whatsapp}</p>}
              {provider.contact.telegram && <p className="text-sm">✈️ Telegram: {provider.contact.telegram}</p>}
            </div>
          </div>
        </div>
      </section>

      {/* Listings Sections */}
      {studioListings.length > 0 && (
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Studios</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {studioListings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        </section>
      )}

      {equipmentListings.length > 0 && (
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Equipment</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {equipmentListings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        </section>
      )}

      {serviceListings.length > 0 && (
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Services</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {serviceListings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        </section>
      )}

      {/* Portfolio Preview */}
      {providerPortfolio.length > 0 && (
        <section className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Portfolio</h2>
            <Link href={`/studios/${slug}/portfolio`} className="text-sm font-semibold hover:underline" style={{ color: 'var(--brand-color)' }}>
              View All →
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {providerPortfolio.slice(0, 3).map((item) => (
              <div key={item.id} className="bg-gray-200 rounded-lg aspect-video flex items-center justify-center text-gray-400 text-sm">
                {item.title}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Reviews */}
      {providerReviews.length > 0 && (
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Reviews</h2>
          <div className="space-y-4">
            {providerReviews.map((review) => (
              <div key={review.id} className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-yellow-500">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span>
                  <span className="text-sm text-halo-text-muted">{review.rating}/5</span>
                </div>
                <p className="text-sm">{review.comment}</p>
                {review.ownerReply && (
                  <div className="mt-3 pl-4 border-l-2 border-gray-300">
                    <p className="text-sm text-halo-text-muted"><strong>Owner reply:</strong> {review.ownerReply}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Map placeholder */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-4">Location</h2>
        <p className="text-sm text-halo-text-muted mb-2">
          📍 {provider.neighbourhood}, {provider.city} (Lat: {provider.latitude}, Lng: {provider.longitude})
        </p>
        <div className="bg-gray-200 rounded-lg h-48 flex items-center justify-center text-gray-400 text-sm">
          Map will load in Phase 2
        </div>
      </section>
    </div>
  );
}

/** @param {{ listing: object }} props */
function ListingCard({ listing }) {
  return (
    <Link href={`/listings/${listing.id}`} className="block">
      <article className="bg-white rounded-xl shadow-sm border border-halo-border overflow-hidden hover:shadow-md transition-shadow">
        <div className="h-40 bg-gray-200 flex items-center justify-center text-gray-400 text-sm">
          {listing.title}
        </div>
        <div className="p-4">
          <h3 className="font-semibold mb-1">{listing.title}</h3>
          <p className="text-sm text-halo-text-muted mb-2 line-clamp-2">{listing.description}</p>
          <div className="flex items-center justify-between">
            {listing.type === 'service' ? (
              <span className="text-sm font-semibold" style={{ color: 'var(--brand-color)' }}>Request Quote</span>
            ) : (
              <span className="text-sm font-semibold" style={{ color: 'var(--brand-color)' }}>{formatETB(listing.hourlyRate)}/hr</span>
            )}
            <span className="text-xs bg-gray-100 px-2 py-1 rounded-full capitalize">{listing.type}</span>
          </div>
        </div>
      </article>
    </Link>
  );
}
