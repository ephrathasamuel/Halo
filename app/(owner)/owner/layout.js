'use client';

import { Header } from '@/components/ui/Header';
import { Footer } from '@/components/ui/Footer';
import { RequireRole } from '@/components/ui/RequireRole';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const ownerLinks = [
  { href: '/owner', label: 'Overview' },
  { href: '/owner/provider', label: 'Storefront' },
  { href: '/owner/portfolio', label: 'Portfolio' },
  { href: '/owner/listings', label: 'Listings' },
  { href: '/owner/bookings', label: 'Bookings' },
  { href: '/owner/requests', label: 'Requests' },
  { href: '/owner/calendar', label: 'Calendar' },
  { href: '/owner/earnings', label: 'Earnings' },
  { href: '/owner/reviews', label: 'Reviews' },
  { href: '/owner/disputes', label: 'Disputes' },
];

/**
 * Owner panel layout protected with RequireRole('owner').
 * Includes owner sidebar navigation.
 * @param {{ children: React.ReactNode }} props
 */
export default function OwnerLayout({ children }) {
  const pathname = usePathname();

  return (
    <RequireRole role="owner">
      <Header />
      <div className="flex-1 flex flex-col md:flex-row">
        <aside className="w-full md:w-56 bg-gray-50 border-b md:border-b-0 md:border-r border-halo-border">
          <nav className="p-4" aria-label="Owner navigation">
            <h2 className="text-sm font-semibold text-halo-text-muted uppercase tracking-wider mb-3">Owner Panel</h2>
            <ul className="space-y-1">
              {ownerLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={`block px-3 py-2 rounded-md text-sm min-h-[44px] flex items-center ${
                      pathname === link.href
                        ? 'bg-halo-primary text-white'
                        : 'text-halo-text hover:bg-gray-100'
                    }`}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </aside>
        <main className="flex-1 p-4 md:p-8">{children}</main>
      </div>
      <Footer />
    </RequireRole>
  );
}
