'use client';

import Link from 'next/link';
import {
  CalendarDays,
  ClipboardList,
  ExternalLink,
  Images,
  Inbox,
  LayoutDashboard,
  LayoutGrid,
  ShieldAlert,
  ShoppingBag,
  Star,
  Store,
  Wallet,
} from 'lucide-react';
import { Header } from '@/components/ui/Header';
import { RequireRole } from '@/components/ui/RequireRole';
import { DashboardShell } from '@/components/dashboard/DashboardShell';

const ownerLinks = [
  { href: '/owner', label: 'Overview', icon: LayoutDashboard, exact: true },
  { href: '/owner/bookings', label: 'Bookings', icon: ClipboardList },
  { href: '/owner/requests', label: 'Quote requests', icon: Inbox },
  { href: '/owner/sales', label: 'Sales', icon: ShoppingBag },
  { href: '/owner/calendar', label: 'Calendar', icon: CalendarDays },
  { href: '/owner/listings', label: 'Listings', icon: LayoutGrid },
  { href: '/owner/portfolio', label: 'Portfolio', icon: Images },
  { href: '/owner/earnings', label: 'Earnings', icon: Wallet },
  { href: '/owner/reviews', label: 'Reviews', icon: Star },
  { href: '/owner/disputes', label: 'Disputes', icon: ShieldAlert },
  { href: '/owner/provider', label: 'Storefront settings', icon: Store },
];

/**
 * Provider dashboard layout, for accounts with the owner role.
 * @param {{ children: React.ReactNode }} props
 */
export default function OwnerLayout({ children }) {
  return (
    <RequireRole role="owner">
      <Header />
      <DashboardShell
        area="Provider dashboard"
        links={ownerLinks}
        footer={
          <Link
            href="/studios"
            className="flex items-center gap-3 rounded-lg px-3 text-sm text-halo-text-muted hover:text-halo-ink min-h-[40px]"
          >
            <ExternalLink className="h-[18px] w-[18px]" strokeWidth={1.8} aria-hidden="true" />
            View public site
          </Link>
        }
      >
        {children}
      </DashboardShell>
    </RequireRole>
  );
}
