# FitTracker PWA - Enhanced Fitness Tracking App

A comprehensive Progressive Web App for fitness tracking with home workouts, step counting, Strava integration, and social features.

## Features

### ✅ Core Features (Implemented)
- **Step Tracking**: PWA-based step counting with device motion sensors
- **Home Workouts**: Bodyweight and minimal equipment exercises from wger.de API
- **Authentication**: User profiles and goal setting with Supabase
- **Social Features**: Post workout results with media uploads
- **Strava Integration**: OAuth, activity sync, and webhook support
- **Progressive Web App**: Offline support and mobile-optimized

### 🎯 MVP Compliance
- **wger API Integration**: Exercise library with 24-hour caching
- **Strava API Compliance**: Rate limiting, privacy compliance, owner-only data access
- **Health Data**: Privacy-focused step tracking and workout analytics
- **Media Storage**: Supabase Storage for photo/video uploads
- **Real-time Sync**: Webhook-based Strava activity updates

## Quick Setup

### 1. Environment Configuration
Copy `.env.local` and update with your credentials:

```bash
# Supabase (Required)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Strava API (Optional for demo)
NEXT_PUBLIC_STRAVA_CLIENT_ID=your-strava-client-id
STRAVA_CLIENT_SECRET=your-strava-client-secret

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 2. Database Setup
1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Run the SQL from `.same/database-schema.sql` in your Supabase SQL Editor
3. Create a Storage bucket named `posts` for media uploads

### 3. Run Development Server
```bash
bun install
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Technical Stack

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Supabase (Auth, Database, Storage, RLS)
- **APIs**: wger.de (exercises), Strava (activities), MapLibre (optional maps)
- **PWA**: Service Worker, Device Motion API, offline support
- **Hosting**: Vercel/Netlify ready with Cloudflare Workers for webhooks

## Architecture

### Data Flow
1. **User Registration** → Supabase Auth → Auto-create profile
2. **Step Tracking** → Device Motion → Local storage → Supabase sync
3. **Workouts** → wger API → Cache → Display with images
4. **Strava Sync** → OAuth → Activities → Webhook updates
5. **Social Posts** → Media upload → Supabase Storage → Feed

### Compliance & Privacy
- **Strava**: Data shown only to owner, no AI training, rate limited
- **Health Data**: Local-first with optional sync
- **OSM**: Proper attribution, no bulk downloading
- **GDPR**: User data control and deletion capabilities

## Development Status

See `.same/todos.md` for detailed development progress and next steps.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Follow the existing code patterns
4. Ensure MVP compliance requirements are met
5. Submit a pull request

## License

MIT License - see LICENSE file for details.
