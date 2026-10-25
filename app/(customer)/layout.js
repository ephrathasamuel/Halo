'use client';

import { usePathname } from 'next/navigation';
import { ClipboardList, Clapperboard, LayoutDashboard, ShoppingBag, UserRound } from 'lucide-react';
import { Header } from '@/components/ui/Header';
import { Footer } from '@/components/ui/Footer';
import { DashboardShell } from '@/components/dashboard/DashboardShell';

const customerLinks = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard, exact: true },
  { href: '/bookings', label: 'Bookings', icon: ClipboardList },
  { href: '/events', label: 'Event quotes', icon: Clapperboard },
  { href: '/purchases', label: 'Purchases', icon: ShoppingBag },
  { href: '/account', label: 'Profile', icon: UserRound },
];

/**
 * Customer area layout. Checkout is a focused page without the dashboard sidebar.
 * @param {{ children: React.ReactNode }} props
 */
export default function CustomerLayout({ children }) {
  const pathname = usePathname();

  if (pathname.startsWith('/checkout')) {
    return (
      <>
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <DashboardShell area="My account" links={customerLinks}>
        {children}
      </DashboardShell>
    </>
  );
}
