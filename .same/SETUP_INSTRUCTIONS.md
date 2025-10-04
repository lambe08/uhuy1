# 🚀 SETUP SEGERA: Aktivasi Supabase Database

## ⚠️ Status Aplikasi Saat Ini
- ✅ **Kode siap produksi** - Semua error TypeScript sudah diperbaiki
- ✅ **Database schema siap** - File SQL lengkap di `.same/database-schema.sql`
- ❌ **Demo mode aktif** - Data tidak persisten, hilang saat refresh
- ❌ **Placeholder credentials** - Perlu Supabase project asli

---

## 🔧 LANGKAH WAJIB: Setup Supabase (5 menit)

### Step 1: Buat Supabase Project
1. **Kunjungi:** https://supabase.com/dashboard
2. **Klik:** "New Project"
3. **Isi:**
   - Project name: `fitness-tracker-mvp`
   - Password: (buat password kuat untuk database)
   - Region: Pilih terdekat dengan lokasi Anda
4. **Klik:** "Create new project"
5. **Tunggu:** 2-3 menit hingga project ready

### Step 2: Dapatkan API Credentials
1. **Di dashboard Supabase,** klik project Anda
2. **Klik:** Settings → API (di sidebar kiri)
3. **Copy 2 values ini:**
   ```
   Project URL: https://[project-id].supabase.co
   Anon Key: eyJ... (key panjang)
   ```

### Step 3: Update Environment Variables
1. **Buka file:** `fitness-tracker-mvp/.env.local`
2. **Replace placeholder values:**
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://[your-project-id].supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ[your-actual-anon-key]
   ```

### Step 4: Deploy Database Schema
1. **Di Supabase dashboard,** klik "SQL Editor"
2. **Klik:** "New query"
3. **Copy seluruh isi file:** `.same/database-schema.sql`
4. **Paste di SQL Editor** dan klik "Run" (atau Ctrl+Enter)
5. **Verify:** Klik "Table Editor" → harus ada 7 tables baru

### Step 5: Restart & Test
1. **Restart dev server:**
   ```bash
   bun run dev
   ```
2. **Cek:** Demo mode warning harus hilang
3. **Test:** Daftar account baru → verify email → complete onboarding
4. **Verify:** Data tidak hilang saat refresh halaman

---

## ✅ Checklist Verifikasi

Setelah setup, pastikan semua ini berfungsi:

- [ ] **Demo mode gone** - Tidak ada warning amber di dashboard
- [ ] **User registration** - Bisa buat account baru
- [ ] **Email verification** - Dapat link verifikasi di email
- [ ] **Onboarding flow** - Bisa set step goal & preferences
- [ ] **Data persistence** - Profile tidak hilang saat refresh
- [ ] **Step tracking** - Counter berfungsi dan tersimpan
- [ ] **Workout library** - Exercises load dari wger API

---

## 🎯 Hasil Setelah Setup

### Database Tables (akan terisi otomatis):
- `user_profiles` - Data user dan preferensi
- `step_records` - History langkah harian
- `workout_sessions` - Session workout completed
- `strava_connections` - Token OAuth Strava
- `posts` - Social posts dengan media
- `post_likes` & `post_comments` - Interaksi sosial

### Features yang Akan Aktif:
- ✅ **Persistent step tracking** - Data tidak hilang
- ✅ **Real user authentication** - Login/logout asli
- ✅ **Profile management** - Goal setting tersimpan
- ✅ **Workout history** - Riwayat latihan lengkap
- ✅ **Preparation for Strava** - OAuth ready untuk implementasi
- ✅ **Social features foundation** - Posts & interactions ready

---

## 🔄 After Setup: Next Priorities

1. **Enhanced Step Tracking** - Weekly analytics, goal streaks
2. **Workout Customization** - Session timer, custom programs
3. **Complete Strava Integration** - OAuth + webhook real-time
4. **Social Features MVP** - Post creation, media upload, feed
5. **MapLibre Integration** - Route mapping dengan OSM
6. **Analytics & Deployment** - PostHog + Cloudflare deployment

---

## 🆘 Need Help?

**Common Issues:**
- **Demo mode masih muncul:** Clear browser cache, restart server
- **Email verification tidak dapat:** Check spam folder
- **Database error:** Verify schema deployed completely
- **Connection failed:** Double-check credentials di .env.local

**Ready to go? Setup Supabase dulu, then we continue! 🚀**
