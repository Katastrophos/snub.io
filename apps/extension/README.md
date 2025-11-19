# snub.io Browser Extension

**ignore the noise, on purpose**

Real-time noise filtering for Twitter/X, Reddit, and Hacker News.

## Features

- 🚫 **Block** - Hide noise completely
- ⬇️ **Reduce** - Dim low-signal content
- ⭐ **Highlight** - Emphasize high-signal content
- 📊 **Stats** - See what you're filtering
- 🔄 **Sync** - Use your web app filter configs

## Supported Platforms

- **Twitter/X** - Filter tweets, retweets, promoted content
- **Reddit** - Filter posts and comments (old + new Reddit)
- **Hacker News** - Filter stories and comments

## Installation

### Development (Local Testing)

```bash
# Build extension
cd apps/extension
npm install
npm run build

# Load in Chrome:
# 1. Open chrome://extensions
# 2. Enable "Developer mode"
# 3. Click "Load unpacked"
# 4. Select apps/extension/dist directory

# For Firefox:
# 1. Open about:debugging#/runtime/this-firefox
# 2. Click "Load Temporary Add-on"
# 3. Select apps/extension/dist/manifest.json
```

### Production

*Coming soon to Chrome Web Store and Firefox Add-ons*

## How It Works

### 1. Content Scripts

The extension injects JavaScript into web pages to:
- Find posts/tweets/stories
- Extract content and metadata
- Evaluate through your filter chain
- Apply visual modifications (hide/dim/highlight)

### 2. Filter Engine

Uses the same `@snub/core` filtering logic as the web app:
- Engagement bait detection
- Keyword filtering
- Signal/noise scoring
- Customizable rules

### 3. Background Worker

Syncs with your snub.io web app:
- Pulls your filter configurations
- Tracks filtering stats
- Manages cross-tab communication

### 4. Popup UI

Click the extension icon to:
- See filtering stats for current page
- Toggle extension on/off
- Sync filters from web app
- Open dashboard

## Usage

### First Time Setup

1. Install extension
2. Visit Twitter, Reddit, or Hacker News
3. Click extension icon
4. (Optional) Click "Open Dashboard" to configure filters in web app
5. (Optional) Click "Sync Filters" to use web app configuration

### Daily Use

Just browse normally! The extension works automatically:
- Noise is hidden/dimmed
- High-signal content is highlighted
- Badges show filter decisions
- Stats update in real-time

### Configuration

**Default Filters** (built-in):
- Engagement bait detector (clickbait, emoji spam)
- Keyword filter (noise/signal keywords)

**Web App Sync** (optional):
- Configure filters at snub.io/settings
- Click "Sync Filters" in extension popup
- Filters update across all tabs

## Visual Indicators

**Badges**:
- 🚫 Blocked - Content hidden
- ⬇️ Low Signal - Content dimmed
- ⭐ High Signal - Content highlighted

**Styles**:
- **Blocked**: Hidden completely
- **Reduced**: 30% opacity, grayscale
- **Highlighted**: Cyan border, subtle glow
- **Deferred**: Moved to end, 50% opacity

## Privacy

- **No tracking** - Extension doesn't phone home
- **Local filtering** - Content never sent to servers
- **Optional sync** - Web app sync is opt-in
- **Minimal permissions** - Only access sites you visit

## Permissions Explained

- `activeTab` - Read content on current tab (when you interact)
- `storage` - Save preferences and filter configs locally
- `scripting` - Inject filtering code into web pages
- `host_permissions` - Access specific sites (Twitter, Reddit, HN only)

## Development

### Project Structure

```
apps/extension/
├── src/
│   ├── background/       # Service worker
│   ├── content/          # Platform-specific filters
│   │   ├── base-filter.ts
│   │   ├── twitter.ts
│   │   ├── reddit.ts
│   │   └── hackernews.ts
│   ├── popup/            # Extension popup UI
│   ├── shared/           # Utilities, types
│   │   ├── types.ts
│   │   ├── storage.ts
│   │   └── filter-engine.ts
├── public/               # Static assets
│   ├── content.css
│   └── icons/
├── manifest.json
└── webpack.config.js
```

### Build Commands

```bash
# Development (watch mode)
npm run dev

# Production build
npm run build

# Clean
npm run clean
```

### Adding a New Platform

1. Create `src/content/platform.ts`
2. Extend `BasePlatformFilter`
3. Implement abstract methods:
   - `getPlatformName()`
   - `findPostElements()`
   - `isPostElement()`
   - `extractSignal()`
4. Add to `manifest.json` content_scripts
5. Add to webpack entry points

## Troubleshooting

### Extension not working

1. **Check if enabled**: Click icon, ensure "Enabled" is green
2. **Reload page**: Extension only filters new content after install
3. **Check console**: Open DevTools → Console → Look for `[snub.io]` logs

### Filters not applying

1. **Check configuration**: Ensure filters are enabled
2. **Sync from web app**: Click "Sync Filters" in popup
3. **Clear storage**: `chrome://extensions` → Details → Clear data

### Performance issues

1. **Disable on non-supported sites**: Extension only needed on Twitter/Reddit/HN
2. **Reduce filter count**: Too many filters slow down evaluation
3. **Report issue**: File bug with browser/OS details

## Roadmap

- [ ] YouTube filtering
- [ ] LinkedIn/Facebook support
- [ ] Custom CSS for filtered content
- [ ] Export filtering history
- [ ] Collaborative filter sharing
- [ ] Keyboard shortcuts
- [ ] Dark/light theme toggle

## Contributing

See main project repository: [github.com/Katastrophos/snub.io](https://github.com/Katastrophos/snub.io)

## License

MIT
