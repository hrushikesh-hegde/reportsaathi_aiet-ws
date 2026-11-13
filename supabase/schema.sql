-- ReportSaathi Phase 5 schema
-- Run this in Supabase Dashboard -> SQL Editor.
-- This schema stores account profile metadata and opt-in report history metadata only.
-- It deliberately does NOT store uploaded files, extracted report text or AI explanations.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  created_at timestamptz not null default now()
);

create table if not exists public.report_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null default 'Laboratory report',
  source_type text not null check (source_type in ('pdf', 'png', 'jpeg')),
  extraction_method text not null check (extraction_method in ('pdf_text', 'tesseract_ocr')),
  page_count integer not null check (page_count between 1 and 30),
  created_at timestamptz not null default now()
);

create index if not exists report_history_user_created_idx
  on public.report_history (user_id, created_at desc);

alter table public.profiles enable row level security;
alter table public.report_history enable row level security;

-- A user can read and update only their own profile.
drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile"
  on public.profiles for select
  to authenticated
  using (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Report history is private to its owner. No anonymous access and no public sharing.
drop policy if exists "Users can read own report history" on public.report_history;
create policy "Users can read own report history"
  on public.report_history for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own report history" on public.report_history;
create policy "Users can insert own report history"
  on public.report_history for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own report history" on public.report_history;
create policy "Users can delete own report history"
  on public.report_history for delete
  to authenticated
  using (auth.uid() = user_id);

-- Create a profile row automatically when an Auth user is created.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Restrict table privileges; RLS policies still apply.
revoke all on public.profiles from anon, authenticated;
revoke all on public.report_history from anon, authenticated;
grant select, update on public.profiles to authenticated;
grant select, insert, delete on public.report_history to authenticated;
