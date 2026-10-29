'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { signUp, signUpProvider } from '@/lib/domain/auth';
import { safeReturnPath } from '@/lib/safeReturnPath';
import { COUNTRIES, cityCoords, cityNames, regionNames } from '@/lib/geo';
import { useCountry } from '@/hooks/useCountry';
import { usePlaces } from '@/hooks/usePlaces';
import { AuthCard, authInputClass } from '@/components/ui/AuthCard';
import { AreaSearch } from '@/components/ui/AreaSearch';
import { PhoneInput } from '@/components/ui/PhoneInput';
import { Select } from '@/components/ui/Select';

const ACCOUNT_FIELDS = [
  { key: 'name', label: 'Full name', type: 'text', autoComplete: 'name' },
  { key: 'email', label: 'Email', type: 'email', autoComplete: 'email' },
];

const COUNTRY_OPTIONS = COUNTRIES.map((c) => ({ value: c.code, label: c.name }));

const selectButton =
  'min-h-[48px] px-3.5 rounded-xl border border-halo-border-strong bg-halo-surface text-[15px] hover:border-halo-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-gold';

function TextField({ id, label, value, onChange, ...rest }) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-halo-ink mb-1.5">
        {label}
      </label>
      <input id={id} type="text" value={value} onChange={(e) => onChange(e.target.value)} required className={authInputClass} {...rest} />
    </div>
  );
}

function SignUpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextParam = searchParams.get('next');
  const returnPath = safeReturnPath(nextParam);
  const { country: browsingCountry } = useCountry();

  const [accountType, setAccountType] = useState(searchParams.get('as') === 'provider' ? 'provider' : 'renter');
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    country: '',
    businessName: '',
    region: '',
    city: '',
    neighbourhood: '',
    latitude: null,
    longitude: null,
  });
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Start from the country the visitor is browsing
  useEffect(() => {
    if (browsingCountry && !form.country) setForm((f) => ({ ...f, country: browsingCountry }));
  }, [browsingCountry, form.country]);

  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));
  const isProvider = accountType === 'provider';
  const { places, loading: placesLoading } = usePlaces(isProvider ? form.country : '');
  const regions = regionNames(places);
  const cities = form.region ? cityNames(places, form.region) : [];
  const coords = form.city ? cityCoords(places, form.city, form.region) : null;

  // A new city resets the area, and its centre is the map position until an area is picked
  const setCity = (city) => {
    const c = cityCoords(places, city, form.region);
    setForm((f) => ({ ...f, city, neighbourhood: '', latitude: c?.lat ?? null, longitude: c?.lng ?? null }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);
    const res = isProvider ? signUpProvider(form) : signUp(form);
    setIsSubmitting(false);

    if (!res.ok) {
      setErrorMessage(res.error || 'Failed to create account');
      return;
    }
    router.push(isProvider ? '/owner' : returnPath);
    router.refresh();
  };

  return (
    <AuthCard
      title={isProvider ? 'List on Halo' : 'Create your account'}
      subtitle={
        isProvider
          ? 'Studios, rental houses and film crews from any country Halo serves can join. Your storefront goes live once your country team approves it.'
          : 'Book studios, rent gear and request filming quotes near you.'
      }
      error={errorMessage}
      footer={
        <>
          Already have an account?{' '}
          <Link
            href={nextParam ? `/signin?next=${encodeURIComponent(nextParam)}` : '/signin'}
            className="font-semibold text-halo-ink underline underline-offset-2 min-h-0 min-w-0"
          >
            Sign in
          </Link>
        </>
      }
    >
      {/* Account type */}
      <div className="mb-6 grid grid-cols-2 gap-1 rounded-xl bg-halo-ink/[0.05] p-1" role="radiogroup" aria-label="Account type">
        {[
          { value: 'renter', label: 'I want to book' },
          { value: 'provider', label: 'I want to list' },
        ].map((t) => (
          <button
            key={t.value}
            type="button"
            role="radio"
            aria-checked={accountType === t.value}
            onClick={() => setAccountType(t.value)}
            className={`rounded-lg text-sm font-semibold min-h-[40px] transition-colors ${
              accountType === t.value ? 'bg-halo-surface text-halo-ink shadow-sm' : 'text-halo-text-muted hover:text-halo-ink'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {ACCOUNT_FIELDS.map((f) => (
          <TextField
            key={f.key}
            id={`signup-${f.key}`}
            label={f.label}
            type={f.type}
            autoComplete={f.autoComplete}
            placeholder={f.placeholder}
            value={form[f.key]}
            onChange={set(f.key)}
          />
        ))}

        <Select
          label="Country"
          value={form.country}
          onChange={(v) => setForm((f) => ({ ...f, country: v, region: '', city: '', neighbourhood: '' }))}
          options={[{ value: '', label: 'Choose your country' }, ...COUNTRY_OPTIONS]}
          buttonClassName={selectButton}
        />

        <div>
          <label htmlFor="signup-phone" className="block text-sm font-medium text-halo-ink mb-1.5">
            Phone number
          </label>
          <PhoneInput
            id="signup-phone"
            value={form.phone}
            onChange={set('phone')}
            defaultCountry={form.country}
            required
            inputClassName={authInputClass}
            selectClassName="min-h-[48px]"
          />
        </div>

        {isProvider && (
          <>
            <div className="pt-2 border-t border-halo-border" />
            <TextField
              id="signup-business"
              label="Business name"
              placeholder="As customers will see it"
              value={form.businessName}
              onChange={set('businessName')}
            />
            <div className="grid grid-cols-2 gap-3">
              <Select
                label="Region"
                value={form.region}
                onChange={(v) => setForm((f) => ({ ...f, region: v, city: '', neighbourhood: '' }))}
                options={[
                  { value: '', label: !form.country ? 'Country first' : placesLoading ? 'Loading' : 'Choose' },
                  ...regions.map((r) => ({ value: r, label: r })),
                ]}
                buttonClassName={selectButton}
              />
              <Select
                label="City"
                value={form.city}
                onChange={setCity}
                options={[{ value: '', label: form.region ? 'Choose' : 'Region first' }, ...cities.map((c) => ({ value: c, label: c }))]}
                buttonClassName={selectButton}
              />
            </div>
            <div>
              <label htmlFor="signup-area" className="block text-sm font-medium text-halo-ink mb-1.5">
                Neighbourhood or area
              </label>
              <AreaSearch
                id="signup-area"
                value={form.neighbourhood}
                onChange={set('neighbourhood')}
                onPick={(place) => setForm((f) => ({ ...f, latitude: place.lat, longitude: place.lng }))}
                city={form.city}
                coords={coords}
                required
                className={authInputClass}
              />
            </div>
          </>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-xl bg-halo-ink py-3 text-[15px] font-semibold text-white hover:bg-halo-ink-soft disabled:opacity-60 min-h-[48px]"
        >
          {isSubmitting ? 'Creating account' : isProvider ? 'Create provider account' : 'Create account'}
        </button>
      </form>
    </AuthCard>
  );
}

export default function SignUpPage() {
  return (
    <Suspense fallback={<div className="min-h-[60vh]" aria-busy="true" />}>
      <SignUpContent />
    </Suspense>
  );
}
