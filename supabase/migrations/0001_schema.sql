-- ============================================================================
-- PaperRaj — 0001_schema.sql
-- Complete relational schema for Supabase PostgreSQL.
-- Run in Supabase Studio → SQL Editor → New query → paste → Run.
-- (This file is also what `npx drizzle-kit push` produces from src/db/schema.ts.)
-- ============================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------- people ---
create table if not exists public.profiles (
  id            uuid primary key default gen_random_uuid(),
  auth_user_id  text,                                  -- auth.users.id when Supabase Auth is used
  email         text not null,
  password_hash text,                                  -- only used by the built-in local auth provider
  full_name     text,
  school        text,
  contact       text,
  role          text not null default 'user' check (role in ('user','admin')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create unique index if not exists profiles_email_key on public.profiles (email);
create unique index if not exists profiles_auth_user_id_key on public.profiles (auth_user_id);
create index if not exists profiles_role_idx on public.profiles (role);

create table if not exists public.sessions (
  token      text primary key,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index if not exists sessions_user_id_idx on public.sessions (user_id);

create table if not exists public.password_resets (
  token      text primary key,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  expires_at timestamptz not null,
  used_at    timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists password_resets_user_id_idx on public.password_resets (user_id);

-- --------------------------------------------------------------- papers ---
create table if not exists public.papers (
  id               uuid primary key default gen_random_uuid(),
  file_name        text not null,
  owner_id         uuid references public.profiles(id) on delete set null,
  uploader_name    text not null,
  class_level      text,
  board            text,
  subject          text,
  exam             text,
  year             integer check (year is null or (year between 1900 and 2200)),
  school           text,
  paper_type       text,
  description      text,
  file_size        bigint not null,
  file_ext         text not null,
  mime_type        text not null,
  storage_bucket   text not null,
  storage_path     text not null,
  status           text not null default 'PENDING' check (status in ('PENDING','APPROVED')),
  download_count   integer not null default 0,
  like_count       integer not null default 0,
  dislike_count    integer not null default 0,
  comment_count    integer not null default 0,
  open_report_count integer not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  -- Duplicate filenames are rejected at the database level, case-insensitively.
  constraint papers_file_name_unique unique (file_name),
  constraint papers_file_ext_allowed check (file_ext in ('pdf','jpg','jpeg','png','webp')),
  constraint papers_file_size_positive check (file_size > 0)
);

create index if not exists papers_owner_id_idx        on public.papers (owner_id);
create index if not exists papers_status_idx          on public.papers (status);
create index if not exists papers_created_at_idx      on public.papers (created_at desc);
create index if not exists papers_subject_idx         on public.papers (subject);
create index if not exists papers_class_idx           on public.papers (class_level);
create index if not exists papers_board_idx           on public.papers (board);
create index if not exists papers_exam_idx            on public.papers (exam);
create index if not exists papers_year_idx            on public.papers (year);
create index if not exists papers_paper_type_idx      on public.papers (paper_type);
create index if not exists papers_download_count_idx  on public.papers (download_count desc);

-- Local storage fallback: only used when SUPABASE_SERVICE_ROLE_KEY is absent
-- (local development / CI). Supabase Storage is used in production.
create table if not exists public.file_blobs (
  id       uuid primary key default gen_random_uuid(),
  paper_id uuid not null references public.papers(id) on delete cascade,
  data     bytea not null
);
create unique index if not exists file_blobs_paper_id_key on public.file_blobs (paper_id);

-- ----------------------------------------------------------- engagement ---
create table if not exists public.comments (
  id          uuid primary key default gen_random_uuid(),
  paper_id    uuid not null references public.papers(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  author_name text not null,
  body        text not null check (char_length(btrim(body)) > 0),
  created_at  timestamptz not null default now()
);
create index if not exists comments_paper_id_idx   on public.comments (paper_id);
create index if not exists comments_user_id_idx    on public.comments (user_id);
create index if not exists comments_created_at_idx on public.comments (created_at desc);

-- One current vote per user per paper.
create table if not exists public.votes (
  id         uuid primary key default gen_random_uuid(),
  paper_id   uuid not null references public.papers(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  value      smallint not null check (value in (1,-1)),
  created_at timestamptz not null default now(),
  constraint votes_paper_user_unique unique (paper_id, user_id)
);
create index if not exists votes_paper_id_idx on public.votes (paper_id);

create table if not exists public.reports (
  id            uuid primary key default gen_random_uuid(),
  paper_id      uuid not null references public.papers(id) on delete cascade,
  reporter_id   uuid references public.profiles(id) on delete set null,
  reporter_name text,
  reason        text not null,
  details       text,
  status        text not null default 'OPEN' check (status in ('OPEN','RESOLVED')),
  created_at    timestamptz not null default now()
);
create index if not exists reports_paper_id_idx on public.reports (paper_id);
create index if not exists reports_status_idx   on public.reports (status);

-- -------------------------------------------------------- platform data ---
create table if not exists public.settings (
  key        text primary key,
  value      text not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.teachers (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  subject    text,
  school     text,
  contact    text,
  notes      text,
  created_at timestamptz not null default now()
);
create index if not exists teachers_subject_idx on public.teachers (subject);

create table if not exists public.audit_logs (
  id          uuid primary key default gen_random_uuid(),
  actor_id    uuid references public.profiles(id) on delete set null,
  action      text not null,
  target_type text,
  target_id   text,
  details     text,
  created_at  timestamptz not null default now()
);
create index if not exists audit_logs_created_at_idx on public.audit_logs (created_at desc);

-- ------------------------------------------------------- default settings ---
insert into public.settings (key, value) values
  ('auto_approval', 'true'),
  ('max_upload_mb', '50')
on conflict (key) do nothing;

-- ------------------------------------------------------------- triggers ---
-- Keep like/dislike counters in sync with the votes table.
create or replace function public.sync_vote_counts() returns trigger
language plpgsql as $$
declare
  v_paper uuid;
begin
  v_paper := coalesce(new.paper_id, old.paper_id);
  update public.papers p set
    like_count    = (select count(*) from public.votes v where v.paper_id = p.id and v.value = 1),
    dislike_count = (select count(*) from public.votes v where v.paper_id = p.id and v.value = -1)
  where p.id = v_paper;
  return null;
end;
$$;

drop trigger if exists votes_sync_counts on public.votes;
create trigger votes_sync_counts
  after insert or update or delete on public.votes
  for each row execute function public.sync_vote_counts();

-- Keep comment counters in sync.
create or replace function public.sync_comment_count() returns trigger
language plpgsql as $$
declare
  v_paper uuid;
begin
  v_paper := coalesce(new.paper_id, old.paper_id);
  update public.papers p set
    comment_count = (select count(*) from public.comments c where c.paper_id = p.id)
  where p.id = v_paper;
  return null;
end;
$$;

drop trigger if exists comments_sync_count on public.comments;
create trigger comments_sync_count
  after insert or delete on public.comments
  for each row execute function public.sync_comment_count();

-- Block ownership changes unless the actor is an administrator.
create or replace function public.guard_paper_ownership() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.owner_id is distinct from old.owner_id and not public.is_admin() then
    raise exception 'Changing the owner of a paper is not allowed.';
  end if;
  return new;
end;
$$;
