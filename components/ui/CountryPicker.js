'use client';

import { Globe } from 'lucide-react';
import { COUNTRIES } from '@/lib/geo';
import { useCountry } from '@/hooks/useCountry';
import { Select } from '@/components/ui/Select';

const OPTIONS = [{ value: '', label: 'All countries' }, ...COUNTRIES.map((c) => ({ value: c.code, label: c.name }))];

/**
 * Country the visitor is browsing. Sets which providers, prices and cities they see.
 * @param {{ className?: string, buttonClassName?: string, align?: 'left' | 'right' }} props
 */
export function CountryPicker({ className = '', buttonClassName = '', align = 'right' }) {
  const { country, setCountry } = useCountry();

  // Same footprint before the country is known, so the header doesn't shift
  if (country === null) return <span className={`inline-block h-10 w-32 ${className}`} aria-hidden="true" />;

  return (
    <Select
      label="Country"
      hideLabel
      align={align}
      icon={Globe}
      value={country}
      onChange={setCountry}
      options={OPTIONS}
      className={className}
      buttonClassName={`min-h-[40px] gap-2 px-3 rounded-lg text-sm font-medium text-halo-ink hover:bg-halo-ink/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-gold ${buttonClassName}`}
    />
  );
}
