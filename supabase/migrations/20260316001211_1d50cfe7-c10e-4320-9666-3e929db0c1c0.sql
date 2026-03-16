
-- 1. Lock down has_role to only allow checking own role (prevents probing other users)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
      AND _user_id = auth.uid()
  )
$$;

-- 2. Allow members to cancel (update status) their own future bookings
CREATE POLICY "Users can update own member_bookings"
ON public.member_bookings
FOR UPDATE
TO authenticated
USING (
  member_id IN (SELECT id FROM public.members WHERE user_id = auth.uid())
)
WITH CHECK (
  member_id IN (SELECT id FROM public.members WHERE user_id = auth.uid())
);

-- 3. Allow admins full access to member_bookings
CREATE POLICY "Admins can manage all member_bookings"
ON public.member_bookings
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 4. Create trigger for restrict_member_self_update (it exists as function but trigger is missing)
DROP TRIGGER IF EXISTS trg_restrict_member_self_update ON public.members;
CREATE TRIGGER trg_restrict_member_self_update
  BEFORE UPDATE ON public.members
  FOR EACH ROW
  EXECUTE FUNCTION public.restrict_member_self_update();
