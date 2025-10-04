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
