-- Partner agreements (replaces the single-checkbox agreement)
-- One row per partner. Covers three documents signed in order:
--   1. BNC LEG Partner Agreement (MoU)
--   2. Annexures A to D (fee structure, verification, brand rules, service levels)
--   3. Annexure E  Advertisement and Promotion Consent Form
-- Everything the partner fills, ticks and signs is kept as JSON:
--   partner_details   {firm_name, office_address, email, signatory_name, designation, place, country, partner_code}
--   acknowledgements  {"<checkbox id>": true, ...}
--   consents          {"a": true|false, ... "h": true|false}   (Annexure E; false = No)
--   signatures        {"agreement": {...}, "annexures": {...}, "consent": {...}}
--                     each: {name, signed_at, ip, user_agent}
-- No company stamp is collected.

CREATE TABLE IF NOT EXISTS public.partner_agreements (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id        uuid NOT NULL UNIQUE REFERENCES public.registration_partner_profiles(id) ON DELETE CASCADE,
  version           text NOT NULL DEFAULT '2026-11',
  status            text NOT NULL DEFAULT 'signed' CHECK (status IN ('signed', 'revoked')),
  partner_details   jsonb NOT NULL DEFAULT '{}'::jsonb,
  acknowledgements  jsonb NOT NULL DEFAULT '{}'::jsonb,
  consents          jsonb NOT NULL DEFAULT '{}'::jsonb,
  consent_history   jsonb NOT NULL DEFAULT '[]'::jsonb,  -- every later change to Annexure E choices
  signatures        jsonb NOT NULL DEFAULT '{}'::jsonb,
  signed_at         timestamptz NOT NULL DEFAULT now(),
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_partner_agreements_signed_at ON public.partner_agreements (signed_at DESC);

-- Fill the signer's IP (from the API request headers) into every signature and
-- keep a history of Annexure E changes. Signatures cannot be edited after signing.
CREATE OR REPLACE FUNCTION public.partner_agreements_stamp()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  hdr json := nullif(current_setting('request.headers', true), '')::json;
  ip  text := coalesce(split_part(hdr->>'x-forwarded-for', ',', 1), hdr->>'x-real-ip', hdr->>'cf-connecting-ip');
  k   text;
BEGIN
  NEW.updated_at := now();
  IF TG_OP = 'INSERT' THEN
    FOR k IN SELECT jsonb_object_keys(NEW.signatures) LOOP
      NEW.signatures := jsonb_set(NEW.signatures, ARRAY[k, 'ip'], to_jsonb(coalesce(trim(ip), 'unknown')));
      NEW.signatures := jsonb_set(NEW.signatures, ARRAY[k, 'signed_at'], to_jsonb(now()));
    END LOOP;
    NEW.signed_at := now();
  ELSE
    -- partners may only change their Annexure E choices after signing
    IF NOT public.is_referral_admin() THEN
      NEW.partner_id := OLD.partner_id;
      NEW.version := OLD.version;
      NEW.status := OLD.status;
      NEW.partner_details := OLD.partner_details;
      NEW.acknowledgements := OLD.acknowledgements;
      NEW.signatures := OLD.signatures;
      NEW.signed_at := OLD.signed_at;
    END IF;
    IF NEW.consents IS DISTINCT FROM OLD.consents THEN
      NEW.consent_history := OLD.consent_history || jsonb_build_object(
        'changed_at', now(), 'previous', OLD.consents, 'ip', coalesce(trim(ip), 'unknown'));
    ELSE
      NEW.consent_history := OLD.consent_history;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_partner_agreements_stamp ON public.partner_agreements;
CREATE TRIGGER trg_partner_agreements_stamp BEFORE INSERT OR UPDATE ON public.partner_agreements
  FOR EACH ROW EXECUTE FUNCTION public.partner_agreements_stamp();

ALTER TABLE public.partner_agreements ENABLE ROW LEVEL SECURITY;

-- partners: read, sign (insert once) and update consents on their own row; admins: everything
DROP POLICY IF EXISTS partner_agreements_read ON public.partner_agreements;
CREATE POLICY partner_agreements_read ON public.partner_agreements FOR SELECT TO authenticated
  USING (partner_id = auth.uid() OR public.is_referral_admin());
DROP POLICY IF EXISTS partner_agreements_insert ON public.partner_agreements;
CREATE POLICY partner_agreements_insert ON public.partner_agreements FOR INSERT TO authenticated
  WITH CHECK (partner_id = auth.uid() AND public.is_registered_partner());
DROP POLICY IF EXISTS partner_agreements_update ON public.partner_agreements;
CREATE POLICY partner_agreements_update ON public.partner_agreements FOR UPDATE TO authenticated
  USING (partner_id = auth.uid() OR public.is_referral_admin())
  WITH CHECK (partner_id = auth.uid() OR public.is_referral_admin());
DROP POLICY IF EXISTS partner_agreements_admin_delete ON public.partner_agreements;
CREATE POLICY partner_agreements_admin_delete ON public.partner_agreements FOR DELETE TO authenticated
  USING (public.is_referral_admin());

NOTIFY pgrst, 'reload schema';
