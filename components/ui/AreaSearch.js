'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { Loader2, MapPin } from 'lucide-react';
import { searchPlaces } from '@/lib/places';

/**
 * Neighbourhood or area field with live suggestions from the chosen city.
 * Typing a name that isn't suggested still works; picking a suggestion also
 * passes its map position, so the storefront map shows the right spot.
 * @param {{
 *   id: string,
 *   value: string,
 *   onChange: (value: string) => void,
 *   onPick?: (place: import('@/lib/places').Place) => void,
 *   city: string,
 *   coords?: { lat: number, lng: number } | null,
 *   required?: boolean,
 *   className?: string
 * }} props
 */
export function AreaSearch({ id, value, onChange, onPick, city, coords, required = false, className = '' }) {
  const listId = useId();
  const rootRef = useRef(null);
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [status, setStatus] = useState('idle'); // idle | loading | error
  const [typed, setTyped] = useState(false); // only search what the person typed

  const lat = coords?.lat;
  const lng = coords?.lng;

  // Search 300 ms after typing stops, cancelling any older request
  useEffect(() => {
    if (!typed || !city || String(value).trim().length < 2) {
      setResults([]);
      setStatus('idle');
      return undefined;
    }
    const controller = new AbortController();
    const timer = setTimeout(() => {
      setStatus('loading');
      searchPlaces(value, { city, coords: lat != null ? { lat, lng } : null, signal: controller.signal })
        .then((places) => {
          setResults(places);
          setActive(-1);
          setStatus('idle');
        })
        .catch((err) => {
          if (err.name !== 'AbortError') setStatus('error');
        });
    }, 300);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [value, typed, city, lat, lng]);

  useEffect(() => {
    if (!open) return undefined;
    const onPointer = (e) => {
      if (!rootRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener('pointerdown', onPointer);
    return () => document.removeEventListener('pointerdown', onPointer);
  }, [open]);

  const pick = (place) => {
    onChange(place.name);
    onPick?.(place);
    setTyped(false);
    setOpen(false);
  };

  const onKeyDown = (e) => {
    if (!open || results.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => Math.min(results.length - 1, i + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(0, i - 1));
    } else if (e.key === 'Enter' && active >= 0) {
      e.preventDefault();
      pick(results[active]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  const showList = open && typed && (results.length > 0 || status !== 'idle');

  return (
    <div ref={rootRef} className="relative">
      <input
        id={id}
        type="text"
        role="combobox"
        aria-expanded={showList}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
        autoComplete="off"
        required={required}
        disabled={!city}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setTyped(true);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        placeholder={city ? `Search areas in ${city}` : 'Choose a city first'}
        className={`${className} pr-9 disabled:cursor-not-allowed disabled:opacity-60`}
      />
      {status === 'loading' && (
        <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-halo-text-muted" aria-hidden="true" />
      )}

      {showList && (
        <div className="absolute z-50 mt-2 w-full overflow-hidden rounded-2xl border border-halo-border bg-halo-surface shadow-[0_12px_40px_rgba(0,0,0,0.16)]">
          <ul id={listId} role="listbox" className="max-h-72 overflow-y-auto p-1.5">
            {results.map((place, i) => (
              <li
                key={`${place.name}-${place.detail}`}
                id={`${listId}-${i}`}
                role="option"
                aria-selected={i === active}
                onPointerEnter={() => setActive(i)}
                onClick={() => pick(place)}
                className={`flex cursor-pointer items-start gap-2.5 rounded-xl px-3 py-2.5 ${i === active ? 'bg-halo-ink/[0.06]' : ''}`}
              >
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-halo-text-muted" aria-hidden="true" />
                <span className="min-w-0">
                  <span className="block truncate text-[15px] text-halo-ink">{place.name}</span>
                  {place.detail && <span className="block truncate text-[13px] text-halo-text-muted">{place.detail}</span>}
                </span>
              </li>
            ))}
            {status === 'loading' && results.length === 0 && (
              <li className="px-3 py-2.5 text-[15px] text-halo-text-muted">Searching...</li>
            )}
            {status === 'error' && (
              <li className="px-3 py-2.5 text-[15px] text-halo-text-muted">Search is unavailable. Type the area name instead.</li>
            )}
          </ul>
          <p className="border-t border-halo-border px-4 py-1.5 text-[11px] text-halo-text-muted">Places from OpenStreetMap</p>
        </div>
      )}
    </div>
  );
}
