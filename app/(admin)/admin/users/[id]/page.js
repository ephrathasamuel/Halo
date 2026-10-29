'use client';

import { use, useState } from 'react';
import { useScopedStorage } from '@/hooks/useAdminScope';
import { STORAGE_KEYS } from '@/lib/storage/keys';
import { formatDate, formatMoney } from '@/lib/format';
import { currencyOfProvider } from '@/lib/domain/providers';
import { BackButton } from '@/components/ui/BackButton';
import { reinstateUser, suspendUser } from '@/lib/client/domain';

export default function AdminUserDetailPage({ params }) {
  const resolvedParams = use(params);
  const { id } = resolvedParams;

  const { data: users, refresh } = useScopedStorage(STORAGE_KEYS.USERS);
  const { data: bookings } = useScopedStorage(STORAGE_KEYS.BOOKINGS);
  const { data: providers } = useScopedStorage(STORAGE_KEYS.PROVIDERS);

  const user = users.find((u) => u.id === id);
  const userBookings = bookings.filter((b) => b.renterId === id || b.ownerId === id);
  const userProvider = providers.find((p) => p.ownerId === id);

  const [feedback, setFeedback] = useState({ type: '', text: '' });

  if (!user) {
    return (
      <div className="max-w-xl mx-auto py-12 text-center space-y-4">
        <h1 className="text-xl font-semibold text-halo-ink">User Not Found</h1>
        <BackButton fallback="/admin/users" />
      </div>
    );
  }

  const handleToggleStatus = async () => {
    setFeedback({ type: '', text: '' });
    const res = user.status === 'active' ? await suspendUser(user.id) : await reinstateUser(user.id);
    if (!res.ok) {
      setFeedback({ type: 'error', text: res.error || 'Failed to update user status' });
      return;
    }
    setFeedback({ type: 'success', text: `User status updated to ${user.status === 'active' ? 'SUSPENDED' : 'ACTIVE'}!` });
    refresh();
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-halo-border">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-halo-ink">{user.name}</h1>
            <span
              className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                user.status === 'active'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-rose-50 text-rose-700 border-rose-200'
              }`}
            >
              {user.status}
            </span>
          </div>
          <p className="text-xs text-halo-text-muted mt-1">
            Registered on {formatDate(user.createdAt?.slice(0, 10))}, ID: #{user.id.slice(-6)}
          </p>
        </div>

        <BackButton fallback="/admin/users" />
      </div>

      {feedback.text && (
        <div
          className={`p-4 rounded-xl text-sm font-medium border ${
            feedback.type === 'error'
            ? 'bg-red-50 text-red-700 border-red-200'
            : 'bg-emerald-50 text-emerald-800 border-emerald-200'
          }`}
        >
          {feedback.text}
        </div>
      )}

      {/* Profile & Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border border-halo-border p-6 space-y-3 sm:col-span-2">
          <h2 className="text-sm font-semibold text-halo-text-muted">Account Credentials</h2>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-halo-text-muted block">Email Address:</span>
              <span className="font-semibold text-halo-ink">{user.email}</span>
            </div>
            <div>
              <span className="text-halo-text-muted block">Phone:</span>
              <span className="font-semibold text-halo-ink">{user.phone}</span>
            </div>
            <div>
              <span className="text-halo-text-muted block">Assigned Roles:</span>
              <span className="font-semibold text-halo-ink">{user.roles?.join(', ')}</span>
            </div>
            <div>
              <span className="text-halo-text-muted block">Associated Provider:</span>
              <span className="font-semibold text-halo-ink">
                {userProvider ? userProvider.name : 'None (Renter)'}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-halo-border p-6 space-y-3 flex flex-col justify-between">
          <h2 className="text-sm font-semibold text-halo-text-muted">Governance Action</h2>
          {!user.roles?.includes('admin') ? (
            <button
              onClick={handleToggleStatus}
              className={`w-full py-2.5 rounded-xl text-xs font-semibold transition min-h-[44px] ${
                user.status === 'active'
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-halo-ink hover:bg-halo-ink-soft text-white'
              }`}
            >
              {user.status === 'active' ? 'Suspend Account' : 'Reinstate Account'}
            </button>
          ) : (
            <p className="text-xs text-halo-text-muted">Admin accounts cannot be suspended.</p>
          )}
        </div>
      </div>

      {/* User Bookings History */}
      <div className="bg-white rounded-2xl border border-halo-border p-6 space-y-4">
        <h2 className="text-lg font-semibold text-halo-ink">Related Bookings ({userBookings.length})</h2>

        {userBookings.length === 0 ? (
          <p className="text-xs text-halo-text-muted py-4">No bookings found for this account.</p>
        ) : (
          <div className="divide-y divide-halo-border">
            {userBookings.map((b) => (
              <div key={b.id} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <span className="font-mono text-halo-text-muted mr-2">#{b.id.slice(-6)}</span>
                  <span className="font-semibold text-halo-ink mr-2">{formatDate(b.date)}</span>
                  <span className="px-2 py-0.5 rounded-full bg-stone-100 font-semibold">{b.status}</span>
                </div>
                <span className="font-semibold text-halo-ink">{formatMoney(b.total, currencyOfProvider(b.providerId))}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
