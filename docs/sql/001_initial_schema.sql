-- ============================================================
-- TUFF — Initial Schema Migration
-- Session: 002 | File: 001_initial_schema.sql
-- Run this in: Supabase Dashboard > SQL Editor > New Query
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- PROFILES
-- Auto-created when a user signs up via Supabase Auth
-- ============================================================
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  username text unique,
  avatar_url text,
  tagline text,
  vision_statement text,
  core_values text[],
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- GOALS
-- Long-term goals, broken into milestones
-- ============================================================
create table if not exists goals (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade not null,
  title text not null,
  description text,
  category text check (category in ('career','health','finance','relationships','learning','personal','startup')),
  status text default 'active' check (status in ('active','completed','paused','dropped')),
  target_date date,
  progress integer default 0 check (progress >= 0 and progress <= 100),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists milestones (
  id uuid primary key default uuid_generate_v4(),
  goal_id uuid references goals(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  title text not null,
  is_done boolean default false,
  due_date date,
  created_at timestamptz default now()
);

-- ============================================================
-- HABITS
-- Daily habits with streak tracking
-- ============================================================
create table if not exists habits (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade not null,
  title text not null,
  description text,
  icon text default '⚡',
  frequency text default 'daily' check (frequency in ('daily','weekdays','weekends','custom')),
  custom_days integer[],
  color text default '#C8B89A',
  current_streak integer default 0,
  longest_streak integer default 0,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists habit_logs (
  id uuid primary key default uuid_generate_v4(),
  habit_id uuid references habits(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  logged_date date not null default current_date,
  note text,
  created_at timestamptz default now(),
  unique(habit_id, logged_date)
);

-- ============================================================
-- NETWORKING / CONTACTS CRM
-- People you meet, relationships you're building
-- ============================================================
create table if not exists contacts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade not null,
  full_name text not null,
  role text,
  company text,
  email text,
  phone text,
  linkedin_url text,
  twitter_url text,
  tags text[],
  notes text,
  met_at text,
  relationship_strength integer default 3 check (relationship_strength >= 1 and relationship_strength <= 5),
  last_contacted date,
  next_followup date,
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists contact_interactions (
  id uuid primary key default uuid_generate_v4(),
  contact_id uuid references contacts(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  interaction_type text check (interaction_type in ('call','message','meeting','email','coffee','event','other')),
  summary text,
  interaction_date date default current_date,
  created_at timestamptz default now()
);

-- ============================================================
-- PROJECTS
-- Startups, side projects, academic work
-- ============================================================
create table if not exists projects (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade not null,
  title text not null,
  description text,
  type text check (type in ('startup','side_project','academic','freelance','other')),
  status text default 'active' check (status in ('idea','active','launched','paused','archived')),
  tech_stack text[],
  url text,
  repo_url text,
  cover_color text default '#1A1A1A',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists tasks (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid references projects(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade not null,
  title text not null,
  description text,
  status text default 'todo' check (status in ('todo','in_progress','done','blocked')),
  priority text default 'medium' check (priority in ('low','medium','high','urgent')),
  due_date date,
  is_standalone boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- KNOWLEDGE / NOTES
-- Notes, learnings, bookmarks, resources
-- ============================================================
create table if not exists notes (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade not null,
  title text not null,
  content text,
  category text check (category in ('learning','idea','resource','book','article','other')),
  tags text[],
  source_url text,
  is_pinned boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- JOURNAL
-- Daily entries with mood tracking
-- ============================================================
create table if not exists journal_entries (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade not null,
  entry_date date not null default current_date,
  content text not null,
  mood integer check (mood >= 1 and mood <= 5),
  mood_label text check (mood_label in ('rough','low','okay','good','great')),
  gratitude text[],
  wins text[],
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, entry_date)
);

-- ============================================================
-- ROW LEVEL SECURITY — enable for all tables
-- ============================================================
alter table profiles enable row level security;
alter table goals enable row level security;
alter table milestones enable row level security;
alter table habits enable row level security;
alter table habit_logs enable row level security;
alter table contacts enable row level security;
alter table contact_interactions enable row level security;
alter table projects enable row level security;
alter table tasks enable row level security;
alter table notes enable row level security;
alter table journal_entries enable row level security;

-- ============================================================
-- RLS POLICIES — users can only access their own data
-- ============================================================

-- profiles
create policy "Users can view own profile" on profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on profiles for insert with check (auth.uid() = id);

-- goals
create policy "Own goals only" on goals for all using (auth.uid() = user_id);

-- milestones
create policy "Own milestones only" on milestones for all using (auth.uid() = user_id);

-- habits
create policy "Own habits only" on habits for all using (auth.uid() = user_id);

-- habit_logs
create policy "Own habit logs only" on habit_logs for all using (auth.uid() = user_id);

-- contacts
create policy "Own contacts only" on contacts for all using (auth.uid() = user_id);

-- contact_interactions
create policy "Own interactions only" on contact_interactions for all using (auth.uid() = user_id);

-- projects
create policy "Own projects only" on projects for all using (auth.uid() = user_id);

-- tasks
create policy "Own tasks only" on tasks for all using (auth.uid() = user_id);

-- notes
create policy "Own notes only" on notes for all using (auth.uid() = user_id);

-- journal_entries
create policy "Own journal entries only" on journal_entries for all using (auth.uid() = user_id);

-- ============================================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- Trigger fires whenever a new user is added to auth.users
-- ============================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- UPDATED_AT AUTO-UPDATER
-- ============================================================
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_profiles_updated before update on profiles for each row execute procedure update_updated_at();
create trigger trg_goals_updated before update on goals for each row execute procedure update_updated_at();
create trigger trg_habits_updated before update on habits for each row execute procedure update_updated_at();
create trigger trg_contacts_updated before update on contacts for each row execute procedure update_updated_at();
create trigger trg_projects_updated before update on projects for each row execute procedure update_updated_at();
create trigger trg_tasks_updated before update on tasks for each row execute procedure update_updated_at();
create trigger trg_notes_updated before update on notes for each row execute procedure update_updated_at();
create trigger trg_journal_updated before update on journal_entries for each row execute procedure update_updated_at();
