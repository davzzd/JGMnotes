-- Lets admins choose the order of a note's files (e.g. English before Malayalam).
-- Run once in the Supabase SQL editor. Fresh installs do not need this: schema.sql includes it.

alter table public.note_files add column if not exists position integer not null default 0;
