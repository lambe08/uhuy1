# 🚀 Supabase Setup Guide untuk FitTracker MVP

## Priority 1: Database Setup (CRITICAL untuk disable demo mode)

### Step 1: Create Supabase Project

1. **Buka Supabase Dashboard**
   - Pergi ke [supabase.com/dashboard](https://supabase.com/dashboard)
   - Sign in atau create account baru

2. **Create New Project**
   - Klik "New Project"
   - Pilih organization atau create baru
   - Set project name: `fitness-tracker-mvp`
   - Generate strong password untuk database
   - Pilih region terdekat untuk performance optimal
   - Klik "Create new project"

3. **Wait untuk setup complete** (biasanya 2-3 menit)

### Step 2: Get API Credentials

1. **Navigate ke Project Settings**
   - Klik project name → Settings → API

2. **Copy credentials ini:**
   ```
   Project URL: https://[your-project-id].supabase.co
   Anon Key: eyJ... (panjang key)
   ```

3. **Update .env.local file:**
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://[your-project-id].supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ[your-anon-key]
   ```

### Step 3: Deploy Database Schema

1. **Open SQL Editor di Supabase Dashboard**
   - Klik "SQL Editor" di sidebar
   - Klik "New query"

2. **Copy & paste entire content dari `.same/database-schema.sql`**

3. **Execute the query** (Ctrl+Enter atau click "Run")

4. **Verify tables created:**
   - Klik "Table Editor" di sidebar
   - Harus ada tables: user_profiles, step_records, workout_sessions, dll.

### Step 4: Setup Row Level Security (RLS)

✅ **RLS sudah enabled di schema**, tapi verify:

1. **Check RLS status:**
   - Table Editor → pilih table → Settings
   - "Enable Row Level Security" harus checked

2. **Verify policies:**
   - Authentication → Policies
   - Harus ada policies untuk setiap table

### Step 5: Test Authentication

1. **Restart development server:**
   ```bash
   bun run dev
   ```

2. **App harus show "Sign In" tanpa demo mode warning**

3. **Test sign up:**
   - Daftar dengan email test
   - Check email untuk verification link
   - Confirm email verification

4. **Test sign in & onboarding:**
   - Sign in dengan credentials
   - Complete onboarding flow
   - Verify data tersimpan (tidak hilang saat refresh)

---

## Post-Setup Verification Checklist

### ✅ Critical Checks:
- [ ] **Demo mode warning gone** - tidak ada amber notification
- [ ] **User registration works** - bisa create account baru
- [ ] **Email verification works** - dapat link di email
- [ ] **Onboarding flow works** - bisa set goals & preferences
- [ ] **Data persistence** - profile data tidak hilang saat refresh
- [ ] **Step tracking** - bisa start/stop step counter
- [ ] **Workout library loads** - dari wger API

### ✅ Database Functionality:
- [ ] **User profiles** - tersimpan di Supabase Table Editor
- [ ] **Step records** - daily steps data persisted
- [ ] **Authentication** - login/logout functionality
- [ ] **RLS policies** - users hanya bisa access own data

---

## Next Priority Features (setelah Supabase setup):

### 🔥 Priority 2: Enhanced Data Persistence
- **Step data storage** - daily/weekly tracking ke database
- **Workout session tracking** - save completed workouts
- **Progress analytics** - historical data views

### 🔥 Priority 3: Strava Integration
- **Complete OAuth flow** - real Strava connection
- **Activity sync** - import workouts from Strava
- **Webhook setup** - real-time activity updates

### 🔥 Priority 4: Social Features MVP
- **Post creation** - dengan Supabase Storage untuk media
- **Activity feed** - dengan infinite scroll
- **Social interactions** - likes & comments system

---

## Troubleshooting Common Issues

### Issue: "Demo Mode" masih muncul
**Solution:**
- Check .env.local file ada & format benar
- Restart development server
- Clear browser cache/local storage

### Issue: Authentication errors
**Solution:**
- Verify Supabase credentials correct
- Check RLS policies deployed
- Confirm email verification enabled di Supabase Auth settings

### Issue: Database connection failed
**Solution:**
- Verify database schema deployed completely
- Check Supabase project status (bukan paused)
- Test connection di Supabase SQL Editor

### Issue: Email verification tidak dapat
**Solution:**
- Check spam folder
- Verify email provider settings di Supabase Auth
- Test dengan email domain lain

---

## Support & Documentation

- **Supabase Docs:** [docs.supabase.com](https://docs.supabase.com)
- **Project Github:** Ada di repository fitness-tracker-mvp
- **API Reference:** [supabase.com/docs/reference/javascript](https://supabase.com/docs/reference/javascript)

---

## Production Deployment Notes

### Untuk production deployment:
1. **Upgrade Supabase plan** jika perlu (free tier: 500MB, 2 CPU)
2. **Setup custom domain** untuk auth redirects
3. **Configure SMTP** untuk production emails
4. **Setup backup strategy** untuk database
5. **Monitor rate limits** dan usage quotas

**Status:** Setelah setup complete, app siap untuk Priority 2-7 implementation! 🚀
