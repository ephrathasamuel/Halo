'use client';

import { Header } from '@/components/ui/Header';
import { Footer } from '@/components/ui/Footer';
import { RequireRole } from '@/components/ui/RequireRole';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const adminLinks = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/providers', label: 'Providers' },
  { href: '/admin/listings', label: 'Listings' },
  { href: '/admin/users', label: 'Users' },
  { href: '/admin/bookings', label: 'Bookings' },
  { href: '/admin/disputes', label: 'Disputes' },
  { href: '/admin/reports', label: 'Reports' },
  { href: '/admin/announcements', label: 'Announcements' },
];

/**
 * Admin panel layout protected with RequireRole('admin').
 * Includes admin sidebar navigation.
 * @param {{ children: React.ReactNode }} props
 */
export default function AdminLayout({ children }) {
  const pathname = usePathname();

  return (
    <RequireRole role="admin">
      <Header />
      <div className="flex-1 flex flex-col md:flex-row">
        <aside className="w-full md:w-56 bg-red-50 border-b md:border-b-0 md:border-r border-halo-border">
          <nav className="p-4" aria-label="Admin navigation">
            <h2 className="text-sm font-semibold text-red-700 uppercase tracking-wider mb-3">Admin Panel</h2>
            <ul className="space-y-1">
              {adminLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={`block px-3 py-2 rounded-md text-sm min-h-[44px] flex items-center ${
                      pathname === link.href
                        ? 'bg-red-700 text-white'
                        : 'text-halo-text hover:bg-red-100'
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
