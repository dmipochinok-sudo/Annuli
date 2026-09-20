DROP POLICY IF EXISTS "Anyone can submit a lead" ON public.leads;

CREATE POLICY "Anonymous visitors can submit a lead"
ON public.leads FOR INSERT TO anon
WITH CHECK (user_id IS NULL);

CREATE POLICY "Signed-in users can submit their own lead"
ON public.leads FOR INSERT TO authenticated
WITH CHECK (user_id IS NULL OR user_id = auth.uid());