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
      title: 'Listing Not Found | Halo',
      description: 'The requested listing is not available.',
    };
  }

  return {
    title: `${listing.title} | ${provider ? provider.name : 'Halo Marketplace'}`,
    description: listing.description?.slice(0, 160),
    openGraph: {
      title: `${listing.title} — ${provider?.name || 'Halo'}`,
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
  return <ListingDetailClient id={id} />;
}
