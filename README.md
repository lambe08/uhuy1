# FitHome+ - Home Workout & Fitness Tracker PWA

A comprehensive Progressive Web App for **home workouts without equipment**, step tracking, Strava activity sync, and social fitness community. Built with Next.js 15, TypeScript, Supabase, and modern PWA features.

## Features

### ✅ Core Features
- **🏠 Home Workouts**: Bodyweight and minimal equipment exercises from wger.de API (no gym required!)
- **👟 Step Tracking**: Device motion sensor-based step counting with daily/weekly goals
- **🏃 Strava Integration**: OAuth 2.0 authentication, activity sync, and webhook real-time updates
- **📱 Social Feed**: Share workouts, upload media, like and comment on posts
- **🔐 Authentication**: Secure user profiles with Supabase Auth and Row-Level Security
- **💾 Offline-First**: Progressive Web App with service worker caching
- **📊 Analytics**: Weekly workout summaries, step progress, and fitness insights

### 🎯 Technical Highlights
- **wger API**: Exercise library with ETag-based 24-hour caching for efficiency
- **Strava 2024 Compliance**: Minimal scopes (`read, activity:read_all`), rate limiting (200/15min, 2000/day)
- **Privacy-First**: RLS policies, encrypted tokens, owner-only data access
- **Supabase Storage**: Secure media uploads with signed URLs
- **Webhook Handlers**: Real-time activity synchronization from Strava
- **Free Tier Only**: All services use free tiers (Supabase, Strava Dev, wger.de)

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
3. Create Storage buckets:
   - `avatars` (for user profile pictures)
   - `post_images` (for workout post media)
4. Set bucket policies to allow authenticated users to upload their own files

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
