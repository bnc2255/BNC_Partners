-- Referral code lookup (run after 20261115120000_referral_program.sql)
-- Lets the site check a code before the visitor is signed in, e.g. on the
-- "Were you referred by a partner?" step right after registration.
-- Returns only the referring partner's first name.
CREATE OR REPLACE FUNCTION public.referral_code_owner(p_code text)
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT coalesce(nullif(trim(p.first_name), ''), 'a BNC partner')
    FROM partner_referral_codes c
    JOIN registration_partner_profiles p ON p.id = c.partner_id
   WHERE c.code = upper(trim(p_code));
$$;
GRANT EXECUTE ON FUNCTION public.referral_code_owner(text) TO anon, authenticated;
