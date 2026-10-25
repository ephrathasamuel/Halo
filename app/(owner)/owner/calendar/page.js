'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSession } from '@/hooks/useSession';
import { useStorageSync } from '@/hooks/useStorageSync';
import { STORAGE_KEYS } from '@/lib/storage/keys';
import { formatDate, formatTime } from '@/lib/format';

export default function OwnerCalendarPage() {
  const { session } = useSession();
  const { data: bookings } = useStorageSync(STORAGE_KEYS.BOOKINGS, []);
  const { data: listings } = useStorageSync(STORAGE_KEYS.LISTINGS, []);
  const { data: users } = useStorageSync(STORAGE_KEYS.USERS, []);

  const today = new Date().toISOString().slice(0, 10);
  const [selectedDate, setSelectedDate] = useState(today);

  const myListings = listings.filter((l) => l.ownerId === session?.userId);
  const myBookings = bookings.filter((b) => b.ownerId === session?.userId);
  const userMap = new Map(users.map((u) => [u.id, u]));

  // All blocked dates across all studio listings of this owner
  const allBlockedDates = new Set();
  myListings.forEach((l) => {
    (l.blockedDates || []).forEach((d) => allBlockedDates.add(d));
  });

  // Confirmed, in_progress, and requested bookings
  const scheduleBookings = myBookings.filter(
    (b) => ['confirmed', 'in_progress', 'requested'].includes(b.status)
  );

  // Bookings for selected date
  const dayBookings = scheduleBookings.filter((b) => b.date === selectedDate);
  dayBookings.sort((a, b) => a.startTime.localeCompare(b.startTime));

  // Build a 14-day horizon strip
  const horizonDays = [];
  for (let i = -2; i < 12; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().slice(0, 10);
    const hasBookings = scheduleBookings.some((b) => b.date === dateStr);
    const isBlocked = allBlockedDates.has(dateStr);
    horizonDays.push({
      dateStr,
      dayNum: d.getDate(),
      dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
      monthName: d.toLocaleDateString('en-US', { month: 'short' }),
      hasBookings,
      isBlocked,
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Studio & Gear Schedule</h1>
          <p className="text-xs text-slate-500 mt-1">
            Visual calendar with turnover buffers, rental timelines, and blackout dates.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-white min-h-[44px]"
          />
          <button
            onClick={() => setSelectedDate(today)}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition min-h-[44px]"
          >
            Today
          </button>
        </div>
      </div>

      {/* 14-Day Horizon Carousel */}
      <div className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Upcoming 14-Day Horizon</p>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {horizonDays.map((day) => {
            const isSelected = day.dateStr === selectedDate;
            const isToday = day.dateStr === today;
            return (
              <button
                key={day.dateStr}
                onClick={() => setSelectedDate(day.dateStr)}
                className={`flex-shrink-0 w-20 p-3 rounded-2xl border text-center transition min-h-[44px] ${
                  isSelected
                    ? 'border-halo-primary bg-halo-primary text-white shadow-md'
                    : 'border-slate-200 bg-white hover:border-slate-300 text-slate-800'
                }`}
              >
                <p className={`text-[11px] uppercase font-bold ${isSelected ? 'text-white/80' : 'text-slate-400'}`}>
                  {day.dayName}
                </p>
                <p className="text-xl font-black my-0.5">{day.dayNum}</p>
                <p className={`text-[10px] ${isSelected ? 'text-white/80' : 'text-slate-400'}`}>
                  {day.monthName}
                </p>

                {/* Status Dot */}
                <div className="flex justify-center gap-1 mt-1.5">
                  {day.hasBookings && (
                    <span
                      className={`w-2 h-2 rounded-full ${isSelected ? 'bg-amber-300' : 'bg-emerald-500'}`}
                      title="Has bookings"
                    />
                  )}
                  {day.isBlocked && (
                    <span
                      className={`w-2 h-2 rounded-full ${isSelected ? 'bg-red-300' : 'bg-rose-500'}`}
                      title="Blackout date"
                    />
                  )}
                  {isToday && !day.hasBookings && !day.isBlocked && (
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Day Schedule View */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Schedule for {formatDate(selectedDate)}
            </h2>
            <p className="text-xs text-slate-500">
              {dayBookings.length} session{dayBookings.length !== 1 ? 's' : ''} scheduled
            </p>
          </div>

          {allBlockedDates.has(selectedDate) && (
            <span className="px-3 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold uppercase tracking-wider">
              ⚠️ Blackout / Maintenance Date
            </span>
          )}
        </div>

        {dayBookings.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-sm space-y-2">
            <span className="text-4xl block">✨</span>
            <p className="font-semibold text-slate-700">No sessions scheduled for this date</p>
            <p className="text-xs">The studio room and gear are fully open and available.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {dayBookings.map((b) => {
              const renter = userMap.get(b.renterId);
              return (
                <div
                  key={b.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5 space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <span className="px-3 py-1 bg-halo-primary text-white text-xs font-bold rounded-lg font-mono">
                        {formatTime(b.startTime)} — {formatTime(b.endTime)}
                      </span>
                      <span className="text-xs font-bold text-slate-800">
                        {renter?.name || 'Renter'} ({renter?.phone || 'No phone'})
                      </span>
                    </div>

                    <span
                      className={`text-[11px] font-bold uppercase px-2.5 py-0.5 rounded-full border ${
                        b.status === 'confirmed'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : b.status === 'in_progress'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      {b.status.replace('_', ' ')}
                    </span>
                  </div>

                  {/* Visual Buffer Window Bar */}
                  <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs space-y-2">
                    <div className="flex items-center justify-between text-slate-500 text-[11px]">
                      <span>Turnover Buffer Interval:</span>
                      <span className="font-mono text-slate-700">
                        [start - buffer, end + buffer]
                      </span>
                    </div>
                    <div className="h-6 w-full bg-slate-100 rounded-lg flex overflow-hidden text-[10px] font-bold text-center">
                      <div className="w-1/6 bg-amber-200 text-amber-900 flex items-center justify-center">
                        Cleanup Pre
                      </div>
                      <div className="w-4/6 bg-halo-primary text-white flex items-center justify-center">
                        Shoot Session ({b.hours}h)
                      </div>
                      <div className="w-1/6 bg-amber-200 text-amber-900 flex items-center justify-center">
                        Buffer Post
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                    <div>
                      {b.items.map((i, idx) => (
                        <span key={idx} className="mr-3">
                          • {i.qty}x {i.type}
                        </span>
                      ))}
                    </div>
                    <Link
                      href="/owner/bookings"
                      className="font-bold text-halo-primary hover:underline"
                    >
                      Manage in pipeline →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
