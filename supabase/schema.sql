-- Director HQ — Supabase schema
-- Run this once in Supabase SQL Editor (Project > SQL Editor > New query)

create extension if not exists "pgcrypto";

-- MEETINGS
create table if not exists meetings (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  date date,
  time text,
  location text,
  attendees text,
  status text not null default 'scheduled',
  created_at timestamptz not null default now()
);

-- TASKS
create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  priority text not null default 'medium',
  status text not null default 'todo',
  due_date date,
  created_at timestamptz not null default now()
);

-- CREDENTIALS
create table if not exists credentials (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  site text,
  url text,
  username text,
  password text,
  notes text,
  created_at timestamptz not null default now()
);

-- NOTES
create table if not exists notes (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'Untitled',
  body text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Row Level Security: every director only ever sees their own rows
alter table meetings enable row level security;
alter table tasks enable row level security;
alter table credentials enable row level security;
alter table notes enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'meetings' and policyname = 'owner_all_meetings') then
    create policy owner_all_meetings on meetings for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'tasks' and policyname = 'owner_all_tasks') then
    create policy owner_all_tasks on tasks for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'credentials' and policyname = 'owner_all_credentials') then
    create policy owner_all_credentials on credentials for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'notes' and policyname = 'owner_all_notes') then
    create policy owner_all_notes on notes for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
  end if;
end $$;

create index if not exists idx_meetings_owner on meetings(owner_id);
create index if not exists idx_tasks_owner on tasks(owner_id);
create index if not exists idx_credentials_owner on credentials(owner_id);
create index if not exists idx_notes_owner on notes(owner_id);
