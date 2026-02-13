-- 安全创建 'images' 存储桶
insert into storage.buckets (id, name, public)
values ('images', 'images', true)
on conflict (id) do nothing;

-- 安全创建 'covers' 存储桶
insert into storage.buckets (id, name, public)
values ('covers', 'covers', true)
on conflict (id) do nothing;

-- 删除旧策略（如果存在），避免重复创建错误
drop policy if exists "Images Public Access" on storage.objects;
drop policy if exists "Images Authenticated Upload" on storage.objects;
drop policy if exists "Images Authenticated Update" on storage.objects;
drop policy if exists "Images Authenticated Delete" on storage.objects;

drop policy if exists "Covers Public Access" on storage.objects;
drop policy if exists "Covers Authenticated Upload" on storage.objects;
drop policy if exists "Covers Authenticated Update" on storage.objects;
drop policy if exists "Covers Authenticated Delete" on storage.objects;

-- 为 'images' 存储桶设置 RLS 策略
create policy "Images Public Access"
  on storage.objects for select
  using ( bucket_id = 'images' );

create policy "Images Authenticated Upload"
  on storage.objects for insert
  to authenticated
  with check ( bucket_id = 'images' );

create policy "Images Authenticated Update"
  on storage.objects for update
  to authenticated
  using ( bucket_id = 'images' );

create policy "Images Authenticated Delete"
  on storage.objects for delete
  to authenticated
  using ( bucket_id = 'images' );

-- 为 'covers' 存储桶设置 RLS 策略
create policy "Covers Public Access"
  on storage.objects for select
  using ( bucket_id = 'covers' );

create policy "Covers Authenticated Upload"
  on storage.objects for insert
  to authenticated
  with check ( bucket_id = 'covers' );

create policy "Covers Authenticated Update"
  on storage.objects for update
  to authenticated
  using ( bucket_id = 'covers' );

create policy "Covers Authenticated Delete"
  on storage.objects for delete
  to authenticated
  using ( bucket_id = 'covers' );
