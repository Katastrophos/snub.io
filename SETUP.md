# Snub.io Setup Guide

Quick start guide for running the snub.io feed reader locally.

## Prerequisites

- Node.js 18+ and npm 9+
- (Optional) PostgreSQL 14+ for production database
- (Optional) Redis for caching

## Quick Start (SQLite - Development)

The easiest way to get started is using SQLite for local development:

```bash
# 1. Install dependencies
npm install

# 2. Set up database (uses SQLite by default with .env.local)
cd apps/web
npm run db:push

# 3. Start the development server
npm run dev

# 4. Open browser
# Visit http://localhost:3000
```

## PostgreSQL Setup (Production)

For production or if you prefer PostgreSQL:

```bash
# 1. Create PostgreSQL database
createdb snub_io

# 2. Update .env.local with PostgreSQL URL
echo "DATABASE_URL=postgresql://user:password@localhost:5432/snub_io" > apps/web/.env.local

# 3. Push database schema
cd apps/web
npm run db:push

# 4. Start development server
npm run dev
```

## Using the Feed Reader

### 1. Add Your First Feed

1. Visit http://localhost:3000
2. Click "Try Feed Reader"
3. Click "+ Add Feed"
4. Enter an RSS/Atom feed URL, for example:
   - `https://hnrss.org/frontpage` (Hacker News)
   - `https://www.reddit.com/r/programming/.rss` (Reddit Programming)
   - `https://feeds.arstechnica.com/arstechnica/index` (Ars Technica)

### 2. Fetch Feed Items

1. After adding a feed, click "Fetch Now"
2. Items will be fetched, parsed, and evaluated through your filters
3. Each item receives a signal/noise score

### 3. View Filtered Items

1. Click "View Reader" or navigate to `/reader`
2. See items sorted by signal score
3. Filter by decision type (highlight, allow, defer, reduce, block)
4. Provide feedback (👍 signal / 👎 noise) to help train future filters

## Default Filters

New users automatically get two filters:

1. **Engagement Bait Detector** - Identifies clickbait and engagement bait patterns
2. **Common Noise Keywords** - Blocks common noise words, promotes signal words

You can customize these filters (future feature) or add your own.

## Project Structure

```
snub.io/
├── apps/
│   └── web/               # Next.js application
│       ├── src/
│       │   ├── app/       # Pages (/, /dashboard, /reader)
│       │   ├── lib/       # Utilities (feed parser, signal evaluator)
│       │   └── api/       # API routes
│       └── prisma/        # Database schema
├── packages/
│   ├── core/              # Core filtering framework
│   ├── filters/
│   │   └── social/        # Social media filters
│   └── ui/                # Shared UI components
└── docs/                  # Documentation
```

## Available Scripts

```bash
# Root
npm run dev          # Start all apps in development mode
npm run build        # Build all apps
npm run lint         # Lint all apps

# Web app (from root)
npm run web          # Start web app only

# Database (from apps/web)
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema to database
npm run db:studio    # Open Prisma Studio (database GUI)
```

## Troubleshooting

### "Module not found" errors

```bash
# Rebuild workspace dependencies
npm install
```

### Database connection errors

```bash
# Check DATABASE_URL in apps/web/.env.local
# For SQLite: file:./dev.db
# For PostgreSQL: postgresql://user:password@localhost:5432/snub_io

# Recreate database
cd apps/web
rm dev.db  # If using SQLite
npm run db:push
```

### Feed fetch fails

- Ensure the feed URL is publicly accessible
- Some feeds may have CORS restrictions
- Try a different feed URL

## Next Steps

- Add more RSS/Atom feeds
- Experiment with different filter settings (coming soon)
- Explore the codebase and add your own filters
- Check out `docs/architecture.md` for technical details

## Development

To contribute or extend snub.io:

1. Read `docs/architecture.md` for system design
2. Read `docs/feed-reader-design.md` for feed reader specifics
3. Create custom filters by extending `BaseFilter` from `@snub/core`
4. Add new domain-specific filter modules in `packages/filters/`

## Questions?

- Architecture: See `docs/architecture.md`
- Feed reader: See `docs/feed-reader-design.md`
- Filters: See `packages/core/src/` and `packages/filters/social/`
