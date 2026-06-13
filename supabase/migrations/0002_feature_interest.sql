create table if not exists feature_interest (
  id uuid primary key default gen_random_uuid(),
  feature_key text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz default now(),
  unique(feature_key, user_id)
);

alter table feature_interest enable row level security;

create policy "authenticated users can insert own rows"
  on feature_interest
  for insert
  to authenticated
  with check (user_id = auth.uid());
