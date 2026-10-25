import Link from 'next/link';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';
import { statusLabel, statusTone } from '@/lib/status';

/*
 * Small building blocks shared by the owner, admin and customer dashboards,
 * so every panel, number and badge looks the same across the three areas.
 */

export const btn = {
  primary:
    'inline-flex items-center justify-center gap-2 px-4 rounded-xl bg-halo-ink text-white text-sm font-semibold hover:bg-halo-ink-soft disabled:opacity-50 transition-colors min-h-[40px]',
  secondary:
    'inline-flex items-center justify-center gap-2 px-4 rounded-xl border border-halo-border-strong bg-white text-halo-ink text-sm font-semibold hover:border-halo-ink disabled:opacity-50 transition-colors min-h-[40px]',
  danger:
    'inline-flex items-center justify-center gap-2 px-4 rounded-xl border border-red-200 bg-white text-red-700 text-sm font-semibold hover:bg-red-50 disabled:opacity-50 transition-colors min-h-[40px]',
};

/**
 * Page title row with optional actions on the right.
 * @param {{ title: string, description?: import('react').ReactNode, actions?: import('react').ReactNode, children?: import('react').ReactNode }} props
 */
export function PageHeader({ title, description, actions, children }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
      <div className="min-w-0">
        <h1 className="text-2xl sm:text-3xl font-semibold text-halo-ink">{title}</h1>
        {description && <p className="mt-1 text-halo-text-muted">{description}</p>}
        {children}
      </div>
      {actions && <div className="flex flex-wrap gap-2 shrink-0">{actions}</div>}
    </div>
  );
}

/**
 * One number with a label. Neutral by default; `tone="attention"` when it needs action.
 * @param {{ label: string, value: import('react').ReactNode, hint?: string, href?: string, tone?: 'default' | 'attention' }} props
 */
export function StatCard({ label, value, hint, href, tone = 'default' }) {
  const body = (
    <>
      <p className="text-sm text-halo-text-muted">{label}</p>
      <p className={`mt-1 text-xl sm:text-2xl font-semibold tabular ${tone === 'attention' ? 'text-amber-700' : 'text-halo-ink'}`}>
        {value}
      </p>
      {hint && <p className="mt-0.5 text-[13px] text-halo-text-muted">{hint}</p>}
    </>
  );
  const cls = 'block rounded-2xl border border-halo-border bg-white p-5';
  return href ? (
    <Link href={href} className={`${cls} hover:border-halo-border-strong transition-colors`}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}

/**
 * White section with an optional title row.
 * @param {{ title?: string, description?: string, action?: import('react').ReactNode, children: import('react').ReactNode, className?: string, flush?: boolean }} props
 */
export function Panel({ title, description, action, children, className = '', flush = false }) {
  return (
    <section className={`rounded-2xl border border-halo-border bg-white ${className}`}>
      {(title || action) && (
        <div className="flex items-start justify-between gap-4 px-5 pt-5 sm:px-6">
          <div>
            {title && <h2 className="text-lg font-semibold text-halo-ink">{title}</h2>}
            {description && <p className="mt-0.5 text-sm text-halo-text-muted">{description}</p>}
          </div>
          {action && <div className="shrink-0 whitespace-nowrap">{action}</div>}
        </div>
      )}
      <div className={flush ? 'mt-3' : 'p-5 sm:p-6'}>{children}</div>
    </section>
  );
}

/**
 * Status pill using the shared status colours.
 * @param {{ status: string, label?: string }} props
 */
export function StatusBadge({ status, label }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusTone(status)}`}>
      {label || statusLabel(status)}
    </span>
  );
}

/**
 * Inline success or error message with an optional dismiss button.
 * @param {{ tone: 'success' | 'error', children: import('react').ReactNode, onDismiss?: () => void }} props
 */
export function Notice({ tone, children, onDismiss }) {
  const Icon = tone === 'error' ? AlertCircle : CheckCircle2;
  return (
    <div
      className={`flex items-start gap-2.5 rounded-xl px-4 py-3 text-sm ${
        tone === 'error' ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-800'
      }`}
      role={tone === 'error' ? 'alert' : 'status'}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <div className="flex-1">{children}</div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="-my-2 -mr-2 rounded-lg opacity-70 hover:opacity-100 min-h-[36px] min-w-[36px] flex items-center justify-center"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
