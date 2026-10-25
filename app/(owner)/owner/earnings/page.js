'use client';

import { useSession } from '@/hooks/useSession';
import { useStorageSync } from '@/hooks/useStorageSync';
import { STORAGE_KEYS } from '@/lib/storage/keys';
import { formatETB, formatDate } from '@/lib/format';
import { exportCsv, downloadCsv } from '@/lib/csv';
import { OwnerEarningsChart } from '@/components/charts/OwnerEarningsChart';
import { EmptyState } from '@/components/states/EmptyState';

export default function OwnerEarningsPage() {
  const { session } = useSession();
  const { data: bookings } = useStorageSync(STORAGE_KEYS.BOOKINGS, []);

  const myBookings = bookings.filter((b) => b.ownerId === session?.userId);
  const eligibleBookings = myBookings.filter((b) =>
    ['confirmed', 'in_progress', 'completed', 'reviewed'].includes(b.status)
  );

  // Financial aggregates
  const totalSubtotal = eligibleBookings.reduce((sum, b) => sum + (b.subtotal || 0), 0);
  const totalPlatformFees = eligibleBookings.reduce((sum, b) => sum + (b.fee || 0), 0);
  const totalNetEarnings = totalSubtotal - totalPlatformFees;
  const totalDeposits = eligibleBookings.reduce((sum, b) => sum + (b.deposit || 0), 0);

  // Group by date for chart
  const dateMap = new Map();
  eligibleBookings.forEach((b) => {
    const existing = dateMap.get(b.date) || { subtotal: 0, platformFee: 0, ownerNet: 0 };
    const sub = b.subtotal || 0;
    const fee = b.fee || 0;
    dateMap.set(b.date, {
      subtotal: existing.subtotal + sub,
      platformFee: existing.platformFee + fee,
      ownerNet: existing.ownerNet + (sub - fee),
    });
  });

  const chartData = Array.from(dateMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([dateStr, vals]) => ({
      date: dateStr,
      dateLabel: formatDate(dateStr).slice(0, 6),
      ownerNet: vals.ownerNet,
      platformFee: vals.platformFee,
    }));

  const handleExportCsv = () => {
    const columns = [
      { key: 'id', label: 'Booking ID' },
      { key: 'date', label: 'Date' },
      { key: 'status', label: 'Status' },
      { key: 'subtotal', label: 'Gross Subtotal (ETB)' },
      { key: 'platformFee', label: 'Platform 10% Fee (ETB)' },
      { key: 'ownerNet', label: 'Owner Net Earnings (ETB)' },
      { key: 'deposit', label: 'Security Deposit (ETB)' },
      { key: 'paymentStatus', label: 'Payment Status' },
    ];

    const rows = eligibleBookings.map((b) => ({
      id: b.id,
      date: b.date,
      status: b.status,
      subtotal: b.subtotal,
      platformFee: b.fee,
      ownerNet: (b.subtotal || 0) - (b.fee || 0),
      deposit: b.deposit,
      paymentStatus: b.paymentStatus,
    }));

    const csvData = exportCsv(rows, columns);
    downloadCsv(csvData, `halo-earnings-ledger-${new Date().toISOString().slice(0, 10)}.csv`);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Earnings & Financial Ledger</h1>
          <p className="text-xs text-slate-500 mt-1">
            Track gross subtotal bookings, platform commission (10%), and net provider payouts.
          </p>
        </div>

        <button
          onClick={handleExportCsv}
          disabled={eligibleBookings.length === 0}
          className="inline-flex items-center gap-1.5 px-4 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 transition shadow-sm disabled:opacity-50 min-h-[44px]"
        >
          <span>📥</span> Export Financial CSV
        </button>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-1">
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">Net Owner Earnings</p>
          <p className="text-2xl font-black text-slate-900">{formatETB(totalNetEarnings)}</p>
          <p className="text-[11px] text-slate-400">90% of subtotal</p>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-1">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Gross Subtotal</p>
          <p className="text-2xl font-black text-slate-900">{formatETB(totalSubtotal)}</p>
          <p className="text-[11px] text-slate-400">All confirmed & completed sessions</p>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-1">
          <p className="text-xs font-bold uppercase tracking-wider text-amber-600">Platform Commission</p>
          <p className="text-2xl font-black text-amber-700">{formatETB(totalPlatformFees)}</p>
          <p className="text-[11px] text-slate-400">Mock 10% platform fee</p>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-1">
          <p className="text-xs font-bold uppercase tracking-wider text-blue-600">Security Deposits</p>
          <p className="text-2xl font-black text-blue-700">{formatETB(totalDeposits)}</p>
          <p className="text-[11px] text-slate-400">Refundable equipment deposits</p>
        </div>
      </div>

      {/* Revenue Breakdown Chart */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm space-y-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Revenue Timeline</h2>
          <p className="text-xs text-slate-500">
            Daily net earnings alongside platform commission
          </p>
        </div>

        <OwnerEarningsChart data={chartData} />
      </div>

      {/* Accessible Financial Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-6">
        <h2 className="text-lg font-bold text-slate-900">Transaction Breakdown</h2>

        {eligibleBookings.length === 0 ? (
          <EmptyState
            title="No confirmed bookings yet"
            message="As your studio sessions complete, line items will appear in this ledger."
            icon="💳"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <tr>
                  <th scope="col" className="px-4 py-3">Booking ID</th>
                  <th scope="col" className="px-4 py-3">Date</th>
                  <th scope="col" className="px-4 py-3">Status</th>
                  <th scope="col" className="px-4 py-3">Subtotal</th>
                  <th scope="col" className="px-4 py-3">Fee (10%)</th>
                  <th scope="col" className="px-4 py-3">Owner Net (90%)</th>
                  <th scope="col" className="px-4 py-3">Deposit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {eligibleBookings.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">#{b.id.slice(0, 8)}</td>
                    <td className="px-4 py-3">{formatDate(b.date)}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100">
                        {b.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900">{formatETB(b.subtotal)}</td>
                    <td className="px-4 py-3 text-amber-600 font-medium">-{formatETB(b.fee)}</td>
                    <td className="px-4 py-3 font-black text-emerald-700">
                      {formatETB((b.subtotal || 0) - (b.fee || 0))}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">{formatETB(b.deposit)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
