-- Supports the diary's stable newest-first chapter and spread queries.
create index if not exists memories_diary_order_idx
  on public.memories (memory_date desc nulls last, created_at desc, id desc);
