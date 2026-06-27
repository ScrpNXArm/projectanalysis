-- =====================================================
-- SQL Schema untuk To-Do List App (Supabase)
-- Jalankan SEMUA script ni dalam: Supabase Dashboard > SQL Editor > New Query
-- =====================================================

-- 1. Buat table todos
create table public.todos (
    id bigint generated always as identity primary key,
    user_id uuid not null references auth.users(id) on delete cascade,
    text text not null,
    completed boolean not null default false,
    category text not null default 'General',
    priority text not null default 'medium',
    due_date date,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- Index untuk performance (RLS akan filter ikut user_id setiap query)
create index todos_user_id_idx on public.todos (user_id);

-- 2. Enable Row Level Security (WAJIB - tanpa ni semua orang boleh baca data orang lain)
alter table public.todos enable row level security;

-- 3. RLS Policies - setiap user hanya boleh akses task DIA SENDIRI

create policy "Users can view their own todos"
on public.todos
for select
to authenticated
using ( (select auth.uid()) = user_id );

create policy "Users can insert their own todos"
on public.todos
for insert
to authenticated
with check ( (select auth.uid()) = user_id );

create policy "Users can update their own todos"
on public.todos
for update
to authenticated
using ( (select auth.uid()) = user_id )
with check ( (select auth.uid()) = user_id );

create policy "Users can delete their own todos"
on public.todos
for delete
to authenticated
using ( (select auth.uid()) = user_id );

-- 4. Trigger untuk auto-update kolum updated_at setiap kali row diubah
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

create trigger todos_updated_at
before update on public.todos
for each row
execute function public.handle_updated_at();

-- =====================================================
-- SELESAI. Lepas run script ni:
-- 1. Pergi ke Authentication > Providers > Email
--    - Kalau testing/dev, boleh OFF "Confirm email" supaya senang test register/login terus
-- 2. Dapatkan Project URL & anon/publishable key di:
--    Project Settings > API > isi dalam supabase-config.js
-- =====================================================
