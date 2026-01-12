# Deebop - Social Media Platform

## Project Overview
A social media platform combining Shouts (Twitter-like), Images (Instagram-like), Videos (TikTok-like reels), and 360 Panoramas. Web-first, mobile-ready architecture.

**Location:** `C:/Users/maxim/Desktop/deebop`
**Web App:** `C:/Users/maxim/Desktop/deebop/web`
**Port:** `3001` (to avoid conflict with other projects on 3000)

## Tech Stack
| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14+ (App Router), React 19, TypeScript |
| Styling | Tailwind CSS 4 |
| State | Zustand + TanStack React Query |
| Database | PostgreSQL 15 (Docker, port 5433) + Prisma ORM |
| Auth | bcryptjs (password) + jose (JWT), cookie: `deebop-auth` |
| Storage | MinIO (local S3-compatible, port 9000) |
| Queue | Redis (port 6379) |

## Account Tiers
| Feature | Free | Standard (£3.99/mo) | Pro (£9.99/mo) |
|---------|------|---------------------|-----------------|
| Images | 500KB compressed | 10MB original | 50MB original |
| Video | 1min | 3min | 10min |
| Audio | 1min | 3min | 10min |
| 360 Panorama | No | No | Yes (100MB) |
| Ads | Full | Reduced | None |
| Profile Link | No | Yes | Yes |

## Key Design Decisions
- **No comments or DMs** - engagement via Like, Follow, Save, Share only
- **Provenance labels** - AI generated, AI assisted, Original, Composite
- **Local-first development** - runs entirely via Docker Compose

## Project Structure
```
deebop/
├── web/                        # Next.js app
│   ├── src/
│   │   ├── app/
│   │   │   ├── (auth)/         # login, register
│   │   │   ├── (main)/         # home, explore, post, notifications, profile
│   │   │   ├── admin/          # Admin panel (dashboard, users, moderation, ads)
│   │   │   ├── u/[username]/   # Public profiles
│   │   │   ├── reels/          # TikTok-style viewer
│   │   │   ├── about/          # About page
│   │   │   ├── blog/           # Blog
│   │   │   ├── pricing/        # Pricing tiers
│   │   │   ├── features/       # Features page
│   │   │   ├── terms/          # Terms of Service
│   │   │   ├── privacy/        # Privacy Policy
│   │   │   ├── cookies/        # Cookie Policy
│   │   │   ├── contact/        # Contact page
│   │   │   ├── careers/        # Careers page
│   │   │   └── api/            # API routes
│   │   ├── components/
│   │   │   ├── layout/         # Navbar, Sidebar, Footer
│   │   │   ├── feed/           # FeedContainer, PostCard, ContentTypeFilter
│   │   │   ├── viewers/        # ReelsViewer, PanoramaViewer
│   │   │   ├── post/           # CreatePostForm
│   │   │   ├── ads/            # AdCard, BoostedPostCard, BoostPostModal
│   │   │   ├── subscription/   # UpgradePrompt, TierBadge
│   │   │   └── moderation/     # ReportModal
│   │   ├── lib/                # db.ts, auth.ts, s3.ts
│   │   ├── stores/             # Zustand stores
│   │   └── hooks/              # useAuth, useFeed
│   ├── prisma/
│   │   └── schema.prisma       # Database schema
│   └── .env                    # Environment variables
└── .docker/
    └── docker-compose.yml      # Local dev environment
```

## Admin Panel
**URL:** http://localhost:3001/admin

**Admin Credentials (dev):**
- Email: `admin@deebop.com`
- Password: `admin123`

**Admin access controlled by:** `ADMIN_EMAILS` env var (comma-separated list)

**Admin Features:**
- Dashboard - Stats overview (users, posts, reports, ads)
- User Management - Search, filter, suspend, change tier, delete, view posts
- Moderation Queue - Review reported content
- Ad Management - Create and manage platform ads

## Authentication
- Cookie name: `deebop-auth` (IMPORTANT: all API routes must use this)
- JWT secret: `JWT_SECRET` env var
- Password hashing: bcryptjs

## Database
- PostgreSQL via Docker on port 5433
- Connection: `postgresql://deebop:deebop@localhost:5433/deebop`
- ORM: Prisma
- Key models: User, Post, Follow, Like, Save, Share, Report, Ad, Boost, VideoJob

## Running Locally
```bash
# Start Docker services (PostgreSQL, MinIO, Redis)
cd .docker && docker-compose up -d

# Install dependencies
cd web && npm install

# Push schema to database
npx prisma db push

# Run dev server
npm run dev
```

## Implementation Status

### Completed (Phases 1-9)
- [x] Auth (login, register, JWT)
- [x] Profiles (view, edit, privacy settings)
- [x] Content creation (shouts, images, videos, 360 panoramas)
- [x] Feed with content type filtering
- [x] Engagement (like, follow, save, share)
- [x] Reels-style video viewer
- [x] 360 Panorama viewer (Pannellum)
- [x] Subscription tiers (Stripe integration)
- [x] Ads & Boosts system
- [x] Moderation & reporting
- [x] Admin panel (dashboard, users, moderation, ads)
- [x] Static pages (about, blog, pricing, terms, privacy, etc.)
- [x] Footer with navigation links
- [x] Video transcoding (FFmpeg, async processing, tier-based limits)

## Video Transcoding System

The platform includes automatic video transcoding using FFmpeg CLI. Videos are processed asynchronously after upload.

### How It Works
1. User uploads video via `/api/upload` with `mediaType=video`
2. Raw video stored in MinIO under `raw/` prefix
3. `VideoJob` record created with status `pending`
4. `triggerVideoProcessing()` starts FFmpeg transcoding in background
5. Video transcoded based on user tier settings
6. Thumbnail generated at 1-second mark
7. Processed files uploaded to MinIO under `video/` prefix
8. `VideoJob` updated with output URLs and metadata

### Tier-Based Settings
| Tier | Max Duration | Resolution | Bitrate |
|------|--------------|------------|---------|
| Free | 60 seconds | 1080p | 3000k |
| Standard | 3 minutes | 1080p | 4000k |
| Pro | 10 minutes | 1080p | 5000k |

### Key Files
| File | Purpose |
|------|---------|
| `lib/video-job-processor.ts` | Core transcoding logic with FFmpeg CLI |
| `app/api/upload/route.ts` | Video upload endpoint, creates VideoJob |
| `app/api/video-jobs/[id]/route.ts` | Get job status, cancel job |
| `app/api/cron/process-videos/route.ts` | Cron endpoint for batch processing |
| `components/post/CreatePostForm.tsx` | Frontend with job status polling |

### API Endpoints
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/upload` | POST | Upload video, returns `jobId` |
| `/api/video-jobs/[id]` | GET | Get job status and progress |
| `/api/video-jobs/[id]` | DELETE | Cancel pending/processing job |
| `/api/cron/process-videos` | GET | Process next pending job (for cron) |

### VideoJob Statuses
- `pending` - Waiting to be processed
- `processing` - Currently being transcoded
- `completed` - Successfully processed
- `failed` - Processing failed (see `errorMessage`)
- `cancelled` - Cancelled by user

### FFmpeg Configuration
FFmpeg path is auto-detected or can be set via environment variables:
```bash
FFMPEG_PATH="C:/path/to/ffmpeg.exe"
FFPROBE_PATH="C:/path/to/ffprobe.exe"
```

### Testing Video Transcoding
```bash
# 1. Start dev server
cd web && npm run dev

# 2. Test via cron endpoint (no auth required in dev)
curl http://localhost:3001/api/cron/process-videos

# 3. Or upload a test video (requires auth cookie)
# See test-auto.mp4 in web/ directory for a sample video
```

### Verified Working (Jan 4, 2026)
- FFmpeg 8.0.1 installed via winget
- Test video uploaded and transcoded successfully
- Thumbnail generation working
- MinIO storage verified accessible

## Common Issues & Fixes

### 401 Unauthorized on Admin APIs
**Cause:** Cookie name mismatch - API routes checking wrong cookie name
**Fix:** Ensure all admin routes use `cookieStore.get('deebop-auth')` not `auth_token`

### Port Already in Use
```bash
# Find process on port 3001
netstat -aon | grep :3001
# Kill it
taskkill /F /PID <PID>
```

## Stripe Payments (Optional)

Stripe is **optional** - the app runs without it for beta testing. Payment features return 503 when Stripe is not configured.

### Enabling Stripe

1. Add these environment variables in Vercel:
   ```bash
   STRIPE_SECRET_KEY="sk_live_..."          # From Stripe Dashboard > API Keys
   STRIPE_WEBHOOK_SECRET="whsec_..."        # From Stripe Dashboard > Webhooks
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_..."
   STRIPE_STANDARD_PRICE_ID="price_..."     # Create in Stripe > Products
   STRIPE_PRO_PRICE_ID="price_..."          # Create in Stripe > Products
   ```

2. Create products in Stripe Dashboard:
   - **Standard** - £5.99/month subscription
   - **Pro** - £14.99/month subscription

3. Set up webhook endpoint in Stripe Dashboard:
   - URL: `https://your-domain.com/api/subscriptions/webhook`
   - Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`

### Key Files
| File | Purpose |
|------|---------|
| `lib/stripe.ts` | Stripe initialization, tier configs, `getStripe()`, `isStripeEnabled()` |
| `app/api/subscriptions/checkout/route.ts` | Create checkout session |
| `app/api/subscriptions/portal/route.ts` | Billing portal redirect |
| `app/api/subscriptions/status/route.ts` | Get user's subscription status |
| `app/api/subscriptions/webhook/route.ts` | Handle Stripe webhooks |
| `app/api/boosts/route.ts` | Create boost with payment |

### How It Works
- `isStripeEnabled()` checks if `STRIPE_SECRET_KEY` is set
- `getStripe()` lazily initializes Stripe only when called
- Routes return 503 "Payments disabled in beta mode" when Stripe is not configured
- Subscription status endpoint still works (returns user tier without Stripe details)

## Environment Variables (.env)
```bash
DATABASE_URL="postgresql://deebop:deebop@localhost:5433/deebop"
JWT_SECRET="local-dev-secret-change-in-production"
S3_ENDPOINT="http://localhost:9000"
S3_ACCESS_KEY_ID="minioadmin"
S3_SECRET_ACCESS_KEY="minioadmin123"
S3_BUCKET="deebop-media"
REDIS_URL="redis://localhost:6379"
NEXT_PUBLIC_APP_URL="http://localhost:3001"
ADMIN_EMAILS="admin@deebop.com,john@example.com,test@example.com"

# Optional - Stripe (for payments)
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_STANDARD_PRICE_ID="price_..."
STRIPE_PRO_PRICE_ID="price_..."
```
