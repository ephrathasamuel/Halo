'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Lock, ShoppingBag } from 'lucide-react';
import { useSession } from '@/hooks/useSession';
import { useStorageSync } from '@/hooks/useStorageSync';
import { STORAGE_KEYS } from '@/lib/storage/keys';
import { formatMoney, relativeTime } from '@/lib/format';
import { EmptyState } from '@/components/states/EmptyState';
import { Notice, PageHeader, StatusBadge, btn } from '@/components/dashboard/DashboardUI';
import { updatePurchaseRequest } from '@/lib/client/domain';

const NEXT_STEP = {
  requested: 'Waiting for the seller to reply.',
  accepted: 'Accepted. The seller will contact you about payment and pickup.',
  completed: 'Bought.',
  declined: 'The seller declined this request.',
  cancelled: 'You cancelled this request.',
};

export default function PurchasesPage() {
  const { session, isSignedIn, isLoaded } = useSession();
  const { data: purchases, refresh } = useStorageSync(STORAGE_KEYS.PURCHASES, []);
  const { data: providers } = useStorageSync(STORAGE_KEYS.PROVIDERS, []);
  const [notice, setNotice] = useState(null);

  if (!isLoaded) return <div className="min-h-[50vh]" aria-busy="true" />;
  if (!isSignedIn) {
    return (
      <EmptyState icon={Lock} title="Sign in to see your purchases" message="Items you asked to buy appear here.">
        <Link href="/signin?next=/purchases" className={btn.primary}>
          Sign in
        </Link>
      </EmptyState>
    );
  }

  const providerMap = new Map(providers.map((p) => [p.id, p]));
  const mine = purchases
    .filter((p) => p.buyerId === session.userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const cancel = async (p) => {
    const res = await updatePurchaseRequest(p.id, 'cancelled');
    setNotice(res.ok ? { tone: 'success', text: 'Request cancelled.' } : { tone: 'error', text: res.error });
    refresh();
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Purchases" description="Items you asked to buy." />

      {notice && (
        <Notice tone={notice.tone} onDismiss={() => setNotice(null)}>
          {notice.text}
        </Notice>
      )}

      {mine.length === 0 ? (
        <EmptyState icon={ShoppingBag} title="No purchases yet" message="Studios and rental houses sell used and new gear here too.">
          <Link href="/browse?type=sale" className={btn.primary}>
            See gear for sale
          </Link>
        </EmptyState>
      ) : (
        <ul className="space-y-3">
          {mine.map((p) => {
            const seller = providerMap.get(p.providerId);
            return (
              <li key={p.id} className="rounded-2xl border border-halo-border bg-halo-surface p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link href={`/listings/${p.listingId}`} className="font-semibold text-halo-ink hover:underline min-h-0">
                        {p.title}
                      </Link>
                      <StatusBadge status={p.status} label={p.status === 'completed' ? 'Bought' : undefined} />
                    </div>
                    <p className="mt-0.5 text-sm text-halo-text-muted">
                      From {seller?.name || 'the seller'}, {p.quantity} x {formatMoney(p.unitPrice, p.currency)}, {relativeTime(p.createdAt)}
                    </p>
                    <p className="mt-2 text-[15px] text-halo-ink">{NEXT_STEP[p.status]}</p>
                  </div>
                  <p className="shrink-0 font-semibold text-halo-ink tabular">{formatMoney(p.total, p.currency)}</p>
                </div>
                {['requested', 'accepted'].includes(p.status) && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {seller?.contact?.phone && (
                      <a href={`tel:${seller.contact.phone}`} className={btn.secondary}>
                        Call seller
                      </a>
                    )}
                    <button onClick={() => cancel(p)} className={btn.danger}>
                      Cancel request
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
