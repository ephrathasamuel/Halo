/**
 * Sitemap configuration for Halo marketplace.
 * Lists public routes, storefronts, and seeded listings.
 * @returns {import('next').MetadataRoute.Sitemap}
 */
export default function sitemap() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  // Static public routes
  const staticRoutes = [
    { url: `${baseUrl}/`, changeFrequency: 'daily', priority: 1.0 },
    { url: `${baseUrl}/browse`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/studios`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/signin`, changeFrequency: 'monthly', priority: 0.3 },
    { url: `${baseUrl}/signup`, changeFrequency: 'monthly', priority: 0.3 },
  ];

  // Seeded provider storefronts (hardcoded since we can't read localStorage on server)
  const providerSlugs = [
    'b-light',
    'merkato-frames',
    'kazanchis-sound-house',
    'gear-garage',
    'habesha-cine-crew',
  ];

  const providerRoutes = providerSlugs.flatMap((slug) => [
    { url: `${baseUrl}/studios/${slug}`, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${baseUrl}/studios/${slug}/portfolio`, changeFrequency: 'weekly', priority: 0.5 },
  ]);

  return [...staticRoutes, ...providerRoutes];
}
