'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ExternalLink, Plus, Store } from 'lucide-react';
import { useSession } from '@/hooks/useSession';
import { useStorageSync } from '@/hooks/useStorageSync';
import { STORAGE_KEYS } from '@/lib/storage/keys';
import { formatMoney, formatDate, formatHours, formatPrice, formatTime } from '@/lib/format';
import { EmptyState } from '@/components/states/EmptyState';
import { Notice, PageHeader, Panel, StatCard, StatusBadge, btn } from '@/components/dashboard/DashboardUI';
import { currencyOfProvider } from '@/lib/domain/providers';
import { transitionBooking } from '@/lib/client/domain';

const EARNING_STATUSES = ['confirmed', 'in_progress', 'completed', 'reviewed'];

export default function OwnerOverviewPage() {
  const { session } = useSession();
  const { data: providers } = useStorageSync(STORAGE_KEYS.PROVIDERS, []);
  const { data: listings } = useStorageSync(STORAGE_KEYS.LISTINGS, []);
  const { data: bookings } = useStorageSync(STORAGE_KEYS.BOOKINGS, []);
  const { data: users } = useStorageSync(STORAGE_KEYS.USERS, []);

  const [notice, setNotice] = useState(null);

  const provider = providers.find((p) => p.ownerId === session?.userId);
  const myBookings = bookings.filter((b) => b.ownerId === session?.userId);
  const myListings = listings.filter((l) => l.ownerId === session?.userId);
  const userMap = new Map(users.map((u) => [u.id, u]));

  const pendingRequests = myBookings.filter((b) => b.status === 'requested');
  const upcoming = myBookings
    .filter((b) => ['confirmed', 'in_progress'].includes(b.status))
    .sort((a, b) => `${a.date}${a.startTime}`.localeCompare(`${b.date}${b.startTime}`));
  const activeListingsCount = myListings.filter((l) => l.status === 'approved').length;

  // Owner earnings = rental subtotal minus the 10% platform fee
  const totalOwnerEarnings = myBookings
    .filter((b) => EARNING_STATUSES.includes(b.status))
    .reduce((sum, b) => sum + (b.subtotal || 0) - (b.fee || 0), 0);

  const handleAction = async (bookingId, targetState) => {
    const res = await transitionBooking(bookingId, targetState);
    if (!res.ok) {
      setNotice({ tone: 'error', text: res.error || 'That change could not be saved.' });
      return;
    }
    setNotice({
      tone: 'success',
      text: targetState === 'confirmed' ? 'Booking confirmed. The renter can see it now.' : 'Booking declined.',
    });
  };

  if (!provider) {
    return (
      <EmptyState
        icon={Store}
        title="No storefront linked to this account"
        message="Your account can manage a storefront, but none is connected to it yet. Contact Halo support to set it up."
      />
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title={provider.name}
        description={`${provider.neighbourhood}, ${provider.city}. Open ${formatHours(provider.hours)}.`}
        actions={
          <>
            <Link href={`/studios/${provider.slug}`} className={btn.secondary}>
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
              View storefront
            </Link>
            <Link href="/owner/listings/new" className={btn.primary}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              New listing
            </Link>
          </>
        }
      >
        {provider.status !== 'approved' && (
          <div className="mt-3">
            <StatusBadge status={provider.status} label={`Storefront ${provider.status}`} />
          </div>
        )}
      </PageHeader>

      {notice && (
        <Notice tone={notice.tone} onDismiss={() => setNotice(null)}>
          {notice.text}
        </Notice>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Requests to answer"
          value={pendingRequests.length}
          hint={pendingRequests.length ? 'Waiting for you' : 'All caught up'}
          tone={pendingRequests.length ? 'attention' : 'default'}
          href="/owner/bookings"
        />
        <StatCard label="Upcoming bookings" value={upcoming.length} hint="Confirmed or in progress" href="/owner/calendar" />
        <StatCard label="Earnings" value={formatPrice(totalOwnerEarnings)} hint="After the 10% Halo fee" href="/owner/earnings" />
        <StatCard
          label="Live listings"
          value={`${activeListingsCount} of ${myListings.length}`}
          hint="Approved and bookable"
          href="/owner/listings"
        />
      </div>

      <Panel
        title="Booking requests"
        description="Confirm or decline. Confirming checks the slot is still free."
        action={
          <Link href="/owner/bookings" className="text-sm font-semibold text-halo-ink hover:underline min-h-0">
            All bookings
          </Link>
        }
        flush
      >
        {pendingRequests.length === 0 ? (
          <p className="px-5 pb-6 sm:px-6 text-halo-text-muted">No requests waiting. New ones show up here.</p>
        ) : (
          <ul className="divide-y divide-halo-border border-t border-halo-border">
            {pendingRequests.map((b) => {
              const renter = (b.guest || userMap.get(b.renterId));
              return (
                <li key={b.id} className="px-5 py-4 sm:px-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-medium text-halo-ink">{renter?.name || 'Renter'}</p>
                    <p className="text-sm text-halo-text-muted">
                      {formatDate(b.date)}, {formatTime(b.startTime)} to {formatTime(b.endTime)}
                    </p>
                    <p className="text-sm text-halo-text-muted">
                      {b.items.map((i) => `${i.qty} ${i.title || i.type}`).join(', ')}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 md:gap-6">
                    <p className="text-right tabular">
                      <span className="block text-[13px] text-halo-text-muted">Rental</span>
                      <span className="font-semibold text-halo-ink">{formatMoney(b.subtotal, currencyOfProvider(b.providerId))}</span>
                    </p>
                    <div className="flex gap-2">
                      <button onClick={() => handleAction(b.id, 'declined')} className={btn.secondary}>
                        Decline
                      </button>
                      <button onClick={() => handleAction(b.id, 'confirmed')} className={btn.primary}>
                        Confirm
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>

      <Panel
        title="Coming up"
        action={
          <Link href="/owner/calendar" className="text-sm font-semibold text-halo-ink hover:underline min-h-0">
            Calendar
          </Link>
        }
        flush
      >
        {upcoming.length === 0 ? (
          <p className="px-5 pb-6 sm:px-6 text-halo-text-muted">Nothing scheduled yet.</p>
        ) : (
          <ul className="divide-y divide-halo-border border-t border-halo-border">
            {upcoming.slice(0, 5).map((b) => (
              <li key={b.id} className="px-5 py-3.5 sm:px-6 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-medium text-halo-ink">
                    {formatDate(b.date)}, {formatTime(b.startTime)}
                  </p>
                  <p className="text-sm text-halo-text-muted truncate">
                    {(b.guest || userMap.get(b.renterId))?.name || 'Renter'}, {b.hours} hours
                  </p>
                </div>
                <StatusBadge status={b.status} />
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
