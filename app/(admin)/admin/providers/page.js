'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useScopedStorage } from '@/hooks/useAdminScope';
import { STORAGE_KEYS } from '@/lib/storage/keys';
import { STATUS_TONES, statusLabel } from '@/lib/status';
import { moderateProvider } from '@/lib/client/domain';
import { AssignOwnerForm } from '@/components/admin/AssignOwnerForm';

const STATUS_BADGES = STATUS_TONES;

export default function AdminProvidersPage() {
  const { data: providers, refresh } = useScopedStorage(STORAGE_KEYS.PROVIDERS);
  const { data: users } = useScopedStorage(STORAGE_KEYS.USERS);
  const userMap = new Map(users.map((u) => [u.id, u]));

  const [feedback, setFeedback] = useState({ type: '', text: '' });

  const handleDecision = async (providerId, decision) => {
    setFeedback({ type: '', text: '' });
    const res = await moderateProvider(providerId, decision);
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
      <div className="pb-4 border-b border-halo-border">
        <h1 className="text-2xl font-semibold text-halo-ink">Storefronts</h1>
        <p className="text-xs text-halo-text-muted mt-1">
          Approve new storefronts, give storefronts to their owners, and suspend ones that break the rules. Each owner has their own provider account, separate from admin accounts.
        </p>
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

      <div className="bg-white rounded-2xl border border-halo-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-stone-700">
            <thead className="bg-stone-50 text-xs font-semibold text-halo-text-muted border-b border-halo-border">
              <tr>
                <th scope="col" className="px-6 py-4">Provider</th>
                <th scope="col" className="px-6 py-4">Owner</th>
                <th scope="col" className="px-6 py-4">Location</th>
                <th scope="col" className="px-6 py-4">Status</th>
                <th scope="col" className="px-6 py-4 text-right">Moderation Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-halo-border">
              {providers.map((p) => {
                const owner = userMap.get(p.ownerId);
                return (
                  <tr key={p.id} className="hover:bg-stone-50 transition">
                    <td className="px-6 py-4">
                      <div className="space-y-0.5">
                        <Link
                          href={`/studios/${p.slug}`}
                          target="_blank"
                          className="font-semibold text-halo-ink hover:text-halo-ink hover:underline"
                        >
                          {p.name}</Link>
                        <p className="text-xs text-halo-text-muted line-clamp-1 max-w-xs">{p.tagline}</p>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-xs align-top">
                      {owner ? (
                        <>
                          <p className="font-semibold text-halo-ink">{owner.name}</p>
                          <p className="text-halo-text-muted">{p.contact?.phone || owner.phone}</p>
                          <p className="text-halo-text-muted">{owner.email}</p>
                        </>
                      ) : (
                        <AssignOwnerForm provider={p} onDone={(text) => setFeedback({ type: 'success', text })} />
                      )}
                    </td>

                    <td className="px-6 py-4 text-xs text-stone-600">
                      {p.neighbourhood}, {p.city}
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full border ${
                          STATUS_BADGES[p.status] || 'bg-stone-100'
                        }`}
                      >
                        {statusLabel(p.status)}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {p.status !== 'approved' && (
                          <button
                            onClick={() => handleDecision(p.id, 'approved')}
                            className="px-3 py-1.5 bg-halo-ink hover:bg-halo-ink-soft text-white rounded-xl text-xs font-semibold transition min-h-[44px]"
                          >Approve
                          </button>
                        )}

                        {p.status !== 'suspended' && (
                          <button
                            onClick={() => handleDecision(p.id, 'suspended')}
                            className="px-3 py-1.5 bg-white hover:bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs font-semibold transition min-h-[44px]"
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
