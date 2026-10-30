'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ArrowRight, Search } from 'lucide-react';
import { getPublicListings } from '@/lib/domain/listings';
import { getPublicProviders } from '@/lib/domain/providers';
import { ListingCard } from '@/components/listings/ListingCard';
import { ListingGridSkeleton } from '@/components/states/LoadingState';
import { SafeImage } from '@/components/ui/SafeImage';
import { AnnouncementToast } from '@/components/ui/AnnouncementToast';
import { Select } from '@/components/ui/Select';
import { readStorage } from '@/lib/storage/readStorage';
import { STORAGE_KEYS } from '@/lib/storage/keys';
import { useHydrated } from '@/hooks/useHydrated';
import { useCountry } from '@/hooks/useCountry';
import { countryName } from '@/lib/geo';

const CATEGORIES = [
  {
    type: 'studio',
    title: 'Studios',
    blurb: 'Cyclorama stages, natural light lofts, podcast rooms',
    image: '/images/listings/b-light-studio-1.jpg',
  },
  {
    type: 'equipment',
    title: 'Equipment',
    blurb: 'Cinema cameras, lenses, lighting, audio, drones',
    image: '/images/listings/b-light-camera.jpg',
  },
  {
    type: 'service',
    title: 'Event filming',
    blurb: 'Wedding, engagement and corporate film crews',
    image: '/images/listings/b-light-wedding.jpg',
  },
  {
    type: 'sale',
    title: 'For sale',
    blurb: 'Used and new gear from studios and rental houses',
    image: '/images/listings/sale-camera.jpg',
  },
];

const STEPS = [
  {
    title: 'Find what fits',
    text: 'Filter by area, price, date and size. Every listing shows its real hourly price and what is included.',
  },
  {
    title: 'Book or ask for a quote',
    text: 'Studios and gear are booked by the hour with the full price shown before you confirm. Film crews send you a quote.',
  },
  {
    title: 'Shoot, then review',
    text: 'Equipment deposits come back after return. Leave a review so the next creative knows what to expect.',
  },
];

export default function HomePage() {
  const router = useRouter();
  const hydrated = useHydrated();
  const { country } = useCountry();
  const ready = hydrated && country !== null;
  const place = country ? countryName(country) : '';
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('');

  // Storage is browser-only: read it after mount so server and client HTML match
  // Everything below follows the country chosen in the header
  const featuredListings = ready
    ? getPublicListings({ country, pageSize: 6, sort: 'popularity' }).items
    : [];
  const providers = ready ? getPublicProviders({ country }) : [];
  const typeCounts = ready
    ? Object.fromEntries(
        CATEGORIES.map((c) => [c.type, getPublicListings({ country, type: c.type, pageSize: 1 }).total])
      )
    : {};
  // Only when a specific country is chosen and nobody has listed there yet
  const noProvidersYet = ready && Boolean(country) && providers.length === 0;
  const announcements = hydrated ? readStorage(STORAGE_KEYS.ANNOUNCEMENTS, []).data : [];
  const activeAnnouncement = announcements.find((a) => a.active);
  const featuredProvider = providers.find((p) => p.featured) || providers[0];

  const handleHeroSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set('q', searchQuery.trim());
    if (selectedType) params.set('type', selectedType);
    const queryString = params.toString();
    router.push(queryString ? `/browse?${queryString}` : '/browse');
  };

  return (
    <div className="pb-20">
      {/* Full-width bar right under the header */}
      {activeAnnouncement && <AnnouncementToast announcement={activeAnnouncement} />}

      {/* Hero */}
      {/* No overflow-hidden: the category dropdown menu must be able to hang below the hero */}
      <section className="relative z-20 isolate bg-black">
        <Image
          src="/images/site/hero-addis.jpg"
          alt=""
          fill
          priority
          unoptimized
          className="object-cover -z-10 opacity-60"
          sizes="100vw"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-black/75 via-black/45 to-black/10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16 sm:pt-32 sm:pb-24 lg:pt-28">
          <div className="max-w-2xl">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold text-on-photo leading-[1.05]">
              Studios, gear and film crews in your city
            </h1>
            <p className="mt-5 text-lg text-on-photo/80 max-w-xl leading-relaxed">
              Book a photo studio by the hour, rent a cinema camera for the weekend, or get a quote
              for your wedding film. Every price is shown up front, in local currency.
            </p>
          </div>

          <form
            onSubmit={handleHeroSearch}
            className="mt-9 max-w-3xl bg-white rounded-2xl p-2 shadow-2xl flex flex-col sm:flex-row gap-2"
            role="search"
          >
            {/* Each part gets a rounded ring when focused, instead of a square outline */}
            <div className="flex-1 flex items-center gap-2 px-3 rounded-xl ring-halo-gold focus-within:ring-2">
              <Search className="w-5 h-5 text-halo-text-muted shrink-0" aria-hidden="true" />
              <label htmlFor="hero-search" className="sr-only">
                What do you need?
              </label>
              <input
                id="hero-search"
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Try podcast room, RED camera, wedding"
                className="w-full py-2 text-[15px] text-halo-ink outline-none focus-visible:outline-none placeholder:text-halo-text-muted bg-transparent"
              />
            </div>
            <Select
              label="Category"
              hideLabel
              value={selectedType}
              onChange={setSelectedType}
              options={[
                { value: '', label: 'Everything' },
                { value: 'studio', label: 'Studios' },
                { value: 'equipment', label: 'Equipment' },
                { value: 'service', label: 'Event filming' },
              ]}
              className="sm:w-48 sm:border-l sm:border-halo-border sm:pl-2"
              buttonClassName="h-full min-h-[48px] px-3 rounded-xl hover:bg-halo-ink/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-gold"
            />
            <button
              type="submit"
              className="bg-halo-ink hover:bg-halo-ink-soft text-white font-semibold px-6 rounded-xl text-[15px] transition-colors min-h-[48px]"
            >
              Search
            </button>
          </form>
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14" aria-labelledby="categories-heading">
        <h2 id="categories-heading" className="sr-only">
          Categories
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {CATEGORIES.map((c) => (
            <Link
              key={c.type}
              href={`/browse?type=${c.type}`}
              className="group relative isolate overflow-hidden rounded-2xl aspect-[16/10] sm:aspect-[4/3] lg:aspect-[4/5] flex items-end p-5"
            >
              <SafeImage
                src={c.image}
                alt=""
                fill
                className="object-cover -z-10 transition-transform duration-500 group-hover:scale-[1.04]"
                sizes="(max-width: 640px) 100vw, 33vw"
              />
              <span className="absolute inset-0 -z-10 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <span>
                <span className="block text-xl font-semibold text-on-photo">{c.title}</span>
                <span className="block mt-0.5 text-sm text-on-photo/80">{c.blurb}</span>
                <span className="mt-2 block text-sm font-medium text-on-photo tabular">
                  {typeCounts[c.type] != null ? `${typeCounts[c.type]} listings` : ' '}
                </span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured listings */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16" aria-labelledby="featured-heading">
        <div className="flex items-end justify-between gap-4 mb-6">
          <div>
            <h2 id="featured-heading" className="text-2xl sm:text-3xl font-semibold text-halo-ink">
              Popular right now
            </h2>
            <p className="mt-1 text-halo-text-muted">
              The most booked spaces and kits{place ? ` in ${place}` : ''}.
            </p>
          </div>
          <Link
            href="/browse"
            className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold text-halo-ink hover:underline"
          >
            See all listings
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </Link>
        </div>

        {noProvidersYet ? (
          <div className="rounded-3xl border border-dashed border-halo-border-strong bg-halo-surface px-6 py-12 text-center">
            <h3 className="text-xl font-semibold text-halo-ink">Halo is just opening in {place}</h3>
            <p className="mt-2 text-halo-text-muted max-w-md mx-auto">
              No studios or rental houses are listed here yet. Run one? Be the first provider in {place}.
            </p>
            <Link
              href="/signup?as=provider"
              className="mt-6 inline-flex items-center px-5 rounded-xl bg-halo-ink text-white text-sm font-semibold hover:bg-halo-ink-soft"
            >
              List your space or gear
            </Link>
          </div>
        ) : ready ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10">
            {featuredListings.map((listing, i) => (
              <ListingCard key={listing.id} listing={listing} priority={i < 3} />
            ))}
          </div>
        ) : (
          <ListingGridSkeleton count={6} />
        )}

        <Link
          href="/browse"
          className="sm:hidden mt-8 flex items-center justify-center rounded-xl border border-halo-border-strong text-sm font-semibold text-halo-ink"
        >
          See all listings
        </Link>
      </section>

      {/* Providers */}
      <section
        className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 ${noProvidersYet ? 'hidden' : ''}`}
        aria-labelledby="providers-heading"
      >
        <div className="flex items-end justify-between gap-4 mb-6">
          <div>
            <h2 id="providers-heading" className="text-2xl sm:text-3xl font-semibold text-halo-ink">
              Independent providers
            </h2>
            <p className="mt-1 text-halo-text-muted">
              Each studio runs its own storefront on Halo, with its own work and reviews.
            </p>
          </div>
          <Link
            href="/studios"
            className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold text-halo-ink hover:underline"
          >
            All providers
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </Link>
        </div>

        <div className="-mx-4 px-4 sm:mx-0 sm:px-0 flex sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-4 overflow-x-auto no-scrollbar snap-x">
          {providers.map((p) => (
            <Link
              key={p.id}
              href={`/studios/${p.slug}`}
              className="group snap-start shrink-0 w-[78%] sm:w-auto flex items-center gap-4 rounded-2xl border border-halo-border bg-white p-3 hover:border-halo-border-strong transition-colors"
            >
              <span className="relative h-16 w-20 shrink-0 overflow-hidden rounded-lg bg-halo-placeholder">
                <SafeImage src={p.cover} alt="" fallbackType="provider" fill className="object-cover" sizes="80px" />
              </span>
              <span className="min-w-0">
                <span className="block font-semibold text-halo-ink truncate">{p.name}</span>
                <span className="block text-sm text-halo-text-muted truncate">{p.tagline}</span>
                <span className="block text-[13px] text-halo-text-muted mt-0.5">
                  {p.neighbourhood}, {p.city}
                </span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured provider */}
      {featuredProvider && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20">
          <div className="grid lg:grid-cols-2 overflow-hidden rounded-3xl bg-halo-ink text-white">
            <div className="relative min-h-[240px] lg:min-h-[380px]">
              <SafeImage
                src={featuredProvider.cover}
                alt={`Inside ${featuredProvider.name}`}
                fallbackType="provider"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
            <div className="p-8 sm:p-12 flex flex-col justify-center">
              <p className="text-sm font-medium text-halo-gold">Featured provider</p>
              <h2 className="mt-2 text-3xl font-semibold">{featuredProvider.name}</h2>
              <p className="mt-3 text-white/75 leading-relaxed line-clamp-4">{featuredProvider.about}</p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  href={`/studios/${featuredProvider.slug}`}
                  className="inline-flex items-center px-5 rounded-xl bg-white text-halo-ink text-sm font-semibold hover:bg-white/90"
                >
                  Visit storefront
                </Link>
                <Link
                  href={`/studios/${featuredProvider.slug}/portfolio`}
                  className="inline-flex items-center px-5 rounded-xl border border-white/25 text-sm font-semibold hover:bg-white/10"
                >
                  See their work
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* How it works */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20" aria-labelledby="how-heading">
        <h2 id="how-heading" className="text-2xl sm:text-3xl font-semibold text-halo-ink">
          How Halo works
        </h2>
        <ol className="mt-8 grid gap-8 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <li key={s.title} className="border-t border-halo-border-strong pt-5">
              <span className="text-sm font-semibold text-halo-gold-ink tabular">Step {i + 1}</span>
              <h3 className="mt-1 text-lg font-semibold text-halo-ink">{s.title}</h3>
              <p className="mt-2 text-halo-text-muted leading-relaxed">{s.text}</p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
