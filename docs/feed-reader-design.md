# Feed Reader Design

**Feature**: Manually Curated Feed Reader (v0.1.0)

## Overview

The first working prototype of snub.io - a feed reader where users manually add RSS/Atom feeds, and the platform applies noise filters to surface only high-signal content.

## User Flow

1. **Add Feeds**: User pastes RSS/Atom URLs or manually adds sources
2. **Auto-Fetch**: System periodically fetches new items from feeds
3. **Filter Pipeline**: Each item runs through configured filter chain
4. **Curated View**: User sees only items that pass filters, sorted by signal strength
5. **Manual Override**: User can mark items as noise/signal to train adaptive filters

## Database Schema

### feeds
```sql
id              UUID PRIMARY KEY
user_id         UUID REFERENCES users(id)
url             VARCHAR NOT NULL
title           VARCHAR
description     TEXT
type            VARCHAR (rss, atom, manual)
fetch_interval  INTEGER (minutes)
last_fetched_at TIMESTAMP
enabled         BOOLEAN DEFAULT true
created_at      TIMESTAMP
updated_at      TIMESTAMP
```

### feed_items (signals)
```sql
id              UUID PRIMARY KEY
feed_id         UUID REFERENCES feeds(id)
user_id         UUID REFERENCES users(id)
external_id     VARCHAR (from feed)
title           VARCHAR
content         TEXT
url             VARCHAR
author          VARCHAR
published_at    TIMESTAMP
fetched_at      TIMESTAMP
signal_score    FLOAT
noise_score     FLOAT
confidence      FLOAT
decision        VARCHAR (allow, block, defer, highlight, reduce)
user_feedback   VARCHAR (noise, signal, null)
metadata        JSONB
created_at      TIMESTAMP
```

### users
```sql
id              UUID PRIMARY KEY
email           VARCHAR UNIQUE
name            VARCHAR
created_at      TIMESTAMP
preferences     JSONB
```

### filter_configs
```sql
id              UUID PRIMARY KEY
user_id         UUID REFERENCES users(id)
filter_type     VARCHAR (keyword, engagement_bait, etc.)
config          JSONB
enabled         BOOLEAN
priority        INTEGER
created_at      TIMESTAMP
updated_at      TIMESTAMP
```

## API Routes

### Feeds
- `GET /api/feeds` - List user's feeds
- `POST /api/feeds` - Add new feed
- `PATCH /api/feeds/:id` - Update feed settings
- `DELETE /api/feeds/:id` - Remove feed
- `POST /api/feeds/:id/fetch` - Manually trigger fetch

### Feed Items
- `GET /api/items` - List filtered items (query: feed, decision, limit, offset)
- `GET /api/items/:id` - Get single item
- `POST /api/items/:id/feedback` - Mark as noise/signal

### Filters
- `GET /api/filters` - List user's filters
- `POST /api/filters` - Create filter
- `PATCH /api/filters/:id` - Update filter
- `DELETE /api/filters/:id` - Remove filter

## UI Components

### Feed Manager (`/dashboard/feeds`)
- List of all feeds with status indicators
- Add feed form (URL input + validation)
- Feed settings (fetch interval, enable/disable)
- Manual fetch trigger

### Feed Reader (`/reader`)
- List of filtered items, sorted by signal score
- Filter toggles (show: all, highlights only, blocked, etc.)
- Item cards showing:
  - Title, source, timestamp
  - Signal/noise score visualization
  - Filter decision badge
  - Quick feedback buttons (noise/signal)

### Filter Configuration (`/dashboard/filters`)
- List of active filters with priority
- Filter creation wizard
- Filter testing interface (paste content, see scores)

## Signal Evaluation Pipeline

```typescript
async function evaluateItem(item: FeedItem, userFilters: FilterConfig[]) {
  // 1. Convert item to Signal
  const signal: Signal = {
    id: item.id,
    source: SignalSource.FEED,
    content: {
      text: item.content,
      html: item.content,
      links: extractLinks(item.content),
    },
    metadata: {
      timestamp: item.published_at,
      source: SignalSource.FEED,
      url: item.url,
      author: item.author,
      platform: 'feed',
    },
    timestamp: item.published_at,
  }

  // 2. Build filter chain from user's configs
  const filters = userFilters.map(config => createFilter(config))
  const chain = new FilterChain(filters)

  // 3. Evaluate
  const result = await chain.evaluate(signal)

  // 4. Store result
  await updateItem(item.id, {
    signal_score: result.score.signal,
    noise_score: result.score.noise,
    confidence: result.score.confidence,
    decision: result.decision,
  })

  return result
}
```

## Feed Fetching Strategy

- **Cron Job**: Run every 15 minutes
- **Smart Fetch**: Only fetch feeds where `now - last_fetched_at > fetch_interval`
- **Deduplication**: Use `external_id` to avoid duplicate items
- **Rate Limiting**: Max 1 feed fetch per 5 seconds per user

## Performance Considerations

- **Lazy Evaluation**: Only evaluate items when user views them (optional)
- **Cached Scores**: Store evaluation results, re-evaluate only on filter changes
- **Pagination**: Default 50 items per page
- **Indexes**: On `user_id`, `feed_id`, `decision`, `signal_score`, `published_at`

## Future Enhancements

- [ ] Import OPML (feed collections)
- [ ] Export filtered items as digest
- [ ] Adaptive filters that learn from user feedback
- [ ] Collaborative filtering (similar users' signals)
- [ ] Real-time feed updates (WebSockets)
- [ ] Mobile app with push notifications for high-signal items
