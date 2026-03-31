
CREATE TABLE public.tag_mappings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  tag text NOT NULL,
  vibe_key text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, tag)
);

ALTER TABLE public.tag_mappings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own tag mappings" ON public.tag_mappings
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tag mappings" ON public.tag_mappings
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tag mappings" ON public.tag_mappings
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tag mappings" ON public.tag_mappings
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);
