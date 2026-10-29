'use client';

import { X } from 'lucide-react';

import { use, useState, useEffect } from 'react';
import { useSession } from '@/hooks/useSession';
import { useStorageSync } from '@/hooks/useStorageSync';
import { STORAGE_KEYS } from '@/lib/storage/keys';
import { formatDate } from '@/lib/format';
import { BackButton } from '@/components/ui/BackButton';
import { updateListingAvailability } from '@/lib/client/domain';

export default function StudioAvailabilityPage({ params }) {
  const resolvedParams = use(params);
  const { id } = resolvedParams;
  const { session } = useSession();
  const { data: listings, refresh } = useStorageSync(STORAGE_KEYS.LISTINGS, []);

  const listing = listings.find((l) => l.id === id);

  const [bufferMinutes, setBufferMinutes] = useState(30);
  const [blockedDates, setBlockedDates] = useState([]);
  const [newDateInput, setNewDateInput] = useState('');
  const [feedback, setFeedback] = useState({ type: '', text: '' });

  useEffect(() => {
    if (listing) {
      setBufferMinutes(listing.bufferMinutes ?? 30);
      setBlockedDates(listing.blockedDates || []);
    }
  }, [listing]);

  if (!listing) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center space-y-4">
        <h2 className="text-xl font-semibold text-halo-ink">Listing Not Found</h2>
        <BackButton fallback="/owner/listings" />
      </div>
    );
  }

  // Ownership Guard
  const isAdmin = session?.roles?.includes('admin');
  if (listing.ownerId !== session?.userId && !isAdmin) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center space-y-4">
        <div className="p-6 bg-red-50 border border-red-200 rounded-2xl max-w-md mx-auto">
          <h2 className="text-lg font-semibold text-red-700">Access Denied</h2>
          <p className="text-xs text-red-600 mt-1">
            Not yours: You cannot manage availability for another owner listing.
          </p>
        </div>
      </div>
    );
  }

  if (listing.type !== 'studio') {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center space-y-4">
        <p className="text-stone-600">Availability schedules only apply to studio room listings.</p>
        <BackButton fallback="/owner/listings" />
      </div>
    );
  }

  const handleAddBlockedDate = (e) => {
    e.preventDefault();
    if (!newDateInput) return;
    if (blockedDates.includes(newDateInput)) {
      setFeedback({ type: 'error', text: 'This date is already in the blocked list.' });
      return;
    }
    const updated = [...blockedDates, newDateInput].sort();
    setBlockedDates(updated);
    setNewDateInput('');
    saveAvailability(updated, bufferMinutes);
  };

  const handleRemoveBlockedDate = (dateToRemove) => {
    const updated = blockedDates.filter((d) => d !== dateToRemove);
    setBlockedDates(updated);
    saveAvailability(updated, bufferMinutes);
  };

  const handleBufferChange = (val) => {
    const num = Number(val);
    setBufferMinutes(num);
    saveAvailability(blockedDates, num);
  };

  const saveAvailability = async (dates, buffer) => {
    setFeedback({ type: '', text: '' });
    const res = await updateListingAvailability(listing.id, {
      blockedDates: dates,
      bufferMinutes: buffer,
    });
    if (!res.ok) {
      setFeedback({ type: 'error', text: res.error || 'Failed to update availability' });
      return;
    }
    setFeedback({ type: 'success', text: 'Availability settings updated!' });
    refresh();
  };

  return (
    <div className="max-w-3xl space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-halo-border">
        <div>
          <h1 className="text-2xl font-semibold text-halo-ink">Studio Availability & Schedule</h1>
          <p className="text-xs text-halo-text-muted mt-1">
            Configure cleanup buffers and blackout dates for &quot;{listing.title}&quot;
          </p>
        </div>

        <BackButton fallback="/owner/listings" />
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

      {/* Buffer Turnover Setting */}
      <div className="bg-white rounded-2xl border border-halo-border p-6 md:p-8 space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-halo-ink">Turnover & Buffer Window</h2>
          <p className="text-xs text-halo-text-muted mt-0.5">
            Buffer time prevents renters from booking back-to-back without cleanup time in between.
            Every confirmed shoot occupies <span className="font-mono font-semibold text-halo-ink">[start - buffer, end + buffer]</span>.
          </p>
        </div>

        <div className="max-w-xs space-y-1.5">
          <label htmlFor="buffer-select" className="block text-xs font-semibold text-stone-700">
            Cleanup Buffer
          </label>
          <select
            id="buffer-select"
            value={bufferMinutes}
            onChange={(e) => handleBufferChange(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-halo-border text-sm focus:outline-none focus:ring-2 focus:ring-halo-primary min-h-[44px]"
          >
            <option value="0">0 minutes (No buffer)</option>
            <option value="15">15 minutes turnover</option>
            <option value="30">30 minutes buffer (Recommended)</option>
            <option value="45">45 minutes turnover</option>
            <option value="60">60 minutes buffer (Deep reset)</option>
          </select>
        </div>
      </div>

      {/* Blocked Dates Section */}
      <div className="bg-white rounded-2xl border border-halo-border p-6 md:p-8 space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-halo-ink">Blackout / Blocked Dates</h2>
          <p className="text-xs text-halo-text-muted mt-0.5">
            Mark dates when this studio room is closed for maintenance, private production, or holidays.
          </p>
        </div>

        {/* Add date form */}
        <form onSubmit={handleAddBlockedDate} className="flex flex-col sm:flex-row items-center gap-3">
          <input
            type="date"
            required
            value={newDateInput}
            min={new Date().toISOString().slice(0, 10)}
            onChange={(e) => setNewDateInput(e.target.value)}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-halo-border text-sm focus:outline-none focus:ring-2 focus:ring-halo-primary min-h-[44px]"
          />
          <button
            type="submit"
            className="w-full sm:w-auto px-5 py-2.5 bg-stone-900 text-white rounded-xl text-xs font-semibold hover:bg-stone-800 transition min-h-[44px]"
          >
            + Block Date
          </button>
        </form>

        {/* Blocked dates list */}
        <div className="space-y-2 pt-2 border-t border-halo-border">
          <p className="text-xs font-semibold text-halo-text-muted">
            Currently Blocked Dates ({blockedDates.length})
          </p>

          {blockedDates.length === 0 ? (
            <p className="text-xs text-halo-text-muted py-3">No blackout dates currently scheduled.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {blockedDates.map((dateStr) => (
                <div
                  key={dateStr}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-stone-100 border border-halo-border text-xs font-medium text-halo-ink"
                >
                  <span>{formatDate(dateStr)} ({dateStr})</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveBlockedDate(dateStr)}
                    className="text-red-500 hover:text-red-700 min-h-[44px] min-w-[44px] flex items-center justify-center font-semibold"
                    aria-label={`Unblock ${dateStr}`}
                  >
                    <X className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
