'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';
import { useSession } from '@/hooks/useSession';
import { signOut } from '@/lib/domain/auth';
import { Logo } from '@/components/ui/Logo';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { CountryPicker } from '@/components/ui/CountryPicker';
import { UserAvatar } from '@/components/ui/ProviderLogo';

const SLOGAN = 'Book the space. Make the work.';

// Categories live on Home and Browse as buttons; the header stays short
const PRIMARY_LINKS = [
  { href: '/browse', label: 'Browse' },
  { href: '/studios', label: 'Providers' },
  { href: '/signup?as=provider', label: 'List your space' },
];

/**
 * Site header: logo, category navigation, and account controls.
 * White with a hairline border so listing photos carry the colour on every page.
 */
export function Header() {
  const { session, isSignedIn } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close the phone menu whenever the route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const handleSignOut = () => {
    signOut();
    router.push('/');
    router.refresh();
  };

  const isOwner = session?.roles?.includes('owner');
  const isAdmin = session?.roles?.includes('admin') || session?.roles?.includes('regional_admin');

  const accountLinks = isSignedIn
    ? [
        { href: '/dashboard', label: 'My bookings' },
        ...(isOwner ? [{ href: '/owner', label: 'Provider dashboard' }] : []),
        ...(isAdmin ? [{ href: '/admin', label: 'Admin' }] : []),
      ]
    : [];

  const linkClass = (href) => {
    const base = href.split('?')[0];
    const active = pathname === base && !href.includes('?');
    return `px-3 rounded-lg text-sm font-medium whitespace-nowrap transition-colors min-h-[40px] flex items-center ${
      active ? 'text-halo-ink' : 'text-halo-text-muted hover:text-halo-ink hover:bg-halo-ink/[0.04]'
    }`;
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-halo-border">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" aria-label="Main navigation">
        <div className="flex items-center justify-between h-16 gap-4">
          <div className="flex items-center gap-4 shrink-0">
            <Link href="/" className="flex items-center min-h-[44px]" aria-label="Halo home">
              <Logo />
            </Link>
            <p className="hidden xl:flex items-center gap-4 text-sm text-halo-text-muted">
              <span className="h-5 w-px bg-halo-border-strong" aria-hidden="true" />
              {SLOGAN}
            </p>
          </div>

          {/* Desktop navigation */}
          <div className="hidden lg:flex items-center gap-0.5">
            {PRIMARY_LINKS.map((l) => (
              <Link key={l.href} href={l.href} className={linkClass(l.href)}>
                {l.label}
              </Link>
            ))}
          </div>

          <div className="hidden lg:flex items-center gap-1">
            <CountryPicker />
            <ThemeToggle />
            {isSignedIn ? (
              <>
                {accountLinks.map((l) => (
                  <Link key={l.href} href={l.href} className={linkClass(l.href)}>
                    {l.label}
                  </Link>
                ))}
                <span className="mx-2 h-6 w-px bg-halo-border" aria-hidden="true" />
                <Link
                  href="/account"
                  className="rounded-full min-h-0 min-w-0"
                  title={`${session.name}, edit profile`}
                  aria-label={`Signed in as ${session.name}. Edit profile`}
                >
                  <UserAvatar user={session} size={36} />
                </Link>
                <button
                  onClick={handleSignOut}
                  className="px-3 rounded-lg text-sm font-medium whitespace-nowrap text-halo-text-muted hover:text-halo-ink hover:bg-halo-ink/[0.04] min-h-[40px]"
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link href="/signin" className={linkClass('/signin')}>
                  Sign in
                </Link>
                <Link
                  href="/signup"
                  className="ml-1 px-4 rounded-lg bg-halo-ink text-white text-sm font-semibold whitespace-nowrap hover:bg-halo-ink-soft transition-colors min-h-[40px] flex items-center"
                >
                  Create account
                </Link>
              </>
            )}
          </div>

          {/* Phone: theme switch and menu button */}
          <div className="lg:hidden ml-auto -mr-2 flex items-center">
            <ThemeToggle />
            <button
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-halo-ink hover:bg-halo-ink/[0.04]"
              onClick={() => setMobileMenuOpen((open) => !open)}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-menu"
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div id="mobile-menu" className="lg:hidden border-t border-halo-border py-3 space-y-1">
            {PRIMARY_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="flex items-center px-2 min-h-[44px] rounded-lg text-[15px] font-medium text-halo-ink hover:bg-halo-ink/[0.04]"
              >
                {l.label}
              </Link>
            ))}
            <div className="flex items-center justify-between px-2 min-h-[44px]">
              <span className="text-[15px] text-halo-text-muted">Country</span>
              <CountryPicker />
            </div>
            <div className="my-2 h-px bg-halo-border" />
            {isSignedIn ? (
              <>
                {accountLinks.map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    className="flex items-center px-2 min-h-[44px] rounded-lg text-[15px] font-medium text-halo-ink hover:bg-halo-ink/[0.04]"
                  >
                    {l.label}
                  </Link>
                ))}
                <button
                  onClick={handleSignOut}
                  className="w-full text-left flex items-center px-2 min-h-[44px] rounded-lg text-[15px] font-medium text-halo-error hover:bg-red-50"
                >
                  Sign out
                </button>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <Link
                  href="/signin"
                  className="flex items-center justify-center min-h-[44px] rounded-lg border border-halo-border-strong text-sm font-semibold text-halo-ink"
                >
                  Sign in
                </Link>
                <Link
                  href="/signup"
                  className="flex items-center justify-center min-h-[44px] rounded-lg bg-halo-ink text-sm font-semibold text-white"
                >
                  Create account
                </Link>
              </div>
            )}
          </div>
        )}
      </nav>
    </header>
  );
}
