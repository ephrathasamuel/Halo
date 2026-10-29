'use client';

import { Store } from 'lucide-react';
import { useMyStorefront } from '@/hooks/useMyStorefront';
import { Select } from '@/components/ui/Select';

/** Shown on the provider dashboard only when the account runs more than one storefront. */
export function StorefrontSwitcher() {
  const { provider, storefronts, choose } = useMyStorefront();
  if (storefronts.length < 2 || !provider) return null;
  return (
    <div className="mb-6 flex flex-wrap items-center gap-3 rounded-2xl border border-halo-border bg-white px-4 py-3">
      <span className="text-sm text-halo-text-muted">Managing</span>
      <Select
        label="Storefront"
        hideLabel
        icon={Store}
        value={provider.id}
        onChange={choose}
        options={storefronts.map((p) => ({ value: p.id, label: p.name }))}
        buttonClassName="min-h-[40px] px-3 rounded-xl border border-halo-border-strong bg-halo-surface text-sm font-semibold hover:border-halo-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-gold"
      />
      <span className="text-xs text-halo-text-muted">{storefronts.length} storefronts on this account</span>
    </div>
  );
}
