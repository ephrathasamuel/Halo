import { Header } from '@/components/ui/Header';
import { Footer } from '@/components/ui/Footer';

/**
 * Customer route group layout.
 * @param {{ children: React.ReactNode }} props
 */
export default function CustomerLayout({ children }) {
  return (
    <>
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
