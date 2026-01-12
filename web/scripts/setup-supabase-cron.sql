-- ============================================
-- Supabase pg_cron Setup for Scheduled Drops
-- ============================================
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor)
--
-- This sets up automatic publishing of scheduled drops every minute.
-- Works on free tier with no limits.
-- ============================================

-- Step 1: Enable pg_cron extension (if not already enabled)
-- Note: You may need to enable this via Dashboard → Database → Extensions first
create extension if not exists pg_cron;

-- Step 2: Create a function to publish scheduled drops
create or replace function publish_scheduled_drops()
returns jsonb
language plpgsql
security definer
as $$
declare
  posts_published int;
  albums_published int;
  result jsonb;
begin
  -- Publish scheduled posts that are due
  with updated_posts as (
    update posts
    set
      status = 'published',
      dropped_at = now(),
      updated_at = now()
    where
      status = 'scheduled'
      and scheduled_for <= now()
    returning id
  )
  select count(*) into posts_published from updated_posts;

  -- Publish scheduled albums that are due
  with updated_albums as (
    update albums
    set
      status = 'published',
      dropped_at = now(),
      updated_at = now()
    where
      status = 'scheduled'
      and scheduled_for <= now()
    returning id
  )
  select count(*) into albums_published from updated_albums;

  -- Build result
  result := jsonb_build_object(
    'posts_published', posts_published,
    'albums_published', albums_published,
    'executed_at', now()
  );

  -- Log if anything was published (optional, helps with debugging)
  if posts_published > 0 or albums_published > 0 then
    raise notice 'Published % posts and % albums', posts_published, albums_published;
  end if;

  return result;
end;
$$;

-- Step 3: Schedule the cron job to run every minute
-- First, remove any existing job with the same name (safe to run multiple times)
select cron.unschedule('publish-scheduled-drops')
where exists (
  select 1 from cron.job where jobname = 'publish-scheduled-drops'
);

-- Schedule the job
select cron.schedule(
  'publish-scheduled-drops',  -- job name
  '* * * * *',                -- every minute
  'select publish_scheduled_drops()'
);

-- ============================================
-- Verification & Management Commands
-- ============================================

-- View all scheduled cron jobs:
-- select * from cron.job;

-- View recent job runs (last 20):
-- select * from cron.job_run_details order by start_time desc limit 20;

-- Manually test the function:
-- select publish_scheduled_drops();

-- Check pending scheduled drops:
-- select id, status, scheduled_for from posts where status = 'scheduled' order by scheduled_for;
-- select id, status, scheduled_for from albums where status = 'scheduled' order by scheduled_for;

-- Disable the job temporarily:
-- select cron.unschedule('publish-scheduled-drops');

-- Re-enable (run the schedule command above again)

-- ============================================
-- Notes
-- ============================================
--
-- 1. This runs entirely in PostgreSQL - no HTTP calls, no pg_net limits
-- 2. The function is idempotent - safe to run multiple times
-- 3. Job runs every minute on the minute
-- 4. Check cron.job_run_details to verify it's running
-- 5. Timezone: Cron runs in UTC by default
--
-- For future enhancements (notifications, webhooks), you can:
-- - Add Supabase Edge Functions triggered by database changes
-- - Or upgrade to paid Supabase and call HTTP endpoints from pg_cron
