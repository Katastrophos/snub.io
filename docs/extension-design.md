# Browser Extension Architecture

**Feature**: Real-time noise filtering on social media and news sites

## Overview

Transform snub.io from a passive feed reader into an **active noise suppression system** that filters the entire web in real-time.

## Supported Platforms

### Phase 1 (MVP)
- **Twitter/X** - Filter tweets, retweets, promoted content
- **Reddit** - Filter posts and comments
- **Hacker News** - Filter stories and comments

### Phase 2 (Future)
- LinkedIn, Facebook, Instagram
- YouTube comments/recommendations
- News sites (NY Times, BBC, etc.)

## Architecture

```
┌─────────────────────────────────────────────────┐
│              Browser Tab                         │
│  ┌──────────────────────────────────────┐      │
│  │        Web Page (Twitter/Reddit)      │      │
│  │  ┌────────────────────────────────┐  │      │
│  │  │   Content Script (Injected)    │  │      │
│  │  │   - Find posts/tweets          │  │      │
│  │  │   - Extract content            │  │      │
│  │  │   - Apply filters              │  │      │
│  │  │   - Modify DOM                 │  │      │
│  │  └────────────┬───────────────────┘  │      │
│  └───────────────┼──────────────────────┘      │
└────────────────┼─────────────────────────────┘
                 │ Message Passing
         ┌───────▼──────────┐
         │  Background      │
         │  Service Worker  │
         │  - Filter cache  │
         │  - Sync w/ API   │
         │  - Storage       │
         └───────┬──────────┘
                 │
         ┌───────▼──────────┐
         │   Popup UI       │
         │  - Stats         │
         │  - Quick toggle  │
         │  - Settings link │
         └──────────────────┘
```

## Components

### 1. Manifest (manifest.json)

**Version**: Manifest V3 (Chrome/Edge)
**Permissions**:
- `activeTab` - Access current tab
- `storage` - Store filter configs and stats
- `scripting` - Inject content scripts
- `host_permissions` - Twitter, Reddit, HN

### 2. Content Scripts

**Platform-specific scripts** that inject into pages:
- `twitter.ts` - Twitter/X filtering
- `reddit.ts` - Reddit filtering
- `hackernews.ts` - Hacker News filtering

**Responsibilities**:
- Observe DOM mutations (new posts loading)
- Extract post content and metadata
- Convert to Signal format
- Evaluate through filter chain
- Apply visual modifications (hide/dim/highlight)

### 3. Background Service Worker

**Persistent background process**:
- Cache user's filter configs
- Sync with snub.io web app API
- Aggregate filtering stats
- Handle cross-tab communication

### 4. Popup UI

**Extension popup** (click icon in toolbar):
- Current page filtering stats
- Quick enable/disable toggle
- Link to web app settings
- Recent filtered items

### 5. Shared Filter Logic

**Uses @snub/core package**:
- Same filters as web app
- Consistent scoring
- Reusable filter implementations

## Data Flow

```
1. User visits Twitter
2. Content script injects
3. Script observes tweets loading
4. For each tweet:
   a. Extract text, author, metadata
   b. Convert to Signal
   c. Evaluate through FilterChain
   d. Apply decision (hide/dim/highlight)
5. Background worker tracks stats
6. Popup shows: "Blocked 23 tweets on this page"
```

## Visual Modifications

### Decision Actions

**BLOCK**:
- Hide element completely
- Add "Show blocked content" button (optional)

**REDUCE**:
- Reduce opacity to 0.3
- Collapse content (show title only)
- Add "(Low signal)" badge

**ALLOW**:
- No modification
- Default display

**HIGHLIGHT**:
- Add neon cyan border
- Increase opacity to 1.0
- Add "High signal" badge

**DEFER**:
- Move to "Read Later" section
- Reduce priority in feed

## Sync with Web App

### Initial Sync
1. User installs extension
2. Extension opens tab to web app
3. User logs in (or uses demo mode)
4. Extension stores user ID + filter configs

### Ongoing Sync
- Background worker polls `/api/filters` every 5 minutes
- Updates filter cache on change
- Sends filtering stats to `/api/stats`

### Offline Mode
- Extension works offline with cached filters
- Syncs stats when reconnected

## Filter Configuration

**Two modes**:

1. **Use web app filters** (default)
   - Syncs from web app
   - User configures at snub.io/settings

2. **Extension-only filters**
   - Quick toggles in popup
   - Simplified keyword lists
   - Don't sync to web app

## Performance

### Optimization Strategies

**Lazy Evaluation**:
- Only evaluate visible posts
- Batch processing for scrolling

**Filter Caching**:
- Cache filter results per post ID
- Invalidate on filter config change

**DOM Efficiency**:
- Use MutationObserver for new content
- Debounce rapid mutations
- CSS classes for visual changes (not inline styles)

**Memory Management**:
- Limit cache size (1000 items max)
- Clear old entries on tab close

## Privacy & Security

### Data Collection
- **No tracking** - Extension doesn't phone home
- **Local-only filtering** - Content never sent to servers
- **Optional sync** - User can disable web app sync

### Permissions Justification
- `activeTab` - Only access current tab when user interacts
- `storage` - Store filters and preferences locally
- `scripting` - Inject filtering code
- `host_permissions` - Specific to Twitter/Reddit/HN only

### Content Security
- No `eval()` or dynamic code execution
- Sandboxed content scripts
- CSP-compliant

## User Experience

### First Run
1. Install extension
2. See welcome page with setup guide
3. Choose: "Use web app" or "Quick setup"
4. Visit Twitter → see filtering in action
5. Click extension icon → see stats

### Daily Use
- Seamless filtering as you browse
- Subtle visual cues (badges, opacity)
- Non-intrusive by default
- Stats in popup for awareness

### Power User Features
- Custom CSS for filtered content
- Whitelist specific users/sources
- Export filtering history
- Keyboard shortcuts

## Platform-Specific Logic

### Twitter/X

**Target Elements**:
```javascript
article[data-testid="tweet"]
```

**Extract**:
- Tweet text
- Author username
- Engagement metrics
- Media/links

**Challenges**:
- React virtual scrolling
- Dynamic class names
- Promoted tweets (different structure)

### Reddit

**Target Elements**:
```javascript
div[data-testid="post-container"]
```

**Extract**:
- Post title + selftext
- Subreddit
- Upvotes/downvotes
- Author

**Challenges**:
- Infinite scroll
- Collapsed threads
- Awards/badges

### Hacker News

**Target Elements**:
```javascript
tr.athing
```

**Extract**:
- Title + URL
- Points + comments
- Submitter

**Challenges**:
- Server-rendered HTML (simpler)
- Nested comment threads

## Development Workflow

```bash
# Build extension
cd apps/extension
npm run build

# Load unpacked in Chrome
# 1. chrome://extensions
# 2. Enable "Developer mode"
# 3. Click "Load unpacked"
# 4. Select apps/extension/dist

# Hot reload during dev
npm run dev  # Watches for changes
```

## Distribution

### Chrome Web Store
- Submit for review
- $5 one-time fee
- 2-3 day approval

### Firefox Add-ons
- Submit to AMO
- Free
- 1-2 day approval

### Edge Add-ons
- Uses Chrome extension
- Separate submission

## Future Enhancements

- [ ] Apply filters to YouTube recommendations
- [ ] Filter email in Gmail web interface
- [ ] Custom filter rules per site
- [ ] Export blocked content as digest
- [ ] Collaborative filters (share with community)
- [ ] ML-based adaptive filtering (learn from clicks)
- [ ] Browser-native notifications for high-signal content

## Success Metrics

- **Engagement**: % of users who enable extension after install
- **Effectiveness**: Avg items blocked per page
- **Retention**: Daily active users
- **Performance**: Filter evaluation time < 10ms per post
