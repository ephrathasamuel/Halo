'use client';

import { useState } from 'react';
import { assignStorefrontOwner } from '@/app/actions/halo';
import { reloadData } from '@/lib/client/cache';

const inputClass =
  'w-full px-3 rounded-lg border border-halo-border-strong bg-halo-surface text-sm text-halo-ink min-h-[40px] focus:border-halo-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-gold';

/**
 * Admin: give a storefront with no owner to its real owner. They get their own
 * provider account and change the first password when they sign in.
 */
export function AssignOwnerForm({ provider, onDone }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  if (!open) {
    return (
      <div>
        <p className="font-semibold text-amber-700">No owner yet</p>
        <p className="text-halo-text-muted">Not taking bookings</p>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-2 px-3 rounded-lg border border-halo-border-strong text-xs font-semibold text-halo-ink hover:border-halo-ink min-h-[36px]"
        >
          Add owner
        </button>
      </div>
    );
  }

  async function submit(event) {
    event.preventDefault();
    setError('');
    setPending(true);
    const res = await assignStorefrontOwner({ providerId: provider.id, ...form });
    setPending(false);
    if (!res?.ok) {
      setError(res?.error || 'Could not add the owner');
      return;
    }
    await reloadData();
    onDone?.(
      res.existingAccount
        ? `${provider.name} now belongs to ${form.email}. They manage it from their provider dashboard.`
        : `${provider.name} now belongs to ${form.name}. Give them their email and first password; they choose their own when they sign in at /signin.`
    );
  }

  const id = (key) => `owner-${key}-${provider.id}`;
  return (
    <form onSubmit={submit} className="grid gap-2 min-w-[220px]" aria-label={`Owner for ${provider.name}`}>
      <label className="sr-only" htmlFor={id('name')}>Owner name</label>
      <input id={id('name')} required placeholder="Owner's full name" value={form.name} onChange={set('name')} className={inputClass} />
      <label className="sr-only" htmlFor={id('email')}>Owner email</label>
      <input id={id('email')} type="email" required placeholder="Owner's email" value={form.email} onChange={set('email')} className={inputClass} />
      <label className="sr-only" htmlFor={id('phone')}>Owner phone</label>
      <input id={id('phone')} type="tel" placeholder="Phone (optional)" value={form.phone} onChange={set('phone')} className={inputClass} />
      <label className="sr-only" htmlFor={id('password')}>First password</label>
      <input
        id={id('password')}
        type="password"
        autoComplete="new-password"
        placeholder="First password (8+, letters and a number)"
        value={form.password}
        onChange={set('password')}
        className={inputClass}
      />
      <p className="text-[11px] text-halo-text-muted">Leave the password empty if they already have a Halo account.</p>
      {error && (
        <p className="text-xs text-halo-error" role="alert">
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <button type="submit" disabled={pending} className="px-3 rounded-lg bg-halo-ink text-white text-xs font-semibold min-h-[36px] disabled:opacity-60">
          {pending ? 'Saving…' : 'Give storefront'}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="px-3 rounded-lg text-xs text-halo-text-muted hover:text-halo-ink min-h-[36px]">
          Cancel
        </button>
      </div>
    </form>
  );
}
