<<<<<<< HEAD
# Fitness Tracker MVP - Development Todos
## PRIORITAS SEGERA (Berdasarkan Spesifikasi Teknis)

### 🔥 Phase 1: Supabase Setup & Database (URGENT - Demo OFF)
- [ ] Setup .env.local dengan Supabase credentials (URL & ANON KEY)
- [ ] Deploy database schema + RLS policies ke Supabase
- [ ] Apply migrasi: user_profiles, steps_daily, workouts, posts, post_likes, post_comments, strava_tokens, routes
- [ ] Test RLS: semua tabel scope auth.uid() = user_id
- [ ] Seed data minimal untuk testing
- [ ] **MATIKAN demo mode - data harus persist ke DB**

### 🔥 Phase 2: Data Persistence (Core MVP)
- [ ] Migrasi useStepTracking: agregasi harian → steps_daily table (source=device_motion)
- [ ] Migrasi workout sessions: autosave ke workouts table dengan proper metadata
- [ ] Persist user_profiles: step_goal, workout_goal, fitness_level, preferences JSONB
- [ ] Test persistensi: verifikasi via SQL query bahwa data tersimpan
- [ ] Implement offline/online sync logic dasar

### 🔥 Phase 3: Workout Enhancement & Session Timer
- [ ] Program Builder: 4 minggu, 3-4x/minggu, auto-progression
- [ ] Session timer: work/rest/rounds dengan autosave realtime
- [ ] wger API caching: edge functions 24 jam cache untuk bodyweight exercises
- [ ] Workout history & progress analytics dashboard
- [ ] Custom workout creation interface

### 🔥 Phase 4: Complete Strava Integration (E2E + Webhook)
- [ ] **OAuth2 E2E**: authorize → exchange → simpan access/refresh/expires_at
- [ ] **Cloudflare Workers**: endpoint /api/strava/webhook (subscribe/verify challenge)
- [ ] **Webhook Events**: activity → fetch detail → upsert workouts (< 60 detik)
- [ ] **Deauth Handling**: event deauth → revoke tokens & tandai disconnect
- [ ] **Upload FIT/TCX/GPX**: createUpload → poll status → update metadata
- [ ] **Rate Limiting**: queue + backoff (200/15m & 2000/hari; non-upload 100/15m & 1000/hari)
- [ ] **Error Handling**: duplicate/malformed activities

### 🔥 Phase 5: Social Features MVP
- [ ] Post creation: caption + media upload
- [ ] **Supabase Storage**: signed URLs, MIME validation, thumbnail generation
- [ ] Feed: infinite scroll dengan proper pagination
- [ ] Social interactions: post_likes, post_comments tables
- [ ] Moderation: basic content filtering
- [ ] Media: proper image/video handling dengan compression

### 🔥 Phase 6: MapLibre + OSM Compliance
- [ ] **MapLibre GL JS integration**: route visualization
- [ ] **OSM Tile Policy compliance**: atribusi wajib, NO bulk/prefetch
- [ ] **GPX/TCX route display**: geojson dari routes table
- [ ] **Provider tiles**: alternatif untuk high traffic
- [ ] **Route tracking**: distance_m, elev_gain_m calculations

### 🔥 Phase 7: Analytics, Privacy & Deployment
- [ ] **PostHog integration**: events + feature flags
- [ ] **Privacy controls**: disconnect Strava, export CSV/GPX, delete data
- [ ] **GDPR compliance**: data portability + deletion capabilities
- [ ] **Cloudflare Pages deployment**: web app
- [ ] **Cloudflare Workers deployment**: Strava webhook endpoint
- [ ] **Backup & monitoring**: runbooks untuk incident response

---

## WORKFLOW TEKNIS (E2E & Berurutan)

### 1) Environment Setup
```bash
# Isi .env.local
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Strava credentials
NEXT_PUBLIC_STRAVA_CLIENT_ID=your_client_id
STRAVA_CLIENT_SECRET=your_client_secret

# PostHog
NEXT_PUBLIC_POSTHOG_KEY=your_posthog_key
```

### 2) Database Schema Deployment
```sql
-- Deploy ke Supabase:
-- user_profiles, steps_daily, workouts, posts, post_likes, post_comments
-- strava_tokens, routes dengan RLS policies
```

### 3) Step Tracking (Web → Native Path)
- **Web MVP**: DeviceMotionEvent threshold & smoothing
- **Android**: ACTIVITY_RECOGNITION + SensorManager TYPE_STEP_COUNTER
- **iOS**: CMPedometer + HealthKit stepCount
- **Health Connect**: aggregate() untuk akurasi, hindari double-count

### 4) Strava Integration (Webhook-First)
```javascript
// Webhook endpoint (Cloudflare Workers)
export default {
  async fetch(request) {
    // Handle subscription verification & activity events
    // Respect rate limits: 200/15m & 2000/hari
  }
}
```

### 5) Social MVP Implementation
- **Form posting**: media + caption validation
- **Storage**: Supabase signed URLs + thumbnail generation
- **Feed**: infinite scroll dengan efficient queries
- **Interactions**: real-time likes/comments

---

## ACCEPTANCE CRITERIA MVP

### Definition of Done:
1. ✅ **Demo mode OFF**: steps_daily, workouts, user_profiles persist di DB
2. ❌ **Strava E2E**: connect → aktivitas via webhook (< 60 detik) → deauth handled
3. ❌ **Social posting**: upload → feed → interactions working
4. ❌ **Privacy controls**: disconnect/export/delete tersedia
5. ❌ **MapLibre**: route tampil + atribusi OSM + NO bulk/prefetch

### Optional MVP:
- Upload aktivitas ke Strava (FIT/TCX/GPX)
- Advanced analytics dengan PostHog
- Offline sync dengan Service Worker

---

## COMPLIANCE & LEGAL REQUIREMENTS

### Strava API Terms (2024):
- ✅ Privacy notice implemented
- [ ] **Webhook mandatory**: hindari polling excessive
- [ ] **Data usage restriction**: NO AI training, owner-only display
- [ ] **Rate limit compliance**: monitor 200/15m & 2000/hari
- [ ] **Upload compliance**: proper FIT/TCX/GPX dengan timestamps

### OSM Tile Policy:
- [ ] **Attribution visible**: credit OSM contributors
- [ ] **NO bulk/prefetch**: respect tile server resources
- [ ] **Usage policy**: follow osmfoundation.org guidelines

### Data Privacy (GDPR):
- [ ] **Data portability**: export user data (CSV/GPX)
- [ ] **Right to deletion**: complete data removal
- [ ] **Consent management**: granular permissions

---

## TECHNICAL DEBT & CRITICAL ISSUES

### 🚨 Immediate Fixes:
1. **Demo Mode**: aplikasi tidak persist data - URGENT
2. **No Database Connection**: semua data hilang saat refresh
3. **Mock Strava**: OAuth flow incomplete
4. **No Media Storage**: social features butuh Supabase Storage

### 🔧 Performance Optimizations:
- Error boundary global implementation
- Loading states improvements
- Service Worker untuk offline capability
- PWA manifest optimization
- Image optimization & lazy loading

---

## DEPLOYMENT ARCHITECTURE

### Frontend (PWA):
- **Platform**: Cloudflare Pages
- **Tech Stack**: Next.js 15 + shadcn/ui + Tailwind
- **Features**: PWA manifest + Service Worker (offline/sync)

### Backend/Data:
- **Database**: Supabase (Auth, Postgres, Storage, RLS)
- **Edge Functions**: wger API caching (24 jam)
- **Storage**: Media files dengan signed URLs

### Webhooks & Workers:
- **Platform**: Cloudflare Workers
- **Purpose**: Strava webhook endpoint /api/strava/webhook
- **Features**: Rate limiting + backoff strategies

### Analytics & Monitoring:
- **Analytics**: PostHog (events + feature flags)
- **Monitoring**: Error tracking + performance metrics
- **Backup**: Automated DB backup + restore procedures

---

## STATUS APLIKASI SAAT INI

**Current State**: ~60% complete foundation
- ✅ Next.js + shadcn/ui setup
- ✅ Basic UI components & routing
- ✅ Workout catalog (wger API)
- ✅ Step tracking interface
- ✅ Strava OAuth setup
- ❌ Database persistence
- ❌ Complete Strava integration
- ❌ Social features
- ❌ Deployment ready

**Next Critical Action**: Setup Supabase environment & deploy schema untuk menghidupkan persistensi data.
=======
# Fitness Tracker PWA - Consolidated Development Plan

## 🚨 IMMEDIATE PRIORITIES (Following User Requirements)

### Phase 1 — Core & Supabase (URGENT - Foundation)
- [ ] **Setup .env.local dengan Supabase credentials** 🔧
- [ ] **Deploy database schema + RLS ke Supabase** 🔧
- [ ] **Disable isDemoMode & all fallback in-memory data** 🔧
- [ ] **Test Auth flow (signup/login) & RLS per user** 🔧

### Phase 2 — Home Workout Enhancement (Next Priority)
- [ ] **Program Builder + auto-progression features**
- [ ] **Session Timer (work/rest/rounds) + autosave ke workouts table**
- [ ] **Workout history & progress analytics dashboard**

### Phase 3 — Steps Persistence & Analytics (Data Layer)
- [ ] **Write steps_daily harian (source=device_motion) ke database**
- [ ] **Weekly/monthly charts (ringkas & akurat)**
- [ ] **Estimasi kalori/jarak dengan parameter user (berat/tinggi)**

### Phase 4 — Strava Integration E2E (API Integration)
- [ ] **OAuth E2E flow + simpan token/refresh/expires ke strava_tokens**
- [ ] **Cloudflare Workers Webhook: subscribe/verify → handle activity/deauth**
- [ ] **Activity upload (GPX/TCX/FIT) + status polling + metadata**
- [ ] **Rate-limit monitor (UI) + backoff mechanism**

### Phase 5 — Social MVP (Community Features)
- [ ] **Post creation form + media upload (Supabase Storage)**
- [ ] **Feed dengan infinite scroll (posts table)**
- [ ] **Likes/comments system (post_likes, post_comments tables)**
- [ ] **Content moderation basics + signed URLs + thumbnails**

### Phase 6 — MapLibre & Analytics (Optional Features)
- [ ] **MapLibre GL + OSM tiles dengan atribusi proper (no bulk/prefetch)**
- [ ] **PostHog events & feature flags integration**
- [ ] **Privacy settings (disconnect Strava, export/delete data)**
- [ ] **Offline mode & background sync capabilities**

### Phase 7 — Deployment & Production (Go Live)
- [ ] **Cloudflare Pages deployment (web) + Workers (webhook)**
- [ ] **Backup DB + error tracking + runbooks**
- [ ] **Advanced responsive design + a11y improvements**
- [ ] **Global error handling + skeleton states**

---

## 🎯 MVP Definition of Done (Acceptance Criteria)

### Core Requirements:
1. ✅ **Onboarding + target langkah/jadwal** (COMPLETED)
2. ❌ **Dashboard langkah harian/mingguan disimpan di DB** (NEEDS SUPABASE)
3. ❌ **Connect Strava → aktivitas via webhook (<60 dtk) + deauth handled**
4. ❌ **Posting hasil latihan (caption + media) → feed + likes/comments**
5. ❌ **Privacy page + kontrol disconnect/export/delete data**

### Optional MVP Features:
6. ❌ **MapLibre dengan atribusi OSM benar, tanpa bulk/prefetch**

---

## 🔧 Current Technical Status

### ✅ What's Working:
- Next.js 15 + shadcn/ui + Tailwind setup
- Basic onboarding flow + goal setting
- Web-based step tracking (device motion sensors)
- wger API workout catalog integration
- Mock Strava integration UI
- Responsive component library
- Database schema + RLS policies ready

### ❌ What Needs Implementation:
- **Demo mode is ON** - no data persistence
- **Real Supabase connection** - needs .env.local setup
- **Complete Strava OAuth flow** - only UI exists
- **Social posting features** - not implemented
- **Webhook endpoints** - needs Cloudflare Workers
- **Media storage** - needs Supabase Storage setup

---

## 📋 Implementation Sequence

Based on the user's requirements, we'll follow this exact order:

1. **SUPABASE FOUNDATION** → Setup .env.local, deploy schema, disable demo mode
2. **DATA PERSISTENCE** → steps_daily, workouts, user_profiles storage
3. **WORKOUT ENHANCEMENT** → Session timer, program builder, analytics
4. **STRAVA COMPLETE** → OAuth E2E, webhooks, upload functionality
5. **SOCIAL MVP** → Posting, feed, media storage, interactions
6. **EXTRAS** → MapLibre, PostHog, privacy controls
7. **DEPLOYMENT** → Cloudflare Pages/Workers, monitoring

---

## 🚨 Critical Dependencies

### Requires User Action:
1. **Supabase Project Setup** - User must create account & project
2. **Environment Variables** - User must fill .env.local
3. **Cloudflare Account** - For Workers deployment (Phase 4+)
4. **Strava App Registration** - For OAuth credentials

### Ready to Implement:
- Database schema (SQL files ready)
- Component architecture (75% complete)
- API integration patterns (established)
- TypeScript types (defined)

---

**CURRENT STATUS**: Ready untuk Phase 1 execution. Butuh Supabase setup dari user untuk proceed.

**NEXT ACTION**: Setup Supabase environment atau implement demo mode improvements sambil menunggu setup.
>>>>>>> 1180b17ad123fe458e50629b95322f81596ef6de
