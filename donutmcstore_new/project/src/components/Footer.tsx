import { Link } from 'react-router-dom';
import { ExternalLink, Sparkles, ShieldCheck, Lock } from 'lucide-react';

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
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full blur-lg opacity-50 group-hover:opacity-75 transition-opacity" />
                <img
                  src="/logo.png"
                  alt="DonutMC"
                  className="relative w-12 h-12 rounded-full transform group-hover:scale-105 transition-transform"
                />
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
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex flex-wrap items-center justify-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-lg">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect width="24" height="24" rx="4" fill="#000000"/>
                  <path d="M8 8h8v8H8z" fill="#FFFFFF"/>
                </svg>
                <span className="text-xs text-blue-400 font-medium">Secured by Square</span>
              </div>
              
              <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-lg">
                <Lock className="w-4 h-4 text-green-400" />
                <span className="text-xs text-green-400 font-medium">SSL Encrypted</span>
              </div>
              
              <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-lg">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                <span className="text-xs text-cyan-400 font-medium">Secure Checkout</span>
              </div>
            </div>

            <div className="text-center sm:text-right">
              <p className="text-gray-500 text-sm">
                &copy; {new Date().getFullYear()} DonutMC Store. All rights reserved.
              </p>
              <p className="text-gray-600 text-xs mt-1">
                Not affiliated with Mojang Studios or Microsoft
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
