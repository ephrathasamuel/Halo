'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, Camera, Clapperboard, Plus, Tag, X } from 'lucide-react';
import { useSession } from '@/hooks/useSession';
import { useStorageSync } from '@/hooks/useStorageSync';
import { STORAGE_KEYS } from '@/lib/storage/keys';
import { providerLocation } from '@/lib/geo';
import { ImageUploader } from '@/components/ui/ImageUploader';
import { Notice, btn } from '@/components/dashboard/DashboardUI';
import { saveListing } from '@/lib/client/domain';

const TYPES = [
  { id: 'studio', label: 'Space', desc: 'A studio or room booked by the hour', icon: Building2 },
  { id: 'equipment', label: 'Equipment rental', desc: 'Cameras, lights, audio, drones, props', icon: Camera },
  { id: 'service', label: 'Service', desc: 'Filming, photography, editing, crew', icon: Clapperboard },
  { id: 'sale', label: 'Item for sale', desc: 'Gear or props you want to sell', icon: Tag },
];

/* Suggestions only: providers can type anything */
const CATEGORY_SUGGESTIONS = {
  studio: ['Photo studio', 'Film stage', 'Podcast room', 'Recording studio', 'Loft', 'Rooftop', 'Event space'],
  equipment: ['Camera', 'Lens', 'Lighting', 'Audio', 'Drone', 'Support and rigs', 'Monitor', 'Props', 'Backdrop'],
  service: ['Wedding filming', 'Event photography', 'Corporate video', 'Music video', 'Editing', 'Live streaming', 'Crew hire'],
  sale: ['Camera', 'Lens', 'Lighting', 'Audio', 'Drone', 'Accessories', 'Props', 'Furniture'],
};

const DETAIL_SUGGESTIONS = {
  studio: ['Size', 'Ceiling height', 'Power', 'Backdrops'],
  equipment: ['Brand', 'Model', 'Lens mount', "What's in the kit"],
  service: ['Crew size', 'Delivery time', 'Equipment used', 'Travel'],
  sale: ['Brand', 'Model', 'Year bought', 'Warranty', "What's included"],
};

const AMENITY_SUGGESTIONS = ['Cyclorama wall', 'Lighting rigs', 'Climate control', 'Makeup room', 'Wi-Fi', 'Parking', 'Sound isolation', 'Natural light'];
const EVENT_SUGGESTIONS = ['Wedding', 'Engagement', 'Corporate event', 'Birthday', 'Music video', 'Commercial', 'Conference', 'Product launch'];
const CONDITIONS = {
  equipment: ['Excellent', 'Good', 'Fair'],
  sale: ['New', 'Like new', 'Used, good', 'Used, fair', 'For parts'],
};

const inputClass =
  'w-full px-3.5 min-h-[44px] rounded-xl border border-halo-border-strong bg-halo-surface text-[15px] text-halo-ink placeholder:text-halo-text-muted focus:border-halo-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-gold';

function Field({ id, label, hint, children }) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-halo-ink">
        {label}
      </label>
      {hint && <p className="text-[13px] text-halo-text-muted">{hint}</p>}
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

/**
 * Chips the provider can switch on, plus their own entries.
 * @param {{ label: string, suggestions: string[], value: string[], onChange: (v: string[]) => void, placeholder: string }} props
 */
function ChipPicker({ label, suggestions, value, onChange, placeholder }) {
  const [custom, setCustom] = useState('');
  const all = [...new Set([...suggestions, ...value])];
  const toggle = (item) => onChange(value.includes(item) ? value.filter((v) => v !== item) : [...value, item]);
  const addCustom = () => {
    const item = custom.trim();
    if (item && !value.includes(item)) onChange([...value, item]);
    setCustom('');
  };
  return (
    <div>
      <p className="text-sm font-medium text-halo-ink">{label}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {all.map((item) => {
          const on = value.includes(item);
          return (
            <button
              key={item}
              type="button"
              onClick={() => toggle(item)}
              aria-pressed={on}
              className={`px-3.5 rounded-full border text-sm min-h-[36px] transition-colors ${
                on ? 'bg-halo-ink border-halo-ink text-white' : 'bg-halo-surface border-halo-border-strong text-halo-ink hover:border-halo-ink'
              }`}
            >
              {item}
            </button>
          );
        })}
      </div>
      <div className="mt-2 flex gap-2 max-w-sm">
        <input
          type="text"
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addCustom();
            }
          }}
          placeholder={placeholder}
          className={inputClass}
          aria-label={placeholder}
        />
        <button type="button" onClick={addCustom} className={btn.secondary}>
          Add
        </button>
      </div>
    </div>
  );
}

/**
 * Create or edit any kind of listing: a space, equipment rental, a service or an
 * item for sale. Photos come straight from the device; any extra details
 * (brand, model, year...) are free label/value rows.
 * @param {{ initialListing?: object|null }} props
 */
export function ListingForm({ initialListing = null }) {
  const router = useRouter();
  const { session } = useSession();
  const { data: providers } = useStorageSync(STORAGE_KEYS.PROVIDERS, []);
  const provider = providers.find((p) => p.ownerId === session?.userId);

  const init = initialListing || {};
  const [type, setType] = useState(init.type || 'studio');
  const [form, setForm] = useState({
    title: init.title || '',
    description: init.description || '',
    category: init.category || '',
    photos: init.photos || [],
    details: init.details?.length ? init.details : [],
    available: init.status !== 'inactive',
    // studio
    hourlyRate: init.hourlyRate ?? '',
    minHours: init.minHours ?? 2,
    capacity: init.capacity ?? '',
    bufferMinutes: init.bufferMinutes ?? 30,
    amenities: init.amenities || [],
    // equipment / sale
    deposit: init.deposit ?? '',
    quantity: init.quantity ?? 1,
    condition: init.condition || '',
    // service
    startingFromHint: init.startingFromHint ?? '',
    eventTypes: init.eventTypes || [],
    // sale
    salePrice: init.salePrice ?? '',
    negotiable: Boolean(init.negotiable),
  });
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!provider) {
    return (
      <div className="p-8 text-center rounded-2xl border border-halo-border bg-halo-surface">
        <p className="text-halo-text-muted">No storefront is linked to this account yet.</p>
      </div>
    );
  }

  const { currency } = providerLocation(provider);
  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));
  const onInput = (key) => (e) => set(key)(e.target.value);

  // Details rows: suggested labels appear as one-tap starters
  const unusedDetailLabels = DETAIL_SUGGESTIONS[type].filter((l) => !form.details.some((d) => d.label === l));
  const setDetail = (i, key, value) =>
    set('details')(form.details.map((d, j) => (j === i ? { ...d, [key]: value } : d)));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);

    const keepStatus = init.status && !['approved', 'inactive'].includes(init.status) ? init.status : null;
    const res = await saveListing({
      id: init.id,
      providerId: provider.id,
      type,
      title: form.title,
      description: form.description,
      category: form.category,
      photos: form.photos,
      details: form.details,
      // pending or rejected listings keep their moderation status
      status: keepStatus || (form.available ? 'approved' : 'inactive'),
      hourlyRate: Number(form.hourlyRate),
      minHours: Number(form.minHours),
      capacity: Number(form.capacity),
      bufferMinutes: Number(form.bufferMinutes),
      amenities: form.amenities,
      deposit: Number(form.deposit || 0),
      quantity: Number(form.quantity),
      condition: form.condition || CONDITIONS[type]?.[0],
      startingFromHint: Number(form.startingFromHint),
      eventTypes: form.eventTypes,
      salePrice: Number(form.salePrice),
      negotiable: form.negotiable,
      blockedDates: init.blockedDates || [],
    });
    setIsSubmitting(false);

    if (!res.ok) {
      setErrorMsg(res.error || 'Failed to save listing');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    router.push('/owner/listings');
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errorMsg && <Notice tone="error">{errorMsg}</Notice>}

      {/* 1. What is it */}
      {!initialListing && (
        <section className="rounded-2xl border border-halo-border bg-halo-surface p-5 sm:p-6">
          <h2 className="text-lg font-semibold text-halo-ink">What are you listing?</h2>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3" role="radiogroup" aria-label="Listing type">
            {TYPES.map((t) => {
              const on = type === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => setType(t.id)}
                  className={`flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition-colors ${
                    on ? 'border-halo-ink bg-halo-ink/[0.04] ring-1 ring-halo-ink' : 'border-halo-border-strong hover:border-halo-ink'
                  }`}
                >
                  <t.icon className="h-5 w-5 text-halo-ink" strokeWidth={1.75} aria-hidden="true" />
                  <span className="font-semibold text-halo-ink">{t.label}</span>
                  <span className="text-[13px] text-halo-text-muted">{t.desc}</span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* 2. Photos and basics */}
      <section className="rounded-2xl border border-halo-border bg-halo-surface p-5 sm:p-6 space-y-5">
        <h2 className="text-lg font-semibold text-halo-ink">Photos and description</h2>
        <ImageUploader
          label="Photos"
          hint="Add up to 8 from your phone or computer. The first one is the cover."
          value={form.photos}
          onChange={set('photos')}
        />
        <div className="grid gap-4 md:grid-cols-2">
          <Field id="l-title" label="Title">
            <input id="l-title" type="text" required value={form.title} onChange={onInput('title')} placeholder="e.g. Sony FX3 cinema kit" className={inputClass} />
          </Field>
          <Field id="l-category" label="Category" hint={type === 'equipment' ? 'Required for equipment' : 'Optional'}>
            <input id="l-category" type="text" list="l-category-options" value={form.category} onChange={onInput('category')} placeholder="Choose or type your own" className={inputClass} />
            <datalist id="l-category-options">
              {CATEGORY_SUGGESTIONS[type].map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </Field>
        </div>
        <Field id="l-description" label="Description" hint="What it is, what's included, anything a renter or buyer should know.">
          <textarea id="l-description" rows={4} value={form.description} onChange={onInput('description')} className={`${inputClass} py-2.5`} />
        </Field>
      </section>

      {/* 3. Details */}
      <section className="rounded-2xl border border-halo-border bg-halo-surface p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-halo-ink">Details</h2>
        <p className="text-[13px] text-halo-text-muted">Brand, model, year, size: add whatever helps people decide.</p>
        <div className="mt-4 space-y-2">
          {form.details.map((d, i) => (
            <div key={i} className="grid grid-cols-[1fr_1.5fr_auto] gap-2">
              <input type="text" value={d.label} onChange={(e) => setDetail(i, 'label', e.target.value)} placeholder="Label, e.g. Model" className={inputClass} aria-label={`Detail ${i + 1} label`} />
              <input type="text" value={d.value} onChange={(e) => setDetail(i, 'value', e.target.value)} placeholder="Value, e.g. FX3" className={inputClass} aria-label={`Detail ${i + 1} value`} />
              <button type="button" onClick={() => set('details')(form.details.filter((_, j) => j !== i))} className="inline-flex items-center justify-center rounded-xl text-halo-text-muted hover:text-halo-error hover:bg-red-50" aria-label={`Remove detail ${i + 1}`}>
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {unusedDetailLabels.map((l) => (
            <button key={l} type="button" onClick={() => set('details')([...form.details, { label: l, value: '' }])} className="inline-flex items-center gap-1 px-3 rounded-full border border-dashed border-halo-border-strong text-sm text-halo-ink hover:border-halo-ink min-h-[36px]">
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              {l}
            </button>
          ))}
          <button type="button" onClick={() => set('details')([...form.details, { label: '', value: '' }])} className="inline-flex items-center gap-1 px-3 rounded-full border border-dashed border-halo-border-strong text-sm font-medium text-halo-ink hover:border-halo-ink min-h-[36px]">
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            Your own
          </button>
        </div>
      </section>

      {/* 4. Price and specifics for this type */}
      <section className="rounded-2xl border border-halo-border bg-halo-surface p-5 sm:p-6 space-y-5">
        <h2 className="text-lg font-semibold text-halo-ink">{type === 'sale' ? 'Price' : type === 'service' ? 'Pricing and events' : 'Price and rules'}</h2>

        {type === 'studio' && (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Field id="l-rate" label={`Price per hour (${currency})`}>
                <input id="l-rate" type="number" inputMode="numeric" min="1" required value={form.hourlyRate} onChange={onInput('hourlyRate')} className={inputClass} />
              </Field>
              <Field id="l-min" label="Minimum hours">
                <input id="l-min" type="number" min="1" value={form.minHours} onChange={onInput('minHours')} className={inputClass} />
              </Field>
              <Field id="l-cap" label="Fits up to (people)">
                <input id="l-cap" type="number" min="1" required value={form.capacity} onChange={onInput('capacity')} className={inputClass} />
              </Field>
              <Field id="l-buffer" label="Cleanup between bookings (min)">
                <input id="l-buffer" type="number" min="0" step="15" value={form.bufferMinutes} onChange={onInput('bufferMinutes')} className={inputClass} />
              </Field>
            </div>
            <ChipPicker label="What's included" suggestions={AMENITY_SUGGESTIONS} value={form.amenities} onChange={set('amenities')} placeholder="Add something else" />
          </>
        )}

        {type === 'equipment' && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Field id="l-rate" label={`Price per hour (${currency})`}>
              <input id="l-rate" type="number" inputMode="numeric" min="1" required value={form.hourlyRate} onChange={onInput('hourlyRate')} className={inputClass} />
            </Field>
            <Field id="l-deposit" label={`Refundable deposit (${currency})`}>
              <input id="l-deposit" type="number" inputMode="numeric" min="0" value={form.deposit} onChange={onInput('deposit')} placeholder="0" className={inputClass} />
            </Field>
            <Field id="l-qty" label="How many you have">
              <input id="l-qty" type="number" min="1" value={form.quantity} onChange={onInput('quantity')} className={inputClass} />
            </Field>
            <Field id="l-condition" label="Condition">
              <input id="l-condition" type="text" list="l-cond-options" value={form.condition} onChange={onInput('condition')} placeholder="Excellent" className={inputClass} />
              <datalist id="l-cond-options">{CONDITIONS.equipment.map((c) => <option key={c} value={c} />)}</datalist>
            </Field>
          </div>
        )}

        {type === 'service' && (
          <>
            <Field id="l-from" label={`Starting price (${currency})`} hint="Clients see 'from' this price and request a quote for the exact amount.">
              <input id="l-from" type="number" inputMode="numeric" min="1" required value={form.startingFromHint} onChange={onInput('startingFromHint')} className={`${inputClass} max-w-xs`} />
            </Field>
            <ChipPicker label="Events you cover" suggestions={EVENT_SUGGESTIONS} value={form.eventTypes} onChange={set('eventTypes')} placeholder="Add another kind of event" />
          </>
        )}

        {type === 'sale' && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Field id="l-price" label={`Price (${currency})`}>
              <input id="l-price" type="number" inputMode="numeric" min="1" required value={form.salePrice} onChange={onInput('salePrice')} className={inputClass} />
            </Field>
            <Field id="l-qty" label="How many you're selling">
              <input id="l-qty" type="number" min="1" value={form.quantity} onChange={onInput('quantity')} className={inputClass} />
            </Field>
            <Field id="l-condition" label="Condition">
              <input id="l-condition" type="text" list="l-sale-cond" value={form.condition} onChange={onInput('condition')} placeholder="Used, good" className={inputClass} />
              <datalist id="l-sale-cond">{CONDITIONS.sale.map((c) => <option key={c} value={c} />)}</datalist>
            </Field>
            <label className="flex items-center gap-3 self-end min-h-[44px] cursor-pointer">
              <input type="checkbox" checked={form.negotiable} onChange={(e) => set('negotiable')(e.target.checked)} className="h-5 w-5 min-h-0 min-w-0 shrink-0 accent-[var(--halo-ink)]" />
              <span className="text-[15px] text-halo-ink">Price is negotiable</span>
            </label>
          </div>
        )}
      </section>

      {/* 5. Availability and save */}
      <section className="rounded-2xl border border-halo-border bg-halo-surface p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <label className="flex items-start gap-3 cursor-pointer">
          <input type="checkbox" checked={form.available} onChange={(e) => set('available')(e.target.checked)} className="mt-1 h-5 w-5 min-h-0 min-w-0 shrink-0 accent-[var(--halo-ink)]" />
          <span>
            <span className="block font-medium text-halo-ink">Available now</span>
            <span className="block text-[13px] text-halo-text-muted">
              Switch off to hide it from search and stop new {type === 'sale' ? 'purchase requests' : 'bookings'}. You can switch it back on any time.
            </span>
          </span>
        </label>
        <div className="flex gap-2 shrink-0">
          <button type="button" onClick={() => router.push('/owner/listings')} className={btn.secondary}>
            Cancel
          </button>
          <button type="submit" disabled={isSubmitting} className={btn.primary}>
            {isSubmitting ? 'Saving' : initialListing ? 'Save changes' : 'Publish listing'}
          </button>
        </div>
      </section>
    </form>
  );
}
