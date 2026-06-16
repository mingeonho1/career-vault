-- ============================================================
-- 0001_init.sql — 이력 금고 초기 스키마
-- ============================================================

-- ----------------------------------------
-- 1. career_vault_documents 테이블
-- ----------------------------------------
create table if not exists public.career_vault_documents (
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

alter table public.career_vault_documents enable row level security;

-- 본인 행만 select/insert/update/delete
create policy "career_vault_documents: owner select"
  on public.career_vault_documents for select
  using (user_id = auth.uid());

create policy "career_vault_documents: owner insert"
  on public.career_vault_documents for insert
  with check (user_id = auth.uid());

create policy "career_vault_documents: owner update"
  on public.career_vault_documents for update
  using (user_id = auth.uid());

create policy "career_vault_documents: owner delete"
  on public.career_vault_documents for delete
  using (user_id = auth.uid());

-- ----------------------------------------
-- 2. career_vault_career_cards 테이블
-- 주의: 주민등록번호 저장용 컬럼 없음
-- ----------------------------------------
create table if not exists public.career_vault_career_cards (
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
  source_document_id  uuid references public.career_vault_documents(id) on delete set null,
  created_at          timestamptz not null default now()
);

alter table public.career_vault_career_cards enable row level security;

-- 본인 행만 select/insert/update/delete
create policy "career_vault_career_cards: owner select"
  on public.career_vault_career_cards for select
  using (user_id = auth.uid());

create policy "career_vault_career_cards: owner insert"
  on public.career_vault_career_cards for insert
  with check (user_id = auth.uid());

create policy "career_vault_career_cards: owner update"
  on public.career_vault_career_cards for update
  using (user_id = auth.uid());

create policy "career_vault_career_cards: owner delete"
  on public.career_vault_career_cards for delete
  using (user_id = auth.uid());

-- ----------------------------------------
-- 3. waitlist 테이블 (공유, source 구분)
-- ----------------------------------------
create table if not exists public.waitlist (
  id         bigint generated always as identity primary key,
  email      text not null,
  source     text not null,
  created_at timestamptz not null default now(),
  unique (email, source)
);

create index if not exists waitlist_source_idx on public.waitlist (source);

alter table public.waitlist enable row level security;

-- 익명 포함 누구나 insert 가능 (대기명단 등록)
create policy "waitlist: anon insert"
  on public.waitlist for insert
  with check (true);

-- select는 service role에서만 (관리 목적)
create policy "waitlist: owner select"
  on public.waitlist for select
  using (false);

-- ----------------------------------------
-- 4. Storage — private 버킷 career-vault-certificates (공유 프로젝트: 버킷명 네임스페이싱)
-- ----------------------------------------

-- 버킷 생성 (private, 파일당 10MB)
insert into storage.buckets (id, name, public, file_size_limit)
values ('career-vault-certificates', 'career-vault-certificates', false, 10485760)
on conflict (id) do nothing;

-- 본인 경로({user_id}/)만 read/write
create policy "career_vault certificates: owner select"
  on storage.objects for select
  using (
    bucket_id = 'career-vault-certificates'
    and auth.uid()::text = (string_to_array(name, '/'))[1]
  );

create policy "career_vault certificates: owner insert"
  on storage.objects for insert
  with check (
    bucket_id = 'career-vault-certificates'
    and auth.uid()::text = (string_to_array(name, '/'))[1]
  );

create policy "career_vault certificates: owner update"
  on storage.objects for update
  using (
    bucket_id = 'career-vault-certificates'
    and auth.uid()::text = (string_to_array(name, '/'))[1]
  );

create policy "career_vault certificates: owner delete"
  on storage.objects for delete
  using (
    bucket_id = 'career-vault-certificates'
    and auth.uid()::text = (string_to_array(name, '/'))[1]
  );
