'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useStorageSync } from '@/hooks/useStorageSync';
import { STORAGE_KEYS } from '@/lib/storage/keys';
import { moderateProvider } from '@/lib/domain/providers';

const STATUS_BADGES = {
  approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  suspended: 'bg-rose-50 text-rose-700 border-rose-200',
};

export default function AdminProvidersPage() {
  const { data: providers, refresh } = useStorageSync(STORAGE_KEYS.PROVIDERS, []);
  const { data: users } = useStorageSync(STORAGE_KEYS.USERS, []);
  const userMap = new Map(users.map((u) => [u.id, u]));

  const [feedback, setFeedback] = useState({ type: '', text: '' });

  const handleDecision = (providerId, decision) => {
    setFeedback({ type: '', text: '' });
    const res = moderateProvider(providerId, decision);
    if (!res.ok) {
      setFeedback({ type: 'error', text: res.error || 'Failed to update provider status' });
      return;
    }
    setFeedback({
      type: 'success',
      text: `Provider status successfully updated to ${decision.toUpperCase()}!`,
    });
    refresh();
  };

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Provider Moderation</h1>
        <p className="text-xs text-slate-500 mt-1">
          Review creative provider applications, verify studio credentials, and manage suspensions.
        </p>
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

      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
              <tr>
                <th scope="col" className="px-6 py-4">Provider</th>
                <th scope="col" className="px-6 py-4">Owner / Contact</th>
                <th scope="col" className="px-6 py-4">Location</th>
                <th scope="col" className="px-6 py-4">Status</th>
                <th scope="col" className="px-6 py-4 text-right">Moderation Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {providers.map((p) => {
                const owner = userMap.get(p.ownerId);
                return (
                  <tr key={p.id} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-4">
                      <div className="space-y-0.5">
                        <Link
                          href={`/studios/${p.slug}`}
                          target="_blank"
                          className="font-bold text-slate-900 hover:text-halo-primary hover:underline"
                        >
                          {p.name} ↗
                        </Link>
                        <p className="text-xs text-slate-400 line-clamp-1 max-w-xs">{p.tagline}</p>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-xs">
                      <p className="font-bold text-slate-800">{owner?.name || 'Unknown'}</p>
                      <p className="text-slate-500">{p.contact?.phone}</p>
                      <p className="text-slate-400">{owner?.email}</p>
                    </td>

                    <td className="px-6 py-4 text-xs text-slate-600">
                      {p.neighbourhood}, {p.city}
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`inline-block text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                          STATUS_BADGES[p.status] || 'bg-slate-100'
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {p.status !== 'approved' && (
                          <button
                            onClick={() => handleDecision(p.id, 'approved')}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm min-h-[44px]"
                          >
                            ✓ Approve
                          </button>
                        )}

                        {p.status !== 'suspended' && (
                          <button
                            onClick={() => handleDecision(p.id, 'suspended')}
                            className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition min-h-[44px]"
                          >
                            Suspend
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
