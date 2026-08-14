import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-brand-ink text-slate-400 mt-auto border-t-4 border-brand-400">
      <div className="max-w-7xl mx-auto px-3 md:px-4 py-8 md:py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          <div>
            <h3 className="text-white text-lg font-black mb-3">
              LIVE<span className="text-brand-300">SATTA</span>
            </h3>
            <p className="text-sm leading-relaxed">
              Live-SattaKing.com is India&apos;s fastest platform for live Live Satta results.
              Get instant updates for Gali, Desawar, Ghaziabad, Faridabad &amp; 100+ games.
            </p>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-3">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/" className="hover:text-white transition-colors">Live Satta Results</Link></li>
              <li><Link href="/blog" className="hover:text-white transition-colors">Blog</Link></li>
              <li><Link href="/contact" className="hover:text-white transition-colors">Contact Us</Link></li>
              <li><Link href="/about" className="hover:text-white transition-colors">About Us</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-3">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link href="/disclaimer" className="hover:text-white transition-colors">Disclaimer</Link></li>
            </ul>
            <p className="mt-4 text-xs text-gray-500 leading-relaxed">
              This website is for informational purposes only. We do not encourage or promote gambling in any form.
            </p>
          </div>
        </div>

        <div className="border-t border-white/10 mt-8 pt-6 text-center text-sm">
          <p>&copy; {new Date().getFullYear()} Live-SattaKing.com &mdash; All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
