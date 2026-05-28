-- ============================================================
-- Storage Bucket：銀行存摺圖片（passbooks，private）
-- ============================================================
-- 此 bucket 為 private（public=false）。所有存取走 server-side service_role。
-- 應用程式以 storage.from('passbooks').upload() 寫入，
-- 並用 createSignedUrl(path, expiresIn) 給 admin 檢視。

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'passbooks',
  'passbooks',
  false,
  8 * 1024 * 1024,                                          -- 8 MB
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

-- service_role 預設可繞過 storage.objects 的 RLS，因此不需要額外 policy。
-- 不對 anon / authenticated 建立任何 policy = 完全拒絕。
