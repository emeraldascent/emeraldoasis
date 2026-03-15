
-- Fix jotform_submissions SELECT policy: use matched_member_id instead of email matching
DROP POLICY IF EXISTS "Users can view own jotform submission" ON public.jotform_submissions;

CREATE POLICY "Users can view own jotform submission"
ON public.jotform_submissions
FOR SELECT
TO authenticated
USING (
  matched_member_id IN (SELECT id FROM public.members WHERE user_id = auth.uid())
);
