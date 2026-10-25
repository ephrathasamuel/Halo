'use client';

import Link from 'next/link';
import { useStorageSync } from '@/hooks/useStorageSync';
import { STORAGE_KEYS } from '@/lib/storage/keys';
import { formatETB } from '@/lib/format';

export default function AdminDashboardPage() {
  const { data: providers } = useStorageSync(STORAGE_KEYS.PROVIDERS, []);
  const { data: listings } = useStorageSync(STORAGE_KEYS.LISTINGS, []);
  const { data: users } = useStorageSync(STORAGE_KEYS.USERS, []);
  const { data: bookings } = useStorageSync(STORAGE_KEYS.BOOKINGS, []);
  const { data: disputes } = useStorageSync(STORAGE_KEYS.DISPUTES, []);

  // Financial aggregates
  const paidBookings = bookings.filter((b) => b.paymentStatus === 'paid');
  const totalGMV = paidBookings.reduce((sum, b) => sum + (b.total || 0), 0);
  const totalPlatformFees = paidBookings.reduce((sum, b) => sum + (b.fee || 0), 0);

  // Status counters
  const pendingProviders = providers.filter((p) => p.status === 'pending');
  const pendingListings = listings.filter((l) => l.status === 'pending');
  const openDisputes = disputes.filter((d) => d.status === 'open');
  const suspendedUsers = users.filter((u) => u.status === 'suspended');

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Platform Administration</h1>
            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 border border-red-200">
              Admin Only
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Global marketplace governance, storefront approvals, dispute resolution, and commission audits.
          </p>
        </div>
      </div>

      {/* Actionable Governance Alerts */}
      {(pendingProviders.length > 0 || pendingListings.length > 0 || openDisputes.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {pendingProviders.length > 0 && (
            <Link
              href="/admin/providers"
              className="p-5 rounded-2xl bg-amber-50 border border-amber-200 hover:border-amber-300 transition shadow-sm space-y-1 block"
            >
              <span className="text-xs font-bold uppercase tracking-wider text-amber-800">
                ⚠️ Provider Approvals Pending
              </span>
              <p className="text-2xl font-black text-amber-900">{pendingProviders.length}</p>
              <p className="text-xs text-amber-700">Review storefront applications →</p>
            </Link>
          )}

          {pendingListings.length > 0 && (
            <Link
              href="/admin/listings"
              className="p-5 rounded-2xl bg-blue-50 border border-blue-200 hover:border-blue-300 transition shadow-sm space-y-1 block"
            >
              <span className="text-xs font-bold uppercase tracking-wider text-blue-800">
                📦 Listings Pending Review
              </span>
              <p className="text-2xl font-black text-blue-900">{pendingListings.length}</p>
              <p className="text-xs text-blue-700">Inspect studio and gear listings →</p>
            </Link>
          )}

          {openDisputes.length > 0 && (
            <Link
              href="/admin/disputes"
              className="p-5 rounded-2xl bg-rose-50 border border-rose-200 hover:border-rose-300 transition shadow-sm space-y-1 block"
            >
              <span className="text-xs font-bold uppercase tracking-wider text-rose-800">
                ⚖️ Open Incident Disputes
              </span>
              <p className="text-2xl font-black text-rose-900">{openDisputes.length}</p>
              <p className="text-xs text-rose-700">Resolve claims & mediation →</p>
            </Link>
          )}
        </div>
      )}

      {/* Global Financial & Operating Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-1">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Platform GMV</p>
          <p className="text-2xl font-black text-slate-900">{formatETB(totalGMV)}</p>
          <p className="text-[11px] text-slate-400">Total gross rental volume</p>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-1">
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">Platform Commission</p>
          <p className="text-2xl font-black text-emerald-700">{formatETB(totalPlatformFees)}</p>
          <p className="text-[11px] text-slate-400">10% commission on subtotal</p>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-1">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Registered Providers</p>
          <p className="text-2xl font-black text-slate-900">{providers.length}</p>
          <p className="text-[11px] text-slate-400">
            {providers.filter((p) => p.status === 'approved').length} approved • {pendingProviders.length} pending
          </p>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-1">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">User Accounts</p>
          <p className="text-2xl font-black text-slate-900">{users.length}</p>
          <p className="text-[11px] text-slate-400">
            {users.filter((u) => u.status === 'active').length} active • {suspendedUsers.length} suspended
          </p>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href="/admin/providers"
          className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 shadow-sm transition space-y-2 group"
        >
          <span className="text-2xl group-hover:scale-110 transition inline-block">🏢</span>
          <h3 className="font-bold text-slate-900">Provider Moderation</h3>
          <p className="text-xs text-slate-500">Approve new studio storefronts or suspend non-compliant providers.</p>
        </Link>

        <Link
          href="/admin/listings"
          className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 shadow-sm transition space-y-2 group"
        >
          <span className="text-2xl group-hover:scale-110 transition inline-block">📋</span>
          <h3 className="font-bold text-slate-900">Listing Moderation</h3>
          <p className="text-xs text-slate-500">Approve or reject studio rooms, equipment packages, and filming services.</p>
        </Link>

        <Link
          href="/admin/reports"
          className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 shadow-sm transition space-y-2 group"
        >
          <span className="text-2xl group-hover:scale-110 transition inline-block">📊</span>
          <h3 className="font-bold text-slate-900">Commission & Financial Reports</h3>
          <p className="text-xs text-slate-500">Audit platform revenue, calculate owner earnings, and export CSV reports.</p>
        </Link>
      </div>
    </div>
  );
}
