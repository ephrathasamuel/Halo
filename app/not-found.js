import Link from 'next/link';

/**
 * Custom 404 Not Found page component.
 */
export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-halo-primary mb-4">404</h1>
        <p className="text-xl text-halo-text-muted mb-6">Page not found</p>
        <Link
          href="/"
          className="inline-flex items-center px-6 py-3 bg-halo-primary text-white rounded-lg font-semibold hover:bg-halo-primary-light transition-colors min-h-[44px]"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}
