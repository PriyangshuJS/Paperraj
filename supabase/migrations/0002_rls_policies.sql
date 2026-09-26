-- ============================================================================
-- PaperRaj — 0002_rls_policies.sql
-- Row Level Security. Run AFTER 0001_schema.sql.
--
-- The Next.js server enforces the same rules server-side for every request,
-- so RLS here is defence in depth: it protects the tables if anything ever
-- talks to Supabase directly with the anon key.
-- ============================================================================

-- ---------------------------------------------------------------- helpers --
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  );
$$;

-- ----------------------------------------------------------- profiles -----
alter table public.profiles       enable row level security;
alter table public.sessions       enable row level security;
alter table public.password_resets enable row level security;
alter table public.audit_logs     enable row level security;
alter table public.settings       enable row level security;
alter table public.file_blobs     enable row level security;

-- Nobody reads sessions, password resets or raw blobs through PostgREST.
drop policy if exists "no client access to sessions" on public.sessions;
create policy "no client access to sessions" on public.sessions
  for all using (false) with check (false);

drop policy if exists "no client access to password resets" on public.password_resets;
create policy "no client access to password resets" on public.password_resets
  for all using (false) with check (false);

drop policy if exists "no client access to file blobs" on public.file_blobs;
create policy "no client access to file blobs" on public.file_blobs
  for all using (false) with check (false);

drop policy if exists "no client access to audit logs" on public.audit_logs;
create policy "no client access to audit logs" on public.audit_logs
  for all using (false) with check (false);

-- Profiles: a signed-in user may read and update their own row; admins may read all.
drop policy if exists "read own profile" on public.profiles;
create policy "read own profile" on public.profiles
  for select using (id = auth.uid() or public.is_admin());

drop policy if exists "update own profile" on public.profiles;
create policy "update own profile" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "insert own profile" on public.profiles;
create policy "insert own profile" on public.profiles
  for insert with check (id = auth.uid() or email is not null);

-- Settings: readable by everyone (the app needs to know the upload limit),
-- writable only by admins.
drop policy if exists "read settings" on public.settings;
create policy "read settings" on public.settings for select using (true);

drop policy if exists "admin writes settings" on public.settings;
create policy "admin writes settings" on public.settings
  for all using (public.is_admin()) with check (public.is_admin());

-- ------------------------------------------------------------- papers -----
alter table public.papers enable row level security;

drop policy if exists "public reads approved papers" on public.papers;
create policy "public reads approved papers" on public.papers
  for select using (status = 'APPROVED');

drop policy if exists "owners read their own papers" on public.papers;
create policy "owners read their own papers" on public.papers
  for select using (owner_id = auth.uid());

-- Guest uploads: no owner, but an uploader name is required.
drop policy if exists "guests may contribute" on public.papers;
create policy "guests may contribute" on public.papers
  for insert with check (
    owner_id is null
    and char_length(btrim(uploader_name)) > 0
    and status = 'PENDING'
  );

-- Signed-in contributors own what they upload, and cannot publish it themselves.
drop policy if exists "users upload their own papers" on public.papers;
create policy "users upload their own papers" on public.papers
  for insert with check (owner_id = auth.uid() and status = 'PENDING');

drop policy if exists "owners update their own papers" on public.papers;
create policy "owners update their own papers" on public.papers
  for update using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

drop policy if exists "owners delete their own papers" on public.papers;
create policy "owners delete their own papers" on public.papers
  for delete using (owner_id = auth.uid());

drop policy if exists "admins manage every paper" on public.papers;
create policy "admins manage every paper" on public.papers
  for all using (public.is_admin()) with check (public.is_admin());

-- Block ownership changes at the row level (admins excepted).
drop trigger if exists papers_guard_ownership on public.papers;
create trigger papers_guard_ownership
  before update on public.papers
  for each row execute function public.guard_paper_ownership();

-- ----------------------------------------------------------- comments -----
alter table public.comments enable row level security;

drop policy if exists "anyone reads comments" on public.comments;
create policy "anyone reads comments" on public.comments for select using (true);

drop policy if exists "signed in users comment" on public.comments;
create policy "signed in users comment" on public.comments
  for insert with check (user_id = auth.uid());

drop policy if exists "authors delete their own comments" on public.comments;
create policy "authors delete their own comments" on public.comments
  for delete using (user_id = auth.uid());

drop policy if exists "admins moderate comments" on public.comments;
create policy "admins moderate comments" on public.comments
  for all using (public.is_admin()) with check (public.is_admin());

-- -------------------------------------------------------------- votes -----
alter table public.votes enable row level security;

drop policy if exists "anyone reads votes" on public.votes;
create policy "anyone reads votes" on public.votes for select using (true);

drop policy if exists "one vote per user" on public.votes;
create policy "one vote per user" on public.votes
  for insert with check (user_id = auth.uid());

drop policy if exists "users change their own vote" on public.votes;
create policy "users change their own vote" on public.votes
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "users remove their own vote" on public.votes;
create policy "users remove their own vote" on public.votes
  for delete using (user_id = auth.uid());

-- ------------------------------------------------------------ reports -----
alter table public.reports enable row level security;

drop policy if exists "anyone may report a paper" on public.reports;
create policy "anyone may report a paper" on public.reports
  for insert with check (reporter_id is null or reporter_id = auth.uid());

drop policy if exists "admins read reports" on public.reports;
create policy "admins read reports" on public.reports for select using (public.is_admin());

drop policy if exists "admins resolve reports" on public.reports;
create policy "admins resolve reports" on public.reports
  for update using (public.is_admin()) with check (public.is_admin());

-- ----------------------------------------------------------- teachers -----
alter table public.teachers enable row level security;

drop policy if exists "anyone reads the teacher directory" on public.teachers;
create policy "anyone reads the teacher directory" on public.teachers
  for select using (true);

drop policy if exists "admins manage the teacher directory" on public.teachers;
create policy "admins manage the teacher directory" on public.teachers
  for all using (public.is_admin()) with check (public.is_admin());
