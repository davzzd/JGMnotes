-- Adds optional cover images to notes. Run once in the Supabase SQL editor.
-- (Fresh installs do not need this: schema.sql already includes it.)

alter table public.sermon_notes add column if not exists cover_path text;

update storage.buckets
set allowed_mime_types = array[
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'image/jpeg'
]
where id = 'notes';
