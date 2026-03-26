
-- Add user_id to books table
ALTER TABLE public.books ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add user_id to river_settings
ALTER TABLE public.river_settings ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Drop the unique constraint on vibe_key (now per-user)
ALTER TABLE public.river_settings DROP CONSTRAINT IF EXISTS river_settings_vibe_key_key;
ALTER TABLE public.river_settings ADD CONSTRAINT river_settings_user_vibe UNIQUE (user_id, vibe_key);

-- Update RLS policies for books
DROP POLICY IF EXISTS "Anyone can read books" ON public.books;
DROP POLICY IF EXISTS "Anyone can insert books" ON public.books;
DROP POLICY IF EXISTS "Anyone can delete books" ON public.books;

CREATE POLICY "Users can read own books" ON public.books FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own books" ON public.books FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own books" ON public.books FOR DELETE USING (auth.uid() = user_id);

-- Update RLS policies for river_settings
DROP POLICY IF EXISTS "Anyone can read settings" ON public.river_settings;
DROP POLICY IF EXISTS "Anyone can upsert settings" ON public.river_settings;
DROP POLICY IF EXISTS "Anyone can update settings" ON public.river_settings;

CREATE POLICY "Users can read own settings" ON public.river_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own settings" ON public.river_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own settings" ON public.river_settings FOR UPDATE USING (auth.uid() = user_id);
