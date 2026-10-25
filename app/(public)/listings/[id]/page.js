import { ListingDetailClient } from '@/components/listings/ListingDetailClient';
import { seedListings, seedProviders } from '@/lib/storage/seed';

/**
 * Server metadata generator for listing details.
 * @param {{ params: Promise<{ id: string }> }} props
 */
export async function generateMetadata({ params }) {
  const { id } = await params;
  const listing = seedListings.find((l) => l.id === id);
  const provider = listing ? seedProviders.find((p) => p.id === listing.providerId) : null;

  if (!listing) {
    return {
      title: 'Listing not found',
      description: 'The requested listing is not available.',
    };
  }

  return {
    title: provider ? `${listing.title} by ${provider.name}` : listing.title,
    description: listing.description?.slice(0, 160),
    openGraph: {
      title: provider ? `${listing.title} by ${provider.name}` : listing.title,
      description: listing.description?.slice(0, 160),
      images: [listing.photos?.[0] || '/images/listings/b-light-studio-1.jpg'],
    },
  };
}

/**
 * Listing Detail Server Page.
 * @param {{ params: Promise<{ id: string }> }} props
 */
export default async function ListingDetailPage({ params }) {
  const { id } = await params;
  const listing = seedListings.find((l) => l.id === id);
  const provider = listing ? seedProviders.find((p) => p.id === listing.providerId) : null;

  const jsonLd = listing
    ? {
        '@context': 'https://schema.org',
        '@type': listing.type === 'studio' ? 'Place' : 'Product',
        name: listing.title,
        description: listing.description,
        image: listing.photos?.[0] || '/images/listings/b-light-studio-1.jpg',
        offers: {
          '@type': 'Offer',
          price: listing.hourlyRate || listing.startingFromHint || 0,
          priceCurrency: 'ETB',
          seller: {
            '@type': 'Organization',
            name: provider?.name || 'Halo Provider',
          },
        },
      }
    : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <ListingDetailClient id={id} />
    </>
  );
}
