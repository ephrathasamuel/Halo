'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';

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
 *   icon?: import('react').ComponentType<{ className?: string }>
 * }} props
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
}) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const rootRef = useRef(null);
  const listRef = useRef(null);
  const buttonRef = useRef(null);

  const selectedIndex = Math.max(0, options.findIndex((o) => o.value === value));
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
    if (open) listRef.current?.focus();
  }, [open]);

  // Long lists scroll: keep the keyboard-highlighted option visible
  useEffect(() => {
    if (open) document.getElementById(`${id}-opt-${active}`)?.scrollIntoView({ block: 'nearest' });
  }, [open, active, id]);

  const openMenu = () => {
    setActive(selectedIndex);
    setOpen(true);
  };

  const choose = (index) => {
    onChange(options[index].value);
    setOpen(false);
    buttonRef.current?.focus();
  };

  const onListKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => Math.min(options.length - 1, i + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(0, i - 1));
    } else if (e.key === 'Home') {
      e.preventDefault();
      setActive(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      setActive(options.length - 1);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      choose(active);
    } else if (e.key === 'Escape' || e.key === 'Tab') {
      setOpen(false);
      if (e.key === 'Escape') buttonRef.current?.focus();
    } else if (e.key.length === 1) {
      const next = options.findIndex((o) => o.label.toLowerCase().startsWith(e.key.toLowerCase()));
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
        onClick={() => (open ? setOpen(false) : openMenu())}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            e.preventDefault();
            openMenu();
          }
        }}
        className={`flex w-full items-center justify-between gap-2 text-left text-[15px] text-halo-ink ${buttonClassName}`}
      >
        {Icon && <Icon className="h-4 w-4 shrink-0 text-halo-text-muted" aria-hidden="true" />}
        <span id={`${id}-value`} className="truncate flex-1">
          {selected?.label}
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-halo-text-muted transition-transform ${open ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>

      {open && (
        <ul
          ref={listRef}
          role="listbox"
          tabIndex={-1}
          aria-labelledby={`${id}-label`}
          aria-activedescendant={`${id}-opt-${active}`}
          onKeyDown={onListKeyDown}
          className={`absolute z-50 mt-2 min-w-full w-max max-w-[18rem] max-h-80 overflow-y-auto rounded-2xl border border-halo-border bg-halo-surface p-1.5 shadow-[0_12px_40px_rgba(0,0,0,0.16)] focus:outline-none ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
        >
          {options.map((o, i) => {
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
        </ul>
      )}
    </div>
  );
}
