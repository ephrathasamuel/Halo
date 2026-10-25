'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CalendarDays, Eye, Pencil, Plus } from 'lucide-react';
import { useSession } from '@/hooks/useSession';
import { useStorageSync } from '@/hooks/useStorageSync';
import { STORAGE_KEYS } from '@/lib/storage/keys';
import { formatPrice, LISTING_TYPE_LABELS } from '@/lib/format';
import { deactivateListing } from '@/lib/domain/listings';
import { currencyOfProvider } from '@/lib/domain/providers';
import { EmptyState } from '@/components/states/EmptyState';
import { SafeImage } from '@/components/ui/SafeImage';
import { Notice, PageHeader, StatusBadge, btn } from '@/components/dashboard/DashboardUI';

const TABS = [
  { id: 'all', label: 'All' },
  { id: 'studio', label: 'Spaces' },
  { id: 'equipment', label: 'Equipment' },
  { id: 'service', label: 'Services' },
  { id: 'sale', label: 'For sale' },
];

/** Price line for any listing type. */
function priceLine(item) {
  const currency = currencyOfProvider(item.providerId);
  if (item.type === 'service') return `From ${formatPrice(item.startingFromHint || 0, currency)}`;
  if (item.type === 'sale') return formatPrice(item.salePrice || 0, currency);
  return `${formatPrice(item.hourlyRate || 0, currency)} per hour`;
}

export default function OwnerListingsPage() {
  const { session } = useSession();
  const { data: listings, refresh } = useStorageSync(STORAGE_KEYS.LISTINGS, []);
  const myListings = listings.filter((l) => l.ownerId === session?.userId);

  const [typeFilter, setTypeFilter] = useState('all');
  const [notice, setNotice] = useState(null);

  const filtered = typeFilter === 'all' ? myListings : myListings.filter((l) => l.type === typeFilter);

  const toggleAvailable = (item) => {
    const res = deactivateListing(item.id);
    if (!res.ok) {
      setNotice({ tone: 'error', text: res.error || 'That change could not be saved' });
      return;
    }
    setNotice({
      tone: 'success',
      text: res.data.status === 'approved' ? `${item.title} is available again.` : `${item.title} is now unavailable and hidden from search.`,
    });
    refresh();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Listings"
        description="Spaces, equipment, services and items for sale. Switch anything off when it's not available."
        actions={
          <Link href="/owner/listings/new" className={btn.primary}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            New listing
          </Link>
        }
      />

      {notice && (
        <Notice tone={notice.tone} onDismiss={() => setNotice(null)}>
          {notice.text}
        </Notice>
      )}

      <div className="flex gap-2 overflow-x-auto no-scrollbar" role="group" aria-label="Filter by type">
        {TABS.map((tab) => {
          const count = tab.id === 'all' ? myListings.length : myListings.filter((l) => l.type === tab.id).length;
          const on = typeFilter === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setTypeFilter(tab.id)}
              aria-pressed={on}
              className={`shrink-0 px-4 rounded-full text-sm font-medium border min-h-[40px] ${
                on ? 'bg-halo-ink border-halo-ink text-white' : 'bg-halo-surface border-halo-border-strong text-halo-ink hover:border-halo-ink'
              }`}
            >
              {tab.label} <span className="tabular opacity-70">{count}</span>
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="Nothing here yet" message="Add a space, a piece of equipment, a service, or something you want to sell.">
          <Link href="/owner/listings/new" className={btn.primary}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            New listing
          </Link>
        </EmptyState>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((item) => {
            const available = item.status === 'approved';
            const canToggle = ['approved', 'inactive'].includes(item.status);
            return (
              <li key={item.id} className="flex flex-col overflow-hidden rounded-2xl border border-halo-border bg-halo-surface">
                <div className="relative aspect-[16/10] bg-halo-placeholder">
                  <SafeImage src={item.photos?.[0]} alt="" fallbackType={item.type} fill className={`object-cover ${available ? '' : 'opacity-50 grayscale'}`} />
                  <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold text-halo-ink">
                    {LISTING_TYPE_LABELS[item.type] || item.type}
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="font-semibold text-halo-ink line-clamp-1">{item.title}</h2>
                    {!canToggle && <StatusBadge status={item.status} />}
                  </div>
                  <p className="mt-0.5 text-[15px] text-halo-ink tabular">{priceLine(item)}</p>
                  {item.category && <p className="text-sm text-halo-text-muted">{item.category}</p>}

                  {canToggle && (
                    <label className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-halo-ink/[0.04] px-3 min-h-[44px] cursor-pointer">
                      <span className="text-sm font-medium text-halo-ink">{available ? 'Available' : 'Unavailable'}</span>
                      <input
                        type="checkbox"
                        role="switch"
                        checked={available}
                        onChange={() => toggleAvailable(item)}
                        aria-label={`${item.title} available`}
                        className="h-5 w-9 min-h-0 min-w-0 shrink-0 cursor-pointer appearance-none rounded-full bg-halo-border-strong transition-colors checked:bg-halo-success relative before:absolute before:left-0.5 before:top-0.5 before:h-4 before:w-4 before:rounded-full before:bg-white before:transition-transform checked:before:translate-x-4"
                      />
                    </label>
                  )}

                  <div className="mt-3 flex flex-wrap gap-2 pt-1">
                    <Link href={`/owner/listings/${item.id}/edit`} className={btn.secondary}>
                      <Pencil className="h-4 w-4" aria-hidden="true" />
                      Edit
                    </Link>
                    {item.type === 'studio' && (
                      <Link href={`/owner/listings/${item.id}/availability`} className={btn.secondary}>
                        <CalendarDays className="h-4 w-4" aria-hidden="true" />
                        Blocked dates
                      </Link>
                    )}
                    {available && (
                      <Link href={`/listings/${item.id}`} className={btn.secondary}>
                        <Eye className="h-4 w-4" aria-hidden="true" />
                        View
                      </Link>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
