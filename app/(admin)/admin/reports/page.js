'use client';

import { useStorageSync } from '@/hooks/useStorageSync';
import { STORAGE_KEYS } from '@/lib/storage/keys';
import { formatDate, formatETB } from '@/lib/format';
import { exportCsv, downloadCsv } from '@/lib/csv';

export default function AdminReportsPage() {
  const { data: bookings } = useStorageSync(STORAGE_KEYS.BOOKINGS, []);
  const { data: providers } = useStorageSync(STORAGE_KEYS.PROVIDERS, []);
  const providerMap = new Map(providers.map((p) => [p.id, p]));

  // All paid and confirmed/completed bookings
  const revenueBookings = bookings.filter((b) =>
    ['confirmed', 'in_progress', 'completed', 'reviewed'].includes(b.status)
  );

  const totalGMV = revenueBookings.reduce((sum, b) => sum + (b.total || 0), 0);
  const totalSubtotal = revenueBookings.reduce((sum, b) => sum + (b.subtotal || 0), 0);
  const totalCommission = revenueBookings.reduce((sum, b) => sum + (b.fee || 0), 0);
  const totalOwnerPayouts = totalSubtotal - totalCommission;

  const handleExportCsv = () => {
    const columns = [
      { key: 'id', label: 'Booking ID' },
      { key: 'providerName', label: 'Provider Storefront' },
      { key: 'date', label: 'Shoot Date' },
      { key: 'status', label: 'Status' },
      { key: 'subtotal', label: 'Subtotal (ETB)' },
      { key: 'fee', label: 'Halo 10% Commission (ETB)' },
      { key: 'ownerNet', label: 'Owner Net (ETB)' },
      { key: 'total', label: 'Gross Total (ETB)' },
      { key: 'paymentStatus', label: 'Payment' },
    ];

    const rows = revenueBookings.map((b) => ({
      id: b.id,
      providerName: providerMap.get(b.providerId)?.name || 'Unknown',
      date: b.date,
      status: b.status,
      subtotal: b.subtotal,
      fee: b.fee,
      ownerNet: (b.subtotal || 0) - (b.fee || 0),
      total: b.total,
      paymentStatus: b.paymentStatus,
    }));

    const csvData = exportCsv(rows, columns);
    downloadCsv(csvData, `halo-platform-commission-report-${new Date().toISOString().slice(0, 10)}.csv`);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Platform Commission & Financial Audit</h1>
          <p className="text-xs text-slate-500 mt-1">
            Reconcile platform take rate (mock 10% fee), gross booking volumes, and owner payouts.
          </p>
        </div>

        <button
          onClick={handleExportCsv}
          disabled={revenueBookings.length === 0}
          className="inline-flex items-center gap-1.5 px-4 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 transition shadow-sm disabled:opacity-50 min-h-[44px]"
        >
          <span>📥</span> Export Audit CSV
        </button>
      </div>

      {/* Metrics Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-1">
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">Platform Commission (10%)</p>
          <p className="text-2xl font-black text-emerald-700">{formatETB(totalCommission)}</p>
          <p className="text-[11px] text-slate-400">Halo platform net revenue</p>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-1">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Gross Subtotal Volume</p>
          <p className="text-2xl font-black text-slate-900">{formatETB(totalSubtotal)}</p>
          <p className="text-[11px] text-slate-400">Sum of all base hourly rentals</p>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-1">
          <p className="text-xs font-bold uppercase tracking-wider text-blue-600">Owner Net Payouts</p>
          <p className="text-2xl font-black text-blue-700">{formatETB(totalOwnerPayouts)}</p>
          <p className="text-[11px] text-slate-400">90% payable to studio owners</p>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-1">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Gross Total (GMV)</p>
          <p className="text-2xl font-black text-slate-900">{formatETB(totalGMV)}</p>
          <p className="text-[11px] text-slate-400">Including refundable deposits</p>
        </div>
      </div>

      {/* Audit Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-4">
        <h2 className="text-lg font-bold text-slate-900">Commission Ledger Details</h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
              <tr>
                <th scope="col" className="px-4 py-3">Booking ID</th>
                <th scope="col" className="px-4 py-3">Studio Provider</th>
                <th scope="col" className="px-4 py-3">Date</th>
                <th scope="col" className="px-4 py-3">Subtotal</th>
                <th scope="col" className="px-4 py-3">Platform 10% Fee</th>
                <th scope="col" className="px-4 py-3">Owner 90%</th>
                <th scope="col" className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {revenueBookings.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50 transition">
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">#{b.id.slice(0, 8)}</td>
                  <td className="px-4 py-3 font-semibold text-slate-900">
                    {providerMap.get(b.providerId)?.name || 'Unknown'}
                  </td>
                  <td className="px-4 py-3 text-xs">{formatDate(b.date)}</td>
                  <td className="px-4 py-3 font-medium text-slate-800">{formatETB(b.subtotal)}</td>
                  <td className="px-4 py-3 font-black text-emerald-700">+{formatETB(b.fee)}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {formatETB((b.subtotal || 0) - (b.fee || 0))}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs uppercase font-bold px-2 py-0.5 rounded-full bg-slate-100">
                      {b.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
