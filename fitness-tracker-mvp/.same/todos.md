# Fitness Tracker MVP - Development Todos

## IMMEDIATE PRIORITIES (Urutan PRIORITAS):

### 🔥 Priority 1: Supabase Setup & Disable Demo Mode (URGENT)
- [ ] Set up .env.local dengan Supabase credentials
- [ ] Deploy database schema ke Supabase
- [ ] Test database connection & RLS policies
- [ ] Disable demo mode flag
- [ ] Test user authentication flow

### 🔥 Priority 2: Data Persistence
- [ ] Implement step data storage ke steps_daily table
- [ ] Store workout sessions ke database
- [ ] Persist user profiles & preferences
- [ ] Add offline/online sync logic

### 🔥 Priority 3: Workout Enhancement
- [ ] Session timer & tracking functionality
- [ ] Custom workout builder interface
- [ ] Workout history & progress analytics
- [ ] Auto-progression features

### 🔥 Priority 4: Complete Strava Integration
- [ ] End-to-end OAuth flow implementation
- [ ] Webhook endpoint setup (Cloudflare Workers)
- [ ] Activity upload (GPX/TCX/FIT) functionality
- [ ] Real-time activity sync via webhooks
- [ ] Rate limiting & API compliance

### 🔥 Priority 5: Social Features MVP
- [ ] Post creation dengan media upload
- [ ] Supabase Storage integration (signed URLs, thumbnails)
- [ ] Feed dengan infinite scroll
- [ ] Basic likes & comments system
- [ ] Content moderation features

### 🔥 Priority 6: MapLibre Integration
- [ ] Route mapping dengan OSM tiles
- [ ] Proper attribution & compliance
- [ ] No bulk/prefetch violations
- [ ] GPX/TCX route visualization

### 🔥 Priority 7: Analytics & Deployment
- [ ] PostHog analytics integration
- [ ] Feature flags implementation
- [ ] Cloudflare Pages deployment
- [ ] Workers untuk Strava webhooks
- [ ] Monitoring & backup systems

---

## Phase Status Overview:

### ✅ Phase 1: Core Setup & Onboarding (COMPLETED)
- [x] Next.js + shadcn/ui initialization
- [x] Onboarding flow dengan goal setting
- [x] Responsive layout & navigation
- [x] Component import fixes

### ✅ Phase 2: Home Workout Features (MOSTLY COMPLETED)
- [x] wger API integration untuk workout catalog
- [x] Workout selection interface
- [x] Basic workout tracking & progress
- [x] Loading states untuk workout library
- [ ] **Workout customization & session tracking (PRIORITY 3)**

### ✅ Phase 3: Step Tracking (MOSTLY COMPLETED)
- [x] Web-based step detection using device sensors
- [x] Step counter dashboard dengan progress tracking
- [x] Daily/weekly step goals dengan visual indicators
- [x] Quick stats (calories, miles, active minutes)
- [ ] **Store step data ke Supabase (PRIORITY 2)**
- [ ] Step history & analytics

### 🔄 Phase 4: Strava Integration (IN PROGRESS)
- [x] Strava OAuth2 setup dengan compliance screen
- [x] Activity reading dari Strava (mock data)
- [x] Rate limiting monitoring & API usage tracking
- [x] Privacy compliance notices
- [ ] **Complete OAuth implementation (PRIORITY 4)**
- [ ] **Activity upload functionality (PRIORITY 4)**
- [ ] **Webhook real-time updates (PRIORITY 4)**

### 🆕 Phase 5: Social Features (NOT STARTED)
- [ ] **Posting interface dengan media upload (PRIORITY 5)**
- [ ] **Supabase Storage integration (PRIORITY 5)**
- [ ] **Activity feed dengan infinite scroll (PRIORITY 5)**
- [ ] **Social interactions (likes, comments) (PRIORITY 5)**
- [ ] **Content moderation (PRIORITY 5)**

### 🆕 Phase 6: Additional Features (NOT STARTED)
- [ ] **MapLibre GL + OSM tiles integration (PRIORITY 6)**
- [ ] **PostHog analytics + feature flags (PRIORITY 7)**
- [ ] **Settings & privacy controls (PRIORITY 7)**
- [ ] **Offline functionality & sync (Future)**
- [ ] **Data export/import (Future)**

### 🆕 Phase 7: Polish & Deployment (NOT STARTED)
- [ ] **Advanced responsive design improvements**
- [ ] **Comprehensive error handling**
- [ ] **Interactive onboarding tutorial**
- [ ] **Cloudflare Pages + Workers deployment (PRIORITY 7)**
- [ ] **Monitoring & backup systems (PRIORITY 7)**

---

## Current Technical Debt & Fixes Needed:

### 🚨 Critical Issues:
1. **Demo Mode Active** - App tidak bisa persist data tanpa Supabase setup
2. **No Real Database** - Semua data hilang saat refresh
3. **Mock Strava Data** - OAuth flow belum complete
4. **No Media Storage** - Social features butuh Supabase Storage

### 🔧 Technical Improvements Needed:
- Error boundary implementation
- Loading state improvements
- Offline capability dengan Service Worker
- PWA manifest optimization
- Performance optimization

---

## Compliance & Legal Requirements:

### Strava API Terms:
- ✅ Privacy notice implemented
- ✅ Rate limiting awareness
- [ ] **Webhook implementation (mandatory)**
- [ ] **Proper deauth handling**
- [ ] **Activity upload compliance (FIT/TCX/GPX dengan timestamps)**

### OSM Tiles Policy:
- [ ] **Proper attribution display**
- [ ] **No bulk/prefetch violations**
- [ ] **Usage policy compliance**

### Data Privacy:
- ✅ Basic privacy notices
- [ ] **Data export functionality**
- [ ] **Data deletion capabilities**
- [ ] **GDPR compliance improvements**

---

## MVP Acceptance Criteria:

### Must Have for MVP Launch:
1. ✅ **User onboarding & goal setting**
2. ❌ **Persistent step tracking (DB storage)**
3. ❌ **Strava connect & sync (OAuth + Webhooks)**
4. ❌ **Basic social posting**
5. ❌ **Privacy controls & data management**

### Optional for MVP:
6. Route mapping dengan MapLibre
7. Advanced analytics dengan PostHog
8. Advanced workout customization

---

## Next Immediate Actions:

1. **Setup Supabase environment & deploy schema**
2. **Implement data persistence untuk steps & workouts**
3. **Complete Strava OAuth end-to-end**
4. **Build social posting MVP**
5. **Deploy ke Cloudflare dengan Workers**

---

## Development Notes:

- **Current Framework:** Next.js 15 + shadcn/ui + Tailwind
- **State:** Demo mode active, data tidak persist
- **APIs:** wger (working), Strava (OAuth setup, needs completion)
- **Deployment Target:** Cloudflare Pages + Workers
- **Database:** Supabase (schema ready, needs setup)
- **Storage:** Supabase Storage (for media files)

**Status Aplikasi:** 60% complete, butuh database integration untuk menjadi functional MVP.
