'use client';

import { useState } from 'react';
import { ShieldAlert, UserPlus } from 'lucide-react';
import { STORAGE_KEYS } from '@/lib/storage/keys';
import { COUNTRIES, countryName, providerLocation } from '@/lib/geo';
import { createRegionalAdmin, moveRegionalAdmin, removeRegionalAdmin } from '@/lib/domain/users';
import { useStorageSync } from '@/hooks/useStorageSync';
import { useAdminScope } from '@/hooks/useAdminScope';
import { EmptyState } from '@/components/states/EmptyState';
import { Select } from '@/components/ui/Select';
import { Notice, PageHeader, Panel, btn } from '@/components/dashboard/DashboardUI';
import { UserAvatar } from '@/components/ui/ProviderLogo';

const COUNTRY_OPTIONS = COUNTRIES.map((c) => ({ value: c.code, label: c.name }));

const inputClass =
  'w-full px-3.5 rounded-xl border border-halo-border-strong bg-halo-surface text-[15px] text-halo-ink min-h-[44px] focus:border-halo-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-gold';
const selectButton =
  'min-h-[44px] px-3.5 rounded-xl border border-halo-border-strong bg-halo-surface text-[15px] hover:border-halo-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-gold';

/**
 * One regional admin, with the numbers for the country they look after.
 */
function AdminCard({ admin, stats, onMove, onRemove }) {
  const [confirming, setConfirming] = useState(false);
  return (
    <li className="rounded-2xl border border-halo-border bg-halo-surface p-5">
      <div className="flex items-start gap-3">
        <UserAvatar user={admin} size={44} />
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-halo-ink">{admin.name}</p>
          <p className="text-sm text-halo-text-muted truncate">{admin.email}</p>
          {admin.phone && <p className="text-sm text-halo-text-muted">{admin.phone}</p>}
        </div>
      </div>

      <dl className="mt-4 grid grid-cols-4 gap-2 text-center">
        {[
          ['Live', stats.live],
          ['Waiting', stats.pending],
          ['Customers', stats.customers],
          ['Disputes', stats.disputes],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl bg-halo-ink/[0.04] py-2">
            <dd className="text-lg font-semibold text-halo-ink tabular">{value}</dd>
            <dt className="text-xs text-halo-text-muted">{label}</dt>
          </div>
        ))}
      </dl>

      <div className="mt-4 flex items-end gap-2">
        <Select
          label="Country"
          value={admin.adminScope?.country}
          onChange={(c) => onMove(admin, c)}
          options={COUNTRY_OPTIONS}
          className="flex-1"
          buttonClassName={selectButton}
        />
        {confirming ? (
          <>
            <button onClick={() => setConfirming(false)} className={btn.secondary}>
              Keep
            </button>
            <button onClick={() => onRemove(admin)} className={btn.danger}>
              Remove
            </button>
          </>
        ) : (
          <button onClick={() => setConfirming(true)} className={btn.danger}>
            Remove
          </button>
        )}
      </div>
    </li>
  );
}

export default function RegionalAdminsPage() {
  const { isGlobal } = useAdminScope();
  const { data: users, refresh } = useStorageSync(STORAGE_KEYS.USERS, []);
  const { data: providers } = useStorageSync(STORAGE_KEYS.PROVIDERS, []);
  const { data: bookings } = useStorageSync(STORAGE_KEYS.BOOKINGS, []);
  const { data: disputes } = useStorageSync(STORAGE_KEYS.DISPUTES, []);

  const [form, setForm] = useState({ name: '', email: '', phone: '', country: 'ET' });
  const [notice, setNotice] = useState(null);

  if (!isGlobal) {
    return (
      <EmptyState
        icon={ShieldAlert}
        title="Only global admins manage regional admins"
        message="Ask a global admin if someone in your country needs admin access."
      />
    );
  }

  const providerCountry = new Map(providers.map((p) => [p.id, providerLocation(p).country]));
  const bookingCountry = new Map(bookings.map((b) => [b.id, providerCountry.get(b.providerId)]));
  const statsFor = (country) => ({
    live: providers.filter((p) => providerLocation(p).country === country && p.status === 'approved').length,
    pending: providers.filter((p) => providerLocation(p).country === country && p.status === 'pending').length,
    customers: users.filter((u) => (u.country || 'ET') === country && u.roles?.includes('renter')).length,
    disputes: disputes.filter((d) => d.status === 'open' && bookingCountry.get(d.targetId) === country).length,
  });

  const admins = users.filter((u) => u.roles?.includes('regional_admin'));
  const coveredCountries = new Set(admins.map((a) => a.adminScope?.country));
  // Countries with providers or customers but nobody looking after them
  const uncovered = COUNTRIES.filter((c) => {
    if (coveredCountries.has(c.code)) return false;
    const s = statsFor(c.code);
    return s.live || s.pending || s.customers;
  });

  const done = (res, success) => {
    if (!res.ok) {
      setNotice({ tone: 'error', text: res.error });
      return false;
    }
    setNotice({ tone: 'success', text: success });
    refresh();
    return true;
  };

  const handleCreate = (e) => {
    e.preventDefault();
    if (done(createRegionalAdmin(form), `${form.name.trim()} now looks after ${countryName(form.country)}.`)) {
      setForm({ name: '', email: '', phone: '', country: form.country });
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Regional admins"
        description="Each regional admin approves providers and listings, supports customers and resolves disputes in one country. Only global admins can add them; there is no public sign-up."
      />

      {notice && (
        <Notice tone={notice.tone} onDismiss={() => setNotice(null)}>
          {notice.text}
        </Notice>
      )}

      {uncovered.length > 0 && (
        <Notice tone="error">
          No regional admin yet for {uncovered.map((c) => c.name).join(', ')}. Storefronts there wait for a global admin
          to approve them.
        </Notice>
      )}

      <Panel title="Add a regional admin">
        <form onSubmit={handleCreate} className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 items-end">
          <div className="lg:col-span-1">
            <label htmlFor="ra-name" className="block text-xs font-medium text-halo-text-muted mb-1">Full name</label>
            <input id="ra-name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} />
          </div>
          <div className="lg:col-span-1">
            <label htmlFor="ra-email" className="block text-xs font-medium text-halo-text-muted mb-1">Email</label>
            <input id="ra-email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputClass} />
          </div>
          <div className="lg:col-span-1">
            <label htmlFor="ra-phone" className="block text-xs font-medium text-halo-text-muted mb-1">Phone (optional)</label>
            <input id="ra-phone" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputClass} />
          </div>
          <Select
            label="Country"
            value={form.country}
            onChange={(c) => setForm({ ...form, country: c })}
            options={COUNTRY_OPTIONS}
            buttonClassName={selectButton}
          />
          <button type="submit" className={`${btn.primary} min-h-[44px]`}>
            <UserPlus className="h-4 w-4" aria-hidden="true" />
            Add admin
          </button>
        </form>
      </Panel>

      {admins.length === 0 ? (
        <EmptyState title="No regional admins yet" message="Add one above for each country Halo operates in." />
      ) : (
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {admins.map((admin) => (
            <AdminCard
              key={admin.id}
              admin={admin}
              stats={statsFor(admin.adminScope?.country)}
              onMove={(a, c) => done(moveRegionalAdmin(a.id, c), `${a.name} now looks after ${countryName(c)}.`)}
              onRemove={(a) => done(removeRegionalAdmin(a.id), `${a.name} is no longer a regional admin.`)}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
