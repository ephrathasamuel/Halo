'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { Check, ChevronDown, Search } from 'lucide-react';

/** Long lists get a search box; past this many matches only the first are drawn */
const SEARCH_FROM = 12;
const MAX_SHOWN = 200;

/** Lower case without accents, so "mekele" finds "Mek'ele" and "afar" finds "Āfar" */
const fold = (text) =>
  String(text)
    .normalize('NFD')
    .replace(/[̀-ͯ'’]/g, '')
    .toLowerCase();

/**
 * Dropdown with a soft, rounded menu. The browser's own <select> list can't be
 * styled, so this renders a button plus a listbox and handles the keyboard itself:
 * arrows move, Enter/Space choose, Escape closes, typing a letter jumps to it.
 * @param {{
 *   value: string,
 *   onChange: (value: string) => void,
 *   options: Array<{ value: string, label: string }>,
 *   label: string,
 *   hideLabel?: boolean,
 *   className?: string,
 *   buttonClassName?: string,
 *   align?: 'left' | 'right',
 *   icon?: import('react').ComponentType<{ className?: string }>,
 *   searchable?: boolean,
 *   valueLabel?: string,
 *   disabled?: boolean
 * }} props
 * `searchable` defaults to on for lists longer than 12. `valueLabel` replaces the
 * chosen option's label on the button (PhoneInput shows "+251", not the country).
 */
export function Select({
  value,
  onChange,
  options,
  label,
  hideLabel = false,
  className = '',
  buttonClassName = '',
  align = 'left',
  icon: Icon,
  searchable,
  disabled = false,
  valueLabel,
}) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const rootRef = useRef(null);
  const listRef = useRef(null);
  const buttonRef = useRef(null);
  const searchRef = useRef(null);
  const [query, setQuery] = useState('');
  const withSearch = searchable ?? options.length > SEARCH_FROM;

  const matches = query ? options.filter((o) => fold(o.label).includes(fold(query))) : options;
  const shown = matches.slice(0, MAX_SHOWN);

  const selectedIndex = Math.max(
    0,
    options.findIndex((o) => o.value === value)
  );
  const selected = options[selectedIndex];

  // Close when clicking anywhere else
  useEffect(() => {
    if (!open) return undefined;
    const onPointer = (e) => {
      if (!rootRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener('pointerdown', onPointer);
    return () => document.removeEventListener('pointerdown', onPointer);
  }, [open]);

  useEffect(() => {
    if (open) (withSearch ? searchRef.current : listRef.current)?.focus();
  }, [open, withSearch]);

  // Long lists scroll: keep the keyboard-highlighted option visible
  useEffect(() => {
    if (open) document.getElementById(`${id}-opt-${active}`)?.scrollIntoView({ block: 'nearest' });
  }, [open, active, id]);

  const openMenu = () => {
    if (disabled) return;
    setQuery('');
    setActive(Math.min(selectedIndex, MAX_SHOWN - 1));
    setOpen(true);
  };

  const choose = (index) => {
    if (!shown[index]) return;
    onChange(shown[index].value);
    setOpen(false);
    buttonRef.current?.focus();
  };

  const onListKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => Math.min(shown.length - 1, i + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(0, i - 1));
    } else if (e.key === 'Home') {
      e.preventDefault();
      setActive(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      setActive(shown.length - 1);
    } else if (e.key === 'Enter' || (e.key === ' ' && e.target !== searchRef.current)) {
      e.preventDefault();
      choose(active);
    } else if (e.key === 'Escape' || e.key === 'Tab') {
      setOpen(false);
      if (e.key === 'Escape') buttonRef.current?.focus();
    } else if (e.key.length === 1 && e.target !== searchRef.current) {
      const next = shown.findIndex((o) => o.label.toLowerCase().startsWith(e.key.toLowerCase()));
      if (next >= 0) setActive(next);
    }
  };

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <span id={`${id}-label`} className={hideLabel ? 'sr-only' : 'block text-xs font-medium text-halo-text-muted mb-1'}>
        {label}
      </span>
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-labelledby={`${id}-label ${id}-value`}
        disabled={disabled}
        onClick={() => (open ? setOpen(false) : openMenu())}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            e.preventDefault();
            openMenu();
          }
        }}
        className={`flex w-full items-center justify-between gap-2 text-left text-[15px] text-halo-ink disabled:cursor-not-allowed disabled:opacity-60 ${buttonClassName}`}
      >
        {Icon && <Icon className="h-4 w-4 shrink-0 text-halo-text-muted" aria-hidden="true" />}
        <span id={`${id}-value`} className="truncate flex-1">
          {valueLabel ?? selected?.label}
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-halo-text-muted transition-transform ${open ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>

      {open && (
        <div
          className={`absolute z-50 mt-2 min-w-full w-max max-w-[18rem] overflow-hidden rounded-2xl border border-halo-border bg-halo-surface shadow-[0_12px_40px_rgba(0,0,0,0.16)] ${
            align === 'right' ? 'right-0' : 'left-0'
          } ${withSearch ? 'min-w-[16rem]' : ''}`}
        >
          {withSearch && (
            <div className="relative border-b border-halo-border p-1.5">
              <Search
                className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-halo-text-muted"
                aria-hidden="true"
              />
              <input
                ref={searchRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActive(0);
                }}
                onKeyDown={onListKeyDown}
                placeholder={`Search ${label.toLowerCase()}`}
                aria-label={`Search ${label.toLowerCase()}`}
                aria-controls={`${id}-list`}
                aria-activedescendant={shown.length ? `${id}-opt-${active}` : undefined}
                className="w-full min-h-[40px] rounded-xl bg-halo-ink/[0.04] pl-9 pr-3 text-[15px] text-halo-ink placeholder:text-halo-text-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-halo-gold"
              />
            </div>
          )}
          <ul
            ref={listRef}
            id={`${id}-list`}
            role="listbox"
            tabIndex={-1}
            aria-labelledby={`${id}-label`}
            aria-activedescendant={`${id}-opt-${active}`}
            onKeyDown={onListKeyDown}
            className="max-h-80 overflow-y-auto p-1.5 focus:outline-none"
          >
            {shown.length === 0 && <li className="px-3 py-2.5 text-[15px] text-halo-text-muted">No matches</li>}
            {shown.map((o, i) => {
              const isSelected = o.value === value;
              return (
                <li
                  key={o.value || 'all'}
                  id={`${id}-opt-${i}`}
                  role="option"
                  aria-selected={isSelected}
                  onPointerEnter={() => setActive(i)}
                  onClick={() => choose(i)}
                  className={`flex cursor-pointer items-center justify-between gap-6 rounded-xl px-3 py-2.5 text-[15px] ${
                    i === active ? 'bg-halo-ink/[0.06]' : ''
                  } ${isSelected ? 'font-semibold text-halo-ink' : 'text-halo-ink'}`}
                >
                  {o.label}
                  {isSelected && <Check className="h-4 w-4 text-halo-gold-ink" aria-hidden="true" />}
                </li>
              );
            })}
            {matches.length > MAX_SHOWN && <li className="px-3 py-2 text-[13px] text-halo-text-muted">Type to see more</li>}
          </ul>
        </div>
      )}
    </div>
  );
}
