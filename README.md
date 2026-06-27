# To-Do List App (Supabase Edition)
Aplikasi To-Do List dengan login/register dan cloud sync menggunakan Supabase (Auth + Postgres Database).

## Setup
1. Buat project di https://supabase.com
2. Buka **SQL Editor** dalam dashboard Supabase, copy-paste isi `supabase-schema.sql`, lalu **Run**.
3. Pergi **Project Settings > API**, copy **Project URL** dan **anon/publishable key**.
4. Isi dalam `supabase-config.js`:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
5. (Optional, untuk testing senang) Pergi **Authentication > Providers > Email**, OFF "Confirm email" supaya register terus boleh login tanpa sahkan email dulu.
6. Buka `auth.html` di browser untuk daftar/login. Lepas login akan auto-redirect ke `index.html`.

## Struktur Fail
- `auth.html` / `auth.js` / `auth.css` — Halaman login & register
- `index.html` / `script.js` / `style.css` — Halaman utama to-do list (perlu login dulu)
- `supabase-config.js` — Kredensial Supabase (isi sendiri)
- `supabase-schema.sql` — Script SQL untuk setup table `todos` + Row Level Security
