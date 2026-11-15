begin;

create table public.crm_follow_up_emails (
  id bigint generated always as identity primary key,
  draft_id uuid not null unique,
  partner_id uuid references public.registration_partner_profiles(id) on delete set null,
  sent_by uuid references auth.users(id) on delete set null,
  recipient_email text not null,
  sender_email text not null,
  subject text not null,
  status text not null default 'sending' check (status in ('sending','accepted','delivered','soft_bounce','hard_bounce','failed','unknown','complained')),
  attempted_at timestamptz not null default now(),
  sent_at timestamptz,
  delivered_at timestamptz,
  last_event_at timestamptz,
  provider_request_id text,
  provider_email_reference text,
  status_detail text,
  updated_at timestamptz not null default now()
);
create index crm_follow_up_partner_history_idx on public.crm_follow_up_emails (partner_id, attempted_at desc, id desc);
create index crm_follow_up_email_history_idx on public.crm_follow_up_emails (attempted_at desc, id desc);
create unique index crm_follow_up_provider_request_idx on public.crm_follow_up_emails(provider_request_id) where provider_request_id is not null;
create index crm_follow_up_sender_idx on public.crm_follow_up_emails(sent_by);

create table public.crm_follow_up_email_events (
  id bigint generated always as identity primary key,
  email_id bigint not null references public.crm_follow_up_emails(id) on delete cascade,
  event_key text not null unique,
  event_name text not null,
  occurred_at timestamptz not null,
  received_at timestamptz not null default now(),
  detail text
);
create index crm_follow_up_events_email_idx on public.crm_follow_up_email_events(email_id, occurred_at desc);

alter table public.crm_follow_up_emails enable row level security;
alter table public.crm_follow_up_email_events enable row level security;
revoke all on public.crm_follow_up_emails, public.crm_follow_up_email_events from anon, authenticated;
grant select on public.crm_follow_up_emails, public.crm_follow_up_email_events to authenticated;
grant all on public.crm_follow_up_emails, public.crm_follow_up_email_events to service_role;
grant usage, select on sequence public.crm_follow_up_emails_id_seq, public.crm_follow_up_email_events_id_seq to service_role;
create policy crm_follow_up_admin_read on public.crm_follow_up_emails for select to authenticated
  using (exists(select 1 from public.admin_profiles where id = (select auth.uid())));
create policy crm_follow_up_events_admin_read on public.crm_follow_up_email_events for select to authenticated
  using (exists(select 1 from public.admin_profiles where id = (select auth.uid())));

create function public.crm_follow_up_email_summary() returns jsonb
language sql stable security invoker set search_path = public as $$
  select jsonb_build_object(
    'totals', (select jsonb_build_object(
      'attempts', count(*),
      'sent', count(*) filter(where sent_at is not null),
      'delivered', count(*) filter(where delivered_at is not null),
      'pending', count(*) filter(where status in ('sending','accepted')),
      'bounced', count(*) filter(where status in ('soft_bounce','hard_bounce','complained')),
      'failed', count(*) filter(where status = 'failed'),
      'unknown', count(*) filter(where status = 'unknown')
    ) from public.crm_follow_up_emails),
    'partners', coalesce((select jsonb_agg(to_jsonb(p)) from (
      select partner_id, count(*) filter(where sent_at is not null) as sent_count,
        count(*) filter(where delivered_at is not null) as delivered_count,
        max(sent_at) as last_sent_at,
        (array_agg(status order by attempted_at desc, id desc))[1] as latest_status
      from public.crm_follow_up_emails where partner_id is not null group by partner_id
    ) p), '[]'::jsonb)
  );
$$;
revoke all on function public.crm_follow_up_email_summary() from public, anon;
grant execute on function public.crm_follow_up_email_summary() to authenticated, service_role;

-- Serialise provider acknowledgement and webhook updates on the same row.
-- A webhook can arrive before the send HTTP response, so acknowledgements must
-- never downgrade a delivery/bounce status already recorded by a webhook.
create function public.crm_follow_up_record_send_result(p_draft_id uuid, p_status text, p_request_id text, p_detail text)
returns public.crm_follow_up_emails language plpgsql security invoker set search_path = public as $$
declare result public.crm_follow_up_emails;
begin
  if p_status not in ('accepted','failed','unknown') then raise exception 'Invalid send status'; end if;
  update public.crm_follow_up_emails set
    status = case when status in ('sending','unknown') then p_status else status end,
    sent_at = case when p_status = 'accepted' then coalesce(sent_at, now()) else sent_at end,
    provider_request_id = coalesce(provider_request_id, nullif(p_request_id,'')),
    status_detail = case when status in ('sending','unknown') then left(p_detail,1000) else status_detail end,
    updated_at = now()
  where draft_id = p_draft_id returning * into result;
  return result;
end;
$$;
revoke all on function public.crm_follow_up_record_send_result(uuid,text,text,text) from public, anon, authenticated;
grant execute on function public.crm_follow_up_record_send_result(uuid,text,text,text) to service_role;

create function public.crm_follow_up_record_email_event(
  p_draft_id uuid, p_request_id text, p_recipient text, p_event_key text,
  p_status text, p_occurred_at timestamptz, p_detail text, p_email_reference text
) returns boolean language plpgsql security invoker set search_path = public as $$
declare target public.crm_follow_up_emails; inserted_id bigint;
begin
  if p_status not in ('delivered','soft_bounce','hard_bounce','complained') then raise exception 'Invalid email event'; end if;
  select * into target from public.crm_follow_up_emails
    where ((p_draft_id is not null and draft_id = p_draft_id) or (p_request_id is not null and provider_request_id = p_request_id))
      and lower(recipient_email) = lower(p_recipient)
    order by id limit 1 for update;
  if not found then return false; end if;
  insert into public.crm_follow_up_email_events(email_id,event_key,event_name,occurred_at,detail)
    values(target.id,p_event_key,p_status,p_occurred_at,left(p_detail,1000))
    on conflict(event_key) do nothing returning id into inserted_id;
  if inserted_id is null then return true; end if;
  update public.crm_follow_up_emails set
    sent_at = coalesce(sent_at, attempted_at),
    delivered_at = case when p_status = 'delivered' then least(coalesce(delivered_at,p_occurred_at),p_occurred_at) else delivered_at end,
    provider_request_id = coalesce(provider_request_id,nullif(p_request_id,'')),
    provider_email_reference = coalesce(provider_email_reference,nullif(p_email_reference,'')),
    updated_at = now()
  where id = target.id;
  if (target.last_event_at is null or p_occurred_at >= target.last_event_at)
    and not (p_status = 'soft_bounce' and target.status in ('delivered','hard_bounce','complained'))
    and target.status <> 'complained' then
    update public.crm_follow_up_emails set status = p_status, last_event_at = p_occurred_at,
      status_detail = left(p_detail,1000) where id = target.id;
  end if;
  return true;
end;
$$;
revoke all on function public.crm_follow_up_record_email_event(uuid,text,text,text,text,timestamptz,text,text) from public, anon, authenticated;
grant execute on function public.crm_follow_up_record_email_event(uuid,text,text,text,text,timestamptz,text,text) to service_role;

notify pgrst, 'reload schema';
commit;
