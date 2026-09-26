create table if not exists public.paper_pages (
  id uuid primary key default gen_random_uuid(),
  paper_id uuid not null references public.papers(id) on delete cascade,
  page_number integer not null,
  file_name text not null,
  file_size bigint not null,
  mime_type text not null,
  storage_bucket text not null,
  storage_path text not null,
  created_at timestamptz not null default now(),

  constraint paper_pages_paper_page_key
    unique (paper_id, page_number)
);

create index if not exists paper_pages_paper_id_idx
  on public.paper_pages(paper_id);

alter table public.paper_pages enable row level security;
