'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getPublicListings } from '@/lib/domain/listings';
import { getPublicProviders } from '@/lib/domain/providers';
import { ListingCard } from '@/components/listings/ListingCard';
import { readStorage } from '@/lib/storage/readStorage';
import { STORAGE_KEYS } from '@/lib/storage/keys';
import { SafeImage } from '@/components/ui/SafeImage';

export default function HomePage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('');

  const { items: featuredListings } = getPublicListings({ pageSize: 6, sort: 'popularity' });
  const providers = getPublicProviders();

  // Read active announcements
  const { data: announcements } = readStorage(STORAGE_KEYS.ANNOUNCEMENTS, []);
  const activeAnnouncement = announcements.find((a) => a.active);

  const handleHeroSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set('q', searchQuery.trim());
    if (selectedType) params.set('type', selectedType);
    const queryString = params.toString();
    router.push(queryString ? `/browse?${queryString}` : '/browse');
  };

  return (
    <div className="space-y-16 pb-16">
      {/* Active Announcement Banner */}
      {activeAnnouncement && (
        <div
          className="bg-amber-500 text-slate-950 font-medium px-4 py-3 text-center text-sm shadow-inner flex items-center justify-center gap-2"
          role="alert"
        >
          <span className="font-bold">📢 {activeAnnouncement.title}:</span>
          <span>{activeAnnouncement.message}</span>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-amber-300 text-xs font-semibold backdrop-blur-sm border border-white/10">
            <span>✨</span> Creative Studio & Production Gear Marketplace in Addis Ababa
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight leading-tight">
            Book Top Studios & Cinema Gear <br className="hidden sm:inline" />
            <span className="text-amber-400">Right in Addis Ababa</span>
          </h1>

          <p className="text-slate-300 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            Connect directly with verified creative storefronts. Rent soundstages in Bole, natural
            light studios in Arada, cinema camera kits, and professional event filming crews.
          </p>

          {/* Hero Search Box */}
          <form
            onSubmit={handleHeroSearch}
            className="bg-white p-2.5 sm:p-3 rounded-2xl shadow-2xl max-w-3xl mx-auto flex flex-col sm:flex-row gap-2.5 text-slate-800"
          >
            <div className="flex-1 relative flex items-center">
              <span className="pl-3.5 text-slate-400 select-none" aria-hidden="true">
                🔍
              </span>
              <label htmlFor="hero-search" className="sr-only">
                Search creative spaces or gear
              </label>
              <input
                id="hero-search"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search studio, camera kit, lighting, audio..."
                className="w-full px-3 py-2.5 text-sm outline-none placeholder:text-slate-400 min-h-[44px]"
              />
            </div>

            <div className="sm:w-48 sm:border-l sm:border-slate-200">
              <label htmlFor="hero-category" className="sr-only">
                Category
              </label>
              <select
                id="hero-category"
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full h-full px-3 py-2.5 text-sm bg-transparent font-medium text-slate-700 outline-none cursor-pointer min-h-[44px]"
              >
                <option value="">All Categories</option>
                <option value="studio">Studios</option>
                <option value="equipment">Equipment</option>
                <option value="service">Event Filming</option>
              </select>
            </div>

            <button
              type="submit"
              className="bg-halo-primary hover:bg-halo-primary-light text-white font-bold px-6 py-3 rounded-xl text-sm transition-colors shadow-md min-h-[44px] flex items-center justify-center gap-2"
            >
              <span>Explore</span>
              <span>→</span>
            </button>
          </form>

          {/* Fast Category Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-slate-300">
            <span className="text-slate-400">Popular shortcuts:</span>
            <Link
              href="/browse?type=studio"
              className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors min-h-[32px] flex items-center"
            >
              🏢 Studios
            </Link>
            <Link
              href="/browse?type=equipment"
              className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors min-h-[32px] flex items-center"
            >
              📹 Cinema Cameras
            </Link>
            <Link
              href="/browse?type=service"
              className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors min-h-[32px] flex items-center"
            >
              🎬 Wedding Filming
            </Link>
            <Link
              href="/studios/b-light"
              className="px-3 py-1.5 rounded-full bg-amber-400/20 text-amber-300 hover:bg-amber-400/30 transition-colors font-semibold min-h-[32px] flex items-center"
            >
              ⭐ Flagship: B Light
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Verified Listings */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Featured Listings
            </h2>
            <p className="text-slate-500 text-sm mt-1">
              Popular studios, camera kits, and production packages ready for instant booking.
            </p>
          </div>
          <Link
            href="/browse"
            className="text-sm font-bold text-halo-primary hover:underline flex items-center gap-1 min-h-[44px]"
          >
            View all listings ({featuredListings.length}+) →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredListings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      </section>

      {/* Flagship Provider Highlight Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950/70 text-white rounded-3xl p-6 sm:p-10 border border-amber-500/20 shadow-xl flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-3 max-w-xl">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
              Flagship Studio Storefront
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              B Light Creative Studio
            </h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              Located in Bole, B Light provides high-ceiling cyclorama stages, RED & cinema camera
              packages, sound equipment, and Hollywood-level wedding cinematography.
            </p>
            <div className="flex flex-wrap gap-4 pt-2">
              <Link
                href="/studios/b-light"
                className="inline-flex items-center justify-center px-5 py-2.5 bg-amber-400 text-slate-950 rounded-xl font-bold text-sm hover:bg-amber-300 transition-colors min-h-[44px]"
              >
                Visit B Light Storefront
              </Link>
              <Link
                href="/studios/b-light/portfolio"
                className="inline-flex items-center justify-center px-5 py-2.5 bg-white/10 text-white rounded-xl font-bold text-sm hover:bg-white/20 transition-colors min-h-[44px]"
              >
                View Portfolio
              </Link>
            </div>
          </div>

          <div className="w-full md:w-80 aspect-video relative rounded-2xl overflow-hidden border border-white/10 shadow-lg">
            <SafeImage
              src="/images/providers/b-light-cover.jpg"
              alt="B Light Studio"
              fallbackType="provider"
              fill
              className="object-cover"
            />
          </div>
        </div>
      </section>

      {/* Provider Strip */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Independent Addis Ababa Studios
            </h2>
            <p className="text-slate-500 text-sm mt-1">
              Explore independent providers with their own specialized spaces and equipment.
            </p>
          </div>
          <Link
            href="/studios"
            className="text-sm font-bold text-halo-primary hover:underline flex items-center gap-1 min-h-[44px]"
          >
            All Studios ({providers.length}) →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {providers.map((p) => (
            <Link
              key={p.id}
              href={`/studios/${p.slug}`}
              className="group bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between text-center items-center min-h-[140px]"
              style={{ borderTop: `3px solid ${p.brandColor}` }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white text-lg shadow-sm mb-2 group-hover:scale-105 transition-transform"
                style={{ backgroundColor: p.brandColor }}
              >
                {p.name.charAt(0)}
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm group-hover:text-halo-primary transition-colors">
                  {p.name}
                </h3>
                <span className="text-[11px] text-slate-400 font-medium">
                  📍 {p.neighbourhood}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* How It Works Section */}
      <section className="bg-slate-50 py-16 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              How Halo Works
            </h2>
            <p className="text-slate-500 text-sm mt-2">
              A transparent, reliable marketplace designed for filmmakers, photographers, and event
              planners in Addis Ababa.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 font-bold text-xl flex items-center justify-center">
                1
              </div>
              <h3 className="font-bold text-slate-900 text-lg">Browse & Check Availability</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Filter studios by hourly rate, capacity, and neighbourhood. Check live calendar
                availability with automated conflict prevention and cleanup buffers.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 font-bold text-xl flex items-center justify-center">
                2
              </div>
              <h3 className="font-bold text-slate-900 text-lg">Reserve with Transparent Terms</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Transparent 10% platform commission with clear fee breakdown before confirmation.
                Equipment deposits are tracked separately and refunded after return.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 font-bold text-xl flex items-center justify-center">
                3
              </div>
              <h3 className="font-bold text-slate-900 text-lg">Create, Review & Resolve</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Execute your production, leave verified renter reviews with owner response rights,
                and resolve any disputes through clear admin mediation.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
