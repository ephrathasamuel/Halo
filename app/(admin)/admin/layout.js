'use client';

import {
  BarChart3,
  ClipboardList,
  Globe2,
  LayoutDashboard,
  LayoutGrid,
  Megaphone,
  Scale,
  Store,
  Users,
} from 'lucide-react';
import { Header } from '@/components/ui/Header';
import { RequireRole } from '@/components/ui/RequireRole';
import { DashboardShell } from '@/components/dashboard/DashboardShell';
import { useAdminScope } from '@/hooks/useAdminScope';

const COMMON_LINKS = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard, exact: true },
  { href: '/admin/providers', label: 'Providers', icon: Store },
  { href: '/admin/listings', label: 'Listings', icon: LayoutGrid },
  { href: '/admin/users', label: 'Customers and users', icon: Users },
  { href: '/admin/bookings', label: 'Bookings', icon: ClipboardList },
  { href: '/admin/disputes', label: 'Disputes', icon: Scale },
  { href: '/admin/reports', label: 'Reports', icon: BarChart3 },
];

// Only global admins manage regional admins and site-wide announcements
const GLOBAL_LINKS = [
  { href: '/admin/team', label: 'Regional admins', icon: Globe2 },
  { href: '/admin/announcements', label: 'Announcements', icon: Megaphone },
];

function AdminShell({ children }) {
  const { isGlobal, label } = useAdminScope();
  return (
    <DashboardShell
      area={isGlobal ? 'Halo admin, all countries' : `Halo admin, ${label}`}
      links={isGlobal ? [...COMMON_LINKS, ...GLOBAL_LINKS] : COMMON_LINKS}
    >
      {children}
    </DashboardShell>
  );
}

/**
 * Admin layout for global admins and regional (country) admins.
 * Each page only shows data inside the admin's scope; see hooks/useAdminScope.js.
 * @param {{ children: React.ReactNode }} props
 */
export default function AdminLayout({ children }) {
  return (
    <RequireRole role={['admin', 'regional_admin']}>
      <Header />
      <AdminShell>{children}</AdminShell>
    </RequireRole>
  );
}
