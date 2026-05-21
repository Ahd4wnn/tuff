# Tuff — SQL Migration Log

This folder stores all SQL schema files used during the build of Tuff.
Each file maps to one build session. Run them in order in Supabase SQL Editor.

| File | Session | Description |
|------|---------|-------------|
| 001_initial_schema.sql | Session 002 | All core tables: profiles, goals, milestones, habits, habit_logs, contacts, contact_interactions, projects, tasks, notes, journal_entries. RLS policies, auto-profile trigger, updated_at triggers. |
| 002_projects_github.sql | Session 010 | Adds github_username to profiles, weekly_goal fields to projects |


## How to run
1. Go to your Supabase project dashboard
2. Click **SQL Editor** in the left sidebar
3. Click **New Query**
4. Paste the contents of the file
5. Click **Run**
