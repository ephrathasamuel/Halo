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

/**
 * Provider Storefront page.
 * Server component that provides SEO metadata and renders client storefront.
 * @param {{ params: Promise<{ slug: string }> }} props
 */
export default async function StudioPage({ params }) {
  const { slug } = await params;
  return <StudioStorefrontClient slug={slug} />;
}
