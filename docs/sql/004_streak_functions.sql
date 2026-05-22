-- ============================================================
-- TUFF — Migration 004
-- Session: Streak Fix | File: 004_streak_functions.sql
-- ============================================================

-- Function: calculate current streak for a habit
-- Counts backwards from today through consecutive logged dates
create or replace function calculate_streak(p_habit_id uuid, p_user_id uuid)
returns integer as $$
declare
  streak integer := 0;
  check_date date := current_date;
  log_exists boolean;
begin
  loop
    select exists (
      select 1 from habit_logs
      where habit_id = p_habit_id
        and user_id = p_user_id
        and logged_date = check_date
    ) into log_exists;

    if log_exists then
      streak := streak + 1;
      check_date := check_date - interval '1 day';
    else
      exit;
    end if;

    -- Safety cap at 3650 days (10 years)
    if streak >= 3650 then exit; end if;
  end loop;

  return streak;
end;
$$ language plpgsql security definer;

-- Function: update streak on a habit after any log change
create or replace function refresh_habit_streak(p_habit_id uuid, p_user_id uuid)
returns void as $$
declare
  new_streak integer;
  new_longest integer;
begin
  new_streak := calculate_streak(p_habit_id, p_user_id);

  select longest_streak into new_longest
  from habits where id = p_habit_id;

  update habits set
    current_streak = new_streak,
    longest_streak = greatest(coalesce(new_longest, 0), new_streak),
    updated_at = now()
  where id = p_habit_id and user_id = p_user_id;
end;
$$ language plpgsql security definer;

-- Trigger function: fires after any insert or delete on habit_logs
create or replace function habit_log_changed()
returns trigger as $$
declare
  affected_habit_id uuid;
  affected_user_id uuid;
begin
  if TG_OP = 'DELETE' then
    affected_habit_id := OLD.habit_id;
    affected_user_id := OLD.user_id;
  else
    affected_habit_id := NEW.habit_id;
    affected_user_id := NEW.user_id;
  end if;

  perform refresh_habit_streak(affected_habit_id, affected_user_id);
  return null;
end;
$$ language plpgsql security definer;

-- Attach trigger to habit_logs
drop trigger if exists on_habit_log_changed on habit_logs;
create trigger on_habit_log_changed
  after insert or delete on habit_logs
  for each row execute procedure habit_log_changed();

-- Backfill: recalculate streaks for all existing habits right now
do $$
declare
  h record;
begin
  for h in select id, user_id from habits loop
    perform refresh_habit_streak(h.id, h.user_id);
  end loop;
end;
$$;
