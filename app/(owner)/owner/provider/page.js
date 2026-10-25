'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from '@/hooks/useSession';
import { useStorageSync } from '@/hooks/useStorageSync';
import { STORAGE_KEYS } from '@/lib/storage/keys';
import { saveProvider } from '@/lib/domain/providers';

const NEIGHBOURHOODS = [
  'Bole',
  'Kazanchis',
  'Sarbet',
  'Old Airport',
  'Megenagna',
  'Arada',
  'Piassa',
  'Kirkos',
  'Yeka',
  'Nifas Silk',
];

export default function OwnerProviderSettingsPage() {
  const { session } = useSession();
  const { data: providers, refresh } = useStorageSync(STORAGE_KEYS.PROVIDERS, []);
  const provider = providers.find((p) => p.ownerId === session?.userId);

  const [formData, setFormData] = useState({
    name: '',
    tagline: '',
    about: '',
    neighbourhood: 'Bole',
    brandColor: '#D4AF37',
    openTime: '08:00',
    closeTime: '20:00',
    phone: '',
    whatsapp: '',
    telegram: '',
  });

  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (provider) {
      setFormData({
        name: provider.name || '',
        tagline: provider.tagline || '',
        about: provider.about || '',
        neighbourhood: provider.neighbourhood || 'Bole',
        brandColor: provider.brandColor || '#D4AF37',
        openTime: provider.hours?.open || '08:00',
        closeTime: provider.hours?.close || '20:00',
        phone: provider.contact?.phone || '',
        whatsapp: provider.contact?.whatsapp || '',
        telegram: provider.contact?.telegram || '',
      });
    }
  }, [provider]);

  if (!provider) {
    return (
      <div className="py-12 text-center text-slate-500">
        No provider storefront found linked to your account.
      </div>
    );
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    setStatusMessage({ type: '', text: '' });
    setIsSubmitting(true);

    const payload = {
      id: provider.id,
      name: formData.name,
      tagline: formData.tagline,
      about: formData.about,
      neighbourhood: formData.neighbourhood,
      brandColor: formData.brandColor,
      hours: { open: formData.openTime, close: formData.closeTime },
      contact: {
        phone: formData.phone,
        whatsapp: formData.whatsapp,
        telegram: formData.telegram,
      },
    };

    const res = saveProvider(payload);
    setIsSubmitting(false);

    if (!res.ok) {
      setStatusMessage({ type: 'error', text: res.error || 'Failed to update provider' });
      return;
    }

    setStatusMessage({ type: 'success', text: 'Storefront details saved successfully!' });
    refresh();
  };

  return (
    <div className="max-w-3xl space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Storefront Settings</h1>
          <p className="text-xs text-slate-500 mt-1">
            Update your public studio branding, opening hours, and direct client contact information.
          </p>
        </div>

        <Link
          href={`/studios/${provider.slug}`}
          target="_blank"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 transition min-h-[44px]"
        >
          <span>🌐</span> Preview Storefront ↗
        </Link>
      </div>

      {statusMessage.text && (
        <div
          className={`p-4 rounded-xl text-sm font-medium border shadow-sm ${
            statusMessage.type === 'error'
              ? 'bg-red-50 text-red-700 border-red-200'
              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
          }`}
        >
          {statusMessage.type === 'error' ? '⚠️ ' : '✓ '}
          {statusMessage.text}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm space-y-6">
        {/* Brand Preview Banner */}
        <div
          className="h-24 rounded-2xl flex items-center justify-between px-6 text-white shadow-inner"
          style={{ backgroundColor: formData.brandColor }}
        >
          <div>
            <p className="text-lg font-black">{formData.name || 'Studio Name'}</p>
            <p className="text-xs opacity-90">{formData.tagline || 'Studio Tagline'}</p>
          </div>
          <span className="text-xs bg-black/20 px-3 py-1 rounded-full font-mono">
            {formData.brandColor}
          </span>
        </div>

        {/* Studio Name & Tagline */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label htmlFor="studio-name" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Studio Name *
            </label>
            <input
              id="studio-name"
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-halo-primary min-h-[44px]"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="brand-color" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Brand Accent Color
            </label>
            <div className="flex items-center gap-3">
              <input
                id="brand-color"
                type="color"
                value={formData.brandColor}
                onChange={(e) => setFormData({ ...formData, brandColor: e.target.value })}
                className="w-12 h-11 rounded-xl cursor-pointer border border-slate-200 bg-transparent p-0"
              />
              <input
                type="text"
                value={formData.brandColor}
                onChange={(e) => setFormData({ ...formData, brandColor: e.target.value })}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-halo-primary min-h-[44px]"
              />
            </div>
          </div>
        </div>

        {/* Tagline */}
        <div className="space-y-1.5">
          <label htmlFor="tagline" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
            Tagline / Subheading *
          </label>
          <input
            id="tagline"
            type="text"
            required
            value={formData.tagline}
            onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
            placeholder="e.g. Professional Studio & Film Production in Bole"
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-halo-primary min-h-[44px]"
          />
        </div>

        {/* About */}
        <div className="space-y-1.5">
          <label htmlFor="about" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
            About the Studio & Production Team
          </label>
          <textarea
            id="about"
            rows={4}
            value={formData.about}
            onChange={(e) => setFormData({ ...formData, about: e.target.value })}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-halo-primary"
          />
        </div>

        {/* Location & Opening Hours */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-100">
          <div className="space-y-1.5">
            <label htmlFor="neighbourhood" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Neighbourhood *
            </label>
            <select
              id="neighbourhood"
              value={formData.neighbourhood}
              onChange={(e) => setFormData({ ...formData, neighbourhood: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-halo-primary min-h-[44px]"
            >
              {NEIGHBOURHOODS.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="open-time" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Opening Time (HH:mm)
            </label>
            <input
              id="open-time"
              type="time"
              value={formData.openTime}
              onChange={(e) => setFormData({ ...formData, openTime: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-halo-primary min-h-[44px]"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="close-time" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Closing Time (HH:mm)
            </label>
            <input
              id="close-time"
              type="time"
              value={formData.closeTime}
              onChange={(e) => setFormData({ ...formData, closeTime: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-halo-primary min-h-[44px]"
            />
          </div>
        </div>

        {/* Contact Details */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Contact Channels</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="phone" className="block text-xs text-slate-600">
                Direct Phone *
              </label>
              <input
                id="phone"
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+251911000000"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-halo-primary min-h-[44px]"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="whatsapp" className="block text-xs text-slate-600">
                WhatsApp Number
              </label>
              <input
                id="whatsapp"
                type="tel"
                value={formData.whatsapp}
                onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                placeholder="+251911000000"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-halo-primary min-h-[44px]"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="telegram" className="block text-xs text-slate-600">
                Telegram Handle
              </label>
              <input
                id="telegram"
                type="text"
                value={formData.telegram}
                onChange={(e) => setFormData({ ...formData, telegram: e.target.value })}
                placeholder="@handle"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-halo-primary min-h-[44px]"
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-4 flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-3 bg-halo-primary text-white font-bold rounded-xl hover:bg-halo-primary-light transition shadow disabled:opacity-50 min-h-[44px]"
          >
            {isSubmitting ? 'Saving Changes...' : 'Save Storefront Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}
