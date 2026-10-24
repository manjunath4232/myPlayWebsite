-- Run once in the Supabase SQL editor for a new project.
begin;
create table public.owners (
 user_id uuid primary key references auth.users(id) on delete cascade
);
alter table public.owners enable row level security;
revoke all on public.owners from anon, authenticated;
grant select on public.owners to authenticated;
create policy "Owners see their own membership" on public.owners for select to authenticated using(user_id = (select auth.uid()));

create or replace function public.is_owner() returns boolean
language sql stable security definer set search_path = '' as $$
 select exists(select 1 from public.owners where user_id = (select auth.uid()));
$$;
revoke all on function public.is_owner() from public;
grant execute on function public.is_owner() to anon, authenticated;

create table public.products (
 id uuid primary key default gen_random_uuid(),
 name text not null check(char_length(trim(name)) between 1 and 100),
 category text not null check(char_length(trim(category)) between 1 and 50),
 price numeric(10,2) not null check(price >= 0 and price <= 99999999),
 description text not null default '' check(char_length(description) <= 2000),
 image_path text not null unique,
 available boolean not null default true,
 published boolean not null default true,
 created_at timestamptz not null default now()
);
alter table public.products enable row level security;
grant select on public.products to anon,authenticated;
grant insert,update,delete on public.products to authenticated;
create policy "Customers read published products" on public.products for select to anon,authenticated using(published or (select public.is_owner()));
create policy "Owner inserts products" on public.products for insert to authenticated with check((select public.is_owner()));
create policy "Owner updates products" on public.products for update to authenticated using((select public.is_owner())) with check((select public.is_owner()));
create policy "Owner deletes products" on public.products for delete to authenticated using((select public.is_owner()));
create index products_catalog_idx on public.products(published,created_at desc);

create table public.store_settings (
 id integer primary key check(id=1),
 business_name text not null check(char_length(trim(business_name)) between 1 and 80),
 tagline text not null check(char_length(trim(tagline)) between 1 and 100),
 description text not null check(char_length(description) <= 500),
 whatsapp_number text not null default '' check(whatsapp_number='' or whatsapp_number ~ '^[1-9][0-9]{7,14}$')
);
alter table public.store_settings enable row level security;
grant select on public.store_settings to anon,authenticated;
grant update on public.store_settings to authenticated;
create policy "Everyone reads store settings" on public.store_settings for select to anon,authenticated using(true);
create policy "Only owner updates settings" on public.store_settings for update to authenticated using((select public.is_owner())) with check((select public.is_owner()));
insert into public.store_settings(id,business_name,tagline,description) values(1,'AAMUKTHA Drapes & Delights','Good things, simply found.','A little inspiration for your everyday. Explore our collection, find something you love, and talk to us on WhatsApp.');

-- Private bucket. Customers can request signed URLs for published product photos only.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
 values('product-images','product-images',false,2097152,array['image/webp','image/jpeg','image/png']);
create policy "Read published photos or owner photos" on storage.objects for select to anon,authenticated using(bucket_id='product-images' and ((select public.is_owner()) or exists(select 1 from public.products p where p.image_path=name and p.published)));
create policy "Owner uploads photos" on storage.objects for insert to authenticated with check(bucket_id='product-images' and (select public.is_owner()));
create policy "Owner replaces photos" on storage.objects for update to authenticated using(bucket_id='product-images' and (select public.is_owner())) with check(bucket_id='product-images' and (select public.is_owner()));
create policy "Owner deletes photos" on storage.objects for delete to authenticated using(bucket_id='product-images' and (select public.is_owner()));
commit;
