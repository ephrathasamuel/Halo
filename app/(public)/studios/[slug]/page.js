import { StudioStorefrontClient } from '@/components/studios/StudioStorefrontClient';
import { seedProviders } from '@/lib/storage/seed';

/**
 * Generate metadata on server for provider storefront.
 * @param {{ params: Promise<{ slug: string }> }} props
 */
export async function generateMetadata({ params }) {
  const { slug } = await params;
  const provider = seedProviders.find((p) => p.slug === slug);

  if (!provider) {
    return {
      title: 'Studio Not Found | Halo',
      description: 'The requested studio or equipment provider does not exist.',
    };
  }

  return {
    title: `${provider.name} — Creative Studio in ${provider.neighbourhood} | Halo`,
    description: provider.about?.slice(0, 160) || provider.tagline,
    openGraph: {
      title: `${provider.name} | Halo Marketplace`,
      description: provider.tagline,
      images: [provider.cover || '/images/providers/b-light-cover.jpg'],
    },
  };
}

export default async function StudioPage({ params }) {
  const { slug } = await params;
  const provider = seedProviders.find((p) => p.slug === slug);

  const jsonLd = provider
    ? {
        '@context': 'https://schema.org',
        '@type': 'LocalBusiness',
        name: provider.name,
        description: provider.about || provider.tagline,
        address: {
          '@type': 'PostalAddress',
          addressLocality: provider.city || 'Addis Ababa',
          addressRegion: provider.neighbourhood,
        },
        telephone: provider.contact?.phone,
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
      <StudioStorefrontClient slug={slug} />
    </>
  );
}
