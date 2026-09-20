-- Comprovantes privados para revisão da inscrição profissional.
alter table public.personal_cref_reviews add column if not exists document_path text;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('personal-cref-documents','personal-cref-documents',false,5242880,array['application/pdf','image/jpeg','image/png'])
on conflict (id) do nothing;
create policy "personal owner uploads cref document" on storage.objects for insert to authenticated
with check (bucket_id='personal-cref-documents' and split_part(name,'/',1)=(select auth.uid())::text);
create policy "personal owner reads cref document" on storage.objects for select to authenticated
using (bucket_id='personal-cref-documents' and split_part(name,'/',1)=(select auth.uid())::text);
create policy "personal owner updates cref document" on storage.objects for update to authenticated
using (bucket_id='personal-cref-documents' and split_part(name,'/',1)=(select auth.uid())::text)
with check (bucket_id='personal-cref-documents' and split_part(name,'/',1)=(select auth.uid())::text);
