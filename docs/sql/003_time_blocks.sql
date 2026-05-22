-- ============================================================
-- TUFF — Migration 003
-- Session: 014 | File: 003_time_blocks.sql
-- ============================================================

-- Create time_blocks table
create table if not exists time_blocks (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade not null,
  block_date date not null default current_date,
  start_hour integer not null check (start_hour >= 5 and start_hour <= 23),
  end_hour integer not null check (end_hour >= 6 and end_hour <= 24),
  label text not null,
  category text not null check (category in ('deep_work', 'shallow_work', 'meeting', 'health', 'learning', 'personal', 'buffer')),
  is_done boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  check (end_hour > start_hour)
);

-- Enable RLS
alter table time_blocks enable row level security;

-- RLS Policies
create policy "Own time blocks only" on time_blocks for all using (auth.uid() = user_id);

-- Auto-update updated_at trigger
create trigger trg_time_blocks_updated before update on time_blocks for each row execute procedure update_updated_at();
