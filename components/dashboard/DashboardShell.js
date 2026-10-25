'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

/**
 * Two-column dashboard frame: icon sidebar on desktop, scrolling tabs on phones.
 * @param {{
 *   area: string,
 *   links: Array<{ href: string, label: string, icon: import('react').ComponentType<{ className?: string }>, exact?: boolean }>,
 *   footer?: import('react').ReactNode,
 *   children: import('react').ReactNode
 * }} props
 */
export function DashboardShell({ area, links, footer, children }) {
  const pathname = usePathname();
  const isActive = (link) =>
    link.exact ? pathname === link.href : pathname === link.href || pathname.startsWith(`${link.href}/`);

  return (
    <div className="flex-1 flex flex-col lg:flex-row">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-60 shrink-0 flex-col border-r border-halo-border bg-white">
        <nav className="sticky top-16 p-4" aria-label={`${area} navigation`}>
          <p className="px-3 pb-3 text-xs font-medium text-halo-text-muted">{area}</p>
          <ul className="space-y-0.5">
            {links.map((link) => {
              const active = isActive(link);
              const Icon = link.icon;
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    aria-current={active ? 'page' : undefined}
                    className={`flex items-center gap-3 rounded-lg px-3 text-sm min-h-[40px] transition-colors ${
                      active
                        ? 'bg-halo-ink/[0.05] font-semibold text-halo-ink'
                        : 'text-halo-text-muted hover:bg-halo-ink/[0.03] hover:text-halo-ink'
                    }`}
                  >
                    <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={active ? 2.2 : 1.8} aria-hidden="true" />
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>
          {footer && <div className="mt-6 border-t border-halo-border pt-4">{footer}</div>}
        </nav>
      </aside>

      {/* Phone and tablet tabs */}
      <nav
        className="lg:hidden sticky top-16 z-30 border-b border-halo-border bg-white/95 backdrop-blur"
        aria-label={`${area} navigation`}
      >
        <ul className="flex gap-1 overflow-x-auto no-scrollbar px-4">
          {links.map((link) => {
            const active = isActive(link);
            return (
              <li key={link.href} className="shrink-0">
                <Link
                  href={link.href}
                  aria-current={active ? 'page' : undefined}
                  className={`flex items-center border-b-2 px-2.5 text-sm min-h-[46px] ${
                    active ? 'border-halo-ink font-semibold text-halo-ink' : 'border-transparent text-halo-text-muted'
                  }`}
                >
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <main className="flex-1 min-w-0 px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
