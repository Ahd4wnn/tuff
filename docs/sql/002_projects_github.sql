-- ============================================================
-- TUFF — Migration 002
-- Session: 010 | File: 002_projects_github.sql
-- ============================================================

-- Add github_username to profiles
alter table profiles add column if not exists github_username text;

-- Add weekly_goal and week_start to projects
alter table projects add column if not exists weekly_goal text;
alter table projects add column if not exists week_start date;
alter table projects add column if not exists week_end date;
alter table projects add column if not exists weekly_goal_done boolean default false;
