'use client';

import { Download } from 'lucide-react';
import { STORAGE_KEYS } from '@/lib/storage/keys';
import { formatDate, formatMoney } from '@/lib/format';
import { providerLocation } from '@/lib/geo';
import { statusLabel } from '@/lib/status';
import { exportCsv, downloadCsv } from '@/lib/csv';
import { useAdminScope, useScopedStorage } from '@/hooks/useAdminScope';
import { PageHeader, Panel, StatusBadge, btn } from '@/components/dashboard/DashboardUI';

const REVENUE_STATUSES = ['confirmed', 'in_progress', 'completed', 'reviewed'];

export default function AdminReportsPage() {
  const { label: scopeLabel } = useAdminScope();
  const { data: bookings } = useScopedStorage(STORAGE_KEYS.BOOKINGS);
  const { data: providers } = useScopedStorage(STORAGE_KEYS.PROVIDERS);
  const providerMap = new Map(providers.map((p) => [p.id, p]));

  const currencyOf = (b) => b.currency || providerLocation(providerMap.get(b.providerId)).currency;
  const revenueBookings = bookings.filter((b) => REVENUE_STATUSES.includes(b.status));

  // Money in different currencies is never added together: one row per currency
  const byCurrency = [...revenueBookings.reduce((acc, b) => {
    const c = currencyOf(b);
    const row = acc.get(c) || { currency: c, count: 0, subtotal: 0, fee: 0, total: 0 };
    row.count += 1;
    row.subtotal += b.subtotal || 0;
    row.fee += b.fee || 0;
    row.total += b.total || 0;
    acc.set(c, row);
    return acc;
  }, new Map()).values()];

  const handleExportCsv = () => {
    const columns = [
      { key: 'id', label: 'Booking ID' },
      { key: 'providerName', label: 'Provider' },
      { key: 'country', label: 'Country' },
      { key: 'currency', label: 'Currency' },
      { key: 'date', label: 'Date' },
      { key: 'status', label: 'Status' },
      { key: 'subtotal', label: 'Subtotal' },
      { key: 'fee', label: 'Halo fee (10%)' },
      { key: 'ownerNet', label: 'Owner net' },
      { key: 'total', label: 'Gross total' },
      { key: 'paymentStatus', label: 'Payment' },
    ];
    const rows = revenueBookings.map((b) => {
      const provider = providerMap.get(b.providerId);
      return {
        id: b.id,
        providerName: provider?.name || 'Unknown',
        country: providerLocation(provider).country,
        currency: currencyOf(b),
        date: b.date,
        status: b.status,
        subtotal: b.subtotal,
        fee: b.fee,
        ownerNet: (b.subtotal || 0) - (b.fee || 0),
        total: b.total,
        paymentStatus: b.paymentStatus,
      };
    });
    downloadCsv(exportCsv(rows, columns), `halo-commission-report-${new Date().toISOString().slice(0, 10)}.csv`);
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Reports"
        description={`Halo fees (10% of each rental), booking volume and owner payouts. ${scopeLabel}.`}
        actions={
          <button onClick={handleExportCsv} disabled={revenueBookings.length === 0} className={btn.secondary}>
            <Download className="h-4 w-4" aria-hidden="true" />
            Export CSV
          </button>
        }
      />

      <Panel title="Totals by currency" description="Confirmed, in progress and completed bookings." flush>
        {byCurrency.length === 0 ? (
          <p className="px-5 pb-6 sm:px-6 text-halo-text-muted">No revenue yet.</p>
        ) : (
          <div className="overflow-x-auto border-t border-halo-border">
            <table className="w-full text-left text-sm tabular">
              <thead className="text-halo-text-muted">
                <tr className="border-b border-halo-border">
                  <th scope="col" className="px-5 sm:px-6 py-3 font-medium">Currency</th>
                  <th scope="col" className="px-4 py-3 font-medium">Bookings</th>
                  <th scope="col" className="px-4 py-3 font-medium">Halo fees</th>
                  <th scope="col" className="px-4 py-3 font-medium">Rental volume</th>
                  <th scope="col" className="px-4 py-3 font-medium">Owner payouts</th>
                  <th scope="col" className="px-4 py-3 font-medium">Gross incl. deposits</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-halo-border text-halo-ink">
                {byCurrency.map((r) => (
                  <tr key={r.currency}>
                    <td className="px-5 sm:px-6 py-3 font-semibold">{r.currency}</td>
                    <td className="px-4 py-3">{r.count}</td>
                    <td className="px-4 py-3 font-semibold">{formatMoney(r.fee, r.currency)}</td>
                    <td className="px-4 py-3">{formatMoney(r.subtotal, r.currency)}</td>
                    <td className="px-4 py-3">{formatMoney(r.subtotal - r.fee, r.currency)}</td>
                    <td className="px-4 py-3">{formatMoney(r.total, r.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <Panel title="Commission ledger" flush>
        <div className="overflow-x-auto border-t border-halo-border">
          <table className="w-full text-left text-sm tabular">
            <thead className="text-halo-text-muted">
              <tr className="border-b border-halo-border">
                <th scope="col" className="px-5 sm:px-6 py-3 font-medium">Booking</th>
                <th scope="col" className="px-4 py-3 font-medium">Provider</th>
                <th scope="col" className="px-4 py-3 font-medium">Date</th>
                <th scope="col" className="px-4 py-3 font-medium">Subtotal</th>
                <th scope="col" className="px-4 py-3 font-medium">Halo fee</th>
                <th scope="col" className="px-4 py-3 font-medium">Owner net</th>
                <th scope="col" className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-halo-border text-halo-ink">
              {revenueBookings.map((b) => {
                const c = currencyOf(b);
                return (
                  <tr key={b.id}>
                    <td className="px-5 sm:px-6 py-3 font-mono text-xs text-halo-text-muted">#{b.id.slice(-6)}</td>
                    <td className="px-4 py-3 font-medium">{providerMap.get(b.providerId)?.name || 'Unknown'}</td>
                    <td className="px-4 py-3">{formatDate(b.date)}</td>
                    <td className="px-4 py-3">{formatMoney(b.subtotal, c)}</td>
                    <td className="px-4 py-3 font-semibold">{formatMoney(b.fee, c)}</td>
                    <td className="px-4 py-3">{formatMoney((b.subtotal || 0) - (b.fee || 0), c)}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={b.status} label={statusLabel(b.status)} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
