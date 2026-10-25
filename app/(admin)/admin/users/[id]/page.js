'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { useStorageSync } from '@/hooks/useStorageSync';
import { STORAGE_KEYS } from '@/lib/storage/keys';
import { formatDate, formatETB } from '@/lib/format';
import { suspendUser, reinstateUser } from '@/lib/domain/users';

export default function AdminUserDetailPage({ params }) {
  const resolvedParams = use(params);
  const { id } = resolvedParams;

  const { data: users, refresh } = useStorageSync(STORAGE_KEYS.USERS, []);
  const { data: bookings } = useStorageSync(STORAGE_KEYS.BOOKINGS, []);
  const { data: providers } = useStorageSync(STORAGE_KEYS.PROVIDERS, []);

  const user = users.find((u) => u.id === id);
  const userBookings = bookings.filter((b) => b.renterId === id || b.ownerId === id);
  const userProvider = providers.find((p) => p.ownerId === id);

  const [feedback, setFeedback] = useState({ type: '', text: '' });

  if (!user) {
    return (
      <div className="max-w-xl mx-auto py-12 text-center space-y-4">
        <h1 className="text-xl font-bold text-slate-800">User Not Found</h1>
        <Link href="/admin/users" className="text-xs font-bold text-halo-primary hover:underline">
          Return to user list
        </Link>
      </div>
    );
  }

  const handleToggleStatus = () => {
    setFeedback({ type: '', text: '' });
    const res = user.status === 'active' ? suspendUser(user.id) : reinstateUser(user.id);
    if (!res.ok) {
      setFeedback({ type: 'error', text: res.error || 'Failed to update user status' });
      return;
    }
    setFeedback({ type: 'success', text: `User status updated to ${user.status === 'active' ? 'SUSPENDED' : 'ACTIVE'}!` });
    refresh();
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">{user.name}</h1>
            <span
              className={`text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                user.status === 'active'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-rose-50 text-rose-700 border-rose-200'
              }`}
            >
              {user.status}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Registered on {formatDate(user.createdAt?.slice(0, 10))} • ID: #{user.id.slice(0, 8)}
          </p>
        </div>

        <Link
          href="/admin/users"
          className="text-xs font-bold text-slate-600 hover:text-slate-900 min-h-[44px] flex items-center"
        >
          ← Back to Users
        </Link>
      </div>

      {feedback.text && (
        <div
          className={`p-4 rounded-xl text-sm font-medium border shadow-sm ${
            feedback.type === 'error'
              ? 'bg-red-50 text-red-700 border-red-200'
              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
          }`}
        >
          {feedback.type === 'error' ? '⚠️ ' : '✓ '}
          {feedback.text}
        </div>
      )}

      {/* Profile & Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-3 sm:col-span-2">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">Account Credentials</h2>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-slate-400 block">Email Address:</span>
              <span className="font-bold text-slate-900">{user.email}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Phone:</span>
              <span className="font-bold text-slate-900">{user.phone}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Assigned Roles:</span>
              <span className="font-bold text-slate-900 uppercase">{user.roles?.join(', ')}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Associated Provider:</span>
              <span className="font-bold text-slate-900">
                {userProvider ? userProvider.name : 'None (Renter)'}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-3 flex flex-col justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">Governance Action</h2>
          {!user.roles?.includes('admin') ? (
            <button
              onClick={handleToggleStatus}
              className={`w-full py-2.5 rounded-xl text-xs font-bold transition shadow-sm min-h-[44px] ${
                user.status === 'active'
                  ? 'bg-rose-600 hover:bg-rose-700 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
            >
              {user.status === 'active' ? 'Suspend Account' : 'Reinstate Account'}
            </button>
          ) : (
            <p className="text-xs text-slate-400">Admin accounts cannot be suspended.</p>
          )}
        </div>
      </div>

      {/* User Bookings History */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
        <h2 className="text-lg font-bold text-slate-900">Related Bookings ({userBookings.length})</h2>

        {userBookings.length === 0 ? (
          <p className="text-xs text-slate-400 py-4">No bookings found for this account.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {userBookings.map((b) => (
              <div key={b.id} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <span className="font-mono text-slate-400 mr-2">#{b.id.slice(0, 8)}</span>
                  <span className="font-bold text-slate-800 mr-2">{formatDate(b.date)}</span>
                  <span className="px-2 py-0.5 rounded-full bg-slate-100 font-semibold uppercase">{b.status}</span>
                </div>
                <span className="font-black text-slate-900">{formatETB(b.total)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
