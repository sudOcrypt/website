import { Clock, Gift, Bell } from 'lucide-react';

export function FreeMoneyPage() {
  return (
    <div className="min-h-screen pt-24 pb-16 flex items-center">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 blur-3xl" />

          <div className="relative bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-white/10 p-8 md:p-12">
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-full flex items-center justify-center">
              <Gift className="w-10 h-10 text-cyan-400" />
            </div>

            <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 bg-yellow-500/10 border border-yellow-500/30 rounded-full">
              <Clock className="w-4 h-4 text-yellow-400" />
              <span className="text-sm text-yellow-400">Coming Soon</span>
            </div>

            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Free Money</h1>

            <p className="text-xl text-gray-400 mb-8">
              Exciting rewards program coming to DonutMC Store!
              Earn free coins and items through various activities.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              {[
                { label: 'Daily Rewards', value: 'Soon' },
                { label: 'Referral Bonus', value: 'Soon' },
                { label: 'Giveaways', value: 'Soon' },
              ].map((item) => (
                <div
                  key={item.label}
                  className="p-4 bg-gray-900/50 rounded-xl border border-white/5"
                >
                  <p className="text-sm text-gray-500">{item.label}</p>
                  <p className="text-lg font-semibold text-cyan-400">{item.value}</p>
                </div>
              ))}
            </div>

            <div className="p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-xl">
              <div className="flex items-center justify-center gap-2 text-cyan-400 mb-2">
                <Bell className="w-5 h-5" />
                <span className="font-semibold">Get Notified</span>
              </div>
              <p className="text-gray-400 text-sm">
                Join our Discord to be the first to know when Free Money launches!
              </p>
            </div>

            <a
              href="https://discord.gg/rtP5YhJFRB
              "
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 mt-6 px-6 py-3 bg-[#5865F2] hover:bg-[#4752C4] text-white font-semibold rounded-xl transition-all"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
              </svg>
              Join Discord
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
