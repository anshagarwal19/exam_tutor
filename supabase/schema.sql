-- Run in the Supabase SQL editor. The API uses the service role key server-side.
create table if not exists public.learner_profiles (
  user_id uuid primary key,
  display_name text not null,
  board text not null,
  class_code text not null,
  exam_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.learner_profiles
  add column if not exists minutes_per_day integer not null default 30,
  add column if not exists diagnostic_length integer not null default 5;

create table if not exists public.attempts (
  id bigint generated always as identity primary key,
  user_id uuid not null,
  question_id text not null,
  concept_id text not null,
  chosen integer not null check (chosen >= 0),
  correct boolean not null,
  confidence real check (confidence between 0 and 1),
  reasoning text not null default '',
  misconception text,
  created_at timestamptz not null default now()
);

create table if not exists public.mastery (
  user_id uuid not null,
  concept_id text not null,
  p_known real not null check (p_known between 0 and 1),
  next_review timestamptz,
  updated_at timestamptz not null default now(),
  primary key (user_id, concept_id)
);

create table if not exists public.mock_test_reports (
  user_id uuid not null,
  report_id text not null,
  report_data jsonb not null,
  created_at timestamptz not null default now(),
  primary key (user_id, report_id)
);

create index if not exists learner_profiles_class_idx on public.learner_profiles (class_code);
create index if not exists attempts_user_idx on public.attempts (user_id, created_at desc);
create index if not exists attempts_concept_misconception_idx
  on public.attempts (concept_id, misconception)
  where misconception is not null;
create index if not exists mastery_review_idx on public.mastery (user_id, next_review);

alter table public.attempts enable row level security;
alter table public.mastery enable row level security;
alter table public.learner_profiles enable row level security;
alter table public.mock_test_reports enable row level security;
revoke all on public.learner_profiles, public.attempts, public.mastery from anon, authenticated;
revoke all on public.mock_test_reports from anon, authenticated;
grant select, insert, update on public.learner_profiles to service_role;
grant select, insert, update on public.attempts, public.mastery to service_role;
grant select, insert, update on public.mock_test_reports to service_role;
grant usage, select on sequence public.attempts_id_seq to service_role;

create or replace function public.record_answer(
  p_user_id uuid,
  p_question_id text,
  p_concept_id text,
  p_chosen integer,
  p_correct boolean,
  p_confidence real,
  p_reasoning text,
  p_misconception text,
  p_initial_mastery real,
  p_transition real,
  p_guess real,
  p_slip real
)
returns table (new_p real, next_review timestamptz)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  prior_mastery real;
  posterior real;
  updated_mastery real;
  review_days integer;
  review_at timestamptz;
  evidence_weight real;
  known_likelihood real;
  unknown_likelihood real;
begin
  insert into public.mastery (user_id, concept_id, p_known)
  values (p_user_id, p_concept_id, p_initial_mastery)
  on conflict (user_id, concept_id) do nothing;

  select p_known into prior_mastery
  from public.mastery
  where user_id = p_user_id and concept_id = p_concept_id
  for update;

  evidence_weight := 0.5 + coalesce(p_confidence, 0.5);
  known_likelihood := case when p_correct then 1 - p_slip else p_slip end;
  unknown_likelihood := case when p_correct then p_guess else 1 - p_guess end;
  posterior := (prior_mastery * power(known_likelihood, evidence_weight))
    / (prior_mastery * power(known_likelihood, evidence_weight)
      + (1 - prior_mastery) * power(unknown_likelihood, evidence_weight));

  updated_mastery := posterior + (1 - posterior) * p_transition;
  review_days := case
    when updated_mastery >= 0.9 then 14
    when updated_mastery >= 0.75 then 7
    when updated_mastery >= 0.5 then 3
    else 1
  end;
  review_at := now() + make_interval(days => review_days);

  update public.mastery
  set p_known = updated_mastery, next_review = review_at, updated_at = now()
  where user_id = p_user_id and concept_id = p_concept_id;

  insert into public.attempts (
    user_id, question_id, concept_id, chosen, correct, confidence, reasoning, misconception
  ) values (
    p_user_id, p_question_id, p_concept_id, p_chosen, p_correct, p_confidence, p_reasoning, p_misconception
  );

  return query select updated_mastery, review_at;
end;
$$;

revoke all on function public.record_answer(uuid, text, text, integer, boolean, real, text, text, real, real, real, real)
  from public, anon, authenticated;
grant execute on function public.record_answer(uuid, text, text, integer, boolean, real, text, text, real, real, real, real)
  to service_role;

drop view if exists public.teacher_misconception_patterns;
drop view if exists public.teacher_concept_gaps;
drop view if exists public.teacher_dashboard_summary;

create view public.teacher_concept_gaps as
select
  learner_profiles.class_code,
  concept_id,
  count(*)::integer as learner_count,
  avg(p_known)::real as average_mastery,
  count(*) filter (where p_known < 0.55)::integer as weak_learner_count,
  count(*) filter (where next_review <= now())::integer as due_for_review_count
from public.mastery
join public.learner_profiles using (user_id)
group by learner_profiles.class_code, concept_id;

create view public.teacher_misconception_patterns as
select learner_profiles.class_code, concept_id, misconception, count(*)::integer as occurrences
from public.attempts
join public.learner_profiles using (user_id)
where misconception is not null
group by learner_profiles.class_code, concept_id, misconception;

create view public.teacher_dashboard_summary as
select
  learner_profiles.class_code,
  count(distinct learner_profiles.user_id)::integer as learner_count,
  count(distinct attempts.id)::integer as attempts_count,
  count(distinct mastery.concept_id)::integer as concepts_with_data
from public.learner_profiles
left join public.attempts using (user_id)
left join public.mastery using (user_id)
group by learner_profiles.class_code;

grant select on public.teacher_concept_gaps, public.teacher_misconception_patterns, public.teacher_dashboard_summary
  to service_role;
