
-- Tributaries table for Delta recommendations fed by n8n
CREATE TABLE public.tributaries (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  title text NOT NULL,
  author text,
  source_streams text[] NOT NULL DEFAULT '{}'::text[],
  reason text,
  external_url text,
  dismissed boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tributaries ENABLE ROW LEVEL SECURITY;

-- Anyone can read (public like books demo)
CREATE POLICY "Anyone can read tributaries"
  ON public.tributaries FOR SELECT
  TO anon
  USING (true);

-- Authenticated users can read own tributaries
CREATE POLICY "Users can read own tributaries"
  ON public.tributaries FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert own tributaries (for n8n sync)
CREATE POLICY "Users can insert own tributaries"
  ON public.tributaries FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update own tributaries (for dismiss)
CREATE POLICY "Users can update own tributaries"
  ON public.tributaries FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);
