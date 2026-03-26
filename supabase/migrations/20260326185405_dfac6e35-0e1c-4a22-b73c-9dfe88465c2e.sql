-- Allow public/anonymous read access to books for demo view
CREATE POLICY "Anyone can read books for demo"
ON public.books
FOR SELECT
TO anon
USING (true);