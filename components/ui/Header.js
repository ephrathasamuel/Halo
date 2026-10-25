'use client';

import Link from 'next/link';
import { useSession } from '@/hooks/useSession';
import { signOut } from '@/lib/domain/auth';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

/**
 * Main application header with brand logo, primary navigation links,
 * authentication controls, and responsive mobile menu.
 */
export function Header() {
  const { session, isSignedIn } = useSession();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = () => {
    signOut();
    router.push('/');
    router.refresh();
  };

  const isOwner = session?.roles?.includes('owner');
  const isAdmin = session?.roles?.includes('admin');

  return (
    <header className="bg-halo-primary text-white shadow-md">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" aria-label="Main navigation">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 min-h-[44px] min-w-[44px]">
            <span className="text-2xl font-bold text-halo-secondary">Halo</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            <Link href="/browse" className="hover:text-halo-secondary transition-colors min-h-[44px] flex items-center">
              Browse
            </Link>
            <Link href="/studios" className="hover:text-halo-secondary transition-colors min-h-[44px] flex items-center">
              Studios
            </Link>
            {isSignedIn ? (
              <>
                <Link href="/dashboard" className="hover:text-halo-secondary transition-colors min-h-[44px] flex items-center">
                  Dashboard
                </Link>
                {isOwner && (
                  <Link href="/owner" className="hover:text-halo-secondary transition-colors min-h-[44px] flex items-center">
                    Owner
                  </Link>
                )}
                {isAdmin && (
                  <Link href="/admin" className="hover:text-halo-secondary transition-colors min-h-[44px] flex items-center">
                    Admin
                  </Link>
                )}
                <span className="text-sm text-halo-accent">{session.name}</span>
                <button
                  onClick={handleSignOut}
                  className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-md text-sm transition-colors min-h-[44px]"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <Link
                href="/signin"
                className="bg-halo-secondary text-halo-primary px-4 py-2 rounded-md font-semibold hover:bg-halo-accent transition-colors min-h-[44px] flex items-center"
              >
                Sign In
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden min-h-[44px] min-w-[44px] flex items-center justify-center"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-expanded={mobileMenuOpen}
            aria-label="Toggle navigation menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden pb-4 space-y-2">
            <Link href="/browse" className="block py-2 hover:text-halo-secondary min-h-[44px] flex items-center" onClick={() => setMobileMenuOpen(false)}>Browse</Link>
            <Link href="/studios" className="block py-2 hover:text-halo-secondary min-h-[44px] flex items-center" onClick={() => setMobileMenuOpen(false)}>Studios</Link>
            {isSignedIn ? (
              <>
                <Link href="/dashboard" className="block py-2 hover:text-halo-secondary min-h-[44px] flex items-center" onClick={() => setMobileMenuOpen(false)}>Dashboard</Link>
                {isOwner && <Link href="/owner" className="block py-2 hover:text-halo-secondary min-h-[44px] flex items-center" onClick={() => setMobileMenuOpen(false)}>Owner</Link>}
                {isAdmin && <Link href="/admin" className="block py-2 hover:text-halo-secondary min-h-[44px] flex items-center" onClick={() => setMobileMenuOpen(false)}>Admin</Link>}
                <button onClick={() => { handleSignOut(); setMobileMenuOpen(false); }} className="block py-2 text-red-300 hover:text-red-100 min-h-[44px]">Sign Out</button>
              </>
            ) : (
              <Link href="/signin" className="block py-2 text-halo-secondary font-semibold min-h-[44px] flex items-center" onClick={() => setMobileMenuOpen(false)}>Sign In</Link>
            )}
          </div>
        )}
      </nav>
    </header>
  );
}
