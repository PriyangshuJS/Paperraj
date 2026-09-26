alter table public.papers
drop constraint if exists papers_file_ext_allowed;

alter table public.papers
add constraint papers_file_ext_allowed
check (file_ext in ('pdf', 'jpg', 'jpeg', 'png', 'webp', 'images'));
