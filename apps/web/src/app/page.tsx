export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-void-black via-void-dark to-void-black">
      {/* Hero Section */}
      <section className="section-container py-20 md:py-32">
        <div className="space-y-8 text-center">
          {/* Logo/Title */}
          <div className="space-y-4">
            <h1 className="text-6xl md:text-8xl font-mono font-bold text-neon-cyan glow-text animate-pulse-slow">
              snub.io
            </h1>
            <p className="text-xl md:text-2xl text-neon-pink font-mono">
              ignore the noise, on purpose
            </p>
          </div>

          {/* Tagline */}
          <div className="max-w-3xl mx-auto space-y-4 py-8">
            <p className="text-lg md:text-xl text-gray-300 leading-relaxed">
              Attention is the <span className="text-neon-green font-bold">scarce resource</span>.
              <br />
              Digital noise is <span className="text-neon-pink font-bold">cognitive pollution</span>.
            </p>
            <p className="text-base md:text-lg text-gray-400">
              Snub.io is a platform for intentional signal filtering and focus amplification.
              <br />
              Treat your attention as sovereign territory.
            </p>
          </div>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
            <a
              href="/dashboard"
              className="btn-primary text-center"
            >
              Try Feed Reader
            </a>
            <a
              href="/reader"
              className="px-6 py-3 bg-transparent border-2 border-neon-purple text-neon-purple font-mono uppercase tracking-wider transition-all duration-300 hover:bg-neon-purple hover:text-void-black hover:shadow-lg hover:shadow-neon-purple/50 text-center"
            >
              View Signals
            </a>
          </div>
        </div>
      </section>

      {/* Philosophy Section */}
      <section className="section-container py-16 border-t border-void-gray">
        <div className="grid md:grid-cols-3 gap-8 text-center">
          <div className="space-y-3 p-6 border border-neon-cyan/30 hover:border-neon-cyan transition-colors">
            <h3 className="text-xl font-mono text-neon-cyan">Anti-Feed</h3>
            <p className="text-gray-400 text-sm">
              No algorithms deciding what you see. You curate your signal.
            </p>
          </div>
          <div className="space-y-3 p-6 border border-neon-pink/30 hover:border-neon-pink transition-colors">
            <h3 className="text-xl font-mono text-neon-pink">Pro-Signal</h3>
            <p className="text-gray-400 text-sm">
              Surface what matters. Filter out what doesn't. Amplify focus.
            </p>
          </div>
          <div className="space-y-3 p-6 border border-neon-green/30 hover:border-neon-green transition-colors">
            <h3 className="text-xl font-mono text-neon-green">Sovereign</h3>
            <p className="text-gray-400 text-sm">
              Your attention. Your rules. Your data. Your focus.
            </p>
          </div>
        </div>
      </section>

      {/* Status Section */}
      <section className="section-container py-16 border-t border-void-gray">
        <div className="text-center space-y-4">
          <div className="inline-block px-4 py-2 border border-neon-green bg-neon-green/10">
            <p className="font-mono text-neon-green uppercase tracking-wider">
              <span className="animate-flicker">●</span> Prototype Live
            </p>
          </div>
          <p className="text-gray-500 text-sm font-mono">
            v0.3.0 // Automated signal aggregation
          </p>
          <div className="pt-4 space-y-2">
            <p className="text-sm text-gray-400 font-mono">Features:</p>
            <ul className="text-sm text-gray-500 font-mono space-y-1">
              <li>✓ Automatic feed fetching (background)</li>
              <li>✓ Signal/noise scoring & filtering</li>
              <li>✓ Curated digests (hourly/daily/weekly)</li>
              <li>✓ Customizable automation preferences</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="section-container py-8 border-t border-void-gray">
        <div className="text-center text-gray-600 text-sm font-mono">
          <p>
            Embrace chaos as creative potential. Respect attention as sacred.
          </p>
          <p className="mt-2">
            © 2025 snub.io // <span className="text-neon-cyan">ignore the noise</span>
          </p>
        </div>
      </footer>
    </main>
  )
}
