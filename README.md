# Deebop

A social media platform for sharing images, videos, 360 panoramas, and short text posts (shouts). Built with Next.js 14+, Supabase, and Docker.

## Features

- **Shouts** - Short text posts (Twitter-like)
- **Images** - Photo sharing with descriptions and hashtags
- **Videos** - TikTok-style reels with vertical swipe navigation
- **360 Panoramas** - Immersive panoramic content (Pro tier)
- **No comments, no DMs** - Engagement via Like, Follow, Save, Share only
- **Subscription tiers** - Free, Standard (£5.99/mo), Pro (£14.99/mo)

## Tech Stack

- **Frontend**: Next.js 14+ (App Router), React 19, TypeScript, Tailwind CSS
- **State**: Zustand + TanStack React Query
- **Database**: PostgreSQL 15 via Supabase
- **Storage**: Wasabi S3 (production), MinIO (local development)
- **Media Processing**: FFmpeg (video), Sharp (images)
- **Payments**: Stripe (subscriptions, boosts)
- **Queue**: Redis + BullMQ

## Getting Started

### Prerequisites

- Node.js 20+
- Docker Desktop
- Git

### Local Development

1. **Clone and install dependencies**
   ```bash
   cd deebop
   npm install
   cd web && npm install
   cd ../worker && npm install
   ```

2. **Start Docker services**
   ```bash
   cd .docker
   docker-compose up -d
   ```
   This starts:
   - PostgreSQL on port 54322
   - MinIO (S3) on ports 9000 (API) and 9001 (Console)
   - Redis on port 6379

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your settings
   ```

4. **Run database migrations**
   ```bash
   # Using Supabase CLI
   supabase db reset
   ```

5. **Start the development server**
   ```bash
   cd web
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000)

6. **Start the media processing worker** (optional)
   ```bash
   cd worker
   npm run dev
   ```

### MinIO Console

Access the MinIO console at [http://localhost:9001](http://localhost:9001)
- Username: `minioadmin`
- Password: `minioadmin123`

## Project Structure

```
deebop/
├── .docker/                 # Docker Compose and configs
├── supabase/
│   ├── migrations/          # Database migrations
│   └── functions/           # Edge Functions
├── web/                     # Next.js web application
│   └── src/
│       ├── app/             # App Router pages
│       ├── components/      # React components
│       ├── lib/             # Utilities and API clients
│       ├── stores/          # Zustand stores
│       └── types/           # TypeScript types
├── worker/                  # Media processing worker
│   └── src/
│       └── processors/      # Image, video, panorama processors
└── docs/                    # Documentation
```

## Subscription Tiers

| Feature | Free | Standard | Pro |
|---------|------|----------|-----|
| Price | £0 | £5.99/mo | £14.99/mo |
| Images | 500KB compressed | 10MB original | 50MB original |
| Video | 30s @ 720p | 1min @ 1080p | 5min @ 4K |
| 360 Panorama | No | No | Yes (100MB) |
| Ads | Full | Reduced | None |
| Profile Link | No | Yes | Yes |

## License

Proprietary - All rights reserved
