# Cron Setup Guide

This guide explains how to set up automatic feed fetching and digest generation for snub.io.

## Quick Start (Development)

For local development, you can manually trigger cron jobs:

```bash
# Trigger feed fetching
curl -X POST http://localhost:3000/api/cron/fetch-feeds \
  -H "Authorization: Bearer your-cron-secret"

# Trigger digest generation
curl -X POST http://localhost:3000/api/cron/generate-digests \
  -H "Authorization: Bearer your-cron-secret"
```

## Production Setup

### Option 1: Vercel Cron (Recommended for Vercel deployments)

Create `vercel.json` in your project root:

```json
{
  "crons": [
    {
      "path": "/api/cron/fetch-feeds",
      "schedule": "*/15 * * * *"
    },
    {
      "path": "/api/cron/generate-digests",
      "schedule": "0 * * * *"
    }
  ]
}
```

**Note**: Vercel Cron requires a paid plan and automatically handles authentication.

### Option 2: GitHub Actions

Create `.github/workflows/cron.yml`:

```yaml
name: Snub.io Cron Jobs

on:
  schedule:
    # Fetch feeds every 15 minutes
    - cron: '*/15 * * * *'
    # Generate digests every hour
    - cron: '0 * * * *'
  workflow_dispatch:  # Allow manual triggers

jobs:
  fetch-feeds:
    runs-on: ubuntu-latest
    steps:
      - name: Fetch Feeds
        run: |
          curl -X POST ${{ secrets.APP_URL }}/api/cron/fetch-feeds \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"

  generate-digests:
    runs-on: ubuntu-latest
    if: github.event.schedule == '0 * * * *'
    steps:
      - name: Generate Digests
        run: |
          curl -X POST ${{ secrets.APP_URL }}/api/cron/generate-digests \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

**Required GitHub Secrets**:
- `APP_URL`: Your deployed app URL (e.g., `https://snub.io`)
- `CRON_SECRET`: Secure random string matching your app's `CRON_SECRET` env var

### Option 3: External Cron Service

Use services like:
- **cron-job.org** (free, reliable)
- **EasyCron** (free tier available)
- **Cronitor** (monitoring included)

**Setup**:
1. Create cron jobs with these URLs:
   - Fetch feeds: `https://your-app.com/api/cron/fetch-feeds`
   - Generate digests: `https://your-app.com/api/cron/generate-digests`

2. Set schedule:
   - Fetch feeds: Every 15 minutes (`*/15 * * * *`)
   - Generate digests: Every hour (`0 * * * *`)

3. Add HTTP header:
   - `Authorization: Bearer your-cron-secret`

### Option 4: Server Crontab (Self-hosted)

Add to your server's crontab:

```bash
# Edit crontab
crontab -e

# Add these lines
*/15 * * * * curl -X POST https://your-app.com/api/cron/fetch-feeds -H "Authorization: Bearer your-cron-secret"
0 * * * * curl -X POST https://your-app.com/api/cron/generate-digests -H "Authorization: Bearer your-cron-secret"
```

## Security

### Generate Secure CRON_SECRET

```bash
# Option 1: OpenSSL
openssl rand -hex 32

# Option 2: Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Option 3: Python
python -c "import secrets; print(secrets.token_hex(32))"
```

Add the generated secret to your environment:

```bash
# .env (local)
CRON_SECRET=abc123...your-secret-here

# Vercel
vercel env add CRON_SECRET

# Other platforms
# Add as environment variable in your deployment platform
```

### Verify Cron Protection

Test that cron endpoints reject unauthorized requests:

```bash
# This should return 401 Unauthorized
curl -X POST https://your-app.com/api/cron/fetch-feeds

# This should work
curl -X POST https://your-app.com/api/cron/fetch-feeds \
  -H "Authorization: Bearer your-cron-secret"
```

## Cron Schedules Explained

### Fetch Feeds: `*/15 * * * *`
- Runs every 15 minutes
- Checks all feeds and fetches those due based on their `fetchInterval`
- Example: Feed with 60-minute interval fetches every 60 min, not every 15 min

### Generate Digests: `0 * * * *`
- Runs every hour at :00
- **Hourly digests**: Generated every hour
- **Daily digests**: Generated at 8:00 AM (8:00 UTC)
- **Weekly digests**: Generated Monday 8:00 AM (Monday 8:00 UTC)

## Monitoring

### Check Cron Health

Visit these URLs to verify cron endpoints are running:

- `GET /api/cron/fetch-feeds` - Returns status info
- `GET /api/cron/generate-digests` - Returns status info

### View Logs

Check your application logs for cron job execution:

```bash
# Vercel
vercel logs

# Docker
docker logs <container-id>

# Server
tail -f /var/log/app.log
```

Look for log entries like:
```
[Cron] Feed fetch completed: { totalFeeds: 5, fetchedFeeds: 3, totalNewItems: 12 }
[Cron] Digest generation completed: { hourly: { generated: 2, skipped: 0 } }
```

## Troubleshooting

### Cron jobs not running

1. **Verify cron schedule syntax**:
   - Use [crontab.guru](https://crontab.guru/) to validate

2. **Check authorization**:
   - Ensure `CRON_SECRET` matches in both app and cron service
   - Verify `Authorization` header format

3. **Test manually**:
   ```bash
   curl -v -X POST http://localhost:3000/api/cron/fetch-feeds \
     -H "Authorization: Bearer your-secret"
   ```

### Feeds not fetching

1. **Check feed intervals**:
   - Feeds only fetch when `now - lastFetchedAt >= fetchInterval`
   - Default interval is 60 minutes

2. **Verify feed is enabled**:
   - Check feed status in dashboard
   - Disabled feeds are skipped

3. **Check logs for errors**:
   - Feed parsing failures
   - Network issues
   - Rate limiting

### Digests not generating

1. **Check user preferences**:
   - `autoFetch` must be enabled
   - `digestFrequency` must match digest type

2. **Verify signal threshold**:
   - Ensure items meet `highSignalThreshold`
   - Check `digestMinItems` requirement

3. **Review digest timing**:
   - Daily: Only at 8 AM
   - Weekly: Only Monday 8 AM
   - Check your timezone vs. server timezone

## Alternative: Manual Mode

If you don't want automatic fetching:

1. **Disable in user preferences** (`/settings`):
   - Turn off "Automatic Feed Fetching"

2. **Manual operations**:
   - Fetch feeds: Click "Fetch Now" in dashboard
   - Generate digests: Use "Generate Digest" in digests page

## Cost Considerations

**Free Tier Limits**:
- GitHub Actions: 2,000 minutes/month (plenty for cron)
- Vercel Cron: Requires paid plan ($20/mo)
- External cron services: Most have free tiers

**Recommended for free usage**:
- Development: Manual triggers
- Production: GitHub Actions or cron-job.org

## Advanced: Custom Schedules

Edit the cron endpoints to customize timing:

```typescript
// apps/web/src/app/api/cron/generate-digests/route.ts

// Current: Daily at 8 AM, Weekly Monday 8 AM
// Change to: Daily at 9 AM, Weekly Friday 6 PM

if (hour === 9) {  // Changed from 8
  // Daily digest
}

if (now.getDay() === 5 && hour === 18) {  // Friday (5) at 6 PM
  // Weekly digest
}
```

## Questions?

- Architecture: See `docs/automation-design.md`
- Setup: This file
- Issues: File a GitHub issue
