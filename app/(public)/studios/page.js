'use client';

import Link from 'next/link';
import { Clock, MapPin } from 'lucide-react';
import { getPublicProviders } from '@/lib/domain/providers';
import { getPublicListings } from '@/lib/domain/listings';
import { SafeImage } from '@/components/ui/SafeImage';
import { formatHours, LISTING_TYPE_LABELS } from '@/lib/format';
import { useHydrated } from '@/hooks/useHydrated';
import { ProviderLogo } from '@/components/ui/ProviderLogo';

function DirectorySkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10 animate-pulse" aria-hidden="true">
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i}>
          <div className="aspect-[16/9] rounded-xl bg-halo-placeholder" />
          <div className="mt-3 h-4 w-1/2 rounded bg-halo-placeholder" />
          <div className="mt-2 h-3 w-3/4 rounded bg-halo-placeholder" />
        </div>
      ))}
    </div>
  );
}

export default function StudiosDirectoryPage() {
  const hydrated = useHydrated();
  const providers = hydrated ? getPublicProviders() : [];
  const allListings = hydrated ? getPublicListings({ pageSize: 100 }).items : [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="max-w-2xl">
        <h1 className="text-3xl sm:text-4xl font-semibold text-halo-ink">Providers</h1>
        <p className="mt-2 text-halo-text-muted">
          Independent studios and rental houses. Each one runs its own
          storefront on Halo, with its own listings, work and reviews.
        </p>
      </div>

      <div className="mt-10">
        {!hydrated ? (
          <DirectorySkeleton />
        ) : (
          <div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10"
            role="region"
            aria-label="Provider directory"
          >
            {providers.map((provider) => {
              const own = allListings.filter((l) => l.providerId === provider.id);
              const offers = ['studio', 'equipment', 'service'].filter((t) => own.some((l) => l.type === t));

              return (
                <article key={provider.id} className="group relative">
                  <div className="relative aspect-[16/9] overflow-hidden rounded-xl bg-halo-placeholder">
                    <SafeImage
                      src={provider.cover}
                      alt=""
                      fallbackType="provider"
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                  </div>
                  <div className="mt-3 flex items-start gap-3">
                    <ProviderLogo provider={provider} size={36} rounded="rounded-full" className="mt-0.5" />
                    <div className="min-w-0">
                      <h2 className="text-[17px] font-semibold text-halo-ink">
                        <Link
                          href={`/studios/${provider.slug}`}
                          className="after:absolute after:inset-0 after:content-[''] min-h-0 min-w-0"
                        >
                          {provider.name}
                        </Link>
                      </h2>
                      <p className="text-sm text-halo-text-muted line-clamp-1">{provider.tagline}</p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-halo-text-muted">
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                          {provider.neighbourhood}
                        </span>
                        {provider.hours && (
                          <span className="inline-flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                            {formatHours(provider.hours)}
                          </span>
                        )}
                      </div>
                      {offers.length > 0 && (
                        <ul className="mt-2.5 flex flex-wrap gap-1.5">
                          {offers.map((t) => (
                            <li
                              key={t}
                              className="rounded-full border border-halo-border-strong px-2.5 py-0.5 text-xs font-medium text-halo-ink"
                            >
                              {LISTING_TYPE_LABELS[t]}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
