'use client';

import Link from 'next/link';
import { useScopedStorage } from '@/hooks/useAdminScope';
import { STORAGE_KEYS } from '@/lib/storage/keys';
import { formatDate } from '@/lib/format';
import { EmptyState } from '@/components/states/EmptyState';

export default function AdminDisputesPage() {
  const { data: disputes } = useScopedStorage(STORAGE_KEYS.DISPUTES);
  const { data: users } = useScopedStorage(STORAGE_KEYS.USERS);
  const userMap = new Map(users.map((u) => [u.id, u]));

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-halo-border">
        <h1 className="text-2xl font-semibold text-halo-ink">Dispute Mediation Center</h1>
        <p className="text-xs text-halo-text-muted mt-1">
          Review, mediate, and resolve customer and studio provider dispute claims.
        </p>
      </div>

      {disputes.length === 0 ? (
        <EmptyState
          title="No disputes on file"
          message="Zero active incident claims reported across the platform."
        />
      ) : (
        <div className="bg-white rounded-2xl border border-halo-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-stone-700">
              <thead className="bg-stone-50 text-xs font-semibold text-halo-text-muted border-b border-halo-border">
                <tr>
                  <th scope="col" className="px-6 py-4">Dispute Target</th>
                  <th scope="col" className="px-6 py-4">Opened By</th>
                  <th scope="col" className="px-6 py-4">Reason</th>
                  <th scope="col" className="px-6 py-4">Status</th>
                  <th scope="col" className="px-6 py-4">Date</th>
                  <th scope="col" className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-halo-border">
                {disputes.map((d) => {
                  const opener = userMap.get(d.openedBy);
                  return (
                    <tr key={d.id} className="hover:bg-stone-50 transition">
                      <td className="px-6 py-4 font-mono text-xs">
                        <span className="capitalize font-semibold text-halo-ink">{d.targetType}: </span>
                        <span className="text-halo-text-muted">#{d.targetId.slice(0, 8)}</span>
                      </td>

                      <td className="px-6 py-4 text-xs font-medium text-halo-ink">
                        {opener?.name || 'User'}
                        <p className="text-[11px] text-halo-text-muted">{opener?.email}</p>
                      </td>

                      <td className="px-6 py-4 text-xs font-semibold text-halo-ink">
                        {d.reason}
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full border ${
                            d.status === 'resolved'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}
                        >
                          {d.status}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-xs text-halo-text-muted">
                        {formatDate(d.createdAt?.slice(0, 10))}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/admin/disputes/${d.id}`}
                          className="px-3 py-1.5 bg-stone-900 text-white rounded-xl text-xs font-semibold hover:bg-stone-800 transition min-h-[44px] inline-flex items-center"
                        >
                          {d.status === 'open' ? 'Review & Resolve' : 'View Resolution'}
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
