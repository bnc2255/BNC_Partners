begin;
insert into public.crm_follow_up_emails(draft_id,recipient_email,sender_email,subject)
values('00000000-0000-4000-8000-00000000f001','tracking-test@example.invalid','noreply@bncglobal.in','Transaction-only test');
select public.crm_follow_up_record_email_event('00000000-0000-4000-8000-00000000f001','fixture-request','tracking-test@example.invalid','fixture-delivered','delivered','2026-11-15T10:00:00Z','Accepted by test server.',null);
select public.crm_follow_up_record_send_result('00000000-0000-4000-8000-00000000f001','accepted','fixture-request',null);
select public.crm_follow_up_record_email_event('00000000-0000-4000-8000-00000000f001','fixture-request','tracking-test@example.invalid','fixture-older-bounce','soft_bounce','2026-11-15T09:00:00Z','Old event.',null);
select public.crm_follow_up_record_email_event('00000000-0000-4000-8000-00000000f001','fixture-request','tracking-test@example.invalid','fixture-delivered','delivered','2026-11-15T10:00:00Z','Duplicate.',null);
do $$ begin
  if not exists(select 1 from public.crm_follow_up_emails where draft_id='00000000-0000-4000-8000-00000000f001' and status='delivered' and delivered_at is not null and sent_at is not null) then raise exception 'Delivery must survive late acknowledgements and old bounce events'; end if;
  if (select count(*) from public.crm_follow_up_email_events e join public.crm_follow_up_emails m on m.id=e.email_id where m.draft_id='00000000-0000-4000-8000-00000000f001') <> 2 then raise exception 'Duplicate event was not deduplicated'; end if;
  begin
    insert into public.crm_follow_up_emails(draft_id,recipient_email,sender_email,subject) values('00000000-0000-4000-8000-00000000f001','tracking-test@example.invalid','noreply@bncglobal.in','Duplicate draft');
    raise exception 'Duplicate draft was not blocked';
  exception when unique_violation then null; end;
end $$;
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-00000000f099","role":"authenticated"}',true);
set local role authenticated;
do $$ begin
  if exists(select 1 from public.crm_follow_up_emails) then raise exception 'Non-admin can read email history'; end if;
  if (public.crm_follow_up_email_summary()->'totals'->>'attempts')::int <> 0 then raise exception 'Summary leaks history'; end if;
  if has_function_privilege('authenticated','public.crm_follow_up_record_email_event(uuid,text,text,text,text,timestamptz,text,text)','execute') then raise exception 'Authenticated role can forge events'; end if;
end $$;
reset role;
do $$ begin
  perform set_config('request.jwt.claims',json_build_object('sub',(select id from public.admin_profiles limit 1),'role','authenticated')::text,true);
end $$;
set local role authenticated;
do $$ begin
  if not exists(select 1 from public.crm_follow_up_emails where draft_id='00000000-0000-4000-8000-00000000f001') then raise exception 'Admin cannot read history'; end if;
end $$;
reset role;
rollback;
