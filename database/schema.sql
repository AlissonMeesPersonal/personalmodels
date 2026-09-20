-- Aplicar apenas no projeto Supabase dedicado ao Personal Brasil.
create table if not exists public.professional_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  cref text not null,
  cref_state text not null,
  city text not null,
  state text not null,
  service_mode text not null,
  specialties text[] not null default '{}',
  bio text not null default '',
  experience text not null default '',
  photo_path text,
  updated_at timestamptz not null default now()
);
create table if not exists public.cref_reviews (
  user_id uuid primary key references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  cref text not null,
  cref_state text not null,
  reviewed_at timestamptz
);
create table if not exists public.subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  plan text not null check (plan in ('essencial','destaque','premium')),
  status text not null,
  stripe_customer_id text not null,
  stripe_subscription_id text not null unique,
  updated_at timestamptz not null default now()
);
alter table public.professional_profiles enable row level security;
alter table public.cref_reviews enable row level security;
alter table public.subscriptions enable row level security;
create policy "owner reads profile" on public.professional_profiles for select to authenticated using ((select auth.uid())=user_id);
create policy "owner inserts profile" on public.professional_profiles for insert to authenticated with check ((select auth.uid())=user_id);
create policy "owner edits profile" on public.professional_profiles for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy "owner reads review" on public.cref_reviews for select to authenticated using ((select auth.uid())=user_id);
create policy "owner reads subscription" on public.subscriptions for select to authenticated using ((select auth.uid())=user_id);

-- Fotos privadas, acessíveis ao dono; futuros perfis públicos devem usar URLs assinadas.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values ('personal-photos','personal-photos',false,5242880,array['image/jpeg','image/png','image/webp']) on conflict (id) do nothing;
create policy "owner uploads photo" on storage.objects for insert to authenticated with check (bucket_id='personal-photos' and split_part(name,'/',1)=(select auth.uid())::text);
create policy "owner reads photo" on storage.objects for select to authenticated using (bucket_id='personal-photos' and split_part(name,'/',1)=(select auth.uid())::text);
create policy "owner updates photo" on storage.objects for update to authenticated using (bucket_id='personal-photos' and split_part(name,'/',1)=(select auth.uid())::text) with check (bucket_id='personal-photos' and split_part(name,'/',1)=(select auth.uid())::text);
