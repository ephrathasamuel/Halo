/**
 * Main application footer with branding, quick navigation links, and capstone info.
 */
export function Footer() {
  return (
    <footer className="bg-halo-primary text-white/70 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-bold text-halo-secondary mb-2">Halo</h3>
            <p className="text-sm">Your marketplace for studio rental, equipment rental, and event filming in Addis Ababa.</p>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-2">Quick Links</h4>
            <ul className="space-y-1 text-sm">
              <li><a href="/browse" className="hover:text-white transition-colors">Browse Listings</a></li>
              <li><a href="/studios" className="hover:text-white transition-colors">Studios</a></li>
              <li><a href="/signin" className="hover:text-white transition-colors">Sign In</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-2">About</h4>
            <p className="text-sm">A capstone project for the IBT-QIYAS Full-Stack Software Development Program. This is a demo application.</p>
          </div>
        </div>
        <div className="mt-8 pt-4 border-t border-white/10 text-center text-sm">
          <p>&copy; {new Date().getFullYear()} Halo Marketplace. Demo application — not for production use.</p>
        </div>
      </div>
    </footer>
  );
}
