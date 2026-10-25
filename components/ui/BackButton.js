'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

const DEPTH_KEY = 'halo-nav-depth';

function readDepth() {
  try {
    return Number(sessionStorage.getItem(DEPTH_KEY)) || 0;
  } catch {
    return 0;
  }
}

/**
 * Counts in-app page changes for this tab, so BackButton knows whether there is
 * a Halo page to go back to. Rendered once in the root layout.
 */
export function NavigationTracker() {
  const pathname = usePathname();
  useEffect(() => {
    try {
      sessionStorage.setItem(DEPTH_KEY, String(readDepth() + 1));
    } catch {
      // storage blocked: BackButton falls back to its link
    }
  }, [pathname]);
  return null;
}

/**
 * "Back" that returns to where the visitor came from inside Halo. Someone who
 * landed here from a shared link (no Halo page behind them) goes to `fallback`
 * instead of leaving the site.
 * @param {{ fallback: string, label?: string, className?: string }} props
 */
export function BackButton({ fallback, label = 'Back', className = '' }) {
  const router = useRouter();

  const goBack = () => {
    if (readDepth() > 1) router.back();
    else router.push(fallback);
  };

  return (
    <button
      type="button"
      onClick={goBack}
      className={`inline-flex items-center gap-1.5 pl-3 pr-4 rounded-xl border border-halo-border-strong bg-halo-surface text-sm font-medium text-halo-ink shadow-sm transition-colors hover:border-halo-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-gold min-h-[40px] ${className}`}
    >
      <ArrowLeft className="h-4 w-4" aria-hidden="true" />
      {label}
    </button>
  );
}
