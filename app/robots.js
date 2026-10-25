/**
 * Robots.txt configuration.
 * Excludes dashboard, owner, and admin paths.
 * Note: This is NOT access control — it's a hint for search engine crawlers only.
 * @returns {import('next').MetadataRoute.Robots}
 */
export default function robots() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL && `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`) ||
    'http://localhost:3000';

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/dashboard', '/owner/', '/admin/', '/checkout', '/bookings/', '/events/'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
