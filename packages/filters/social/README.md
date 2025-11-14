# @snub/filter-social

Social media filtering module for snub.io

## Overview

Specialized filters for detecting and filtering noise in social media content:

- **Engagement bait** (like/share/comment prompts)
- **Clickbait patterns**
- **Keyword-based filtering**
- **Content quality signals**

## Filters

### KeywordFilter

Block or promote content based on configurable keywords.

```typescript
import { KeywordFilter } from '@snub/filter-social'

const filter = new KeywordFilter({
  id: 'my-keyword-filter',
  name: 'Personal Keywords',
  enabled: true,
  priority: 100,
  config: {
    noiseKeywords: ['drama', 'outrage', 'breaking'],
    signalKeywords: ['research', 'analysis', 'data'],
  },
})
```

### EngagementBaitFilter

Detect and filter engagement bait patterns automatically.

```typescript
import { EngagementBaitFilter } from '@snub/filter-social'

const filter = new EngagementBaitFilter({
  id: 'engagement-bait',
  name: 'Engagement Bait Detector',
  enabled: true,
  priority: 90,
  config: {},
})
```

## Usage with FilterChain

```typescript
import { FilterChain } from '@snub/core'
import { KeywordFilter, EngagementBaitFilter } from '@snub/filter-social'

const chain = new FilterChain([
  new EngagementBaitFilter({ /* config */ }),
  new KeywordFilter({ /* config */ }),
])

const result = await chain.evaluate(signal)
console.log(result.decision) // 'allow' | 'block' | 'defer' | etc.
```
