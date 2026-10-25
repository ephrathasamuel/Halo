import { Header } from '@/components/ui/Header';
import { Footer } from '@/components/ui/Footer';

/**
 * Public route group layout.
 * @param {{ children: React.ReactNode }} props
 */
export default function PublicLayout({ children }) {
  return (
    <>
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
