import { Inter } from 'next/font/google';
import './globals.css';
import { AppInitializer } from '@/components/ui/AppInitializer';
import { NavigationTracker } from '@/components/ui/BackButton';
import { THEME_INIT_SCRIPT } from '@/components/ui/ThemeToggle';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

// Share previews need absolute image URLs. Vercel sets VERCEL_PROJECT_PRODUCTION_URL
// on every deploy, so links work even before NEXT_PUBLIC_SITE_URL is configured.
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL && `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`) ||
  'http://localhost:3000';

const DESCRIPTION = 'Find and book photo and film studios, production equipment and event filming crews in your city.';

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Halo | Book studios, gear and film crews in your city',
    template: '%s | Halo',
  },
  description: DESCRIPTION,
  openGraph: {
    type: 'website',
    siteName: 'Halo',
    title: 'Halo | Book studios, gear and film crews in your city',
    description: DESCRIPTION,
  },
  twitter: {
    card: 'summary_large_image',
  },
};

export const viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#1a1c20' },
  ],
};

/**
 * Root application layout.
 * suppressHydrationWarning: the theme script adds the "dark" class to <html>
 * before React loads, so the server HTML and the browser differ on purpose.
 * @param {{ children: React.ReactNode }} props
 */
export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="font-[family-name:var(--font-inter)] antialiased min-h-screen flex flex-col">
        <AppInitializer />
        <NavigationTracker />
        {children}
      </body>
    </html>
  );
}
