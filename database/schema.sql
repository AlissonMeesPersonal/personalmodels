-- Tabelas isoladas do Personal Brasil no projeto Supabase indicado.
-- Não modifica as tabelas ou políticas dos demais aplicativos.
create table if not exists public.personal_professional_profiles (
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
create table if not exists public.personal_cref_reviews (
  user_id uuid primary key references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  cref text not null,
  cref_state text not null,
  reviewed_at timestamptz
);
create table if not exists public.personal_subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  plan text not null check (plan in ('essencial','destaque','premium')),
  status text not null,
  stripe_customer_id text not null,
  stripe_subscription_id text not null unique,
  updated_at timestamptz not null default now()
);
alter table public.personal_professional_profiles enable row level security;
alter table public.personal_cref_reviews enable row level security;
alter table public.personal_subscriptions enable row level security;
create policy "personal owner reads profile" on public.personal_professional_profiles for select to authenticated using ((select auth.uid())=user_id);
create policy "personal owner inserts profile" on public.personal_professional_profiles for insert to authenticated with check ((select auth.uid())=user_id);
create policy "personal owner edits profile" on public.personal_professional_profiles for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy "personal owner reads review" on public.personal_cref_reviews for select to authenticated using ((select auth.uid())=user_id);
create policy "personal owner reads subscription" on public.personal_subscriptions for select to authenticated using ((select auth.uid())=user_id);

-- Fotos privadas, acessíveis ao dono; futuros perfis públicos devem usar URLs assinadas.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values ('personal-photos','personal-photos',false,5242880,array['image/jpeg','image/png','image/webp']) on conflict (id) do nothing;
create policy "personal owner uploads photo" on storage.objects for insert to authenticated with check (bucket_id='personal-photos' and split_part(name,'/',1)=(select auth.uid())::text);
create policy "personal owner reads photo" on storage.objects for select to authenticated using (bucket_id='personal-photos' and split_part(name,'/',1)=(select auth.uid())::text);
create policy "personal owner updates photo" on storage.objects for update to authenticated using (bucket_id='personal-photos' and split_part(name,'/',1)=(select auth.uid())::text) with check (bucket_id='personal-photos' and split_part(name,'/',1)=(select auth.uid())::text);

-- Concede acesso à API apenas onde as políticas RLS limitam cada linha ao usuário.
grant select, insert, update on public.personal_professional_profiles to authenticated;
grant select on public.personal_cref_reviews to authenticated;
grant select on public.personal_subscriptions to authenticated;
