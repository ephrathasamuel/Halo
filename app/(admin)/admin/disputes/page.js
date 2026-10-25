'use client';

import Link from 'next/link';
import { useStorageSync } from '@/hooks/useStorageSync';
import { STORAGE_KEYS } from '@/lib/storage/keys';
import { formatDate } from '@/lib/format';
import { EmptyState } from '@/components/states/EmptyState';

export default function AdminDisputesPage() {
  const { data: disputes } = useStorageSync(STORAGE_KEYS.DISPUTES, []);
  const { data: users } = useStorageSync(STORAGE_KEYS.USERS, []);
  const userMap = new Map(users.map((u) => [u.id, u]));

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Dispute Mediation Center</h1>
        <p className="text-xs text-slate-500 mt-1">
          Review, mediate, and resolve customer and studio provider dispute claims.
        </p>
      </div>

      {disputes.length === 0 ? (
        <EmptyState
          title="No disputes on file"
          message="Zero active incident claims reported across the platform."
          icon="⚖️"
        />
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <tr>
                  <th scope="col" className="px-6 py-4">Dispute Target</th>
                  <th scope="col" className="px-6 py-4">Opened By</th>
                  <th scope="col" className="px-6 py-4">Reason</th>
                  <th scope="col" className="px-6 py-4">Status</th>
                  <th scope="col" className="px-6 py-4">Date</th>
                  <th scope="col" className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {disputes.map((d) => {
                  const opener = userMap.get(d.openedBy);
                  return (
                    <tr key={d.id} className="hover:bg-slate-50 transition">
                      <td className="px-6 py-4 font-mono text-xs">
                        <span className="capitalize font-bold text-slate-800">{d.targetType}: </span>
                        <span className="text-slate-500">#{d.targetId.slice(0, 8)}</span>
                      </td>

                      <td className="px-6 py-4 text-xs font-medium text-slate-800">
                        {opener?.name || 'User'}
                        <p className="text-[11px] text-slate-400">{opener?.email}</p>
                      </td>

                      <td className="px-6 py-4 text-xs font-bold text-slate-900">
                        {d.reason}
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`inline-block text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                            d.status === 'resolved'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}
                        >
                          {d.status}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-xs text-slate-400">
                        {formatDate(d.createdAt?.slice(0, 10))}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/admin/disputes/${d.id}`}
                          className="px-3 py-1.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition min-h-[44px] inline-flex items-center"
                        >
                          {d.status === 'open' ? 'Review & Resolve →' : 'View Resolution →'}
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
