'use client';

import { useState } from 'react';
import { useStorageSync } from '@/hooks/useStorageSync';
import { STORAGE_KEYS } from '@/lib/storage/keys';
import { formatDate } from '@/lib/format';
import {
  publishAnnouncement,
  toggleAnnouncement,
  deleteAnnouncement,
} from '@/lib/domain/announcements';

export default function AdminAnnouncementsPage() {
  const { data: announcements, refresh } = useStorageSync(STORAGE_KEYS.ANNOUNCEMENTS, []);

  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [feedback, setFeedback] = useState({ type: '', text: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePublish = (e) => {
    e.preventDefault();
    setFeedback({ type: '', text: '' });
    setIsSubmitting(true);

    const res = publishAnnouncement({ title, message });
    setIsSubmitting(false);

    if (!res.ok) {
      setFeedback({ type: 'error', text: res.error || 'Failed to publish announcement' });
      return;
    }

    setFeedback({ type: 'success', text: 'Platform announcement published!' });
    setTitle('');
    setMessage('');
    refresh();
  };

  const handleToggle = (id) => {
    setFeedback({ type: '', text: '' });
    const res = toggleAnnouncement(id);
    if (!res.ok) {
      setFeedback({ type: 'error', text: res.error || 'Failed to update announcement' });
      return;
    }
    refresh();
  };

  const handleDelete = (id) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return;
    deleteAnnouncement(id);
    refresh();
  };

  return (
    <div className="max-w-4xl space-y-8">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Platform Announcements</h1>
        <p className="text-xs text-slate-500 mt-1">
          Broadcast marketplace news, service updates, and holiday hours across Halo.
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

      {/* Composer Form */}
      <form onSubmit={handlePublish} className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm space-y-4">
        <h2 className="text-lg font-bold text-slate-900">Broadcast New Announcement</h2>

        <div className="space-y-1.5">
          <label htmlFor="ann-title" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
            Headline / Title *
          </label>
          <input
            id="ann-title"
            type="text"
            required
            placeholder="e.g. System Maintenance Notice or Welcome to Halo Marketplace"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-halo-primary min-h-[44px]"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="ann-message" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
            Announcement Message Content *
          </label>
          <textarea
            id="ann-message"
            rows={3}
            required
            placeholder="Write the full announcement text..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-halo-primary"
          />
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-3 bg-halo-primary text-white font-bold rounded-xl text-xs hover:bg-halo-primary-light transition shadow disabled:opacity-50 min-h-[44px]"
          >
            {isSubmitting ? 'Publishing...' : 'Broadcast Announcement'}
          </button>
        </div>
      </form>

      {/* Announcements List */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
        <h2 className="text-lg font-bold text-slate-900">Live Announcements ({announcements.length})</h2>

        <div className="divide-y divide-slate-100">
          {announcements.map((a) => (
            <div key={a.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-900 text-sm">{a.title}</h3>
                  <span
                    className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                      a.active
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}
                  >
                    {a.active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <p className="text-xs text-slate-600">{a.message}</p>
                <p className="text-[11px] text-slate-400">
                  Posted {formatDate(a.createdAt?.slice(0, 10))}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleToggle(a.id)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-50 transition min-h-[44px]"
                >
                  {a.active ? 'Pause' : 'Activate'}
                </button>
                <button
                  onClick={() => handleDelete(a.id)}
                  className="px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-xl transition min-h-[44px]"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
