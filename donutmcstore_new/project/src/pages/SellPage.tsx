import { Coins, Package, Castle, ExternalLink, DollarSign, ArrowRight, Sparkles, Shield, Clock } from 'lucide-react';

export function SellPage() {
  const sellOptions = [
    {
      icon: Coins,
      title: 'We Buy Coins',
      description: 'Sell your in-game coins for real money. Competitive rates guaranteed.',
      rate: '$0.07 / 1M coins',
      highlight: true,
    },
    {
      icon: Package,
      title: 'We Buy Items',
      description: 'Have rare or valuable items? We pay top dollar for premium gear.',
      rate: 'Price varies by item',
      highlight: false,
    },
    {
      icon: Castle,
      title: 'We Buy Bases',
      description: 'Selling your base? We purchase quality builds at fair prices.',
      rate: 'Price based on evaluation',
      highlight: false,
    },
  ];

  const features = [
    { icon: Shield, title: 'Secure Transactions', desc: 'All deals are protected' },
    { icon: Clock, title: 'Fast Payments', desc: 'Get paid within 24 hours' },
    { icon: Sparkles, title: 'Best Rates', desc: 'Competitive market prices' },
  ];

  return (
    <div className="relative pt-24 pb-16">
      <section className="relative py-16">
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-5 py-2.5 mb-6 glass rounded-full border border-cyan-500/30 animate-fade-in-up">
            <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse" />
            <span className="text-sm text-cyan-400 font-medium">Turn Your Items Into Cash</span>
            <DollarSign className="w-4 h-4 text-cyan-400" />
          </div>

          <h1 className="text-4xl md:text-6xl font-bold mb-6 animate-fade-in-up stagger-1">
            <span className="block mb-2 bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent">
              Sell Your Items
            </span>
            <span className="relative inline-block">
              <span className="gradient-text">To Us</span>
            </span>
          </h1>

          <p className="text-lg text-gray-400 max-w-2xl mx-auto animate-fade-in-up stagger-2 leading-relaxed">
            Got valuable items, coins, or bases on DonutSMP?
            <span className="text-cyan-400"> We buy them at competitive rates.</span>
            {' '}Fast payments, secure transactions.
          </p>
        </div>
      </section>

      <section className="relative py-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-6">
            {sellOptions.map((option, index) => (
              <div
                key={option.title}
                className={`group relative glass rounded-2xl p-6 transition-all duration-500 hover:-translate-y-2 card-tilt animate-fade-in-up ${
                  option.highlight ? 'border-cyan-500/30 hover:border-cyan-500/50' : 'hover:border-cyan-500/30'
                }`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-blue-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />

                {option.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                    <div className="relative">
                      <div className="absolute inset-0 bg-cyan-500 blur-lg opacity-50" />
                      <div className="relative px-4 py-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-xs font-bold rounded-full shadow-lg flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        Best Rates
                      </div>
                    </div>
                  </div>
                )}

                <div className="relative">
                  <div className="w-16 h-16 mb-5 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <option.icon className="w-8 h-8 text-white relative" />
                  </div>

                  <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-cyan-400 transition-colors">
                    {option.title}
                  </h3>
                  <p className="text-gray-400 mb-5 leading-relaxed">{option.description}</p>

                  <div className="px-4 py-4 bg-gray-900/50 rounded-xl border border-white/5 group-hover:border-cyan-500/20 transition-all">
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Current Rate</p>
                    <p className="text-xl font-bold gradient-text">
                      {option.rate}
                    </p>
                  </div>
                </div>

                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-b-2xl transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative glass rounded-3xl p-8 md:p-12 text-center">
            <div className="absolute inset-0 bg-gradient-to-br from-[#5865F2]/10 to-blue-600/10 rounded-3xl" />

            <div className="relative">
              <div className="w-20 h-20 mx-auto mb-6 bg-[#5865F2] rounded-2xl flex items-center justify-center shadow-lg shadow-[#5865F2]/30">
                <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                </svg>
              </div>

              <h2 className="text-3xl font-bold text-white mb-4">Ready to Sell?</h2>
              <p className="text-lg text-gray-400 mb-8 max-w-lg mx-auto">
                Contact us on Discord to get a quote and start the selling process.
                Our team is available 24/7 to assist you.
              </p>

              <a
                href="https://discord.gg/rtP5YhJFRB"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-[#5865F2] hover:bg-[#4752C4] text-white font-semibold rounded-xl transition-all duration-300 shadow-lg shadow-[#5865F2]/25 hover:shadow-[#5865F2]/50 hover:-translate-y-1"
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                </svg>
                Join Our Discord
                <ExternalLink className="w-4 h-4" />
              </a>

              <p className="mt-4 text-gray-500 text-sm">discord.gg/rtP5YhJFRB</p>
            </div>
          </div>
        </div>
      </section>

      <section className="relative py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">How It Works</h2>
            <p className="text-gray-400">Simple 3-step process to sell your items</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '1',
                title: 'Contact Us',
                description: 'Reach out on Discord with details about what you want to sell',
              },
              {
                step: '2',
                title: 'Get a Quote',
                description: 'We evaluate your items and provide a fair, competitive offer',
              },
              {
                step: '3',
                title: 'Get Paid',
                description: 'Accept the offer and receive your payment within 24 hours',
              },
            ].map((item, index) => (
              <div key={item.step} className="relative group animate-fade-in-up" style={{ animationDelay: `${400 + index * 100}ms` }}>
                <div className="glass rounded-2xl p-6 text-center transition-all duration-500 hover:-translate-y-2 hover:border-cyan-500/30 card-tilt">
                  <div className="relative w-16 h-16 mx-auto mb-4">
                    <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-full blur-xl group-hover:opacity-75 transition-opacity" />
                    <div className="relative w-full h-full rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <span className="text-2xl font-bold text-white">{item.step}</span>
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-cyan-400 transition-colors">{item.title}</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">{item.description}</p>
                </div>
                {index < 2 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                    <ArrowRight className="w-8 h-8 text-gray-700" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="glass rounded-xl p-5 flex items-center gap-4 animate-fade-in-up hover:border-cyan-500/30 transition-all"
                style={{ animationDelay: `${700 + index * 100}ms` }}
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-white">{feature.title}</h4>
                  <p className="text-sm text-gray-400">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
