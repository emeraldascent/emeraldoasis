
-- Fix check_ins: restrict SELECT to own check-ins + admins
DROP POLICY IF EXISTS "Authenticated users can view check_ins" ON public.check_ins;

CREATE POLICY "Users can view own check_ins"
ON public.check_ins
FOR SELECT
TO authenticated
USING (
  member_id IN (SELECT id FROM public.members WHERE user_id = auth.uid())
);

CREATE POLICY "Admins can view all check_ins"
ON public.check_ins
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Fix jotform_submissions: remove anon INSERT (webhook uses service role key)
DROP POLICY IF EXISTS "Webhook can insert submissions" ON public.jotform_submissions;
