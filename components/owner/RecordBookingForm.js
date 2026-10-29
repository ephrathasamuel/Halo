'use client';

import { useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { createOwnerBooking } from '@/lib/domain/bookings';
import { checkEquipmentAvailability, checkStudioAvailability, minutesToTime, timeToMinutes } from '@/lib/rules/availability';
import { PhoneInput } from '@/components/ui/PhoneInput';
import { Select } from '@/components/ui/Select';
import { btn } from '@/components/dashboard/DashboardUI';

const inputClass =
  'w-full px-3.5 min-h-[44px] rounded-xl border border-halo-border-strong bg-halo-surface text-[15px] text-halo-ink focus:border-halo-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-gold';
const selectButton =
  'min-h-[44px] px-3.5 rounded-xl border border-halo-border-strong bg-halo-surface text-[15px] hover:border-halo-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-gold';

const HOURS = ['07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'];

/**
 * Record a booking taken outside Halo (walk-in, phone call). It blocks the slot
 * like any online booking, so it can never double-book.
 * @param {{ listings: object[], provider: object, onDone: (booking: object) => void, onCancel: () => void }} props
 */
export function RecordBookingForm({ listings, provider, onDone, onCancel }) {
  const bookable = listings.filter((l) => ['studio', 'equipment'].includes(l.type) && l.status === 'approved');
  const tomorrow = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  }, []);

  const [form, setForm] = useState({
    listingId: bookable[0]?.id || '',
    date: tomorrow,
    startTime: '10:00',
    hours: 2,
    qty: 1,
    customerName: '',
    customerPhone: '',
    note: '',
    paid: false,
  });
  const [error, setError] = useState('');
  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));
  const listing = bookable.find((l) => l.id === form.listingId);

  // Live check, same rules as online bookings
  const endTime = minutesToTime(timeToMinutes(form.startTime) + Number(form.hours) * 60);
  const availability = !listing
    ? null
    : listing.type === 'studio'
      ? checkStudioAvailability({ listing, provider, date: form.date, startTime: form.startTime, endTime, hours: Number(form.hours) })
      : checkEquipmentAvailability({ listing, date: form.date, startTime: form.startTime, endTime, requestedQty: Number(form.qty) });

  if (bookable.length === 0) {
    return (
      <p className="text-halo-text-muted">
        You need an available space or piece of equipment first. Add one under Listings.
      </p>
    );
  }

  const submit = (e) => {
    e.preventDefault();
    setError('');
    const res = createOwnerBooking({ ...form, hours: Number(form.hours), qty: Number(form.qty) });
    if (!res.ok) {
      setError(res.error);
      return;
    }
    onDone(res.data);
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <Select
          label="What are they booking?"
          value={form.listingId}
          onChange={set('listingId')}
          options={bookable.map((l) => ({ value: l.id, label: l.title }))}
          buttonClassName={selectButton}
        />
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-3 sm:col-span-1">
            <label htmlFor="rb-date" className="block text-xs font-medium text-halo-text-muted mb-1">Date</label>
            <input id="rb-date" type="date" value={form.date} onChange={(e) => set('date')(e.target.value)} className={inputClass} />
          </div>
          <Select label="Start" value={form.startTime} onChange={set('startTime')} options={HOURS.map((h) => ({ value: h, label: h }))} buttonClassName={selectButton} />
          <div>
            <label htmlFor="rb-hours" className="block text-xs font-medium text-halo-text-muted mb-1">Hours</label>
            <input id="rb-hours" type="number" min="1" max="16" value={form.hours} onChange={(e) => set('hours')(e.target.value)} className={inputClass} />
          </div>
        </div>
      </div>

      {listing?.type === 'equipment' && (
        <div className="max-w-[160px]">
          <label htmlFor="rb-qty" className="block text-xs font-medium text-halo-text-muted mb-1">Quantity (of {listing.quantity})</label>
          <input id="rb-qty" type="number" min="1" max={listing.quantity} value={form.qty} onChange={(e) => set('qty')(e.target.value)} className={inputClass} />
        </div>
      )}

      {availability && (
        <p className={`flex items-center gap-2 text-sm ${availability.available ? 'text-halo-success' : 'text-halo-error'}`}>
          {availability.available ? <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> : <AlertCircle className="h-4 w-4" aria-hidden="true" />}
          {availability.available ? 'Free at that time' : availability.reason}
        </p>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="rb-name" className="block text-xs font-medium text-halo-text-muted mb-1">Customer name</label>
          <input id="rb-name" type="text" required value={form.customerName} onChange={(e) => set('customerName')(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label htmlFor="rb-phone" className="block text-xs font-medium text-halo-text-muted mb-1">Customer phone (optional)</label>
          <PhoneInput id="rb-phone" value={form.customerPhone} onChange={set('customerPhone')} defaultCountry={provider?.country || 'ET'} inputClassName={inputClass} />
        </div>
      </div>
      <div>
        <label htmlFor="rb-note" className="block text-xs font-medium text-halo-text-muted mb-1">Note (optional)</label>
        <input id="rb-note" type="text" value={form.note} onChange={(e) => set('note')(e.target.value)} placeholder="e.g. Booked by phone, bringing own lights" className={inputClass} />
      </div>
      <label className="flex items-center gap-3 min-h-[44px] cursor-pointer">
        <input type="checkbox" checked={form.paid} onChange={(e) => set('paid')(e.target.checked)} className="h-5 w-5 min-h-0 min-w-0 shrink-0 accent-[var(--halo-ink)]" />
        <span className="text-[15px] text-halo-ink">Already paid</span>
      </label>

      {error && (
        <p className="flex items-center gap-2 text-sm text-halo-error" role="alert">
          <AlertCircle className="h-4 w-4" aria-hidden="true" />
          {error}
        </p>
      )}

      <div className="flex gap-2">
        <button type="submit" disabled={availability && !availability.available} className={btn.primary}>
          Save booking
        </button>
        <button type="button" onClick={onCancel} className={btn.secondary}>
          Cancel
        </button>
      </div>
    </form>
  );
}
