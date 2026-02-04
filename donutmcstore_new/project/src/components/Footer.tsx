import { Link } from 'react-router-dom';
import { ExternalLink, Sparkles } from 'lucide-react';

export function Footer() {
  return (
    <footer className="relative mt-auto overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-900/80 to-transparent" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="col-span-1 md:col-span-2">
            <Link to="/" className="flex items-center gap-3 mb-6 group">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity" />
                <div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                  <span className="text-white font-bold text-xl">D</span>
                </div>
              </div>
              <div>
                <span className="text-xl font-bold gradient-text-animated block">DonutMC</span>
                <span className="text-xs text-gray-500 tracking-widest uppercase">Store</span>
              </div>
            </Link>
            <p className="text-gray-400 text-sm max-w-sm leading-relaxed mb-6">
              Your premium marketplace for DonutSMP items, coins, bases, and community schematics.
              Trade safely with our verified system.
            </p>
            <div className="flex items-center gap-2 text-sm text-cyan-400">
              <Sparkles className="w-4 h-4" />
              <span>Trusted by the DonutSMP community</span>
            </div>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-6 flex items-center gap-2">
              <div className="w-1 h-4 bg-gradient-to-b from-cyan-500 to-blue-600 rounded-full" />
              Quick Links
            </h4>
            <ul className="space-y-3">
              {[
                { to: '/', label: 'Shop' },
                { to: '/sell', label: 'Sell to Us' },
                { to: '/reviews', label: 'Reviews' },
                { to: '/schematics', label: 'Schematics' },
              ].map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-gray-400 hover:text-cyan-400 transition-colors text-sm flex items-center gap-2 group"
                  >
                    <span className="w-0 group-hover:w-2 h-px bg-cyan-400 transition-all" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-6 flex items-center gap-2">
              <div className="w-1 h-4 bg-gradient-to-b from-cyan-500 to-blue-600 rounded-full" />
              Community
            </h4>
            <ul className="space-y-3">
              <li>
                <a
                  href="https://discord.gg/rtP5YhJFRB"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-cyan-400 transition-colors text-sm flex items-center gap-2 group"
                >
                  <span className="w-0 group-hover:w-2 h-px bg-cyan-400 transition-all" />
                  Discord Server
                  <ExternalLink className="w-3 h-3 opacity-50" />
                </a>
              </li>
              <li>
                <Link
                  to="/reviews"
                  className="text-gray-400 hover:text-cyan-400 transition-colors text-sm flex items-center gap-2 group"
                >
                  <span className="w-0 group-hover:w-2 h-px bg-cyan-400 transition-all" />
                  Customer Reviews
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-white/10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-gray-500 text-sm">
              &copy; {new Date().getFullYear()} DonutMC Store. All rights reserved.
            </p>
            <p className="text-gray-600 text-xs">
              Not affiliated with Mojang Studios or Microsoft
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
