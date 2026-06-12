-- ============================================================
-- 0001_init.sql — 이력 금고 초기 스키마
-- ============================================================

-- ----------------------------------------
-- 1. documents 테이블
-- ----------------------------------------
create table if not exists public.documents (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  storage_path    text not null,
  file_name       text not null,
  mime_type       text not null,
  size_bytes      bigint not null,
  status          text not null default 'uploaded'
                    check (status in ('uploaded', 'extracted', 'failed')),
  created_at      timestamptz not null default now()
);

alter table public.documents enable row level security;

-- 본인 행만 select/insert/update/delete
create policy "documents: owner select"
  on public.documents for select
  using (user_id = auth.uid());

create policy "documents: owner insert"
  on public.documents for insert
  with check (user_id = auth.uid());

create policy "documents: owner update"
  on public.documents for update
  using (user_id = auth.uid());

create policy "documents: owner delete"
  on public.documents for delete
  using (user_id = auth.uid());

-- ----------------------------------------
-- 2. career_cards 테이블
-- 주의: 주민등록번호 저장용 컬럼 없음
-- ----------------------------------------
create table if not exists public.career_cards (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users(id) on delete cascade,
  category            text not null
                        check (category in (
                          'education', 'certificate', 'military',
                          'career', 'language', 'etc'
                        )),
  title               text not null,
  organization        text not null,
  start_date          date,
  end_date            date,
  detail              jsonb,
  source_document_id  uuid references public.documents(id) on delete set null,
  created_at          timestamptz not null default now()
);

alter table public.career_cards enable row level security;

-- 본인 행만 select/insert/update/delete
create policy "career_cards: owner select"
  on public.career_cards for select
  using (user_id = auth.uid());

create policy "career_cards: owner insert"
  on public.career_cards for insert
  with check (user_id = auth.uid());

create policy "career_cards: owner update"
  on public.career_cards for update
  using (user_id = auth.uid());

create policy "career_cards: owner delete"
  on public.career_cards for delete
  using (user_id = auth.uid());

-- ----------------------------------------
-- 3. waitlist 테이블
-- ----------------------------------------
create table if not exists public.waitlist (
  id          uuid primary key default gen_random_uuid(),
  email       text not null unique,
  user_id     uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now()
);

alter table public.waitlist enable row level security;

-- 익명 포함 누구나 insert 가능 (대기명단 등록)
create policy "waitlist: anon insert"
  on public.waitlist for insert
  with check (true);

-- select/update/delete는 본인(user_id 연결된 경우)만
create policy "waitlist: owner select"
  on public.waitlist for select
  using (user_id = auth.uid());

-- ----------------------------------------
-- 4. Storage — private 버킷 certificates
-- ----------------------------------------

-- 버킷 생성 (private, 파일당 10MB)
insert into storage.buckets (id, name, public, file_size_limit)
values ('certificates', 'certificates', false, 10485760)
on conflict (id) do nothing;

-- 본인 경로({user_id}/)만 read/write
create policy "storage certificates: owner select"
  on storage.objects for select
  using (
    bucket_id = 'certificates'
    and auth.uid()::text = (string_to_array(name, '/'))[1]
  );

create policy "storage certificates: owner insert"
  on storage.objects for insert
  with check (
    bucket_id = 'certificates'
    and auth.uid()::text = (string_to_array(name, '/'))[1]
  );

create policy "storage certificates: owner update"
  on storage.objects for update
  using (
    bucket_id = 'certificates'
    and auth.uid()::text = (string_to_array(name, '/'))[1]
  );

create policy "storage certificates: owner delete"
  on storage.objects for delete
  using (
    bucket_id = 'certificates'
    and auth.uid()::text = (string_to_array(name, '/'))[1]
  );
