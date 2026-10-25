import Link from 'next/link';

/**
 * Public landing page placeholder.
 */
export default function HomePage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Hero Section */}
      <section className="py-20 text-center">
        <h1 className="text-4xl md:text-6xl font-bold text-halo-primary mb-4">
          Find Your Perfect <span className="text-halo-secondary">Creative Space</span>
        </h1>
        <p className="text-xl text-halo-text-muted mb-8 max-w-2xl mx-auto">
          Book professional studios, rent equipment, and hire filming crews in Addis Ababa.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/browse"
            className="inline-flex items-center justify-center px-6 py-3 bg-halo-primary text-white rounded-lg font-semibold hover:bg-halo-primary-light transition-colors min-h-[44px]"
          >
            Browse Listings
          </Link>
          <Link
            href="/studios"
            className="inline-flex items-center justify-center px-6 py-3 border-2 border-halo-primary text-halo-primary rounded-lg font-semibold hover:bg-halo-primary hover:text-white transition-colors min-h-[44px]"
          >
            View Studios
          </Link>
        </div>
      </section>
    </div>
  );
}
