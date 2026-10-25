'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, MessageCircle, Phone } from 'lucide-react';
import { formatPrice } from '@/lib/format';
import { providerLocation } from '@/lib/geo';
import { createPurchaseRequest } from '@/lib/domain/sales';
import { useSession } from '@/hooks/useSession';
import { Notice } from '@/components/dashboard/DashboardUI';

/**
 * Side panel for an item for sale: price, a purchase request, and direct contact.
 * @param {{ listing: object, provider: object }} props
 */
export function PurchasePanel({ listing, provider }) {
  const router = useRouter();
  const { isSignedIn } = useSession();
  const { currency } = providerLocation(provider);
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const whatsapp = provider.contact?.whatsapp?.replace(/[^0-9]/g, '');

  const send = () => {
    setError('');
    if (!isSignedIn) {
      router.push(`/signin?next=${encodeURIComponent(`/listings/${listing.id}`)}`);
      return;
    }
    const res = createPurchaseRequest({ listingId: listing.id, quantity, message });
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setSent(true);
  };

  return (
    <div className="rounded-2xl border border-halo-border bg-halo-surface p-6 shadow-[0_8px_30px_rgba(22,24,29,0.08)] space-y-5">
      <div>
        <p className="text-3xl font-semibold text-halo-ink tabular">{formatPrice(listing.salePrice || 0, currency)}</p>
        <p className="mt-0.5 text-sm text-halo-text-muted">
          {[listing.condition, listing.negotiable ? 'price negotiable' : 'fixed price', `${listing.quantity} available`]
            .filter(Boolean)
            .join(', ')}
        </p>
      </div>

      {sent ? (
        <div className="space-y-3">
          <p className="flex items-start gap-2 text-halo-success">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
            Request sent. {provider.name} will reply to arrange payment and pickup.
          </p>
          <Link href="/purchases" className="text-sm font-semibold text-halo-ink underline underline-offset-2">
            See my purchase requests
          </Link>
        </div>
      ) : (
        <>
          {listing.quantity > 1 && (
            <div>
              <label htmlFor="buy-qty" className="block text-sm font-medium text-halo-ink mb-1">
                Quantity
              </label>
              <input
                id="buy-qty"
                type="number"
                min="1"
                max={listing.quantity}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Math.min(listing.quantity, Number(e.target.value))))}
                className="w-24 px-3 min-h-[44px] rounded-xl border border-halo-border-strong bg-halo-surface text-halo-ink"
              />
            </div>
          )}
          <div>
            <label htmlFor="buy-msg" className="block text-sm font-medium text-halo-ink mb-1">
              Message <span className="font-normal text-halo-text-muted">(optional)</span>
            </label>
            <textarea
              id="buy-msg"
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={listing.negotiable ? 'Make an offer or ask a question' : 'Ask a question or suggest a pickup time'}
              className="w-full px-3 py-2 rounded-xl border border-halo-border-strong bg-halo-surface text-[15px] text-halo-ink"
            />
          </div>
          {error && <Notice tone="error">{error}</Notice>}
          <button
            type="button"
            onClick={send}
            className="w-full rounded-xl bg-halo-ink py-3.5 text-[15px] font-semibold text-white hover:bg-halo-ink-soft min-h-[48px]"
          >
            {isSignedIn ? 'Send purchase request' : 'Sign in to buy'}
          </button>
        </>
      )}

      <div className="flex gap-2 border-t border-halo-border pt-4">
        {provider.contact?.phone && (
          <a href={`tel:${provider.contact.phone}`} className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-halo-border-strong text-sm font-semibold text-halo-ink hover:border-halo-ink">
            <Phone className="h-4 w-4" aria-hidden="true" />
            Call
          </a>
        )}
        {whatsapp && (
          <a
            href={`https://wa.me/${whatsapp}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-halo-border-strong text-sm font-semibold text-halo-ink hover:border-halo-ink"
          >
            <MessageCircle className="h-4 w-4" aria-hidden="true" />
            WhatsApp
          </a>
        )}
      </div>
      <p className="text-[13px] text-center text-halo-text-muted">Payment and pickup are agreed directly with the seller.</p>
    </div>
  );
}
