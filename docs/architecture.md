# Snub.io Technical Architecture

**Version**: 0.1.0
**Status**: Initial Design
**Last Updated**: 2025-11-14

---

## Executive Summary

Snub.io is a platform for intentional signal filtering and focus amplification. The system is architected as a **universal noise filtering framework** with domain-specific modules, designed for extensibility, performance, and clarity.

### Core Principles

1. **Attention is the scarce resource** - All design decisions optimize for user attention sovereignty
2. **Universal abstraction, specialized implementation** - Core filtering framework with pluggable domain modules
3. **Performance where it matters** - C++ microservices for signal processing, ML inference, real-time filtering
4. **Clean boundaries** - Clear separation between UI, business logic, and data processing

---

## System Architecture

### High-Level Overview

```
┌─────────────────────────────────────────────────────────────┐
│                         User Layer                           │
│  ┌──────────────┐              ┌──────────────┐            │
│  │  Web App     │              │  Browser     │            │
│  │  (Next.js)   │              │  Extension   │            │
│  └──────────────┘              └──────────────┘            │
└────────────┬────────────────────────────┬───────────────────┘
             │                            │
             └────────────┬───────────────┘
                          │ API Gateway
             ┌────────────▼────────────────┐
             │    Application Layer        │
             │  ┌────────────────────────┐ │
             │  │  TypeScript API        │ │
             │  │  (Next.js API Routes)  │ │
             │  └──────────┬─────────────┘ │
             │             │                │
             │  ┌──────────▼─────────────┐ │
             │  │  Core Filtering        │ │
             │  │  Framework             │ │
             │  └──────────┬─────────────┘ │
             └─────────────┼────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
   ┌────▼─────┐      ┌────▼─────┐      ┌────▼─────┐
   │ Social   │      │  Email   │      │  News    │
   │ Filter   │      │  Filter  │      │  Filter  │
   └──────────┘      └──────────┘      └──────────┘
        │                  │                  │
        └──────────────────┼──────────────────┘
                           │
             ┌─────────────▼─────────────┐
             │   Performance Layer       │
             │  ┌──────────────────────┐ │
             │  │  C++ Signal          │ │
             │  │  Processor           │ │
             │  └──────────────────────┘ │
             │  ┌──────────────────────┐ │
             │  │  C++ ML Inference    │ │
             │  └──────────────────────┘ │
             └───────────────────────────┘
                           │
             ┌─────────────▼─────────────┐
             │      Data Layer           │
             │  ┌──────────┐  ┌────────┐│
             │  │PostgreSQL│  │ Redis  ││
             │  └──────────┘  └────────┘│
             └───────────────────────────┘
```

---

## Component Design

### 1. Core Filtering Framework

**Location**: `packages/core/`

The universal abstraction layer for all noise filtering operations.

**Responsibilities**:
- Define filtering interfaces and contracts
- Manage filter composition and chaining
- Handle signal scoring and ranking
- Provide plugin architecture for domain-specific filters

**Key Abstractions**:
```typescript
interface NoiseFilter {
  evaluate(signal: Signal): FilterScore;
  shouldBlock(signal: Signal): boolean;
  configure(config: FilterConfig): void;
}

interface Signal {
  id: string;
  source: SignalSource;
  content: Content;
  metadata: Metadata;
  timestamp: number;
}

interface FilterScore {
  signal: number;      // 0-1 (higher = more signal)
  noise: number;       // 0-1 (higher = more noise)
  confidence: number;  // 0-1 (certainty of score)
}
```

### 2. Domain-Specific Filters

**Location**: `packages/filters/`

Specialized implementations of the core filtering interface.

**Modules**:
- **social/** - Social media feed filtering (Twitter, Facebook, Reddit, etc.)
- **email/** - Email and notification stream filtering
- **news/** - News cycle and content aggregator filtering
- **feeds/** - RSS/Atom and general content feed filtering

Each module implements:
- Pattern matching for domain-specific noise signatures
- Content analysis algorithms
- User preference learning
- Domain-specific configuration

### 3. Web Application

**Location**: `apps/web/`

Modern Next.js application serving as the control center.

**Features**:
- User authentication and profile management
- Filter configuration interface
- Signal dashboard (curated content view)
- Focus session tracking
- Analytics and insights

**Tech Stack**:
- Next.js 14+ (App Router)
- React Server Components
- Tailwind CSS (cyberpunk aesthetic)
- TypeScript

### 4. Browser Extension

**Location**: `apps/extension/`

Direct interception and filtering at the source.

**Capabilities**:
- Inject filters into web pages
- Real-time content evaluation
- Sync with web app via API
- Offline filtering capability

**Tech Stack**:
- TypeScript
- Web Extensions API
- Manifest V3

### 5. C++ Microservices

**Location**: `services/`

Performance-critical components for heavy computational work.

**Signal Processor** (`signal-processor/`):
- Real-time signal analysis
- Pattern recognition
- Feature extraction
- SIMD-optimized operations

**ML Inference** (`ml-inference/`):
- Neural network inference for signal scoring
- User behavior modeling
- Anomaly detection
- C++17/20/23 with optimized linear algebra

---

## Data Model

### Core Entities

**User**
```sql
users (
  id UUID PRIMARY KEY,
  email VARCHAR UNIQUE,
  created_at TIMESTAMP,
  preferences JSONB
)
```

**Signal**
```sql
signals (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users,
  source VARCHAR,
  content TEXT,
  metadata JSONB,
  score FLOAT,
  captured_at TIMESTAMP,
  processed_at TIMESTAMP
)
```

**Filter Configuration**
```sql
filter_configs (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users,
  filter_type VARCHAR,
  config JSONB,
  enabled BOOLEAN,
  updated_at TIMESTAMP
)
```

### Caching Strategy

**Redis**:
- User session state
- Recently evaluated signals
- Filter execution cache
- Real-time analytics counters

---

## Deployment Architecture

### Development
```
localhost:3000 - Next.js dev server
localhost:5432 - PostgreSQL
localhost:6379 - Redis
localhost:8080 - C++ signal processor
localhost:8081 - C++ ML inference
```

### Production
```
Vercel - Frontend (web app)
Docker/K8s - Backend microservices
AWS RDS/Supabase - PostgreSQL
Redis Cloud - Redis
CDN - Static assets
```

---

## Performance Considerations

### Critical Paths
1. **Signal evaluation** - Must be < 50ms per signal
2. **Filter chaining** - Parallel execution where possible
3. **ML inference** - Batched and cached aggressively

### Optimization Strategy
- C++ for computation-heavy operations
- SIMD instructions for vectorized operations
- Redis caching at every layer
- Database query optimization (indexes, materialized views)

---

## Security & Privacy

### Principles
1. **User data ownership** - Users control their signal data
2. **Local-first processing** - Browser extension can filter offline
3. **Minimal telemetry** - Only collect what's necessary for service improvement
4. **Encryption at rest** - All user content encrypted in database

### Implementation
- JWT-based authentication
- Content encryption (AES-256)
- Rate limiting on all APIs
- Input sanitization and validation

---

## Development Roadmap

### Phase 1: Foundation (Current)
- [ ] Repository structure
- [ ] Core filtering framework
- [ ] Basic web app
- [ ] PostgreSQL + Redis setup

### Phase 2: Core Features
- [ ] User authentication
- [ ] Social media filter module
- [ ] Signal dashboard
- [ ] Browser extension prototype

### Phase 3: Intelligence
- [ ] C++ signal processor
- [ ] ML-based signal scoring
- [ ] User preference learning
- [ ] Advanced filter configuration

### Phase 4: Scale
- [ ] Performance optimization
- [ ] Multi-platform support
- [ ] Plugin marketplace
- [ ] Public API

---

## Open Questions

1. **Platform priority**: Web app first, or browser extension?
2. **First prototype**: What use case to implement first?
3. **ML approach**: Supervised, unsupervised, or reinforcement learning for signal scoring?
4. **Monetization**: Freemium, subscription, or one-time purchase?

---

## References

- [Next.js Documentation](https://nextjs.org/docs)
- [Web Extensions API](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions)
- [PostgreSQL Performance](https://www.postgresql.org/docs/current/performance-tips.html)

---

**Maintained by**: Katastrophos
**Last Review**: 2025-11-14
