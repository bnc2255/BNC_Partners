-- Referral program (project referrals + unlimited partner chain)
-- Run in Supabase Dashboard > SQL Editor (or `supabase db push`).
--
-- Rules
--  * Money is earned ONLY when a partner brings a client/project that we process.
--  * Introducing a new partner earns nothing by itself; it only places them in your chain.
--  * When a project is approved: the partner who brought it gets up to 5% (set by admin);
--    every partner above them in the chain (any depth) shares a small "upline pool".

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_referral_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.admin_profiles WHERE id = auth.uid());
$$;

CREATE OR REPLACE FUNCTION public.is_registered_partner()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.registration_partner_profiles WHERE id = auth.uid());
$$;

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

-- ---------------------------------------------------------------------------
-- Settings (single row, admin controlled)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.referral_settings (
  id                   smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  max_direct_percent   numeric(5,2) NOT NULL DEFAULT 5    CHECK (max_direct_percent BETWEEN 0 AND 100),
  default_direct_percent numeric(5,2) NOT NULL DEFAULT 5  CHECK (default_direct_percent BETWEEN 0 AND 100),
  upline_pool_percent  numeric(5,2) NOT NULL DEFAULT 1    CHECK (upline_pool_percent BETWEEN 0 AND 100),
  -- 'decay': each level up gets half of the level below it (closest sponsor earns most)
  -- 'equal': the pool is split equally between everyone above
  upline_mode          text NOT NULL DEFAULT 'decay' CHECK (upline_mode IN ('decay', 'equal')),
  default_currency     text NOT NULL DEFAULT 'USD',
  program_open         boolean NOT NULL DEFAULT true,
  updated_at           timestamptz NOT NULL DEFAULT now()
);
INSERT INTO public.referral_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Partner chain: who introduced whom (one sponsor per partner, any depth)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.partner_sponsors (
  partner_id  uuid PRIMARY KEY REFERENCES public.registration_partner_profiles(id) ON DELETE CASCADE,
  sponsor_id  uuid REFERENCES public.registration_partner_profiles(id) ON DELETE SET NULL,
  set_by      text NOT NULL DEFAULT 'code' CHECK (set_by IN ('code', 'admin')),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  CHECK (sponsor_id IS NULL OR sponsor_id <> partner_id)
);
CREATE INDEX IF NOT EXISTS idx_partner_sponsors_sponsor ON public.partner_sponsors (sponsor_id);
DROP TRIGGER IF EXISTS trg_partner_sponsors_touch ON public.partner_sponsors;
CREATE TRIGGER trg_partner_sponsors_touch BEFORE UPDATE ON public.partner_sponsors
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Each partner's shareable referral code
CREATE TABLE IF NOT EXISTS public.partner_referral_codes (
  partner_id  uuid PRIMARY KEY REFERENCES public.registration_partner_profiles(id) ON DELETE CASCADE,
  code        text NOT NULL UNIQUE,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Project referrals (the only thing that earns money)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.project_referrals (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id      uuid NOT NULL REFERENCES public.registration_partner_profiles(id) ON DELETE CASCADE,
  -- snapshot of the referring partner at submission time (required)
  referrer_name    text NOT NULL,
  referrer_email   text NOT NULL,
  referrer_phone   text NOT NULL,
  -- the client (does not need to be a partner)
  client_name      text NOT NULL CHECK (length(trim(client_name)) > 0),
  client_phone     text,
  client_email     text,
  client_company   text,
  project_note     text,
  status           text NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending', 'in_review', 'approved', 'rejected', 'paid')),
  project_value    numeric(14,2) CHECK (project_value IS NULL OR project_value >= 0),
  currency         text NOT NULL DEFAULT 'USD',
  percent          numeric(5,2) CHECK (percent IS NULL OR percent BETWEEN 0 AND 100),
  referral_amount  numeric(14,2) GENERATED ALWAYS AS (round(coalesce(project_value, 0) * coalesce(percent, 0) / 100, 2)) STORED,
  admin_note       text,
  decided_at       timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_project_referrals_referrer ON public.project_referrals (referrer_id);
CREATE INDEX IF NOT EXISTS idx_project_referrals_status ON public.project_referrals (status);
DROP TRIGGER IF EXISTS trg_project_referrals_touch ON public.project_referrals;
CREATE TRIGGER trg_project_referrals_touch BEFORE UPDATE ON public.project_referrals
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Payouts: one row per partner per approved project (level 1 = direct)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.referral_payouts (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_id  uuid NOT NULL REFERENCES public.project_referrals(id) ON DELETE CASCADE,
  partner_id   uuid NOT NULL REFERENCES public.registration_partner_profiles(id) ON DELETE CASCADE,
  level        integer NOT NULL CHECK (level >= 1),
  percent      numeric(9,4) NOT NULL DEFAULT 0,
  amount       numeric(14,2) NOT NULL DEFAULT 0,
  currency     text NOT NULL DEFAULT 'USD',
  status       text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'cancelled')),
  paid_at      timestamptz,
  note         text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_referral_payouts_partner ON public.referral_payouts (partner_id);
CREATE INDEX IF NOT EXISTS idx_referral_payouts_referral ON public.referral_payouts (referral_id);
DROP TRIGGER IF EXISTS trg_referral_payouts_touch ON public.referral_payouts;
CREATE TRIGGER trg_referral_payouts_touch BEFORE UPDATE ON public.referral_payouts
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Chain functions
-- ---------------------------------------------------------------------------
-- Everyone above a partner: level 1 = their sponsor, level 2 = sponsor's sponsor, ...
CREATE OR REPLACE FUNCTION public.referral_upline(p_partner uuid)
RETURNS TABLE (level integer, partner_id uuid)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH RECURSIVE up(level, partner_id, path) AS (
    SELECT 1, s.sponsor_id, ARRAY[p_partner, s.sponsor_id]
      FROM partner_sponsors s WHERE s.partner_id = p_partner AND s.sponsor_id IS NOT NULL
    UNION ALL
    SELECT up.level + 1, s.sponsor_id, up.path || s.sponsor_id
      FROM up JOIN partner_sponsors s ON s.partner_id = up.partner_id
     WHERE s.sponsor_id IS NOT NULL AND NOT s.sponsor_id = ANY(up.path)  -- cycle guard
  )
  SELECT level, partner_id FROM up ORDER BY level;
$$;

-- Would making p_sponsor the sponsor of p_partner create a loop?
CREATE OR REPLACE FUNCTION public.referral_creates_cycle(p_partner uuid, p_sponsor uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p_partner = p_sponsor
      OR EXISTS (SELECT 1 FROM public.referral_upline(p_sponsor) u WHERE u.partner_id = p_partner);
$$;

-- My referral code (created on first call)
CREATE OR REPLACE FUNCTION public.my_referral_code()
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_code text;
BEGIN
  IF NOT public.is_registered_partner() THEN RAISE EXCEPTION 'Only registered partners have a referral code'; END IF;
  SELECT code INTO v_code FROM partner_referral_codes WHERE partner_id = auth.uid();
  IF v_code IS NOT NULL THEN RETURN v_code; END IF;
  LOOP
    v_code := upper(substr(md5(gen_random_uuid()::text), 1, 8));
    BEGIN
      INSERT INTO partner_referral_codes (partner_id, code) VALUES (auth.uid(), v_code);
      RETURN v_code;
    EXCEPTION WHEN unique_violation THEN
      -- code clash (or row created concurrently): retry / return existing
      SELECT code INTO v_code FROM partner_referral_codes WHERE partner_id = auth.uid();
      IF v_code IS NOT NULL THEN RETURN v_code; END IF;
    END;
  END LOOP;
END;
$$;

-- Join someone's chain with their code (only once; admins can change it later)
CREATE OR REPLACE FUNCTION public.claim_referral_sponsor(p_code text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_sponsor uuid;
BEGIN
  IF NOT public.is_registered_partner() THEN RAISE EXCEPTION 'Only registered partners can join a chain'; END IF;
  SELECT partner_id INTO v_sponsor FROM partner_referral_codes WHERE code = upper(trim(p_code));
  IF v_sponsor IS NULL THEN RAISE EXCEPTION 'Referral code not found'; END IF;
  IF EXISTS (SELECT 1 FROM partner_sponsors WHERE partner_id = auth.uid() AND sponsor_id IS NOT NULL) THEN
    RAISE EXCEPTION 'You are already linked to a referring partner';
  END IF;
  IF public.referral_creates_cycle(auth.uid(), v_sponsor) THEN RAISE EXCEPTION 'This code cannot be used for your account'; END IF;
  INSERT INTO partner_sponsors (partner_id, sponsor_id, set_by) VALUES (auth.uid(), v_sponsor, 'code')
    ON CONFLICT (partner_id) DO UPDATE SET sponsor_id = EXCLUDED.sponsor_id, set_by = 'code';
  RETURN v_sponsor;
END;
$$;

-- Admin: set / change / clear any partner's sponsor
CREATE OR REPLACE FUNCTION public.admin_set_referral_sponsor(p_partner uuid, p_sponsor uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_referral_admin() THEN RAISE EXCEPTION 'Admins only'; END IF;
  IF p_sponsor IS NOT NULL AND public.referral_creates_cycle(p_partner, p_sponsor) THEN
    RAISE EXCEPTION 'That would create a loop in the chain';
  END IF;
  INSERT INTO partner_sponsors (partner_id, sponsor_id, set_by) VALUES (p_partner, p_sponsor, 'admin')
    ON CONFLICT (partner_id) DO UPDATE SET sponsor_id = EXCLUDED.sponsor_id, set_by = 'admin';
END;
$$;

-- Admin: (re)build the payouts of one referral from its value, % and the chain.
-- Paid payouts are never touched; other payouts are replaced.
CREATE OR REPLACE FUNCTION public.generate_referral_payouts(p_referral uuid)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  r       project_referrals%ROWTYPE;
  s       referral_settings%ROWTYPE;
  n       integer;
  pool    numeric;
  weight_total numeric;
  u       record;
  created integer := 0;
BEGIN
  IF NOT public.is_referral_admin() THEN RAISE EXCEPTION 'Admins only'; END IF;
  SELECT * INTO r FROM project_referrals WHERE id = p_referral;
  IF NOT FOUND THEN RAISE EXCEPTION 'Referral not found'; END IF;
  SELECT * INTO s FROM referral_settings WHERE id = 1;

  DELETE FROM referral_payouts WHERE referral_id = p_referral AND status <> 'paid';
  IF coalesce(r.project_value, 0) <= 0 THEN RETURN 0; END IF;

  -- level 1: the partner who brought the project
  IF NOT EXISTS (SELECT 1 FROM referral_payouts WHERE referral_id = p_referral AND level = 1) THEN
    INSERT INTO referral_payouts (referral_id, partner_id, level, percent, amount, currency)
    VALUES (p_referral, r.referrer_id, 1, coalesce(r.percent, 0), r.referral_amount, r.currency);
    created := created + 1;
  END IF;

  -- levels 2..N: everyone above them shares the upline pool
  SELECT count(*) INTO n FROM public.referral_upline(r.referrer_id);
  IF n = 0 OR s.upline_pool_percent <= 0 THEN RETURN created; END IF;
  pool := r.project_value * s.upline_pool_percent / 100;
  -- decay: weights 1, 1/2, 1/4 ... (closest sponsor earns most); equal: all weights 1
  weight_total := CASE WHEN s.upline_mode = 'equal' THEN n ELSE 2 * (1 - power(0.5, n)) END;

  FOR u IN SELECT level, partner_id FROM public.referral_upline(r.referrer_id) LOOP
    IF EXISTS (SELECT 1 FROM referral_payouts WHERE referral_id = p_referral AND level = u.level + 1) THEN CONTINUE; END IF;
    INSERT INTO referral_payouts (referral_id, partner_id, level, percent, amount, currency)
    VALUES (
      p_referral, u.partner_id, u.level + 1,
      round(s.upline_pool_percent * (CASE WHEN s.upline_mode = 'equal' THEN 1 ELSE power(0.5, u.level - 1) END) / weight_total, 4),
      round(pool * (CASE WHEN s.upline_mode = 'equal' THEN 1 ELSE power(0.5, u.level - 1) END) / weight_total, 2),
      r.currency
    );
    created := created + 1;
  END LOOP;
  RETURN created;
END;
$$;

-- Partner-facing: my direct partners and my whole downline size (names only)
CREATE OR REPLACE FUNCTION public.my_referral_network()
RETURNS TABLE (level integer, partner_id uuid, name text, joined_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH RECURSIVE down(level, partner_id, joined_at, path) AS (
    SELECT 1, s.partner_id, s.created_at, ARRAY[auth.uid(), s.partner_id]
      FROM partner_sponsors s WHERE s.sponsor_id = auth.uid()
    UNION ALL
    SELECT d.level + 1, s.partner_id, s.created_at, d.path || s.partner_id
      FROM down d JOIN partner_sponsors s ON s.sponsor_id = d.partner_id
     WHERE NOT s.partner_id = ANY(d.path)
  )
  SELECT d.level, d.partner_id,
         trim(coalesce(p.first_name, '') || ' ' || coalesce(p.last_name, '')) AS name,
         d.joined_at
    FROM down d JOIN registration_partner_profiles p ON p.id = d.partner_id
   ORDER BY d.level, d.joined_at;
$$;

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------
ALTER TABLE public.referral_settings      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_sponsors       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_referrals      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_payouts       ENABLE ROW LEVEL SECURITY;

-- settings: everyone signed in can read (page shows the %), admins edit
DROP POLICY IF EXISTS referral_settings_read ON public.referral_settings;
CREATE POLICY referral_settings_read ON public.referral_settings FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS referral_settings_admin ON public.referral_settings;
CREATE POLICY referral_settings_admin ON public.referral_settings FOR UPDATE TO authenticated
  USING (public.is_referral_admin()) WITH CHECK (public.is_referral_admin());

-- sponsors: a partner sees their own link; admins see all (changes go through functions)
DROP POLICY IF EXISTS partner_sponsors_read ON public.partner_sponsors;
CREATE POLICY partner_sponsors_read ON public.partner_sponsors FOR SELECT TO authenticated
  USING (partner_id = auth.uid() OR public.is_referral_admin());

-- codes: own code; admins all
DROP POLICY IF EXISTS partner_referral_codes_read ON public.partner_referral_codes;
CREATE POLICY partner_referral_codes_read ON public.partner_referral_codes FOR SELECT TO authenticated
  USING (partner_id = auth.uid() OR public.is_referral_admin());

-- referrals: partners create + read their own (always pending, no money fields); admins everything
DROP POLICY IF EXISTS project_referrals_read ON public.project_referrals;
CREATE POLICY project_referrals_read ON public.project_referrals FOR SELECT TO authenticated
  USING (referrer_id = auth.uid() OR public.is_referral_admin());
DROP POLICY IF EXISTS project_referrals_insert ON public.project_referrals;
CREATE POLICY project_referrals_insert ON public.project_referrals FOR INSERT TO authenticated
  WITH CHECK (
    (referrer_id = auth.uid() AND public.is_registered_partner()
      AND status = 'pending' AND project_value IS NULL AND percent IS NULL AND admin_note IS NULL)
    OR public.is_referral_admin()
  );
DROP POLICY IF EXISTS project_referrals_admin_update ON public.project_referrals;
CREATE POLICY project_referrals_admin_update ON public.project_referrals FOR UPDATE TO authenticated
  USING (public.is_referral_admin()) WITH CHECK (public.is_referral_admin());
DROP POLICY IF EXISTS project_referrals_admin_delete ON public.project_referrals;
CREATE POLICY project_referrals_admin_delete ON public.project_referrals FOR DELETE TO authenticated
  USING (public.is_referral_admin());

-- payouts: partners read their own; admins everything
DROP POLICY IF EXISTS referral_payouts_read ON public.referral_payouts;
CREATE POLICY referral_payouts_read ON public.referral_payouts FOR SELECT TO authenticated
  USING (partner_id = auth.uid() OR public.is_referral_admin());
DROP POLICY IF EXISTS referral_payouts_admin_write ON public.referral_payouts;
CREATE POLICY referral_payouts_admin_write ON public.referral_payouts FOR ALL TO authenticated
  USING (public.is_referral_admin()) WITH CHECK (public.is_referral_admin());

-- functions callable by signed-in users (each checks its own permissions)
REVOKE ALL ON FUNCTION public.referral_upline(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.referral_creates_cycle(uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.my_referral_code() TO authenticated;
GRANT EXECUTE ON FUNCTION public.claim_referral_sponsor(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_referral_sponsor(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_referral_payouts(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.my_referral_network() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_referral_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_registered_partner() TO authenticated;
