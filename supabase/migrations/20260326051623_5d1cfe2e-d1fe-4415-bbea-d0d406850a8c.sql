
-- Create a table for uploaded books
CREATE TABLE public.books (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  author TEXT,
  date_read DATE,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  format TEXT,
  vibes TEXT[] NOT NULL DEFAULT '{}',
  summary TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;

-- For now allow public read/insert (no auth yet)
CREATE POLICY "Anyone can read books" ON public.books FOR SELECT USING (true);
CREATE POLICY "Anyone can insert books" ON public.books FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can delete books" ON public.books FOR DELETE USING (true);

-- Index on date for timeline queries
CREATE INDEX idx_books_date_read ON public.books (date_read);

-- Create a table for river color settings
CREATE TABLE public.river_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vibe_key TEXT NOT NULL UNIQUE,
  color_hsl TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.river_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read settings" ON public.river_settings FOR SELECT USING (true);
CREATE POLICY "Anyone can upsert settings" ON public.river_settings FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update settings" ON public.river_settings FOR UPDATE USING (true);

-- Seed default colors
INSERT INTO public.river_settings (vibe_key, color_hsl) VALUES
  ('escapist', 'hsl(195, 60%, 50%)'),
  ('ideas', 'hsl(210, 45%, 40%)'),
  ('nature', 'hsl(160, 35%, 45%)'),
  ('history', 'hsl(180, 40%, 35%)'),
  ('life', 'hsl(220, 35%, 55%)');

-- Timestamp trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_river_settings_updated_at
  BEFORE UPDATE ON public.river_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
