-- Fitness Tracker MVP Database Schema - Updated to match specifications
-- Run this in your Supabase SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User Profiles Table (updated to match specification)
CREATE TABLE user_profiles (
  user_id UUID DEFAULT auth.uid() PRIMARY KEY,
  step_goal INTEGER DEFAULT 10000,
  workout_goal INTEGER DEFAULT 3,
  fitness_level TEXT DEFAULT 'beginner' CHECK (fitness_level IN ('beginner', 'intermediate', 'advanced')),
  preferences JSONB DEFAULT '{}',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Steps Daily Table (renamed from step_records to match specification)
CREATE TABLE steps_daily (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES user_profiles(user_id) ON DELETE CASCADE,
  date DATE NOT NULL,
  steps INTEGER NOT NULL DEFAULT 0,
  calories_est DECIMAL(8,2) DEFAULT 0,
  distance_est DECIMAL(10,2) DEFAULT 0, -- in meters
  source TEXT DEFAULT 'device_motion' CHECK (source IN ('device_motion', 'health_connect', 'healthkit', 'manual')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Workouts Table (renamed from workout_sessions to match specification)
CREATE TABLE workouts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES user_profiles(user_id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  plan_id TEXT,
  duration_min INTEGER NOT NULL,
  calories_est DECIMAL(8,2) DEFAULT 0,
  source TEXT DEFAULT 'app' CHECK (source IN ('app', 'strava')),
  strava_activity_id BIGINT,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Posts Table (for social features)
CREATE TABLE posts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES user_profiles(user_id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  media_url TEXT,
  media_type TEXT CHECK (media_type IN ('image', 'video')),
  workout_session_id UUID REFERENCES workouts(id) ON DELETE SET NULL,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Post Likes Table
CREATE TABLE post_likes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES user_profiles(user_id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- Post Comments Table
CREATE TABLE post_comments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES user_profiles(user_id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Workout Steps Table (for detailed workout structure)
CREATE TABLE workout_steps (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  workout_id UUID REFERENCES workouts(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  exercise_id TEXT,
  exercise_name TEXT NOT NULL,
  sets INTEGER DEFAULT 1,
  reps TEXT, -- Can be "10-12" or "10" etc
  duration_seconds INTEGER,
  rest_seconds INTEGER DEFAULT 60,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(workout_id, step_number)
);

-- Strava Tokens Table (encrypted storage for security)
CREATE TABLE strava_tokens (
  user_id UUID REFERENCES user_profiles(user_id) ON DELETE CASCADE PRIMARY KEY,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at BIGINT NOT NULL,
  scope TEXT NOT NULL,
  athlete_id BIGINT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Strava Activities Table (mirror of Strava data for local access)
CREATE TABLE strava_activities (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES user_profiles(user_id) ON DELETE CASCADE,
  strava_id BIGINT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  sport_type TEXT,
  distance_meters DECIMAL(10,2),
  moving_time_seconds INTEGER,
  elapsed_time_seconds INTEGER,
  total_elevation_gain DECIMAL(8,2),
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  average_speed DECIMAL(8,2),
  max_speed DECIMAL(8,2),
  average_heartrate INTEGER,
  max_heartrate INTEGER,
  calories DECIMAL(8,2),
  map_polyline TEXT,
  linked_workout_id UUID REFERENCES workouts(id) ON DELETE SET NULL,
  synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Routes Table (optional - for MapLibre integration)
CREATE TABLE routes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES user_profiles(user_id) ON DELETE CASCADE,
  geojson JSONB NOT NULL,
  distance_m DECIMAL(10,2) NOT NULL,
  elev_gain_m DECIMAL(8,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_steps_daily_user_date ON steps_daily(user_id, date);
CREATE INDEX idx_workouts_user_completed ON workouts(user_id, completed_at);
CREATE INDEX idx_workout_steps_workout_id ON workout_steps(workout_id, step_number);
CREATE INDEX idx_strava_activities_user_id ON strava_activities(user_id, start_date DESC);
CREATE INDEX idx_strava_activities_strava_id ON strava_activities(strava_id);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_post_likes_post_id ON post_likes(post_id);
CREATE INDEX idx_post_comments_post_id ON post_comments(post_id);

-- Row Level Security (RLS) Policies
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE steps_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE strava_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE strava_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE routes ENABLE ROW LEVEL SECURITY;

-- User can only access their own data
CREATE POLICY "Users can view own profile" ON user_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON user_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own steps_daily" ON steps_daily FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own steps_daily" ON steps_daily FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own steps_daily" ON steps_daily FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own workouts" ON workouts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own workouts" ON workouts FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own workout steps" ON workout_steps FOR SELECT
USING (EXISTS (SELECT 1 FROM workouts WHERE workouts.id = workout_steps.workout_id AND workouts.user_id = auth.uid()));
CREATE POLICY "Users can manage own workout steps" ON workout_steps FOR ALL
USING (EXISTS (SELECT 1 FROM workouts WHERE workouts.id = workout_steps.workout_id AND workouts.user_id = auth.uid()));

CREATE POLICY "Users can view own strava tokens" ON strava_tokens FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own strava tokens" ON strava_tokens FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own strava activities" ON strava_activities FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own strava activities" ON strava_activities FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own routes" ON routes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own routes" ON routes FOR ALL USING (auth.uid() = user_id);

-- Posts can be viewed by anyone but only managed by owner
CREATE POLICY "Anyone can view posts" ON posts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage own posts" ON posts FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view post likes" ON post_likes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage own post likes" ON post_likes FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view post comments" ON post_comments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage own post comments" ON post_comments FOR ALL USING (auth.uid() = user_id);

-- Functions to update like/comment counts
CREATE OR REPLACE FUNCTION update_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET likes_count = likes_count - 1 WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_post_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET comments_count = comments_count - 1 WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Triggers for automatic count updates
CREATE TRIGGER trigger_update_post_likes_count
AFTER INSERT OR DELETE ON post_likes
FOR EACH ROW EXECUTE FUNCTION update_post_likes_count();

CREATE TRIGGER trigger_update_post_comments_count
AFTER INSERT OR DELETE ON post_comments
FOR EACH ROW EXECUTE FUNCTION update_post_comments_count();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to handle user signup (automatically create user profile)
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for auto-creating user profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
