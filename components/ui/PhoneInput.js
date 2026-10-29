'use client';

import { useEffect, useState } from 'react';
import { COUNTRIES, getCountry } from '@/lib/geo';
import { joinPhone, splitPhone } from '@/lib/phone';
import { Select } from '@/components/ui/Select';

const DIAL_OPTIONS = COUNTRIES.filter((c) => c.dial).map((c) => ({ value: c.code, label: `${c.name} +${c.dial}` }));

/**
 * Phone number with a searchable country code in front of it. The value is one
 * string, "+251 911234567", so forms and storage need no changes.
 * @param {{
 *   id: string,
 *   value: string,
 *   onChange: (value: string) => void,
 *   defaultCountry?: string,
 *   required?: boolean,
 *   autoComplete?: string,
 *   inputClassName?: string,
 *   selectClassName?: string
 * }} props
 */
export function PhoneInput({
  id,
  value,
  onChange,
  defaultCountry = '',
  required = false,
  autoComplete = 'tel-national',
  inputClassName = '',
  selectClassName = '',
}) {
  // The code is kept separately, so +1 stays the United States or Canada as picked
  const [country, setCountry] = useState(() => splitPhone(value, defaultCountry).country || defaultCountry || 'ET');
  const { local } = splitPhone(value, country);

  // Choosing a country elsewhere in the form moves the code too, until a number is typed
  useEffect(() => {
    if (defaultCountry && !value) setCountry(defaultCountry);
  }, [defaultCountry, value]);
  const dial = getCountry(country)?.dial;

  return (
    <div className="flex gap-2">
      <Select
        label="Country code"
        hideLabel
        value={country}
        valueLabel={dial ? `+${dial}` : 'Code'}
        onChange={(code) => {
          setCountry(code);
          onChange(joinPhone(code, local));
        }}
        options={DIAL_OPTIONS}
        searchable
        className="shrink-0"
        buttonClassName={`min-h-[44px] gap-1.5 px-3 rounded-xl border border-halo-border-strong bg-halo-surface text-[15px] tabular hover:border-halo-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-gold ${selectClassName}`}
      />
      <input
        id={id}
        type="tel"
        inputMode="tel"
        autoComplete={autoComplete}
        required={required}
        value={local}
        onChange={(e) => onChange(joinPhone(country, e.target.value))}
        placeholder="Phone number"
        className={`min-w-0 flex-1 ${inputClassName}`}
      />
    </div>
  );
}
