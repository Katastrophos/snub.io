# Authentication & Multi-User Design

**Feature**: User authentication and multi-user support

## Overview

Transform snub.io from a demo-only app into a production-ready multi-user platform with proper authentication, user isolation, and security.

## Authentication Strategy

### NextAuth.js v4

**Why NextAuth.js**:
- Built for Next.js (seamless integration)
- Session management
- JWT support
- Multiple providers (email/password, OAuth)
- TypeScript support
- Battle-tested security

### Providers

**Phase 1 (MVP)**:
- **Credentials** - Email + password
- Session-based authentication
- Secure password hashing (bcrypt)

**Phase 2 (Future)**:
- Google OAuth
- GitHub OAuth
- Magic link email

## User Model

Already exists in Prisma schema, needs updates:

```prisma
model User {
  id                String   @id @default(uuid())
  email             String   @unique
  name              String?
  password          String   // bcrypt hashed
  emailVerified     DateTime?
  image             String?
  preferences       Json?
  notificationPrefs Json?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  // Relations
  feeds         Feed[]
  feedItems     FeedItem[]
  filterConfigs FilterConfig[]
  digests       Digest[]
  sessions      Session[]
  accounts      Account[]
}

model Account {
  id                String  @id @default(uuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String?
  access_token      String?
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String?
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(uuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}
```

## Authentication Flow

### Registration

```
1. User visits /register
2. Enters email, name, password
3. Password validated (min 8 chars, complexity)
4. Password hashed with bcrypt (10 rounds)
5. User created in database
6. Default filters created
7. Session established
8. Redirect to /dashboard
```

### Login

```
1. User visits /login
2. Enters email, password
3. Credentials validated against database
4. bcrypt.compare() for password check
5. Session established (JWT)
6. Redirect to /dashboard or original destination
```

### Logout

```
1. User clicks logout
2. Session destroyed
3. JWT invalidated
4. Redirect to /
```

## API Route Protection

**Middleware Pattern**:

```typescript
// middleware.ts
export { default } from "next-auth/middleware"

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/reader/:path*",
    "/digests/:path*",
    "/settings/:path*",
    "/api/feeds/:path*",
    "/api/items/:path*",
    "/api/digests/:path*",
    "/api/preferences/:path*",
  ]
}
```

**API Route Helper**:

```typescript
async function getAuthenticatedUser(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }
  return session.user.id
}
```

## Session Management

**Session Strategy**: JWT (stateless)

**JWT Configuration**:
- Secret: `process.env.NEXTAUTH_SECRET`
- Expiry: 30 days
- Auto-refresh on activity

**Session Data**:
```typescript
{
  user: {
    id: string
    email: string
    name?: string
    image?: string
  }
  expires: string
}
```

## Security

### Password Requirements

- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- No common passwords (check against list)

### Password Hashing

- bcrypt with 10 salt rounds
- Never store plaintext
- Never log passwords

### Session Security

- HttpOnly cookies
- Secure flag in production
- SameSite=Lax
- CSRF protection (built-in NextAuth)

### Rate Limiting

**Login attempts**:
- Max 5 attempts per email per 15 minutes
- Exponential backoff
- Account lockout after 10 failed attempts (1 hour)

**Registration**:
- Max 3 accounts per IP per hour
- Email verification (future)

## Migration from Demo User

**Database Migration**:
```sql
-- Remove demo user
DELETE FROM users WHERE id = 'demo-user';

-- All related data cascade deletes automatically
-- (feeds, items, filter configs, digests)
```

**Code Changes**:
- Remove `DEMO_USER_ID` constants
- Replace with `session.user.id`
- Update all API routes
- Add auth checks

## User Isolation

**Enforce in Queries**:

```typescript
// Before
const feeds = await prisma.feed.findMany()

// After
const userId = await getAuthenticatedUser(req)
const feeds = await prisma.feed.findMany({
  where: { userId }
})
```

**Prisma Row-Level Security**:
- All queries filtered by userId
- No cross-user data access
- Cascading deletes on user removal

## UI Changes

### New Pages

- `/login` - Login form
- `/register` - Registration form
- `/profile` - User profile settings

### Navigation Updates

**Logged Out**:
- Show: Home, Login, Register

**Logged In**:
- Show: Dashboard, Reader, Digests, Settings, Profile
- User menu with logout

### Protected Routes

All dashboard routes require authentication:
- `/dashboard`
- `/reader`
- `/digests`
- `/settings`

Redirect to `/login?callbackUrl=<current-page>` if not authenticated.

## Analytics Integration

Once authenticated, track:
- Feeds added/removed
- Items processed per day
- Filter decisions distribution
- Digest generation frequency
- Most filtered sources
- Signal/noise trends over time

## Environment Variables

**Required**:
```env
# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<generate-with-openssl>

# Database
DATABASE_URL=postgresql://...

# Email (future)
EMAIL_SERVER=smtp://...
EMAIL_FROM=noreply@snub.io
```

**Generate Secret**:
```bash
openssl rand -base64 32
```

## Default User Experience

**New User Flow**:
1. Register account
2. See onboarding: "Welcome to snub.io"
3. Default filters auto-created
4. Suggested feeds to add
5. Quick tour of features
6. Redirect to dashboard

**Returning User**:
1. Login
2. See dashboard with stats
3. Recent digest if available
4. New items count

## Email Verification (Future)

**Flow**:
1. User registers
2. Email sent with verification link
3. User clicks link
4. Account verified
5. Can now use all features

**Unverified Limitations**:
- Can add max 2 feeds
- No digest generation
- Banner: "Verify your email"

## Password Reset (Future)

**Flow**:
1. User clicks "Forgot Password"
2. Enters email
3. Reset link sent
4. User clicks link
5. Sets new password
6. Password updated

## Multi-Device Support

**Session Sync**:
- Same user can login on multiple devices
- Sessions independent
- Filter configs shared
- Stats aggregated

**Browser Extension**:
- Sync filters via API
- User ID stored in extension
- Auth token for API calls

## Production Deployment

**Checklist**:
- [ ] Generate secure NEXTAUTH_SECRET
- [ ] Set NEXTAUTH_URL to production domain
- [ ] Enable HTTPS (required for secure cookies)
- [ ] Set up email provider
- [ ] Database backups
- [ ] Monitor failed login attempts
- [ ] Rate limiting on auth endpoints

## Testing

**Test Cases**:
- [ ] Register new user
- [ ] Login with correct credentials
- [ ] Login with wrong password (fail)
- [ ] Logout and verify session cleared
- [ ] Access protected route while logged out (redirect)
- [ ] Access protected API route while logged out (401)
- [ ] User isolation (can't see other user's data)
- [ ] Password hashing (never plaintext in DB)

## Future Enhancements

- [ ] OAuth providers (Google, GitHub)
- [ ] Email verification
- [ ] Password reset
- [ ] Two-factor authentication
- [ ] Account deletion
- [ ] Export user data
- [ ] Session management (view all sessions, revoke)
