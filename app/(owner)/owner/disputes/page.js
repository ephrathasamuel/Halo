'use client';

import { useSession } from '@/hooks/useSession';
import { useStorageSync } from '@/hooks/useStorageSync';
import { STORAGE_KEYS } from '@/lib/storage/keys';
import { formatDate } from '@/lib/format';
import { EmptyState } from '@/components/states/EmptyState';

export default function OwnerDisputesPage() {
  const { session } = useSession();
  const { data: disputes } = useStorageSync(STORAGE_KEYS.DISPUTES, []);
  const { data: bookings } = useStorageSync(STORAGE_KEYS.BOOKINGS, []);
  const { data: events } = useStorageSync(STORAGE_KEYS.EVENT_REQUESTS, []);
  const { data: users } = useStorageSync(STORAGE_KEYS.USERS, []);

  const myBookingIds = new Set(bookings.filter((b) => b.ownerId === session?.userId).map((b) => b.id));
  const myEventIds = new Set(events.filter((e) => e.ownerId === session?.userId).map((e) => e.id));
  const userMap = new Map(users.map((u) => [u.id, u]));

  const myDisputes = disputes.filter(
    (d) =>
      (d.targetType === 'booking' && myBookingIds.has(d.targetId)) ||
      (d.targetType === 'event' && myEventIds.has(d.targetId))
  );

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-halo-border">
        <h1 className="text-2xl font-semibold text-halo-ink">Disputes & Incident Reports</h1>
        <p className="text-xs text-halo-text-muted mt-1">
          Review open claims, client mediation inquiries, and administrator resolutions.
        </p>
      </div>

      {myDisputes.length === 0 ? (
        <EmptyState
          title="No disputes on file"
          message="Your rentals and event productions are running smoothly with zero open incident claims."
        />
      ) : (
        <div className="space-y-4">
          {myDisputes.map((d) => {
            const opener = userMap.get(d.openedBy);
            return (
              <div
                key={d.id}
                className="bg-white rounded-2xl border border-halo-border p-6 space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                        d.status === 'resolved'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}
                    >
                      {d.status}
                    </span>
                    <span className="font-semibold text-halo-ink text-sm">{d.reason}</span>
                    <span className="font-mono text-xs text-halo-text-muted">Target #{d.targetId.slice(0, 8)}</span>
                  </div>

                  <span className="text-xs text-halo-text-muted">
                    Opened {formatDate(d.createdAt?.slice(0, 10))} by {opener?.name || 'Client'}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-stone-50 border border-halo-border text-xs text-stone-700 leading-relaxed">
                  <span className="font-semibold text-halo-ink block mb-1">Issue Description:</span>
                  {d.description}
                </div>

                {d.resolutionNotes && (
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-1">
                    <span className="font-semibold block">Administrator Resolution:</span>
                    <p>{d.resolutionNotes}</p>
                    <p className="text-[10px] text-emerald-700 pt-1">
                      Resolved on {formatDate(d.resolvedAt?.slice(0, 10))}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
