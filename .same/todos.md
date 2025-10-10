# FitHome+ Development Todos - Penyempurnaan Aplikasi

## 📊 STATUS SAAT INI
Repository berhasil di-clone dari: https://github.com/lambe08/uhuy1.git

### ✅ YANG SUDAH ADA:
- [x] Next.js 15 + App Router setup
- [x] TypeScript + Tailwind CSS + shadcn/ui
- [x] Supabase integration basics
- [x] Database schema (profiles, workouts, sessions, posts, strava_tokens)
- [x] PWA manifest & service worker basics
- [x] Komponen UI dasar (Button, Card, Input, Progress, Tabs)
- [x] Hook custom (useAuth, useWorkoutSession, useStepTracking)
- [x] API route handlers structure (posts, workouts, strava)
- [x] Strava OAuth skeleton
- [x] Social feed struktur dasar

## 🎯 FASE PENGEMBANGAN

### FASE 1: Setup & Environment ⏳
- [ ] Buat .env.example dengan semua variabel yang dibutuhkan
- [ ] Install dependencies yang kurang (jika ada)
- [ ] Update package.json jika perlu
- [ ] Setup Supabase credentials
- [ ] Verifikasi dev server berjalan

### FASE 2: Database & RLS Enhancement 🔒
- [ ] Review & update database schema sesuai spec
- [ ] Tambah tabel workout_steps jika belum ada
- [ ] Tambah tabel strava_activities
- [ ] Lengkapi semua RLS policies
- [ ] Setup Storage buckets (avatars, post_images) dengan policies
- [ ] Tambah indexes yang optimal
- [ ] Buat seed data minimal

### FASE 3: wger API Integration 💪
- [ ] Implementasi fetcher wger API dengan cache ETag
- [ ] Filter exercises: bodyweight/minimal equipment
- [ ] Mapping kategori & muscle groups
- [ ] Cache lokal 24 jam
- [ ] Error handling & fallback
- [ ] UI untuk workout builder dengan katalog wger

### FASE 4: Strava Integration (2024 Compliance) 🏃
- [ ] Update OAuth scopes sesuai 2024 requirements
- [ ] Implementasi rate limiter (200/15min, 2000/day)
- [ ] Auto-refresh token mechanism
- [ ] Fetch activities dengan normalisasi data
- [ ] Webhook verification (challenge)
- [ ] Webhook handler (create/update events)
- [ ] Link Strava activities ke local sessions
- [ ] Privacy compliance (owner-only data)

### FASE 5: Home Workout Features 🏠
- [ ] Workout builder dengan preferensi user
- [ ] Filter: tanpa alat, alat minimal
- [ ] Workout template system
- [ ] Session tracker (timer, reps, durasi, RPE)
- [ ] Progress recording
- [ ] Analytics ringan (weekly summary)

### FASE 6: Social Feed Enhancement 📱
- [ ] Post creator dengan media upload
- [ ] Supabase Storage integration (images)
- [ ] Post feed dengan infinite scroll
- [ ] Like/unlike functionality
- [ ] Comment system
- [ ] Share link generation
- [ ] Profil publik minimal

### FASE 7: PWA Enhancement 📲
- [ ] Finalisasi manifest.ts (ikon 192/512)
- [ ] Service Worker cache strategies
- [ ] Offline shell & aset caching
- [ ] Add to Home Screen prompt
- [ ] Push notifications (optional)
- [ ] Background sync
- [ ] Uji installability

### FASE 8: UI/UX Customization 🎨
- [ ] Customize shadcn/ui components (unique design)
- [ ] Enhanced button variants (fitness theme)
- [ ] Card components dengan backdrop blur
- [ ] Responsive layouts untuk semua screen
- [ ] Loading states & skeletons
- [ ] Error boundaries & error handling
- [ ] Accessibility improvements (a11y)

### FASE 9: Security & Validation 🔐
- [ ] Input validation dengan Zod/Valibot
- [ ] Sanitasi konten posting
- [ ] Content Security Policy setup
- [ ] Token encryption untuk Strava
- [ ] Server-side API calls only
- [ ] Rate limiting untuk API endpoints

### FASE 10: Testing & Deployment 🚀
- [ ] Unit tests untuk pure functions
- [ ] API route handler tests
- [ ] E2E tests (login, workout, posting)
- [ ] Buat SETUP_INSTRUCTIONS.md
- [ ] Update README.md
- [ ] Setup Netlify/Vercel deployment
- [ ] Environment variables setup
- [ ] Production build test
- [ ] Deploy & verify

## ✅ COMPLETED IN THIS SESSION:
- [x] Buat .env.example dengan semua variabel yang dibutuhkan
- [x] Install dependencies dengan bun
- [x] Start dev server berhasil
- [x] Update database schema: tambah workout_steps & strava_activities tables
- [x] Tambah RLS policies untuk tabel baru
- [x] Buat wger service dengan ETag caching
- [x] Update Strava OAuth scopes untuk 2024 compliance (read, activity:read_all)
- [x] Update rate limits ke 200/15min dan 2000/day
- [x] Rebrand aplikasi ke FitHome+
- [x] Update manifest.ts untuk PWA
- [x] Customize Button component dengan fitness-themed colors (emerald/teal/orange)
- [x] Update Card component dengan glassmorphism
- [x] Update page.tsx dengan branding dan warna baru
- [x] Update workouts API untuk menggunakan wger service baru

## 🔧 IMMEDIATE NEXT STEPS:
1. ✅ Buat .env.example
2. ✅ Install dependencies & start dev server
3. ✅ Review & perbaiki database schema
4. ✅ Implementasi wger API integration
5. ✅ Update Strava OAuth compliance
6. Implementasi Strava webhook verification & handlers
7. Buat komponen workout builder yang lebih advanced
8. Setup Supabase Storage policies untuk avatars & post_images
9. Implementasi social feed dengan real data
10. Generate PWA icons (192x192, 512x512)

## 📝 NOTES:
- Fokus pada free tier (Supabase, Strava dev, wger)
- Hindari emojis di UI
- Gunakan warna selain purple/indigo/blue kecuali diminta
- Responsive design wajib
- Server-side token handling
- Rate limiting awareness
