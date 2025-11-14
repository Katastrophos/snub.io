# Automation System Design

**Feature**: Automatic Feed Fetching & Digest Generation

## Overview

Transform snub.io from a manual feed reader into an automated signal aggregation platform that works in the background.

## Components

### 1. Background Feed Fetcher

**Trigger**: Cron job every 15 minutes

**Logic**:
```typescript
// For each enabled feed:
if (now - feed.lastFetchedAt >= feed.fetchInterval) {
  fetchAndEvaluate(feed)
}
```

**Rate Limiting**:
- Max 1 feed fetch per 5 seconds per user
- Batch processing to avoid overwhelming feed sources
- Exponential backoff on errors

**Error Handling**:
- Retry failed fetches (max 3 attempts)
- Disable feed after 10 consecutive failures
- Log errors for monitoring

### 2. Digest Generation

**Digest Types**:
- **Hourly** - Last hour's highlights
- **Daily** - Last 24 hours, top signal items
- **Weekly** - Last 7 days, curated by signal score

**Digest Criteria**:
- Only items with `decision = HIGHLIGHT` or `signalScore > 0.7`
- Minimum 3 items, maximum 50 items
- Sorted by signal score descending

**Digest Delivery**:
- Stored in database for on-demand viewing
- (Future) Email delivery
- (Future) Push notifications

### 3. Notification Preferences

**User Settings**:
```typescript
{
  autoFetch: boolean,              // Enable/disable auto-fetching
  digestFrequency: 'hourly' | 'daily' | 'weekly',
  digestDelivery: 'web' | 'email' | 'both',
  highSignalThreshold: number,     // Min score for digest inclusion
  digestMinItems: number,          // Only send if >= N items
  mutedFeeds: string[],           // Exclude from digests
}
```

### 4. Background Job Infrastructure

**Next.js API Route** (`/api/cron/fetch-feeds`)
- Protected by cron secret
- Called by external cron service (Vercel Cron, GitHub Actions, etc.)
- Processes all due feeds

**Job Queue** (Optional - Future)
- Redis-backed job queue
- Parallel processing
- Better error handling and retries

## Database Schema Updates

```prisma
model User {
  // ... existing fields
  notificationPrefs Json?  // Notification preferences
}

model Digest {
  id          String   @id @default(uuid())
  userId      String
  type        DigestType  // HOURLY, DAILY, WEEKLY
  startDate   DateTime
  endDate     DateTime
  itemCount   Int
  items       Json     // Array of item IDs
  createdAt   DateTime @default(now())
  viewedAt    DateTime?

  user User @relation(fields: [userId], references: [id])

  @@index([userId, type])
  @@index([createdAt])
}

enum DigestType {
  HOURLY
  DAILY
  WEEKLY
}
```

## API Endpoints

### Cron
- `POST /api/cron/fetch-feeds` - Trigger automatic feed fetching
- `POST /api/cron/generate-digests` - Generate digests for all users

### Digests
- `GET /api/digests` - List user's digests
- `GET /api/digests/:id` - Get digest with items
- `POST /api/digests/generate` - Manually generate digest

### Preferences
- `GET /api/preferences` - Get user preferences
- `PATCH /api/preferences` - Update preferences

## Cron Schedule

Using Vercel Cron or external service:

```yaml
# vercel.json
{
  "crons": [
    {
      "path": "/api/cron/fetch-feeds",
      "schedule": "*/15 * * * *"  # Every 15 minutes
    },
    {
      "path": "/api/cron/generate-digests",
      "schedule": "0 * * * *"  # Every hour
    }
  ]
}
```

Alternative: GitHub Actions cron

```yaml
# .github/workflows/cron.yml
name: Fetch Feeds
on:
  schedule:
    - cron: '*/15 * * * *'
  workflow_dispatch:

jobs:
  fetch:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger feed fetch
        run: |
          curl -X POST https://snub.io/api/cron/fetch-feeds \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

## Security

**Cron Secret**:
- Store in environment: `CRON_SECRET=random-secure-token`
- Verify in cron routes: `req.headers.authorization === CRON_SECRET`

**Rate Limiting**:
- Prevent abuse of manual digest generation
- Limit feed fetch frequency per user

## Performance Considerations

**Batch Processing**:
- Process feeds in batches of 10
- Wait 100ms between batches

**Database Optimization**:
- Indexes on `lastFetchedAt`, `enabled`, `userId`
- Bulk insert for feed items
- Connection pooling

**Caching**:
- Cache feed metadata in Redis
- Cache digest results for 5 minutes

## Monitoring

**Metrics**:
- Feeds fetched per hour
- Average fetch time
- Error rate
- Items processed per hour
- Digest generation success rate

**Alerts**:
- Feed fetch errors > 10% for 1 hour
- Cron job hasn't run in 30 minutes
- Database connection issues

## Future Enhancements

- [ ] Email digest delivery (SendGrid/Resend)
- [ ] Push notifications (web push API)
- [ ] Slack/Discord webhook integration
- [ ] RSS digest export
- [ ] Intelligent scheduling (fetch popular feeds more often)
- [ ] Adaptive fetch intervals based on update frequency
