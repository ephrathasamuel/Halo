'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useStorageSync } from '@/hooks/useStorageSync';
import { STORAGE_KEYS } from '@/lib/storage/keys';
import { formatDate } from '@/lib/format';
import { suspendUser, reinstateUser } from '@/lib/domain/users';

export default function AdminUsersPage() {
  const { data: users, refresh } = useStorageSync(STORAGE_KEYS.USERS, []);
  const [feedback, setFeedback] = useState({ type: '', text: '' });

  const handleSuspend = (userId) => {
    setFeedback({ type: '', text: '' });
    const res = suspendUser(userId);
    if (!res.ok) {
      setFeedback({ type: 'error', text: res.error || 'Failed to suspend user' });
      return;
    }
    setFeedback({ type: 'success', text: `User account suspended!` });
    refresh();
  };

  const handleReinstate = (userId) => {
    setFeedback({ type: '', text: '' });
    const res = reinstateUser(userId);
    if (!res.ok) {
      setFeedback({ type: 'error', text: res.error || 'Failed to reinstate user' });
      return;
    }
    setFeedback({ type: 'success', text: `User account reinstated to active status!` });
    refresh();
  };

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">User Account Governance</h1>
        <p className="text-xs text-slate-500 mt-1">
          Manage creators, studio owners, and enforce safety suspensions.
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
                <th scope="col" className="px-6 py-4">User</th>
                <th scope="col" className="px-6 py-4">Roles</th>
                <th scope="col" className="px-6 py-4">Status</th>
                <th scope="col" className="px-6 py-4">Registered</th>
                <th scope="col" className="px-6 py-4 text-right">Account Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50 transition">
                  <td className="px-6 py-4">
                    <div className="space-y-0.5">
                      <Link
                        href={`/admin/users/${u.id}`}
                        className="font-bold text-slate-900 hover:text-halo-primary hover:underline"
                      >
                        {u.name}
                      </Link>
                      <p className="text-xs text-slate-500">{u.email}</p>
                      <p className="text-[11px] text-slate-400 font-mono">{u.phone}</p>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {u.roles?.map((role) => (
                        <span
                          key={role}
                          className="px-2 py-0.5 rounded text-[11px] font-bold uppercase bg-slate-100 text-slate-700"
                        >
                          {role}
                        </span>
                      ))}
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <span
                      className={`inline-block text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                        u.status === 'active'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}
                    >
                      {u.status}
                    </span>
                  </td>

                  <td className="px-6 py-4 text-xs text-slate-400">
                    {formatDate(u.createdAt?.slice(0, 10))}
                  </td>

                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/users/${u.id}`}
                        className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-2 min-h-[44px] flex items-center"
                      >
                        Details
                      </Link>

                      {!u.roles?.includes('admin') && (
                        <>
                          {u.status === 'active' ? (
                            <button
                              onClick={() => handleSuspend(u.id)}
                              className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition min-h-[44px]"
                            >
                              Suspend
                            </button>
                          ) : (
                            <button
                              onClick={() => handleReinstate(u.id)}
                              className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold transition min-h-[44px]"
                            >
                              Reinstate
                            </button>
                          )}
                        </>
                      )}
                    </div>
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
