-- =========================================================
-- 머천트 5개 테이블 보안 강화 (offer_rules와 동일 패턴)
-- anon 키는 SELECT만, 쓰기는 FastAPI 백엔드(service role + JWT + 소유권 검증) 경유.
--
-- ⚠️ 실행 순서: ①백엔드 배포 → ②머천트 프론트 배포 → ③이 SQL 실행.
--   (먼저 실행하면 supabase 직접 쓰기 구버전 앱이 멈춤)
-- =========================================================

-- reservations
alter table public.reservations enable row level security;
drop policy if exists "dev_all_reservations" on public.reservations;
drop policy if exists "reservations_read" on public.reservations;
create policy "reservations_read" on public.reservations for select using (true);

-- table_units
alter table public.table_units enable row level security;
drop policy if exists "dev_all_table_units" on public.table_units;
drop policy if exists "table_units_read" on public.table_units;
create policy "table_units_read" on public.table_units for select using (true);

-- time_deals
alter table public.time_deals enable row level security;
drop policy if exists "dev_all_time_deals" on public.time_deals;
drop policy if exists "time_deals_read" on public.time_deals;
create policy "time_deals_read" on public.time_deals for select using (true);

-- store_menus
alter table public.store_menus enable row level security;
drop policy if exists "dev_all_store_menus" on public.store_menus;
drop policy if exists "store_menus_read" on public.store_menus;
create policy "store_menus_read" on public.store_menus for select using (true);

-- offer_benefits_catalog
alter table public.offer_benefits_catalog enable row level security;
drop policy if exists "dev_all_benefits" on public.offer_benefits_catalog;
drop policy if exists "offer_benefits_catalog_read" on public.offer_benefits_catalog;
create policy "offer_benefits_catalog_read" on public.offer_benefits_catalog for select using (true);

-- INSERT/UPDATE/DELETE 정책 없음 → anon 쓰기 차단. service role(백엔드)은 RLS 우회.
