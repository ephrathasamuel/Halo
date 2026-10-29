'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useMyStorefront } from '@/hooks/useMyStorefront';
import { useStorageSync } from '@/hooks/useStorageSync';
import { STORAGE_KEYS } from '@/lib/storage/keys';
import { cityCoords, cityNames, countryName, providerLocation, regionNames } from '@/lib/geo';
import { usePlaces } from '@/hooks/usePlaces';
import { AreaSearch } from '@/components/ui/AreaSearch';
import { PhoneInput } from '@/components/ui/PhoneInput';
import { Select } from '@/components/ui/Select';
import { ImageUploader } from '@/components/ui/ImageUploader';
import { ProviderLogo } from '@/components/ui/ProviderLogo';
import { dominantColor } from '@/lib/media';
import { saveProvider } from '@/lib/client/domain';

/** Keeps a saved value selectable even if it isn't in today's list */
const withCurrent = (list, current) => (current && !list.includes(current) ? [current, ...list] : list);

export default function OwnerProviderSettingsPage() {
  const { provider: storefront } = useMyStorefront();
  const { refresh } = useStorageSync(STORAGE_KEYS.PROVIDERS, []);
  const provider = storefront;
  const providerCountry = provider ? providerLocation(provider).country : '';
  const { places } = usePlaces(providerCountry);

  const [formData, setFormData] = useState({
    name: '',
    tagline: '',
    about: '',
    region: '',
    city: '',
    neighbourhood: '',
    latitude: null,
    longitude: null,
    brandColor: '#D4AF37',
    logo: '',
    cover: '',
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
        region: providerLocation(provider).region,
        city: providerLocation(provider).city,
        neighbourhood: provider.neighbourhood || '',
        latitude: provider.latitude ?? null,
        longitude: provider.longitude ?? null,
        brandColor: provider.brandColor || '#D4AF37',
        logo: provider.logo || '',
        cover: provider.cover || '',
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
      <div className="py-12 text-center text-halo-text-muted">
        No provider storefront found linked to your account.
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatusMessage({ type: '', text: '' });
    setIsSubmitting(true);

    const payload = {
      id: provider.id,
      name: formData.name,
      tagline: formData.tagline,
      about: formData.about,
      region: formData.region,
      city: formData.city,
      neighbourhood: formData.neighbourhood,
      latitude: formData.latitude ?? undefined,
      longitude: formData.longitude ?? undefined,
      brandColor: formData.brandColor,
      logo: formData.logo,
      cover: formData.cover,
      hours: { open: formData.openTime, close: formData.closeTime },
      contact: {
        phone: formData.phone,
        whatsapp: formData.whatsapp,
        telegram: formData.telegram,
      },
    };

    const res = await saveProvider(payload);
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-halo-border">
        <div>
          <h1 className="text-2xl font-semibold text-halo-ink">Storefront Settings</h1>
          <p className="text-xs text-halo-text-muted mt-1">
            Update your public studio branding, opening hours, and direct client contact information.
          </p>
        </div>

        <Link
          href={`/studios/${provider.slug}`}
          target="_blank"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold border border-halo-border-strong text-stone-700 bg-white hover:bg-stone-50 transition min-h-[44px]"
        >
          Preview Storefront</Link>
      </div>

      {statusMessage.text && (
        <div
          className={`p-4 rounded-xl text-sm font-medium border ${
            statusMessage.type === 'error'
            ? 'bg-red-50 text-red-700 border-red-200'
            : 'bg-emerald-50 text-emerald-800 border-emerald-200'
          }`}
        >
          {statusMessage.text}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-halo-border p-6 md:p-8 space-y-6">
        {/* Brand Preview Banner */}
        <div
          className="h-24 rounded-2xl flex items-center justify-between px-6 text-white"
          style={{ backgroundColor: formData.brandColor }}
        >
          <div>
            <p className="text-lg font-semibold">{formData.name || 'Studio Name'}</p>
            <p className="text-xs opacity-90">{formData.tagline || 'Studio Tagline'}</p>
          </div>
          <span className="text-xs bg-black/20 px-3 py-1 rounded-full font-mono">
            {formData.brandColor}
          </span>
        </div>

        {/* Logo and cover photo */}
        <div className="grid gap-6 md:grid-cols-[200px_1fr]">
          <div>
            <ImageUploader
              label="Logo"
              hint="Square works best."
              kind="logo"
              max={1}
              value={formData.logo ? [formData.logo] : []}
              onChange={(urls) => setFormData({ ...formData, logo: urls[0] || '' })}
            />
            {!formData.logo && (
              <div className="mt-3 flex items-center gap-3">
                <ProviderLogo provider={{ name: formData.name, brandColor: formData.brandColor, cover: formData.cover }} size={48} />
                <p className="text-[13px] text-halo-text-muted">No logo yet: Halo shows this one, made from your name and cover colour.</p>
              </div>
            )}
          </div>
          <div>
            <ImageUploader
              label="Cover photo"
              hint="The wide photo at the top of your storefront. Show your space or your work."
              max={1}
              value={formData.cover ? [formData.cover] : []}
              onChange={(urls) => setFormData({ ...formData, cover: urls[0] || '' })}
            />
            {formData.cover && (
              <button
                type="button"
                onClick={async () => {
                  const colour = await dominantColor(formData.cover);
                  if (colour) setFormData((f) => ({ ...f, brandColor: colour }));
                }}
                className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-halo-ink underline underline-offset-2 min-h-[36px]"
              >
                Use colour from my cover
              </button>
            )}
          </div>
        </div>

        {/* Studio Name & Tagline */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label htmlFor="studio-name" className="block text-xs font-semibold text-stone-700">
              Studio Name *
            </label>
            <input
              id="studio-name"
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-halo-border text-sm focus:outline-none focus:ring-2 focus:ring-halo-primary min-h-[44px]"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="brand-color" className="block text-xs font-semibold text-stone-700">
              Brand Accent Color
            </label>
            <div className="flex items-center gap-3">
              <input
                id="brand-color"
                type="color"
                value={formData.brandColor}
                onChange={(e) => setFormData({ ...formData, brandColor: e.target.value })}
                className="w-12 h-11 rounded-xl cursor-pointer border border-halo-border bg-transparent p-0"
              />
              <input
                type="text"
                value={formData.brandColor}
                onChange={(e) => setFormData({ ...formData, brandColor: e.target.value })}
                className="flex-1 px-4 py-2.5 rounded-xl border border-halo-border text-sm font-mono focus:outline-none focus:ring-2 focus:ring-halo-primary min-h-[44px]"
              />
            </div>
          </div>
        </div>

        {/* Tagline */}
        <div className="space-y-1.5">
          <label htmlFor="tagline" className="block text-xs font-semibold text-stone-700">
            Tagline / Subheading *
          </label>
          <input
            id="tagline"
            type="text"
            required
            value={formData.tagline}
            onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
            placeholder="e.g. Professional Studio & Film Production in Bole"
            className="w-full px-4 py-2.5 rounded-xl border border-halo-border text-sm focus:outline-none focus:ring-2 focus:ring-halo-primary min-h-[44px]"
          />
        </div>

        {/* About */}
        <div className="space-y-1.5">
          <label htmlFor="about" className="block text-xs font-semibold text-stone-700">
            About the Studio & Production Team
          </label>
          <textarea
            id="about"
            rows={4}
            value={formData.about}
            onChange={(e) => setFormData({ ...formData, about: e.target.value })}
            className="w-full px-4 py-2.5 rounded-xl border border-halo-border text-sm focus:outline-none focus:ring-2 focus:ring-halo-primary"
          />
        </div>

        {/* Location & Opening Hours */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-halo-border">
          <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <p className="block text-xs font-semibold text-stone-700">Country</p>
              <p className="min-h-[44px] flex items-center px-4 rounded-xl bg-halo-ink/[0.04] text-sm text-halo-ink">
                {countryName(providerLocation(provider).country)}
              </p>
              <p className="text-[11px] text-halo-text-muted">Moving to another country? Contact Halo.</p>
            </div>
            <Select
              label="Region *"
              value={formData.region}
              onChange={(v) => setFormData({ ...formData, region: v, city: '', neighbourhood: '' })}
              options={withCurrent(regionNames(places), formData.region).map((r) => ({ value: r, label: r }))}
              buttonClassName="min-h-[44px] px-4 rounded-xl border border-halo-border text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-gold"
            />
            <Select
              label="City *"
              value={formData.city}
              onChange={(v) => {
                // The city centre places the map until a more exact area is picked
                const c = cityCoords(places, v, formData.region);
                setFormData({ ...formData, city: v, neighbourhood: '', latitude: c?.lat ?? null, longitude: c?.lng ?? null });
              }}
              options={[
                { value: '', label: 'Choose a city' },
                ...withCurrent(cityNames(places, formData.region), formData.city).map((c) => ({ value: c, label: c })),
              ]}
              buttonClassName="min-h-[44px] px-4 rounded-xl border border-halo-border text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-gold"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="neighbourhood" className="block text-xs font-semibold text-stone-700">
              Neighbourhood or area *
            </label>
            <AreaSearch
              id="neighbourhood"
              required
              value={formData.neighbourhood}
              onChange={(v) => setFormData((f) => ({ ...f, neighbourhood: v }))}
              onPick={(place) => setFormData((f) => ({ ...f, latitude: place.lat, longitude: place.lng }))}
              city={formData.city}
              coords={cityCoords(places, formData.city, formData.region)}
              className="w-full px-4 py-2.5 rounded-xl border border-halo-border text-sm focus:outline-none focus:ring-2 focus:ring-halo-primary min-h-[44px]"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="open-time" className="block text-xs font-semibold text-stone-700">
              Opening Time (HH:mm)
            </label>
            <input
              id="open-time"
              type="time"
              value={formData.openTime}
              onChange={(e) => setFormData({ ...formData, openTime: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-halo-border text-sm focus:outline-none focus:ring-2 focus:ring-halo-primary min-h-[44px]"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="close-time" className="block text-xs font-semibold text-stone-700">
              Closing Time (HH:mm)
            </label>
            <input
              id="close-time"
              type="time"
              value={formData.closeTime}
              onChange={(e) => setFormData({ ...formData, closeTime: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-halo-border text-sm focus:outline-none focus:ring-2 focus:ring-halo-primary min-h-[44px]"
            />
          </div>
        </div>

        {/* Contact Details */}
        <div className="space-y-4 pt-4 border-t border-halo-border">
          <h3 className="text-xs font-semibold text-stone-700">Contact Channels</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="phone" className="block text-xs text-stone-600">
                Direct Phone *
              </label>
              <PhoneInput
                id="phone"
                required
                value={formData.phone}
                onChange={(v) => setFormData((f) => ({ ...f, phone: v }))}
                defaultCountry={providerCountry}
                inputClassName="w-full px-4 py-2.5 rounded-xl border border-halo-border text-sm focus:outline-none focus:ring-2 focus:ring-halo-primary min-h-[44px]"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="whatsapp" className="block text-xs text-stone-600">
                WhatsApp Number
              </label>
              <PhoneInput
                id="whatsapp"
                value={formData.whatsapp}
                onChange={(v) => setFormData((f) => ({ ...f, whatsapp: v }))}
                defaultCountry={providerCountry}
                inputClassName="w-full px-4 py-2.5 rounded-xl border border-halo-border text-sm focus:outline-none focus:ring-2 focus:ring-halo-primary min-h-[44px]"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="telegram" className="block text-xs text-stone-600">
                Telegram Handle
              </label>
              <input
                id="telegram"
                type="text"
                value={formData.telegram}
                onChange={(e) => setFormData({ ...formData, telegram: e.target.value })}
                placeholder="@handle"
                className="w-full px-4 py-2.5 rounded-xl border border-halo-border text-sm focus:outline-none focus:ring-2 focus:ring-halo-primary min-h-[44px]"
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-4 flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-3 bg-halo-ink text-white font-semibold rounded-xl hover:bg-halo-ink-soft transition disabled:opacity-50 min-h-[44px]"
          >
            {isSubmitting ? 'Saving Changes...' : 'Save Storefront Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}
