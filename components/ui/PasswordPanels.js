'use client';

import { useState } from 'react';
import { adminSetPassword, changePassword } from '@/app/actions/halo';
import { reloadData } from '@/lib/client/cache';
import { Notice, Panel, btn } from '@/components/dashboard/DashboardUI';

const inputClass =
  'w-full px-3.5 rounded-xl border border-halo-border-strong bg-halo-surface text-[15px] text-halo-ink min-h-[44px] focus:border-halo-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-gold';

function Field({ id, label, value, onChange, autoComplete, checkLength = true }) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-halo-ink mb-1.5">
        {label}
      </label>
      <input
        id={id}
        type="password"
        required
        minLength={checkLength ? 8 : undefined}
        autoComplete={autoComplete}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={inputClass}
      />
    </div>
  );
}

/**
 * "Change password" on the account page (signs out the account's other devices).
 * Accounts made with Google have no password until they set one here.
 */
export function ChangePasswordPanel({ hasPassword = true }) {
  const [form, setForm] = useState({ current: '', next: '', repeat: '' });
  const [notice, setNotice] = useState(null);
  const [pending, setPending] = useState(false);
  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));

  async function submit(event) {
    event.preventDefault();
    if (form.next !== form.repeat) {
      setNotice({ tone: 'error', text: 'The two new passwords are different' });
      return;
    }
    setPending(true);
    const result = await changePassword({ currentPassword: form.current, newPassword: form.next });
    setPending(false);
    if (result?.ok) {
      setNotice({
        tone: 'success',
        text: hasPassword
          ? 'Password changed. Your other devices have been signed out.'
          : 'Password set. You can now also sign in with your email and this password.',
      });
      setForm({ current: '', next: '', repeat: '' });
      reloadData();
    } else {
      setNotice({ tone: 'error', text: result?.error || 'Could not change the password' });
    }
  }

  return (
    <Panel
      title="Password"
      description={hasPassword ? undefined : 'You sign in with Google. Set a password to also sign in with your email.'}
    >
      {notice && (
        <Notice tone={notice.tone} onDismiss={() => setNotice(null)}>
          {notice.text}
        </Notice>
      )}
      <form onSubmit={submit} className="mt-4 grid gap-4 md:grid-cols-3">
        {hasPassword && (
          <Field id="current-password" label="Current password" value={form.current} onChange={set('current')} autoComplete="current-password" checkLength={false} />
        )}
        <Field id="new-password" label="New password" value={form.next} onChange={set('next')} autoComplete="new-password" />
        <Field id="repeat-password" label="Repeat new password" value={form.repeat} onChange={set('repeat')} autoComplete="new-password" />
        <div className="md:col-span-3">
          <button type="submit" disabled={pending} className={btn.primary}>
            {pending ? 'Saving…' : hasPassword ? 'Change password' : 'Set password'}
          </button>
        </div>
      </form>
    </Panel>
  );
}

/** Admin: set a new password for a user who forgot theirs. */
export function AdminSetPasswordPanel({ user }) {
  const [password, setPassword] = useState('');
  const [notice, setNotice] = useState(null);
  const [pending, setPending] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setPending(true);
    const result = await adminSetPassword({ userId: user.id, newPassword: password });
    setPending(false);
    if (result?.ok) {
      setNotice({ tone: 'success', text: `New password set for ${user.name}. Tell them in person or by phone; they can change it in their account.` });
      setPassword('');
    } else {
      setNotice({ tone: 'error', text: result?.error || 'Could not set the password' });
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-halo-border p-6 space-y-3">
      <h2 className="text-sm font-semibold text-halo-text-muted">Forgot their password?</h2>
      {notice && (
        <Notice tone={notice.tone} onDismiss={() => setNotice(null)}>
          {notice.text}
        </Notice>
      )}
      <form onSubmit={submit} className="flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[200px]">
          <Field id="admin-new-password" label="New password for this person" value={password} onChange={setPassword} autoComplete="new-password" />
        </div>
        <button type="submit" disabled={pending} className={`${btn.primary} min-h-[44px]`}>
          {pending ? 'Saving…' : 'Set password'}
        </button>
      </form>
      <p className="text-xs text-halo-text-muted">They will be signed out everywhere and use this password next time.</p>
    </div>
  );
}
