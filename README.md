# JGMnotes

Sermon notes site for Joshua Generation Ministries: a public listing (search, year/month/tag filters, downloads) and an admin panel for uploading notes. React + Vite + Tailwind, with Supabase for the database, file storage and admin login.

## Run locally

```
npm install
npm run dev
```

Without a `.env` the dev server shows sample data (nothing is saved, any admin login works). The admin panel is at `/admin`.

## Connect Supabase

1. Create a project at supabase.com.
2. SQL editor → paste all of `supabase/schema.sql` → Run.
3. Authentication → Sign In / Providers → turn off "Allow new users to sign up".
4. Authentication → Users → Add user (email + password) for each admin, then in the SQL editor:
   ```sql
   insert into public.admins (user_id)
   select id from auth.users where email = 'admin@example.com';
   ```
5. Copy `.env.example` to `.env` and fill in the project URL and anon key (Project Settings → API).

## Deploy (Vercel)

Import the folder as a Vite project and set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as environment variables. `vercel.json` already handles page routing.

## Layout

- `supabase/schema.sql` — tables, access rules, storage bucket
- `src/lib/supabaseBackend.js` — all Supabase calls; `sampleBackend.js` is the dev-only stand-in
- `src/lib/filters.js` — search and filter logic
- `src/components/PdfReader.jsx` — in-page PDF reader (pdf.js), loaded only when a note is opened
- `src/pages` — `NotesList`, `NoteDetail`, and `admin/` (`Login`, `Dashboard`, `NoteForm`)
- `src/index.css` — theme colours and surface/shadow tokens (light and dark)
