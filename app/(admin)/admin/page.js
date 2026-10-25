'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { STORAGE_KEYS } from '@/lib/storage/keys';
import { formatPrice } from '@/lib/format';
import { COUNTRIES, providerLocation } from '@/lib/geo';
import { useAdminScope, useScopedStorage } from '@/hooks/useAdminScope';
import { PageHeader, Panel, StatCard } from '@/components/dashboard/DashboardUI';

const REVENUE_STATUSES = ['confirmed', 'in_progress', 'completed', 'reviewed'];

/**
 * Per-country summary for global admins, in each country's own currency.
 * @param {{ providers: object[], users: object[], bookings: object[], disputes: object[] }} props
 */
function CountryTable({ providers, users, bookings, disputes }) {
  const providerCountry = new Map(providers.map((p) => [p.id, providerLocation(p).country]));
  const bookingCountry = new Map(bookings.map((b) => [b.id, providerCountry.get(b.providerId)]));

  const rows = COUNTRIES.map((c) => {
    const cProviders = providers.filter((p) => providerLocation(p).country === c.code);
    const cBookings = bookings.filter((b) => providerCountry.get(b.providerId) === c.code);
    const revenue = cBookings.filter((b) => REVENUE_STATUSES.includes(b.status));
    return {
      ...c,
      providers: cProviders.filter((p) => p.status === 'approved').length,
      pending: cProviders.filter((p) => p.status === 'pending').length,
      customers: users.filter((u) => (u.country || 'ET') === c.code && u.roles?.includes('renter')).length,
      admins: users.filter((u) => u.roles?.includes('regional_admin') && u.adminScope?.country === c.code).length,
      disputes: disputes.filter((d) => d.status === 'open' && bookingCountry.get(d.targetId) === c.code).length,
      bookings: cBookings.length,
      fees: revenue.reduce((sum, b) => sum + (b.fee || 0), 0),
    };
  }).filter((r) => r.providers || r.pending || r.customers || r.admins);

  return (
    <Panel
      title="Countries"
      description="Each country in its own currency."
      action={
        <Link href="/admin/team" className="text-sm font-semibold text-halo-ink hover:underline min-h-0">
          Regional admins
        </Link>
      }
      flush
    >
      <div className="overflow-x-auto border-t border-halo-border">
        <table className="w-full text-left text-sm tabular">
          <thead className="text-halo-text-muted">
            <tr className="border-b border-halo-border">
              <th scope="col" className="px-5 sm:px-6 py-3 font-medium">Country</th>
              <th scope="col" className="px-4 py-3 font-medium">Live providers</th>
              <th scope="col" className="px-4 py-3 font-medium">Waiting approval</th>
              <th scope="col" className="px-4 py-3 font-medium">Customers</th>
              <th scope="col" className="px-4 py-3 font-medium">Bookings</th>
              <th scope="col" className="px-4 py-3 font-medium">Halo fees</th>
              <th scope="col" className="px-4 py-3 font-medium">Open disputes</th>
              <th scope="col" className="px-4 py-3 font-medium">Regional admins</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-halo-border text-halo-ink">
            {rows.map((r) => (
              <tr key={r.code}>
                <td className="px-5 sm:px-6 py-3 font-medium">{r.name}</td>
                <td className="px-4 py-3">{r.providers}</td>
                <td className={`px-4 py-3 ${r.pending ? 'font-semibold text-amber-700' : ''}`}>{r.pending}</td>
                <td className="px-4 py-3">{r.customers}</td>
                <td className="px-4 py-3">{r.bookings}</td>
                <td className="px-4 py-3">{formatPrice(r.fees, r.currency)}</td>
                <td className={`px-4 py-3 ${r.disputes ? 'font-semibold text-red-700' : ''}`}>{r.disputes}</td>
                <td className={`px-4 py-3 ${r.admins ? '' : 'text-amber-700'}`}>{r.admins || 'None yet'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

export default function AdminDashboardPage() {
  const { isGlobal, label } = useAdminScope();
  const { data: providers } = useScopedStorage(STORAGE_KEYS.PROVIDERS);
  const { data: listings } = useScopedStorage(STORAGE_KEYS.LISTINGS);
  const { data: users } = useScopedStorage(STORAGE_KEYS.USERS);
  const { data: bookings } = useScopedStorage(STORAGE_KEYS.BOOKINGS);
  const { data: disputes } = useScopedStorage(STORAGE_KEYS.DISPUTES);

  const providerMap = new Map(providers.map((p) => [p.id, p]));
  const pendingProviders = providers.filter((p) => p.status === 'pending');
  const pendingListings = listings.filter((l) => l.status === 'pending');
  const openDisputes = disputes.filter((d) => d.status === 'open');
  const suspendedUsers = users.filter((u) => u.status === 'suspended');

  // Fees per currency: amounts in different currencies are never added together
  const feesByCurrency = bookings
    .filter((b) => REVENUE_STATUSES.includes(b.status))
    .reduce((acc, b) => {
      const c = b.currency || providerLocation(providerMap.get(b.providerId)).currency;
      acc[c] = (acc[c] || 0) + (b.fee || 0);
      return acc;
    }, {});
  const feeLines = Object.entries(feesByCurrency);

  const queue = [
    { href: '/admin/providers', label: 'Storefronts waiting for approval', count: pendingProviders.length },
    { href: '/admin/listings', label: 'Listings waiting for review', count: pendingListings.length },
    { href: '/admin/disputes', label: 'Open disputes', count: openDisputes.length },
  ];
  const queueTotal = queue.reduce((sum, q) => sum + q.count, 0);

  return (
    <div className="space-y-8">
      <PageHeader
        title={isGlobal ? 'Overview' : `${label} overview`}
        description={
          isGlobal
            ? 'Every country on Halo. Regional admins handle approvals and disputes in their own country.'
            : `Approvals, customers and disputes in ${label}.`
        }
      />

      <Panel
        title="Needs your attention"
        description={queueTotal ? `${queueTotal} ${queueTotal === 1 ? 'item' : 'items'} waiting` : 'Nothing waiting.'}
        flush
      >
        <ul className="divide-y divide-halo-border border-t border-halo-border">
          {queue.map((q) => (
            <li key={q.href}>
              <Link
                href={q.href}
                className="flex items-center justify-between gap-4 px-5 sm:px-6 py-3.5 hover:bg-halo-ink/[0.02] min-h-[52px]"
              >
                <span className="text-halo-ink">{q.label}</span>
                <span className="flex items-center gap-2">
                  <span
                    className={`inline-flex min-w-7 justify-center rounded-full px-2 py-0.5 text-sm font-semibold tabular ${
                      q.count ? 'bg-amber-100 text-amber-800' : 'bg-stone-100 text-halo-text-muted'
                    }`}
                  >
                    {q.count}
                  </span>
                  <ChevronRight className="h-4 w-4 text-halo-text-muted" aria-hidden="true" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Panel>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Halo fees"
          value={feeLines.length ? feeLines.map(([c, v]) => formatPrice(v, c)).join(' / ') : formatPrice(0)}
          hint="10% of rental subtotals"
          href="/admin/reports"
        />
        <StatCard label="Bookings" value={bookings.length} hint="All statuses" href="/admin/bookings" />
        <StatCard
          label="Providers"
          value={providers.length}
          hint={`${providers.filter((p) => p.status === 'approved').length} live, ${pendingProviders.length} waiting`}
          href="/admin/providers"
        />
        <StatCard label="Users" value={users.length} hint={`${suspendedUsers.length} suspended`} href="/admin/users" />
      </div>

      {isGlobal && <CountryTable providers={providers} users={users} bookings={bookings} disputes={disputes} />}
    </div>
  );
}
