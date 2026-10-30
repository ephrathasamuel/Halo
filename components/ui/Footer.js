import Link from 'next/link';

const COLUMNS = [
  {
    title: 'Book',
    links: [
      { href: '/browse?type=studio', label: 'Studios' },
      { href: '/browse?type=equipment', label: 'Equipment' },
      { href: '/browse?type=service', label: 'Event filming' },
      { href: '/studios', label: 'All providers' },
    ],
  },
  {
    title: 'Providers',
    links: [
      { href: '/signup?as=provider', label: 'List your space or gear' },
      { href: '/owner', label: 'Provider dashboard' },
    ],
  },
  {
    title: 'Account',
    links: [
      { href: '/signin', label: 'Sign in' },
      { href: '/dashboard', label: 'My bookings' },
      { href: '/privacy', label: 'Privacy policy' },
      { href: '/terms', label: 'Terms of use' },
    ],
  },
];

/**
 * Site footer.
 */
export function Footer() {
  return (
    <footer className="mt-auto border-t border-halo-border bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          <div className="col-span-2">
            <p className="text-[1.15rem] font-semibold tracking-[0.14em] text-halo-ink">HALO</p>
            <p className="mt-3 text-sm text-halo-text-muted max-w-xs leading-relaxed">
              Book photo and film studios, rent production gear, and hire event filming crews from
              independent providers near you.
            </p>
          </div>
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h2 className="text-sm font-semibold text-halo-ink mb-3">{col.title}</h2>
              <ul className="space-y-1">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="text-sm text-halo-text-muted hover:text-halo-ink min-h-[36px] inline-flex items-center"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-10 pt-6 border-t border-halo-border flex flex-col sm:flex-row gap-2 justify-between text-xs text-halo-text-muted">
          <p>&copy; {new Date().getFullYear()} Halo. Book the space. Make the work.</p>
          <p>Every price is set by the provider, in their own currency.</p>
          {/* Required credit for the place data (CC BY 4.0 and ODbL) */}
          <p>
            Places from{' '}
            <a href="https://www.geonames.org" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-halo-ink min-h-0 min-w-0">
              GeoNames
            </a>{' '}
            and{' '}
            <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-halo-ink min-h-0 min-w-0">
              OpenStreetMap
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
