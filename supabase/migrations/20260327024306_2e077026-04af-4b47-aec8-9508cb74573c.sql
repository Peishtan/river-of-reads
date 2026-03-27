CREATE POLICY "Anyone can read tributaries public"
  ON public.tributaries FOR SELECT
  TO public
  USING (true);