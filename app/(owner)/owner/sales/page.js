'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MessageCircle, Phone, Plus, ShoppingBag } from 'lucide-react';
import { useSession } from '@/hooks/useSession';
import { useStorageSync } from '@/hooks/useStorageSync';
import { STORAGE_KEYS } from '@/lib/storage/keys';
import { formatMoney, relativeTime } from '@/lib/format';
import { updatePurchaseRequest } from '@/lib/domain/sales';
import { EmptyState } from '@/components/states/EmptyState';
import { Notice, PageHeader, StatusBadge, btn } from '@/components/dashboard/DashboardUI';

const OPEN = ['requested', 'accepted'];

export default function OwnerSalesPage() {
  const { session } = useSession();
  const { data: purchases, refresh } = useStorageSync(STORAGE_KEYS.PURCHASES, []);
  const { data: listings } = useStorageSync(STORAGE_KEYS.LISTINGS, []);
  const [notice, setNotice] = useState(null);

  const mine = purchases
    .filter((p) => p.ownerId === session?.userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const open = mine.filter((p) => OPEN.includes(p.status));
  const closed = mine.filter((p) => !OPEN.includes(p.status));
  const forSale = listings.filter((l) => l.ownerId === session?.userId && l.type === 'sale');

  const act = (request, target, text) => {
    const res = updatePurchaseRequest(request.id, target);
    setNotice(res.ok ? { tone: 'success', text } : { tone: 'error', text: res.error });
    refresh();
  };

  const Row = ({ p }) => {
    const whatsapp = p.buyerPhone?.replace(/[^0-9]/g, '');
    return (
      <li className="rounded-2xl border border-halo-border bg-halo-surface p-5">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-semibold text-halo-ink">{p.title}</h2>
              <StatusBadge status={p.status} label={p.status === 'completed' ? 'Sold' : undefined} />
            </div>
            <p className="mt-0.5 text-sm text-halo-text-muted">
              {p.buyerName}, {p.quantity} x {formatMoney(p.unitPrice, p.currency)}, {relativeTime(p.createdAt)}
            </p>
            {p.message && <p className="mt-2 rounded-xl bg-halo-ink/[0.04] px-3 py-2 text-[15px] text-halo-ink">{p.message}</p>}
          </div>
          <p className="shrink-0 text-lg font-semibold text-halo-ink tabular">{formatMoney(p.total, p.currency)}</p>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {p.buyerPhone && (
            <a href={`tel:${p.buyerPhone}`} className={btn.secondary}>
              <Phone className="h-4 w-4" aria-hidden="true" />
              Call
            </a>
          )}
          {whatsapp && (
            <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer" className={btn.secondary}>
              <MessageCircle className="h-4 w-4" aria-hidden="true" />
              WhatsApp
            </a>
          )}
          {p.status === 'requested' && (
            <>
              <button onClick={() => act(p, 'declined', 'Request declined.')} className={btn.secondary}>
                Decline
              </button>
              <button onClick={() => act(p, 'accepted', `Accepted. Arrange payment and pickup with ${p.buyerName}.`)} className={btn.primary}>
                Accept
              </button>
            </>
          )}
          {p.status === 'accepted' && (
            <button onClick={() => act(p, 'completed', 'Marked as sold. Stock updated.')} className={btn.primary}>
              Mark as sold
            </button>
          )}
        </div>
      </li>
    );
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Sales"
        description="Requests from people who want to buy your items. Accept, agree payment and pickup, then mark it sold."
        actions={
          <Link href="/owner/listings/new" className={btn.primary}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Sell an item
          </Link>
        }
      />

      {notice && (
        <Notice tone={notice.tone} onDismiss={() => setNotice(null)}>
          {notice.text}
        </Notice>
      )}

      {mine.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title={forSale.length ? 'No purchase requests yet' : 'Nothing for sale yet'}
          message={
            forSale.length
              ? `You have ${forSale.length} ${forSale.length === 1 ? 'item' : 'items'} for sale. Requests from buyers appear here.`
              : 'List gear or props you want to sell. Buyers send requests that you accept or decline.'
          }
        />
      ) : (
        <>
          <section aria-labelledby="open-heading">
            <h2 id="open-heading" className="text-lg font-semibold text-halo-ink">
              Open <span className="font-normal text-halo-text-muted tabular">{open.length}</span>
            </h2>
            {open.length === 0 ? (
              <p className="mt-2 text-halo-text-muted">Nothing waiting for you.</p>
            ) : (
              <ul className="mt-3 space-y-3">
                {open.map((p) => (
                  <Row key={p.id} p={p} />
                ))}
              </ul>
            )}
          </section>
          {closed.length > 0 && (
            <section aria-labelledby="closed-heading">
              <h2 id="closed-heading" className="text-lg font-semibold text-halo-ink">History</h2>
              <ul className="mt-3 space-y-3">
                {closed.map((p) => (
                  <Row key={p.id} p={p} />
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}
