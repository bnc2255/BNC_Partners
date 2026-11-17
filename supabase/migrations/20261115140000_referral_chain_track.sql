-- Referral chain track (run after 20261115130000_referral_code_lookup.sql)
-- Powers the "Your chain" view in Dashboard > Referrals:
--   who introduced me  ->  me  ->  partners I introduced  ->  partners they introduced ...

-- my downline, now with each partner's sponsor so the tree can be drawn
DROP FUNCTION IF EXISTS public.my_referral_network();
CREATE FUNCTION public.my_referral_network()
RETURNS TABLE (level integer, partner_id uuid, sponsor_id uuid, name text, joined_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH RECURSIVE down(level, partner_id, sponsor_id, joined_at, path) AS (
    SELECT 1, s.partner_id, s.sponsor_id, s.created_at, ARRAY[auth.uid(), s.partner_id]
      FROM partner_sponsors s WHERE s.sponsor_id = auth.uid()
    UNION ALL
    SELECT d.level + 1, s.partner_id, s.sponsor_id, s.created_at, d.path || s.partner_id
      FROM down d JOIN partner_sponsors s ON s.sponsor_id = d.partner_id
     WHERE NOT s.partner_id = ANY(d.path)
  )
  SELECT d.level, d.partner_id, d.sponsor_id,
         trim(coalesce(p.first_name, '') || ' ' || coalesce(p.last_name, '')) AS name,
         d.joined_at
    FROM down d JOIN registration_partner_profiles p ON p.id = d.partner_id
   ORDER BY d.level, d.joined_at;
$$;
GRANT EXECUTE ON FUNCTION public.my_referral_network() TO authenticated;

-- the partner who introduced me (name only) and when I joined their chain
CREATE OR REPLACE FUNCTION public.my_referral_sponsor()
RETURNS TABLE (partner_id uuid, name text, linked_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT s.sponsor_id,
         trim(coalesce(p.first_name, '') || ' ' || coalesce(p.last_name, '')),
         s.created_at
    FROM partner_sponsors s
    JOIN registration_partner_profiles p ON p.id = s.sponsor_id
   WHERE s.partner_id = auth.uid();
$$;
GRANT EXECUTE ON FUNCTION public.my_referral_sponsor() TO authenticated;

-- refresh the API's function list so the new functions are usable immediately
NOTIFY pgrst, 'reload schema';
