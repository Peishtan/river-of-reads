CREATE TABLE public.feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  feedback_type text NOT NULL DEFAULT 'general',
  book_title text,
  message text NOT NULL,
  user_id uuid,
  status text NOT NULL DEFAULT 'open'
);

ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert feedback" ON public.feedback FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Users can read own feedback" ON public.feedback FOR SELECT TO authenticated USING (auth.uid() = user_id);