create table if not exists public.user_progress (
  user_id uuid primary key references auth.users (id) on delete cascade,
  logs jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  constraint user_progress_logs_object check (jsonb_typeof(logs) = 'object')
);

alter table public.user_progress enable row level security;
revoke all on public.user_progress from anon;
grant select, insert, update on public.user_progress to authenticated;

drop policy if exists "Users manage their own progress" on public.user_progress;
create policy "Users manage their own progress"
  on public.user_progress
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

insert into storage.buckets (id, name, public)
values ('trail-photos', 'trail-photos', false)
on conflict (id) do update set public = false;

drop policy if exists "Users read their own trail photos" on storage.objects;
create policy "Users read their own trail photos"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'trail-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Users upload their own trail photos" on storage.objects;
create policy "Users upload their own trail photos"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'trail-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Users update their own trail photos" on storage.objects;
create policy "Users update their own trail photos"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'trail-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'trail-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Users delete their own trail photos" on storage.objects;
create policy "Users delete their own trail photos"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'trail-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );