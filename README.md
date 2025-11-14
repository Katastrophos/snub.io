# snub.io

**ignore the noise, on purpose**

> Attention is the scarce resource. Snub.io is a platform for intentional signal filtering and focus amplification.

## Vision

Digital noise is not just an annoyance—it's cognitive pollution. Snub.io treats attention as sovereign territory, giving you the tools to deliberately tune out algorithmic feeds, notification streams, and information overload.

Think: **anti-feed, pro-signal, with a cyberpunk philosopher aesthetic.**

## Philosophy

- Embrace chaos as creative potential
- Respect attention as sacred
- Mathematical elegance in filtering
- Performance-critical components deserve C++
- Universal framework, domain-specific modules

## Architecture

Snub.io is built as a **universal noise filtering framework** with specialized implementations:

- **Core**: Broad noise filtering abstractions
- **Modules**: Domain-specific filters (social media, email, notifications, news, content feeds)
- **Performance**: C++ microservices for signal processing, ML inference, real-time filtering
- **Frontend**: Modern React/Next.js web interface
- **Extension**: Browser integration for source interception

## Tech Stack

- **Frontend**: Next.js 14+ (App Router, React Server Components)
- **Backend**: TypeScript API + C++17/20/23 microservices
- **Database**: PostgreSQL + Redis
- **Deploy**: Vercel (frontend) + containerized services
- **Performance**: SIMD optimization where needed

## Project Structure

```
snub.io/
├── apps/
│   ├── web/              # Next.js web application
│   └── extension/        # Browser extension
├── packages/
│   ├── core/             # Universal filtering framework
│   ├── filters/          # Domain-specific filter modules
│   │   ├── social/       # Social media filtering
│   │   ├── email/        # Email/notification filtering
│   │   ├── news/         # News cycle filtering
│   │   └── feeds/        # Content feed filtering
│   └── ui/               # Shared UI components
├── services/
│   ├── signal-processor/ # C++ signal processing service
│   └── ml-inference/     # C++ ML inference service
├── docs/
│   └── architecture.md   # Technical architecture
└── infrastructure/       # Docker, deployment configs
```

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

## Current Status

🚧 **Initial Setup Phase** - Building foundational architecture

## License

MIT (or specify your preference)
