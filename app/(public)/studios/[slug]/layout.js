'use client';

import { useParams } from 'next/navigation';
import { useStorageSync } from '@/hooks/useStorageSync';
import { STORAGE_KEYS } from '@/lib/storage/keys';
import Link from 'next/link';
import { useSession } from '@/hooks/useSession';

/**
 * Provider storefront layout.
 * Applies the provider's brand colour via CSS custom properties.
 * @param {{ children: React.ReactNode }} props
 */
export default function StudioLayout({ children }) {
  const { slug } = useParams();
  const { data: providers } = useStorageSync(STORAGE_KEYS.PROVIDERS, []);
  const provider = providers.find((p) => p.slug === slug);
  const { session } = useSession();

  if (!provider) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-halo-text mb-2">Studio Not Found</h1>
        <p className="text-halo-text-muted">This studio does not exist or is not available.</p>
        <Link href="/studios" className="mt-4 inline-block text-halo-primary hover:underline min-h-[44px] flex items-center justify-center">Browse all studios</Link>
      </div>
    );
  }

  if (provider.status !== 'approved') {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-halo-text mb-2">Studio Not Available</h1>
        <p className="text-halo-text-muted">This studio is currently pending approval or has been suspended.</p>
        <Link href="/studios" className="mt-4 inline-block text-halo-primary hover:underline">Browse all studios</Link>
      </div>
    );
  }

  return (
    <div style={{ '--brand-color': provider.brandColor, '--brand-color-light': provider.brandColor + '33', '--brand-color-dark': provider.brandColor }}>
      {/* Provider Header */}
      <div className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <Link href={`/studios/${slug}`} className="font-bold text-lg min-h-[44px] flex items-center" style={{ color: provider.brandColor }}>
              {provider.name}
            </Link>
            <nav className="flex items-center gap-4 text-sm" aria-label={`${provider.name} navigation`}>
              <Link href={`/studios/${slug}`} className="hover:text-gray-300 min-h-[44px] flex items-center">About</Link>
              <Link href={`/studios/${slug}/portfolio`} className="hover:text-gray-300 min-h-[44px] flex items-center">Portfolio</Link>
              {session && (
                <Link href={`/studios/${slug}/request-quote`} className="hover:text-gray-300 min-h-[44px] flex items-center">Request Quote</Link>
              )}
            </nav>
          </div>
        </div>
      </div>
      {children}
    </div>
  );
}
