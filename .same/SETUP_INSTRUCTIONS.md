# 🚀 FitHome+ - Complete Setup Guide

## 📋 Prerequisites

- Node.js 18+ or Bun 1.0+
- Bun package manager (recommended) or npm/pnpm
- Git
- Supabase account (free tier available)
- (Optional) Strava account for activity sync

## 🏗️ Phase 1: Supabase Database Setup (CRITICAL FIRST STEP)

### Step 1: Create Supabase Project

1. **Go to [Supabase](https://supabase.com)**
2. **Click "New Project"**
3. **Fill in project details:**
   - Organization: Choose or create one
   - Name: `fitness-tracker-mvp` (or your preferred name)
   - Database Password: Generate a strong password (save it!)
   - Region: Choose closest to your users
   - Pricing Plan: Free (sufficient for MVP)

4. **Wait for project creation (2-3 minutes)**

### Step 2: Get Your Credentials

1. **Go to Project Settings → API**
2. **Copy these values:**
   - Project URL (e.g., `https://abcdefghijklmnop.supabase.co`)
   - `anon/public` key (starts with `eyJ...`)

### Step 3: Configure Environment

1. **Copy `.env.local` template:**
   ```bash
   cp .env.local .env.local.backup
   ```

2. **Edit `.env.local` with your actual values:**
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-actual-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

### Step 4: Deploy Database Schema

1. **Open Supabase Dashboard → SQL Editor**
2. **Copy the entire contents of `.same/database-schema.sql`**
3. **Paste in SQL Editor and click "Run"**
4. **Verify success - you should see tables created:**
   - `user_profiles`
   - `steps_daily`
   - `workouts`
   - `workout_steps` (NEW)
   - `strava_tokens`
   - `strava_activities` (NEW)
   - `posts`
   - `post_likes`
   - `post_comments`
   - `routes`

### Step 5: Setup Storage Buckets

1. **Go to Storage in Supabase Dashboard**
2. **Create two buckets:**
   - Name: `avatars`
     - Public: Yes
     - File size limit: 2MB
     - Allowed MIME types: `image/*`

   - Name: `post_images`
     - Public: Yes
     - File size limit: 5MB
     - Allowed MIME types: `image/*, video/*`

3. **Set bucket policies (go to Policies tab for each bucket):**
   - Create policy: "Users can upload their own files"
   - Operations: INSERT
   - Policy: `auth.uid() = (storage.foldername(name))[1]::uuid`

   - Create policy: "Anyone can view files"
   - Operations: SELECT
   - Policy: `true`

### Step 6: Verify Setup

1. **Go to Table Editor in Supabase**
2. **Check that all 10 tables exist with proper columns**
3. **Verify RLS (Row Level Security) is enabled on all tables**
4. **Check Storage buckets are created (avatars, post_images)**

### Step 6: Test Authentication

1. **Go to Authentication → Settings → Auth Providers**
2. **Enable Email authentication (default)**
3. **Configure redirect URLs:**
   - Site URL: `http://localhost:3000`
   - Redirect URLs: `http://localhost:3000/**`

### Step 7: Start Development

```bash
# Install dependencies
bun install

# Start development server
bun run dev
```

**✅ SUCCESS INDICATOR:** When you visit `http://localhost:3000`, you should see no "Demo Mode" banner and be able to sign up/login.

---

## 🔧 Phase 2: Optional Strava Integration Setup

> **Note:** This is for Phase 4 implementation. Skip for now if focusing on core features.

### Step 1: Create Strava Application

1. **Go to [Strava API Settings](https://www.strava.com/settings/api)**
2. **Click "Create App"**
3. **Fill in details:**
   - Application Name: `Fitness Tracker MVP`
   - Category: `Training`
   - Club: Leave empty
   - Website: `http://localhost:3000`
   - Authorization Callback Domain: `localhost`
   - Description: Brief description of your app

4. **Save and note:**
   - Client ID
   - Client Secret

### Step 2: Update Environment Variables

```env
NEXT_PUBLIC_STRAVA_CLIENT_ID=your-actual-client-id
STRAVA_CLIENT_SECRET=your-actual-client-secret
NEXT_PUBLIC_STRAVA_REDIRECT_URI=http://localhost:3000/strava/callback
```

---

## 🚨 Troubleshooting

### Common Issues:

**1. "Demo Mode" still showing:**
- Check `.env.local` exists and has correct values
- Restart development server
- Clear browser cache

**2. Database connection errors:**
- Verify Supabase URL and key are correct
- Check if project is still starting up (wait 5 minutes)
- Ensure database schema was deployed successfully

**3. Authentication not working:**
- Check redirect URLs in Supabase Auth settings
- Verify site URL is set correctly
- Check browser console for errors

**4. Tables not created:**
- Re-run the SQL schema in Supabase SQL Editor
- Check for any error messages in SQL execution
- Verify you have proper permissions

---

## 📊 Verification Checklist

- [ ] Supabase project created
- [ ] Database schema deployed (10 tables including workout_steps & strava_activities)
- [ ] RLS policies enabled on all tables
- [ ] Storage buckets created (avatars, post_images)
- [ ] Storage policies configured
- [ ] Environment variables configured (`.env.local`)
- [ ] `.env.local` contains real credentials (not demo values)
- [ ] Development server starts without errors
- [ ] No "Demo Mode" banner visible on app
- [ ] Can sign up/login users successfully
- [ ] User profile gets created automatically
- [ ] wger API exercises loading (check Workouts tab)
- [ ] (Optional) Strava OAuth configured and working

---

## 🎯 Next Steps After Setup

Once Supabase is working:
1. **Data Persistence** - Steps and workouts will save to database
2. **User Profiles** - Goals and preferences will be stored
3. **Progress Tracking** - Real analytics and history
4. **Strava Integration** - OAuth and webhook setup
5. **Social Features** - Posts, likes, comments
6. **PWA Features** - Offline sync and mobile installation

---

**🆘 Need Help?**
- Check Supabase documentation: https://supabase.com/docs
- Verify step-by-step instructions above
- Ensure all environment variables are set correctly
