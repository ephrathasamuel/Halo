import { AlertCircle } from 'lucide-react';

export const authInputClass =
  'w-full px-3.5 min-h-[48px] rounded-xl border border-halo-border-strong bg-halo-surface text-[15px] text-halo-ink placeholder:text-halo-text-muted focus:border-halo-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-halo-gold';

/**
 * Narrow centred card used by sign-in and sign-up.
 * @param {{ title: string, subtitle?: string, error?: string, children: import('react').ReactNode, footer?: import('react').ReactNode }} props
 */
export function AuthCard({ title, subtitle, error, children, footer }) {
  return (
    <div className="px-4 py-12 sm:py-20">
      <div className="mx-auto w-full max-w-[420px]">
        <h1 className="text-3xl font-semibold text-halo-ink">{title}</h1>
        {subtitle && <p className="mt-2 text-halo-text-muted">{subtitle}</p>}

        {error && (
          <p className="mt-6 flex items-start gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-halo-error" role="alert">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            {error}
          </p>
        )}

        <div className="mt-8">{children}</div>

        {footer && <div className="mt-8 border-t border-halo-border pt-6 text-sm text-halo-text-muted">{footer}</div>}
      </div>
    </div>
  );
}
