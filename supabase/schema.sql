-- JGMnotes schema. Paste this whole file into the Supabase SQL editor and run it once.

create table public.sermon_notes (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  sermon_date date not null,
  description text,
  main_verse text,
  youtube_url text,
  cover_path text,
  tags text[] not null default '{}',
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index sermon_notes_date_idx on public.sermon_notes (sermon_date desc);

create table public.note_files (
  id uuid primary key default gen_random_uuid(),
  note_id uuid not null references public.sermon_notes (id) on delete cascade,
  label text,
  storage_path text not null,
  file_name text not null,
  size_bytes bigint,
  created_at timestamptz not null default now()
);

create index note_files_note_idx on public.note_files (note_id);

-- Allowlist of people who may use the admin panel.
create table public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade
);

create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

create function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger sermon_notes_touch
before update on public.sermon_notes
for each row execute function public.touch_updated_at();

-- Row level security: everyone reads published notes, only admins write.
alter table public.sermon_notes enable row level security;
alter table public.note_files enable row level security;
alter table public.admins enable row level security;

create policy "read published notes" on public.sermon_notes
  for select using (published or public.is_admin());

create policy "admins write notes" on public.sermon_notes
  for all using (public.is_admin()) with check (public.is_admin());

create policy "read files of published notes" on public.note_files
  for select using (
    public.is_admin()
    or exists (select 1 from public.sermon_notes n where n.id = note_id and n.published)
  );

create policy "admins write files" on public.note_files
  for all using (public.is_admin()) with check (public.is_admin());

-- No policies on admins: it is only read through is_admin() and edited in the dashboard.

-- Storage bucket for the note files. Public read, 25 MB per file.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'notes',
  'notes',
  true,
  26214400,
  array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'image/jpeg'
  ]
)
on conflict (id) do nothing;

create policy "admins upload note files" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'notes' and public.is_admin());

create policy "admins update note files" on storage.objects
  for update to authenticated
  using (bucket_id = 'notes' and public.is_admin());

create policy "admins delete note files" on storage.objects
  for delete to authenticated
  using (bucket_id = 'notes' and public.is_admin());

create policy "admins list note files" on storage.objects
  for select to authenticated
  using (bucket_id = 'notes' and public.is_admin());
