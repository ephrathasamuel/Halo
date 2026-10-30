'use client';

import { useState } from 'react';
import { useStorageSync } from '@/hooks/useStorageSync';
import { STORAGE_KEYS } from '@/lib/storage/keys';
import { setBookingsPaused } from '@/lib/client/domain';
import { Notice, Panel, btn } from '@/components/dashboard/DashboardUI';

/**
 * Global admin: stop or restart new bookings, quote requests and purchases
 * across Halo (holidays, maintenance, an incident). Bookings already made carry on.
 */
export function BookingsSwitch() {
  const { data: settings } = useStorageSync(STORAGE_KEYS.SETTINGS, []);
  const current = settings.find((s) => s.id === 'platform') || {};
  const paused = Boolean(current.bookingsPaused);
  const [message, setMessage] = useState(null);
  const [notice, setNotice] = useState(null);
  const [pending, setPending] = useState(false);
  const text = message ?? current.pauseMessage ?? '';

  async function save(nextPaused) {
    setPending(true);
    const res = await setBookingsPaused({ paused: nextPaused, message: text });
    setPending(false);
    setNotice(
      res.ok
        ? { tone: 'success', text: nextPaused ? 'New bookings are paused. Customers see your message.' : 'Halo is taking bookings again.' }
        : { tone: 'error', text: res.error || 'Could not save.' }
    );
  }

  return (
    <Panel
      title="Taking bookings"
      description={
        paused
          ? 'Paused: customers can browse, but new bookings, quote requests and purchases are refused. Bookings already made carry on.'
          : 'Open: customers can book, request quotes and buy.'
      }
      className={paused ? 'border-amber-300' : ''}
    >
      {notice && (
        <div className="mb-4">
          <Notice tone={notice.tone} onDismiss={() => setNotice(null)}>
            {notice.text}
          </Notice>
        </div>
      )}
      <label htmlFor="pause-message" className="block text-sm font-medium text-halo-ink mb-1.5">
        Message for customers while paused (optional)
      </label>
      <textarea
        id="pause-message"
        rows={2}
        maxLength={300}
        value={text}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Halo is not taking new bookings right now. Please check back soon."
        className="w-full px-3.5 py-2.5 rounded-xl border border-halo-border-strong bg-halo-surface text-[15px] text-halo-ink focus:border-halo-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-gold"
      />
      <div className="mt-4 flex flex-wrap gap-3">
        {paused ? (
          <>
            <button type="button" disabled={pending} onClick={() => save(false)} className={btn.primary}>
              Start taking bookings
            </button>
            <button type="button" disabled={pending} onClick={() => save(true)} className={btn.secondary}>
              Save message
            </button>
          </>
        ) : (
          <button type="button" disabled={pending} onClick={() => save(true)} className={btn.primary}>
            Pause new bookings
          </button>
        )}
      </div>
    </Panel>
  );
}
