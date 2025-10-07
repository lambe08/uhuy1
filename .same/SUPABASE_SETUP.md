# Supabase Setup Instructions - Fitness Tracker MVP

## 📋 Overview
This guide will help you set up Supabase for the Fitness Tracker MVP, enabling persistent data storage, authentication, and all core features.

## 🚀 Step 1: Create Supabase Project

1. **Go to Supabase Dashboard**
   - Visit [supabase.com/dashboard](https://supabase.com/dashboard)
   - Sign up/sign in with your account

2. **Create New Project**
   - Click "New Project"
   - Choose your organization
   - Enter project details:
     - **Name**: `fitness-tracker-mvp`
     - **Database Password**: Generate a secure password (save it!)
     - **Region**: Choose closest to your location
   - Click "Create new project"

3. **Wait for Setup**
   - Project creation takes 2-3 minutes
   - You'll see the dashboard when ready

## 🔑 Step 2: Get API Credentials

1. **Navigate to API Settings**
   - In your project dashboard, go to **Settings** → **API**

2. **Copy Required Credentials**
   ```bash
   # Project URL (starts with https://)
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co

   # Anonymous Key (public key)
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

   # Service Role Key (private key - keep secret!)
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

## 📝 Step 3: Update Environment Variables

1. **Edit `.env.local` file** in your project root:
   ```bash
   # Replace placeholder values with your actual Supabase credentials
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_actual_anon_key_here
   SUPABASE_SERVICE_ROLE_KEY=your_actual_service_role_key_here

   # Keep other settings as they are
   NEXT_PUBLIC_STRAVA_CLIENT_ID=your_strava_client_id_here
   STRAVA_CLIENT_SECRET=your_strava_client_secret_here
   NEXT_PUBLIC_POSTHOG_KEY=your_posthog_key_here
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   NODE_ENV=development
   ```

## 🗄️ Step 4: Deploy Database Schema

1. **Open SQL Editor**
   - In Supabase dashboard, go to **SQL Editor**
   - Click "New query"

2. **Copy & Paste Schema**
   - Copy the entire content from `.same/database-schema.sql`
   - Paste it into the SQL editor

3. **Execute Schema**
   - Click "Run" button
   - Wait for execution to complete
   - You should see "Success. No rows returned" message

4. **Verify Tables Created**
   - Go to **Table Editor**
   - You should see these tables:
     - `user_profiles`
     - `steps_daily`
     - `workouts`
     - `posts`
     - `post_likes`
     - `post_comments`
     - `strava_tokens`
     - `routes`

## 🔐 Step 5: Configure Authentication

1. **Enable Email Authentication**
   - Go to **Authentication** → **Settings**
   - Ensure "Enable email confirmations" is ON
   - Set "Site URL" to `http://localhost:3000`

2. **Configure Email Templates (Optional)**
   - Go to **Authentication** → **Email Templates**
   - Customize confirmation and recovery emails

## 📁 Step 6: Setup Storage (for Social Features)

1. **Create Storage Bucket**
   - Go to **Storage**
   - Click "Create bucket"
   - Name: `media-uploads`
   - Make it **public**

2. **Configure RLS Policy for Storage**
   ```sql
   -- Run this in SQL Editor
   CREATE POLICY "Users can upload their own media" ON storage.objects
   FOR INSERT WITH CHECK (auth.uid()::text = (storage.foldername(name))[1]);

   CREATE POLICY "Anyone can view uploaded media" ON storage.objects
   FOR SELECT USING (bucket_id = 'media-uploads');
   ```

## 🧪 Step 7: Test Database Connection

1. **Restart Development Server**
   ```bash
   cd fitness-tracker-mvp
   bun run dev
   ```

2. **Check Application**
   - Open `http://localhost:3000`
   - Demo mode warning should disappear
   - Try signing up with a test account
   - Complete onboarding process

3. **Verify Data Persistence**
   - In Supabase dashboard, go to **Table Editor**
   - Check `user_profiles` table for your test data
   - Try adding step data and verify it appears in `steps_daily`

## ⚙️ Step 8: Configure RLS Testing (Optional)

1. **Test Row Level Security**
   ```sql
   -- Run in SQL Editor to test user isolation
   SELECT * FROM user_profiles; -- Should only show current user's data
   SELECT * FROM steps_daily; -- Should only show current user's steps
   ```

## 🎯 Step 9: Next Steps - Strava Integration

Once Supabase is working, configure Strava API:

1. **Create Strava API Application**
   - Go to [strava.com/settings/api](https://www.strava.com/settings/api)
   - Create new application
   - Authorization Callback Domain: `localhost`

2. **Update Environment Variables**
   ```bash
   NEXT_PUBLIC_STRAVA_CLIENT_ID=your_strava_client_id
   STRAVA_CLIENT_SECRET=your_strava_client_secret
   ```

## 🛡️ Security Checklist

- ✅ **Never commit** `.env.local` to version control
- ✅ **Service Role Key** should never be exposed to frontend
- ✅ **RLS policies** are enabled and tested
- ✅ **Storage bucket** has proper access controls
- ✅ **API keys** are kept secure

## 🐛 Troubleshooting

### Common Issues:

1. **"Invalid Supabase URL" Error**
   - Check `.env.local` has correct URL format
   - Restart development server after changes

2. **Authentication Not Working**
   - Verify email confirmation is properly configured
   - Check site URL matches your local development

3. **RLS Policy Errors**
   - Ensure user is authenticated before accessing data
   - Check policies are created correctly

4. **Table Not Found Errors**
   - Verify schema deployment was successful
   - Check table names match exactly

### Getting Help:

- **Supabase Docs**: [supabase.com/docs](https://supabase.com/docs)
- **Community**: [github.com/supabase/supabase/discussions](https://github.com/supabase/supabase/discussions)

## ✅ Success Criteria

Your setup is complete when:

1. ✅ Application loads without demo mode warning
2. ✅ User registration and login works
3. ✅ Step tracking data persists between sessions
4. ✅ Workout data is saved to database
5. ✅ User profile preferences are maintained

## 🔄 Next Implementation Priorities

After Supabase setup, implement in this order:

1. **Step Tracking Persistence** - Save step data to `steps_daily`
2. **Workout Session Storage** - Auto-save workouts to `workouts` table
3. **Strava OAuth Integration** - Complete authentication flow
4. **Social Features** - Post creation and media upload
5. **Analytics & Deployment** - PostHog integration and Cloudflare deployment

---

**Total Setup Time**: ~30 minutes
**Complexity**: Beginner-friendly
**Cost**: Free tier supports up to 50MB database + 1GB bandwidth
