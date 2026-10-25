'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Lock } from 'lucide-react';
import { useSession } from '@/hooks/useSession';
import { useStorageSync } from '@/hooks/useStorageSync';
import { STORAGE_KEYS } from '@/lib/storage/keys';
import { COUNTRIES } from '@/lib/geo';
import { updateProfile } from '@/lib/domain/users';
import { EmptyState } from '@/components/states/EmptyState';
import { ImageUploader } from '@/components/ui/ImageUploader';
import { UserAvatar } from '@/components/ui/ProviderLogo';
import { Select } from '@/components/ui/Select';
import { Notice, PageHeader, Panel, btn } from '@/components/dashboard/DashboardUI';

const inputClass =
  'w-full px-3.5 min-h-[44px] rounded-xl border border-halo-border-strong bg-halo-surface text-[15px] text-halo-ink focus:border-halo-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-gold';

export default function AccountPage() {
  const { session, isSignedIn, isLoaded } = useSession();
  const { data: users } = useStorageSync(STORAGE_KEYS.USERS, []);
  const user = users.find((u) => u.id === session?.userId);

  const [form, setForm] = useState(null);
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    if (user && !form) {
      setForm({ name: user.name || '', phone: user.phone || '', country: user.country || 'ET', avatar: user.avatar || '' });
    }
  }, [user, form]);

  if (!isLoaded) return <div className="min-h-[50vh]" aria-busy="true" />;
  if (!isSignedIn) {
    return (
      <EmptyState icon={Lock} title="Sign in to edit your profile" message="Your name, photo and contact details.">
        <Link href="/signin?next=/account" className={btn.primary}>
          Sign in
        </Link>
      </EmptyState>
    );
  }
  if (!form) return <div className="min-h-[50vh]" aria-busy="true" />;

  const handleSubmit = (e) => {
    e.preventDefault();
    const res = updateProfile(form);
    setNotice(res.ok ? { tone: 'success', text: 'Profile saved.' } : { tone: 'error', text: res.error });
  };

  return (
    <div className="max-w-2xl space-y-6">
      <PageHeader title="Profile" description="How providers and Halo see you." />

      {notice && (
        <Notice tone={notice.tone} onDismiss={() => setNotice(null)}>
          {notice.text}
        </Notice>
      )}

      <Panel>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex items-start gap-5">
            <UserAvatar user={{ name: form.name, avatar: form.avatar }} size={72} />
            <div className="flex-1">
              <ImageUploader
                label="Profile photo"
                hint="Optional. Without one, your initials are shown."
                kind="avatar"
                max={1}
                value={form.avatar ? [form.avatar] : []}
                onChange={(urls) => setForm({ ...form, avatar: urls[0] || '' })}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="acc-name" className="block text-sm font-medium text-halo-ink mb-1.5">Full name</label>
              <input id="acc-name" type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label htmlFor="acc-phone" className="block text-sm font-medium text-halo-ink mb-1.5">Phone</label>
              <input id="acc-phone" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputClass} />
            </div>
            <Select
              label="Country"
              value={form.country}
              onChange={(c) => setForm({ ...form, country: c })}
              options={COUNTRIES.map((c) => ({ value: c.code, label: c.name }))}
              buttonClassName="min-h-[44px] px-3.5 rounded-xl border border-halo-border-strong bg-halo-surface text-[15px] hover:border-halo-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-gold"
            />
            <div>
              <p className="block text-sm font-medium text-halo-ink mb-1.5">Email</p>
              <p className="min-h-[44px] flex items-center px-3.5 rounded-xl bg-halo-ink/[0.04] text-[15px] text-halo-text-muted">{user?.email}</p>
            </div>
          </div>

          <button type="submit" className={btn.primary}>
            Save profile
          </button>
        </form>
      </Panel>
    </div>
  );
}
