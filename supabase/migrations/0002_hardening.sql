-- Idempotent follow-up for projects that already applied 0001.

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

grant insert (
  id, contest_id, participant_id, title, description,
  primary_file_path, supporting_file_path, prototype_url
) on public.submissions to authenticated;

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

grant select on public.gallery_entries to anon, authenticated;
