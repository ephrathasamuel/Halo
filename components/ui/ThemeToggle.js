'use client';

import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

export const THEME_STORAGE_KEY = 'halo-theme';

/**
 * Runs in <head> before the page paints, so a saved dark theme never flashes white.
 * Without a saved choice it follows the device setting.
 */
export const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem('${THEME_STORAGE_KEY}');var d=t?t==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;if(d)document.documentElement.classList.add('dark');}catch(e){}})();`;

/**
 * Sun/moon button that switches between light and dark and remembers the choice.
 * @param {{ className?: string, withLabel?: boolean }} props
 */
export function ThemeToggle({ className = '', withLabel = false }) {
  // Unknown until mounted: the server can't know the visitor's theme
  const [isDark, setIsDark] = useState(null);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'));
  }, []);

  const toggle = () => {
    const next = !document.documentElement.classList.contains('dark');
    document.documentElement.classList.toggle('dark', next);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next ? 'dark' : 'light');
    } catch {
      // storage blocked: the theme still changes for this page
    }
    setIsDark(next);
  };

  const label = isDark ? 'Switch to light theme' : 'Switch to dark theme';
  const Icon = isDark ? Sun : Moon;

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={withLabel ? undefined : label}
      title={label}
      className={`inline-flex items-center gap-2 rounded-lg text-halo-text-muted hover:text-halo-ink hover:bg-halo-ink/[0.05] min-h-[40px] min-w-[40px] justify-center ${className}`}
    >
      {/* Keep the icon slot the same size before the theme is known */}
      {isDark === null ? <span className="h-[18px] w-[18px]" /> : <Icon className="h-[18px] w-[18px]" aria-hidden="true" />}
      {withLabel && <span className="text-[15px] font-medium text-halo-ink">{isDark ? 'Light theme' : 'Dark theme'}</span>}
    </button>
  );
}
