-- One shared favorite per memory. Either invited diary member can save or unsave it.
create table if not exists public.memory_favorites (
  memory_id uuid primary key references public.memories (id) on delete cascade,
  created_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.memory_favorites enable row level security;

drop policy if exists "Diary members can read shared favorites" on public.memory_favorites;
create policy "Diary members can read shared favorites"
  on public.memory_favorites for select to authenticated
  using (public.is_diary_member());

drop policy if exists "Diary members can add shared favorites" on public.memory_favorites;
create policy "Diary members can add shared favorites"
  on public.memory_favorites for insert to authenticated
  with check (public.is_diary_member() and created_by = (select auth.uid()));

drop policy if exists "Diary members can remove shared favorites" on public.memory_favorites;
create policy "Diary members can remove shared favorites"
  on public.memory_favorites for delete to authenticated
  using (public.is_diary_member());

grant select, insert, delete on public.memory_favorites to authenticated;
