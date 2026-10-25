'use client';

import Link from 'next/link';
import { getPublicProviders } from '@/lib/domain/providers';
import { getPublicListings } from '@/lib/domain/listings';
import { SafeImage } from '@/components/ui/SafeImage';

export default function StudiosDirectoryPage() {
  const providers = getPublicProviders();
  const { items: allListings } = getPublicListings({ pageSize: 100 });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">
          Studio & Provider Directory
        </h1>
        <p className="text-slate-500 mt-2 text-base max-w-2xl">
          Explore independent, verified creative spaces and rental houses across Addis Ababa. Each
          provider manages their own studio storefront inside Halo.
        </p>
      </div>

      {/* Providers Grid */}
      <div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        role="region"
        aria-label="Provider Directory"
      >
        {providers.map((provider) => {
          const providerListings = allListings.filter(
            (l) => l.providerId === provider.id
          );
          const hasStudios = providerListings.some((l) => l.type === 'studio');
          const hasEquipment = providerListings.some((l) => l.type === 'equipment');
          const hasServices = providerListings.some((l) => l.type === 'service');

          return (
            <article
              key={provider.id}
              className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              style={{ borderTop: `4px solid ${provider.brandColor}` }}
            >
              {/* Cover Banner */}
              <div className="relative h-32 w-full bg-slate-100">
                <SafeImage
                  src={provider.cover}
                  alt={`${provider.name} storefront cover`}
                  fallbackType="provider"
                  fill
                  className="object-cover"
                />
                <span className="absolute top-2.5 right-2.5 bg-white/90 backdrop-blur-sm text-slate-800 text-xs font-semibold px-2 py-0.5 rounded shadow-sm">
                  📍 {provider.neighbourhood}
                </span>
              </div>

              {/* Provider Info */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-base shadow-sm"
                      style={{ backgroundColor: provider.brandColor }}
                    >
                      {provider.name.charAt(0)}
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-slate-900 leading-tight">
                        <Link
                          href={`/studios/${provider.slug}`}
                          className="hover:underline focus:outline-none"
                        >
                          {provider.name}
                        </Link>
                      </h2>
                      <span className="text-xs text-slate-500 font-medium">
                        {provider.neighbourhood}, Addis Ababa
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-2 mb-4 leading-relaxed">
                    {provider.tagline}
                  </p>

                  {/* Capabilities chips */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {hasStudios && (
                      <span className="text-[11px] font-medium bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
                        🏢 Studios
                      </span>
                    )}
                    {hasEquipment && (
                      <span className="text-[11px] font-medium bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded">
                        📹 Equipment
                      </span>
                    )}
                    {hasServices && (
                      <span className="text-[11px] font-medium bg-amber-50 text-amber-700 px-2 py-0.5 rounded">
                        🎬 Event Filming
                      </span>
                    )}
                  </div>
                </div>

                {/* Footer details */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>
                    🕐 {provider.hours.open} – {provider.hours.close}
                  </span>
                  <Link
                    href={`/studios/${provider.slug}`}
                    className="inline-flex items-center font-bold min-h-[44px] px-3 py-1.5 rounded-lg text-white transition-opacity hover:opacity-90"
                    style={{ backgroundColor: provider.brandColor }}
                  >
                    View Storefront →
                  </Link>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
