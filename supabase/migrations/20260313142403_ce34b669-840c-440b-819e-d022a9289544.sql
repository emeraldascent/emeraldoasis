CREATE POLICY "Anon can check email exists"
ON public.jotform_submissions
FOR SELECT
TO anon
USING (true);