-- Run this once in the Supabase SQL Editor for the diary project.
-- The two invited users are added to public.diary_members in SETUP.md.

create table if not exists public.diary_members (
  user_id uuid primary key references auth.users (id) on delete cascade,
  added_at timestamptz not null default now()
);

create table if not exists public.memories (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  media_type text not null check (media_type in ('photo', 'video', 'voice', 'little-things')),
  memory_date date,
  location text,
  caption text not null default '',
  storage_path text not null unique,
  original_name text not null,
  content_type text not null,
  file_size bigint not null check (file_size > 0 and file_size <= 52428800),
  created_by uuid not null references auth.users (id),
  created_at timestamptz not null default now()
);

create index if not exists memories_diary_order_idx
  on public.memories (memory_date desc nulls last, created_at desc, id desc);

alter table public.diary_members enable row level security;
alter table public.memories enable row level security;

create or replace function public.is_diary_member()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.diary_members
    where user_id = (select auth.uid())
  );
$$;

revoke all on function public.is_diary_member() from public;
grant execute on function public.is_diary_member() to authenticated;

drop policy if exists "Diary members can read the member list" on public.diary_members;
create policy "Diary members can read the member list"
  on public.diary_members for select to authenticated
  using (public.is_diary_member());

drop policy if exists "Diary members can read memories" on public.memories;
create policy "Diary members can read memories"
  on public.memories for select to authenticated
  using (public.is_diary_member());

drop policy if exists "Diary members can add their memories" on public.memories;
create policy "Diary members can add their memories"
  on public.memories for insert to authenticated
  with check (public.is_diary_member() and created_by = (select auth.uid()));

drop policy if exists "Diary members can update memories" on public.memories;
create policy "Diary members can update memories"
  on public.memories for update to authenticated
  using (public.is_diary_member())
  with check (public.is_diary_member());

drop policy if exists "Diary members can remove memories" on public.memories;
create policy "Diary members can remove memories"
  on public.memories for delete to authenticated
  using (public.is_diary_member());

grant select on public.diary_members to authenticated;
grant select, insert, update, delete on public.memories to authenticated;

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'diary-media',
  'diary-media',
  false,
  52428800,
  array[
    'image/*',
    'video/*',
    'audio/*',
    'application/pdf',
    'text/plain'
  ]
)
on conflict (id) do update
set public = false,
    file_size_limit = 52428800,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Diary members can read private media" on storage.objects;
create policy "Diary members can read private media"
  on storage.objects for select to authenticated
  using (bucket_id = 'diary-media' and public.is_diary_member());

drop policy if exists "Diary members can upload private media" on storage.objects;
create policy "Diary members can upload private media"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'diary-media' and public.is_diary_member());

drop policy if exists "Diary members can delete private media" on storage.objects;
create policy "Diary members can delete private media"
  on storage.objects for delete to authenticated
  using (bucket_id = 'diary-media' and public.is_diary_member());
