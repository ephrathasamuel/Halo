'use client';

import Link from 'next/link';
import { CalendarClock, ChevronRight, Lock, Scale, Star } from 'lucide-react';
import { useSession } from '@/hooks/useSession';
import { useStorageSync } from '@/hooks/useStorageSync';
import { STORAGE_KEYS } from '@/lib/storage/keys';
import { formatMoney, formatDate, formatPrice, formatTime } from '@/lib/format';
import { EmptyState } from '@/components/states/EmptyState';
import { PageHeader, Panel, StatCard, StatusBadge, btn } from '@/components/dashboard/DashboardUI';
import { currencyOfProvider } from '@/lib/domain/providers';

export default function CustomerDashboardPage() {
  const { session, isSignedIn, isLoaded } = useSession();
  const { data: bookings } = useStorageSync(STORAGE_KEYS.BOOKINGS, []);
  const { data: providers } = useStorageSync(STORAGE_KEYS.PROVIDERS, []);
  const { data: reviews } = useStorageSync(STORAGE_KEYS.REVIEWS, []);
  const { data: disputes } = useStorageSync(STORAGE_KEYS.DISPUTES, []);

  // Wait for the stored session before showing the signed-out state
  if (!isLoaded) return <div className="min-h-[50vh]" aria-busy="true" />;

  if (!isSignedIn) {
    return (
      <EmptyState icon={Lock} title="Sign in to see your bookings" message="Track requests, upcoming shoots and receipts.">
        <Link href="/signin?next=/dashboard" className={btn.primary}>
          Sign in
        </Link>
      </EmptyState>
    );
  }

  const myBookings = bookings.filter((b) => b.renterId === session.userId);
  const providerMap = new Map(providers.map((p) => [p.id, p]));
  const reviewedIds = new Set(reviews.filter((r) => r.renterId === session.userId).map((r) => r.targetId));
  const myDisputes = disputes.filter((d) => d.openedBy === session.userId && d.status === 'open');

  const todayStr = new Date().toISOString().slice(0, 10);
  const weekAhead = new Date();
  weekAhead.setDate(weekAhead.getDate() + 7);
  const weekAheadStr = weekAhead.toISOString().slice(0, 10);

  const upcoming = myBookings
    .filter((b) => ['requested', 'confirmed', 'in_progress'].includes(b.status) && b.date >= todayStr)
    .sort((a, b) => `${a.date}${a.startTime}`.localeCompare(`${b.date}${b.startTime}`));
  const completed = myBookings.filter((b) => ['completed', 'reviewed'].includes(b.status));
  const needsReview = myBookings.filter((b) => b.status === 'completed' && !reviewedIds.has(b.id));
  const thisWeek = upcoming.filter((b) => b.status === 'confirmed' && b.date <= weekAheadStr);
  const totalSpent = myBookings.filter((b) => b.paymentStatus === 'paid').reduce((sum, b) => sum + (b.total || 0), 0);

  const todos = [
    ...thisWeek.map((b) => ({
      key: `soon-${b.id}`,
      icon: CalendarClock,
      title: `Shoot at ${providerMap.get(b.providerId)?.name || 'your studio'}`,
      text: `${formatDate(b.date)} at ${formatTime(b.startTime)}`,
      href: `/bookings/${b.id}`,
      cta: 'Details',
    })),
    ...needsReview.map((b) => ({
      key: `review-${b.id}`,
      icon: Star,
      title: `Review ${providerMap.get(b.providerId)?.name || 'your booking'}`,
      text: `How was your session on ${formatDate(b.date)}?`,
      href: `/bookings/${b.id}/review`,
      cta: 'Write review',
    })),
    ...myDisputes.map((d) => ({
      key: `dispute-${d.id}`,
      icon: Scale,
      title: 'Dispute under review',
      text: d.reason,
      href: d.targetType === 'booking' ? `/bookings/${d.targetId}` : '/events',
      cta: 'View',
    })),
  ];

  const firstName = session.name?.split(' ')[0] || 'there';

  return (
    <div className="space-y-8">
      <PageHeader
        title={`Hi, ${firstName}`}
        description="Your bookings and anything that needs you."
        actions={
          <Link href="/browse" className={btn.primary}>
            Book something new
          </Link>
        }
      />

      {todos.length > 0 && (
        <Panel title="To do" flush>
          <ul className="divide-y divide-halo-border border-t border-halo-border">
            {todos.map((t) => (
              <li key={t.key}>
                <Link href={t.href} className="flex items-center gap-4 px-5 sm:px-6 py-3.5 hover:bg-halo-ink/[0.02]">
                  <t.icon className="h-5 w-5 shrink-0 text-halo-ink" strokeWidth={1.75} aria-hidden="true" />
                  <span className="flex-1 min-w-0">
                    <span className="block font-medium text-halo-ink">{t.title}</span>
                    <span className="block text-sm text-halo-text-muted truncate">{t.text}</span>
                  </span>
                  <span className="hidden sm:block text-sm font-semibold text-halo-ink">{t.cta}</span>
                  <ChevronRight className="h-4 w-4 text-halo-text-muted" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        </Panel>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Upcoming" value={upcoming.length} hint="Requested or confirmed" href="/bookings" />
        <StatCard label="Completed" value={completed.length} href="/bookings" />
        <StatCard label="All bookings" value={myBookings.length} href="/bookings" />
        <StatCard label="Total paid" value={formatPrice(totalSpent)} />
      </div>

      <Panel
        title="Upcoming bookings"
        action={
          <Link href="/bookings" className="text-sm font-semibold text-halo-ink hover:underline min-h-0">
            All bookings
          </Link>
        }
        flush
      >
        {upcoming.length === 0 ? (
          <div className="px-5 pb-6 sm:px-6">
            <p className="text-halo-text-muted">Nothing booked yet.</p>
            <Link href="/browse" className="mt-2 inline-flex text-sm font-semibold text-halo-ink underline underline-offset-2 min-h-0">
              Find a studio or kit
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-halo-border border-t border-halo-border">
            {upcoming.slice(0, 5).map((b) => {
              const provider = providerMap.get(b.providerId);
              return (
                <li key={b.id}>
                  <Link href={`/bookings/${b.id}`} className="flex items-center gap-4 px-5 sm:px-6 py-3.5 hover:bg-halo-ink/[0.02]">
                    <span className="flex-1 min-w-0">
                      <span className="block font-medium text-halo-ink">{provider?.name || 'Studio booking'}</span>
                      <span className="block text-sm text-halo-text-muted">
                        {formatDate(b.date)}, {formatTime(b.startTime)} to {formatTime(b.endTime)}
                      </span>
                    </span>
                    <span className="hidden sm:block text-sm font-medium text-halo-ink tabular">{formatMoney(b.total, currencyOfProvider(b.providerId))}</span>
                    <StatusBadge status={b.status} />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>
    </div>
  );
}
