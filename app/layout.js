import { Inter } from 'next/font/google';
import './globals.css';
import { DemoDataBadge } from '@/components/ui/DemoDataBadge';
import { AppInitializer } from '@/components/ui/AppInitializer';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata = {
  title: 'Halo — Studio & Equipment Marketplace | Addis Ababa',
  description: 'Find and book professional studios, equipment, and event filming services in Addis Ababa.',
};

/**
 * Root application layout.
 * @param {{ children: React.ReactNode }} props
 */
export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-[family-name:var(--font-inter)] antialiased min-h-screen flex flex-col">
        <AppInitializer />
        {children}
        <DemoDataBadge />
      </body>
    </html>
  );
}
