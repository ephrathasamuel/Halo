'use client';

import { useState } from 'react';
import { useStorageSync } from '@/hooks/useStorageSync';
import { STORAGE_KEYS } from '@/lib/storage/keys';
import { formatDate } from '@/lib/format';
import { ShieldAlert } from 'lucide-react';
import { useAdminScope } from '@/hooks/useAdminScope';
import { EmptyState } from '@/components/states/EmptyState';
import { deleteAnnouncement, publishAnnouncement, toggleAnnouncement } from '@/lib/client/domain';

function AnnouncementsManager() {
  const { data: announcements, refresh } = useStorageSync(STORAGE_KEYS.ANNOUNCEMENTS, []);

  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [feedback, setFeedback] = useState({ type: '', text: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePublish = async (e) => {
    e.preventDefault();
    setFeedback({ type: '', text: '' });
    setIsSubmitting(true);

    const res = await publishAnnouncement({ title, message });
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

  const handleToggle = async (id) => {
    setFeedback({ type: '', text: '' });
    const res = await toggleAnnouncement(id);
    if (!res.ok) {
      setFeedback({ type: 'error', text: res.error || 'Failed to update announcement' });
      return;
    }
    refresh();
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return;
    await deleteAnnouncement(id);
    refresh();
  };

  return (
    <div className="max-w-4xl space-y-8">
      {/* Header */}
      <div className="pb-4 border-b border-halo-border">
        <h1 className="text-2xl font-semibold text-halo-ink">Platform Announcements</h1>
        <p className="text-xs text-halo-text-muted mt-1">
          Broadcast marketplace news, service updates, and holiday hours across Halo.
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

      {/* Composer Form */}
      <form onSubmit={handlePublish} className="bg-white rounded-2xl border border-halo-border p-6 md:p-8 space-y-4">
        <h2 className="text-lg font-semibold text-halo-ink">Broadcast New Announcement</h2>

        <div className="space-y-1.5">
          <label htmlFor="ann-title" className="block text-xs font-semibold text-stone-700">
            Headline / Title *
          </label>
          <input
            id="ann-title"
            type="text"
            required
            placeholder="e.g. System Maintenance Notice or Welcome to Halo Marketplace"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-halo-border text-sm focus:outline-none focus:ring-2 focus:ring-halo-primary min-h-[44px]"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="ann-message" className="block text-xs font-semibold text-stone-700">
            Announcement Message Content *
          </label>
          <textarea
            id="ann-message"
            rows={3}
            required
            placeholder="Write the full announcement text..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-halo-border text-sm focus:outline-none focus:ring-2 focus:ring-halo-primary"
          />
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-3 bg-halo-ink text-white font-semibold rounded-xl text-xs hover:bg-halo-ink-soft transition disabled:opacity-50 min-h-[44px]"
          >
            {isSubmitting ? 'Publishing...' : 'Broadcast Announcement'}
          </button>
        </div>
      </form>

      {/* Announcements List */}
      <div className="bg-white rounded-2xl border border-halo-border p-6 space-y-4">
        <h2 className="text-lg font-semibold text-halo-ink">Live Announcements ({announcements.length})</h2>

        <div className="divide-y divide-halo-border">
          {announcements.map((a) => (
            <div key={a.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-halo-ink text-sm">{a.title}</h3>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                      a.active
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-stone-100 text-stone-600 border-halo-border'
                    }`}
                  >
                    {a.active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <p className="text-xs text-stone-600">{a.message}</p>
                <p className="text-[11px] text-halo-text-muted">
                  Posted {formatDate(a.createdAt?.slice(0, 10))}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleToggle(a.id)}
                  className="px-3 py-1.5 text-xs font-semibold text-stone-700 border border-halo-border rounded-xl hover:bg-stone-50 transition min-h-[44px]"
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

/** Site-wide announcements are managed by global admins only. */
export default function AdminAnnouncementsPage() {
  const { isGlobal } = useAdminScope();
  if (!isGlobal) {
    return (
      <EmptyState
        icon={ShieldAlert}
        title="Only global admins post announcements"
        message="Announcements appear for every visitor in every country, so a global admin manages them."
      />
    );
  }
  return <AnnouncementsManager />;
}
