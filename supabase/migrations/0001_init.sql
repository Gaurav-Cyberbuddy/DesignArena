-- DesignArena schema, constraints, RLS, storage, and seed contests.
-- Apply with: supabase db push   OR   paste into the SQL editor.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
do $$ begin
  create type public.contest_status as enum (
    'draft',
    'submissions_open',
    'review',
    'voting_open',
    'completed'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.submission_status as enum (
    'pending_review',
    'approved',
    'rejected'
  );
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------
create table if not exists public.contests (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text not null default '',
  guidelines text not null default '',
  cover_image_url text,
  code_prefix text not null unique,
  submission_start timestamptz not null,
  submission_end timestamptz not null,
  voting_start timestamptz not null,
  voting_end timestamptz not null,
  status public.contest_status not null default 'draft',
  allow_vote_changes boolean not null default false,
  results_published boolean not null default false,
  show_runners_up boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint contests_submission_window check (submission_end > submission_start),
  constraint contests_voting_window check (voting_end > voting_start),
  constraint contests_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint contests_prefix_format check (code_prefix ~ '^C[0-9]+$')
);

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now()
);

create table if not exists public.contest_entry_counters (
  contest_id uuid primary key references public.contests (id) on delete cascade,
  last_number integer not null default 0 check (last_number >= 0)
);

create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  entry_code text not null unique,
  contest_id uuid not null references public.contests (id) on delete restrict,
  participant_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  description text not null default '',
  primary_file_path text not null,
  supporting_file_path text,
  prototype_url text,
  status public.submission_status not null default 'pending_review',
  rejection_reason text,
  reviewed_by uuid references public.profiles (id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint submissions_title_len check (char_length(title) between 1 and 120),
  constraint submissions_desc_len check (char_length(description) <= 2000),
  constraint submissions_id_contest unique (id, contest_id)
);

create table if not exists public.votes (
  id uuid primary key default gen_random_uuid(),
  contest_id uuid not null references public.contests (id) on delete restrict,
  submission_id uuid not null,
  voter_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint votes_one_per_contest unique (contest_id, voter_id),
  constraint votes_submission_matches_contest
    foreign key (submission_id, contest_id)
    references public.submissions (id, contest_id)
    on delete restrict
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles (id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Public-safe projection. Does not include participant identity or moderation notes.
create or replace view public.gallery_entries
with (security_invoker = true) as
select
  s.id,
  s.entry_code,
  s.contest_id,
  s.title,
  s.description,
  s.primary_file_path,
  s.prototype_url,
  (s.supporting_file_path is not null) as has_supporting_file,
  s.created_at
from public.submissions s
where s.status = 'approved';

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------
create index if not exists submissions_contest_id_idx on public.submissions (contest_id);
create index if not exists submissions_participant_id_idx on public.submissions (participant_id);
create index if not exists submissions_status_idx on public.submissions (status);
create index if not exists submissions_entry_code_idx on public.submissions (entry_code);
create index if not exists submissions_contest_status_idx on public.submissions (contest_id, status);
create index if not exists votes_contest_id_idx on public.votes (contest_id);
create index if not exists votes_submission_id_idx on public.votes (submission_id);
create index if not exists votes_voter_id_idx on public.votes (voter_id);
create index if not exists votes_contest_submission_idx on public.votes (contest_id, submission_id);
create index if not exists contests_status_idx on public.contests (status);
create index if not exists audit_logs_created_at_idx on public.audit_logs (created_at desc);

-- ---------------------------------------------------------------------------
-- Timestamp helper
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists contests_set_updated_at on public.contests;
create trigger contests_set_updated_at
before update on public.contests
for each row execute function public.set_updated_at();

drop trigger if exists submissions_set_updated_at on public.submissions;
create trigger submissions_set_updated_at
before update on public.submissions
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Profiles from auth.users
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Atomic entry codes (C1-001). Row lock on the counter prevents collisions.
-- ---------------------------------------------------------------------------
create or replace function public.assign_entry_code()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  prefix text;
  n integer;
begin
  if new.entry_code is not null and new.entry_code <> '' then
    return new;
  end if;

  select code_prefix into prefix
  from public.contests
  where id = new.contest_id
  for share;

  if prefix is null then
    raise exception 'Unknown contest';
  end if;

  insert into public.contest_entry_counters (contest_id, last_number)
  values (new.contest_id, 1)
  on conflict (contest_id) do update
    set last_number = public.contest_entry_counters.last_number + 1
  returning last_number into n;

  new.entry_code := prefix || '-' || lpad(n::text, 3, '0');
  return new;
end;
$$;

drop trigger if exists submissions_assign_entry_code on public.submissions;
create trigger submissions_assign_entry_code
before insert on public.submissions
for each row execute function public.assign_entry_code();

-- ---------------------------------------------------------------------------
-- Voting: atomic, authenticated, eligibility-checked.
-- Privileged: uses auth.uid(); never accept a client-supplied voter id.
-- ---------------------------------------------------------------------------
create or replace function public.cast_vote(p_contest_id uuid, p_submission_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  contest_row public.contests%rowtype;
  submission_row public.submissions%rowtype;
  existing_id uuid;
  new_id uuid;
begin
  if uid is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  insert into public.profiles (id)
  values (uid)
  on conflict (id) do nothing;

  select * into contest_row from public.contests where id = p_contest_id;
  if not found then
    raise exception 'Contest not found';
  end if;

  if contest_row.status <> 'voting_open' then
    raise exception 'Voting is not open for this contest';
  end if;

  if now() < contest_row.voting_start or now() > contest_row.voting_end then
    raise exception 'Voting deadline has passed or voting has not started';
  end if;

  select * into submission_row
  from public.submissions
  where id = p_submission_id;

  if not found then
    raise exception 'Entry not found';
  end if;

  if submission_row.contest_id <> p_contest_id then
    raise exception 'Entry does not belong to this contest';
  end if;

  if submission_row.status <> 'approved' then
    raise exception 'Only approved entries can receive votes';
  end if;

  if submission_row.participant_id = uid then
    raise exception 'You cannot vote for your own entry';
  end if;

  select id into existing_id
  from public.votes
  where contest_id = p_contest_id and voter_id = uid;

  if existing_id is not null then
    if not contest_row.allow_vote_changes then
      raise exception 'You have already voted in this contest';
    end if;
    update public.votes
    set submission_id = p_submission_id
    where id = existing_id;
    return existing_id;
  end if;

  insert into public.votes (contest_id, submission_id, voter_id)
  values (p_contest_id, p_submission_id, uid)
  returning id into new_id;

  return new_id;
exception
  when unique_violation then
    raise exception 'You have already voted in this contest';
end;
$$;

revoke all on function public.cast_vote(uuid, uuid) from public;
grant execute on function public.cast_vote(uuid, uuid) to authenticated;

create or replace function public.cast_ballot(p_choices jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  choice jsonb;
  ids uuid[] := '{}';
  contest_ids uuid[] := '{}';
  vote_id uuid;
  results jsonb := '[]'::jsonb;
begin
  if auth.uid() is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  if jsonb_typeof(p_choices) <> 'array' or jsonb_array_length(p_choices) < 1 or jsonb_array_length(p_choices) > 3 then
    raise exception 'Select between one and three contests';
  end if;

  for choice in select * from jsonb_array_elements(p_choices)
  loop
    if (choice ->> 'contest_id')::uuid = any (contest_ids) then
      raise exception 'Only one vote is allowed per contest';
    end if;
    contest_ids := array_append(contest_ids, (choice ->> 'contest_id')::uuid);
    vote_id := public.cast_vote((choice ->> 'contest_id')::uuid, (choice ->> 'submission_id')::uuid);
    ids := array_append(ids, vote_id);
    results := results || jsonb_build_array(jsonb_build_object(
      'contest_id', choice ->> 'contest_id',
      'submission_id', choice ->> 'submission_id',
      'vote_id', vote_id
    ));
  end loop;

  return results;
end;
$$;

revoke all on function public.cast_ballot(jsonb) from public;
grant execute on function public.cast_ballot(jsonb) to authenticated;

-- Vote totals are hidden until the organizer publishes results.
create or replace function public.published_vote_totals(p_contest_id uuid)
returns table (submission_id uuid, vote_count bigint)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  published boolean;
begin
  select results_published into published
  from public.contests
  where id = p_contest_id;

  if published is distinct from true then
    return;
  end if;

  return query
  select v.submission_id, count(*)::bigint
  from public.votes v
  where v.contest_id = p_contest_id
  group by v.submission_id;
end;
$$;

revoke all on function public.published_vote_totals(uuid) from public;
grant execute on function public.published_vote_totals(uuid) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- Admin writes are performed with the service-role key on the server after
-- verifying ADMIN_EMAILS. Authenticated clients cannot self-promote.
-- ---------------------------------------------------------------------------
alter table public.contests enable row level security;
alter table public.profiles enable row level security;
alter table public.submissions enable row level security;
alter table public.votes enable row level security;
alter table public.audit_logs enable row level security;
alter table public.contest_entry_counters enable row level security;

-- Contests: anyone may read non-draft contests. No client writes.
drop policy if exists contests_public_read on public.contests;
create policy contests_public_read on public.contests
for select
to anon, authenticated
using (status <> 'draft');

-- Profiles: users read/update only themselves. No inserts from clients
-- (created by the auth trigger / security definer functions).
drop policy if exists profiles_self_read on public.profiles;
create policy profiles_self_read on public.profiles
for select
to authenticated
using (id = auth.uid());

drop policy if exists profiles_self_update on public.profiles;
create policy profiles_self_update on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

-- Submissions
drop policy if exists submissions_owner_read on public.submissions;
create policy submissions_owner_read on public.submissions
for select
to authenticated
using (participant_id = auth.uid());

drop policy if exists submissions_public_approved_read on public.submissions;
create policy submissions_public_approved_read on public.submissions
for select
to anon, authenticated
using (status = 'approved');

drop policy if exists submissions_owner_insert on public.submissions;
create policy submissions_owner_insert on public.submissions
for insert
to authenticated
with check (
  participant_id = auth.uid()
  and status = 'pending_review'
  and exists (
    select 1 from public.contests c
    where c.id = contest_id
      and c.status = 'submissions_open'
      and now() between c.submission_start and c.submission_end
  )
);

drop policy if exists submissions_owner_update on public.submissions;
create policy submissions_owner_update on public.submissions
for update
to authenticated
using (
  participant_id = auth.uid()
  and exists (
    select 1 from public.contests c
    where c.id = contest_id
      and c.status = 'submissions_open'
      and now() between c.submission_start and c.submission_end
  )
)
with check (
  participant_id = auth.uid()
  and status = 'pending_review'
);

-- Votes: participants may read only their own ballots. Inserts go through
-- cast_vote() (security definer) which still obeys the unique constraint.
drop policy if exists votes_self_read on public.votes;
create policy votes_self_read on public.votes
for select
to authenticated
using (voter_id = auth.uid());

drop policy if exists votes_self_insert on public.votes;
create policy votes_self_insert on public.votes
for insert
to authenticated
with check (
  voter_id = auth.uid()
  and exists (
    select 1 from public.contests c
    where c.id = contest_id
      and c.status = 'voting_open'
      and now() between c.voting_start and c.voting_end
  )
  and exists (
    select 1 from public.submissions s
    where s.id = submission_id
      and s.contest_id = contest_id
      and s.status = 'approved'
      and s.participant_id <> auth.uid()
  )
);

-- No client updates/deletes on votes, contests, audit logs, or counters.
drop policy if exists audit_logs_no_client on public.audit_logs;
create policy audit_logs_no_client on public.audit_logs
for select
to authenticated
using (false);

-- ---------------------------------------------------------------------------
-- Grants. Column privileges keep moderation fields off public queries.
-- Service role bypasses RLS and GRANT restrictions for admin work.
-- ---------------------------------------------------------------------------
revoke all on public.contests from anon, authenticated;
grant select on public.contests to anon, authenticated;

revoke all on public.gallery_entries from anon, authenticated;
grant select on public.gallery_entries to anon, authenticated;

revoke all on public.submissions from anon, authenticated;
-- Public and peer queries never receive participant_id, supporting paths, or rejection notes.
grant select (
  id, entry_code, contest_id, title, description,
  primary_file_path, prototype_url, status, created_at, updated_at
) on public.submissions to anon, authenticated;

grant insert (
  id, contest_id, participant_id, title, description,
  primary_file_path, supporting_file_path, prototype_url
) on public.submissions to authenticated;

grant update (
  title, description, primary_file_path, supporting_file_path, prototype_url, status
) on public.submissions to authenticated;

-- Owners read private fields through this function only.
create or replace function public.my_submissions()
returns table (
  id uuid,
  entry_code text,
  contest_id uuid,
  title text,
  description text,
  primary_file_path text,
  supporting_file_path text,
  prototype_url text,
  status public.submission_status,
  rejection_reason text,
  created_at timestamptz,
  updated_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    s.id, s.entry_code, s.contest_id, s.title, s.description,
    s.primary_file_path, s.supporting_file_path, s.prototype_url,
    s.status, s.rejection_reason, s.created_at, s.updated_at
  from public.submissions s
  where s.participant_id = auth.uid();
$$;

revoke all on function public.my_submissions() from public;
grant execute on function public.my_submissions() to authenticated;

revoke all on public.votes from anon, authenticated;
grant select (id, contest_id, submission_id, created_at) on public.votes to authenticated;
grant insert (contest_id, submission_id, voter_id) on public.votes to authenticated;

revoke all on public.profiles from anon, authenticated;
grant select, update (display_name) on public.profiles to authenticated;

revoke all on public.audit_logs from anon, authenticated;
revoke all on public.contest_entry_counters from anon, authenticated;

-- ---------------------------------------------------------------------------
-- Storage: private bucket. File bytes are served by Next.js after authz.
-- Direct public object URLs are not granted.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('design-files', 'design-files', false)
on conflict (id) do update set public = false;

drop policy if exists design_files_no_public_read on storage.objects;
create policy design_files_no_public_read on storage.objects
for select
to anon, authenticated
using (bucket_id = 'design-files' and false);

drop policy if exists design_files_no_public_write on storage.objects;
create policy design_files_no_public_write on storage.objects
for insert
to anon, authenticated
with check (bucket_id = 'design-files' and false);

-- ---------------------------------------------------------------------------
-- Seed exactly three contests if they do not exist.
-- ---------------------------------------------------------------------------
insert into public.contests (
  name, slug, description, guidelines, cover_image_url, code_prefix,
  submission_start, submission_end, voting_start, voting_end, status
)
select
  v.name, v.slug, v.description, v.guidelines, v.cover, v.prefix,
  now() - interval '1 day',
  now() + interval '21 days',
  now() + interval '21 days',
  now() + interval '35 days',
  'submissions_open'::public.contest_status
from (
  values
    (
      'Contest 1',
      'contest-1',
      'A flagship brief for original visual identity work. Interpret the prompt with craft, restraint, and a clear point of view.',
      'Submit one primary image (poster, identity system, or key visual). Optional supporting PDF up to 8 pages. Prototype links must be viewable without a password.',
      '/covers/contest-1.svg',
      'C1'
    ),
    (
      'Contest 2',
      'contest-2',
      'Editorial and digital layout: sequence, typography, and hierarchy. Show how the design behaves as a system, not a single frame.',
      'Primary file should be a representative spread or screen. Supporting PDF may include additional screens or process notes.',
      '/covers/contest-2.svg',
      'C2'
    ),
    (
      'Contest 3',
      'contest-3',
      'Experience and interaction: a product, campaign site, or spatial graphic system that people can actually use.',
      'Primary image should communicate the experience at a glance. Include a Figma, Behance, or similar prototype URL when possible.',
      '/covers/contest-3.svg',
      'C3'
    )
) as v(name, slug, description, guidelines, cover, prefix)
where not exists (select 1 from public.contests c where c.slug = v.slug);
