'use client';

import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import { Store } from 'lucide-react';
import { getProviderBySlug } from '@/lib/domain/providers';
import { getPublicListings } from '@/lib/domain/listings';
import { EmptyState } from '@/components/states/EmptyState';
import { useHydrated } from '@/hooks/useHydrated';
import { BackButton } from '@/components/ui/BackButton';
import { ProviderLogo } from '@/components/ui/ProviderLogo';

/**
 * Provider storefront layout: the provider's own tab bar, coloured with its brand.
 * @param {{ children: React.ReactNode }} props
 */
export default function StudioLayout({ children }) {
  const { slug } = useParams();
  const pathname = usePathname();
  const hydrated = useHydrated();

  // Wait for browser storage before deciding the studio doesn't exist
  if (!hydrated) {
    return <div className="min-h-[60vh]" aria-busy="true" />;
  }

  // getProviderBySlug only returns approved providers
  const provider = getProviderBySlug(slug);

  if (!provider) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16">
        <EmptyState
          icon={Store}
          title="This studio isn't available"
          message="It may not exist, or it may be waiting for approval."
        >
          <Link
            href="/studios"
            className="inline-flex items-center px-4 bg-halo-ink text-white rounded-lg text-sm font-semibold hover:bg-halo-ink-soft"
          >
            See all providers
          </Link>
        </EmptyState>
      </div>
    );
  }

  const base = `/studios/${slug}`;
  const offersFilming = getPublicListings({ type: 'service', pageSize: 100 }).items.some(
    (l) => l.providerId === provider.id
  );
  const tabs = [
    { href: base, label: 'Overview' },
    { href: `${base}/portfolio`, label: 'Portfolio' },
    ...(offersFilming ? [{ href: `${base}/request-quote`, label: 'Request a quote' }] : []),
  ];

  return (
    <div
      style={{
        '--brand-color': provider.brandColor,
        '--brand-color-light': provider.brandColor + '22',
        '--brand-color-dark': provider.brandColor,
      }}
    >
      <div className="border-b border-halo-border bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-6 overflow-x-auto no-scrollbar">
          <BackButton fallback="/studios" className="shrink-0" />
          <Link href={base} className="flex items-center gap-2 shrink-0 py-3 font-semibold text-halo-ink">
            <ProviderLogo provider={provider} size={28} rounded="rounded-full" />
            {provider.name}
          </Link>
          <nav className="flex items-center gap-1" aria-label={`${provider.name} pages`}>
            {tabs.map((t) => {
              const active = pathname === t.href;
              return (
                <Link
                  key={t.href}
                  href={t.href}
                  aria-current={active ? 'page' : undefined}
                  className={`shrink-0 px-3 text-sm font-medium border-b-2 flex items-center min-h-[52px] transition-colors ${
                    active
                      ? 'text-halo-ink border-[var(--brand-color)]'
                      : 'text-halo-text-muted border-transparent hover:text-halo-ink'
                  }`}
                >
                  {t.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
      {children}
    </div>
  );
}
