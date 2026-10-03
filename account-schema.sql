-- Run in your Supabase project's SQL Editor. No service key is needed in the app.
begin;
create table if not exists public.voice_profiles (
 user_id uuid primary key references auth.users(id) on delete cascade,
 display_name text not null default 'Voice explorer' check (char_length(display_name) between 1 and 60),
 goal text not null default '' check (char_length(goal)<=300),
 preferences jsonb not null default '{}'::jsonb check (jsonb_typeof(preferences)='object' and octet_length(preferences::text)<4096),
 updated_at timestamptz not null default now()
);
create table if not exists public.voice_sessions (
 id uuid primary key,
 user_id uuid not null references auth.users(id) on delete cascade,
 created_at timestamptz not null default now(),
 payload jsonb not null check (
  jsonb_typeof(payload)='object' and octet_length(payload::text)<8192
  and payload ?& array['id','name','date','seconds','comfort']
  and payload->>'id'=id::text
  and jsonb_typeof(payload->'seconds')='number'
  and (payload->>'seconds')::numeric between 1 and 3600
  and payload->>'comfort' in ('easy','neutral','strain')
 )
);
create index if not exists voice_sessions_user_date on public.voice_sessions(user_id,created_at desc);
alter table public.voice_profiles enable row level security;
alter table public.voice_sessions enable row level security;
revoke all on public.voice_profiles,public.voice_sessions from anon;
grant select,insert,update,delete on public.voice_profiles,public.voice_sessions to authenticated;
drop policy if exists own_profile on public.voice_profiles;
create policy own_profile on public.voice_profiles for all to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
drop policy if exists own_sessions on public.voice_sessions;
create policy own_sessions on public.voice_sessions for all to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
-- Prevent clients from moving records between accounts, even when owning both.
create or replace function public.voice_keep_owner() returns trigger language plpgsql set search_path='' as $$
begin
 if new.user_id is distinct from old.user_id then raise exception 'Record owner cannot change'; end if;
 return new;
end; $$;
drop trigger if exists voice_session_keep_owner on public.voice_sessions;
create trigger voice_session_keep_owner before update on public.voice_sessions for each row execute function public.voice_keep_owner();
create or replace function public.voice_profile_timestamp() returns trigger language plpgsql set search_path='' as $$
begin new.updated_at=now();return new;end; $$;
drop trigger if exists voice_profile_timestamp on public.voice_profiles;
create trigger voice_profile_timestamp before update on public.voice_profiles for each row execute function public.voice_profile_timestamp();
commit;
