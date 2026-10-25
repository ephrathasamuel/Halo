/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Listing and portfolio photos will be served from Supabase Storage
    // (https://<project-ref>.supabase.co/storage/v1/object/public/...).
    remotePatterns: [{ protocol: 'https', hostname: '*.supabase.co', pathname: '/storage/v1/object/public/**' }],
    unoptimized: true,
  },
};

export default nextConfig;
