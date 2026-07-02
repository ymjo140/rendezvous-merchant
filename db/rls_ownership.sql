-- =========================================================================
-- RLS 소유권 잠금 (dev-permissive → owner-scoped)   [배포 전 필수]
--
-- 소유권 체인:
--   머천트테이블.store_id(text)  = places.id::text  → places.owner_id = auth.uid()
--   store_tables.place_id(int)   = places.id        → places.owner_id = auth.uid()
--
-- 원칙:
--   · 비민감 정보(카탈로그·메뉴·딜·테이블배치)는 읽기 공개 유지  → B2C 노출 안 깨짐
--   · 모든 쓰기(INSERT/UPDATE/DELETE)는 소유자(authenticated)만
--   · reservations 는 연락처 PII 포함 → 읽기도 소유자만
--   · 매장 claim(미소유 place의 owner 지정)은 SECURITY DEFINER 함수로만
--
-- 참고:
--   · FastAPI 백엔드는 DATABASE_URL 직결(테이블 소유자 롤)이라 RLS 우회 → B2C 무영향
--   · 이 마이그레이션도 직결로 적용되므로 락아웃 위험 없음
--   · 멱등(idempotent): 재실행 안전
-- =========================================================================

-- 0) 매장 claim 함수 ------------------------------------------------------
-- 미소유(owner_id null) place만, 호출자 본인(auth.uid())으로만 owner 지정.
-- 이미 남이 소유한 place는 거부. owner_id 외 컬럼은 절대 손대지 않음(반달리즘 차단).
create or replace function public.claim_store(p_place_id int)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_owner text;
begin
  if v_uid is null then
    raise exception 'auth required';
  end if;
  select owner_id into v_owner from public.places where id = p_place_id;
  if not found then
    raise exception 'place not found';
  end if;
  if v_owner is not null and v_owner <> v_uid::text then
    raise exception 'already claimed by another owner';
  end if;
  update public.places set owner_id = v_uid::text where id = p_place_id;
  return p_place_id;
end;
$$;

revoke all on function public.claim_store(int) from public;
revoke all on function public.claim_store(int) from anon;
grant execute on function public.claim_store(int) to authenticated;

-- 1) places ---------------------------------------------------------------
-- 읽기 공개(B2C 12만 카탈로그 탐색) + 쓰기는 소유자만.
alter table public.places enable row level security;
drop policy if exists "dev_read_places_auth"   on public.places;
drop policy if exists "dev_insert_places_auth" on public.places;
drop policy if exists "dev_update_places_auth" on public.places;
drop policy if exists "dev_delete_places_auth" on public.places;
drop policy if exists "public read places"     on public.places;
drop policy if exists "places_public_read"     on public.places;
drop policy if exists "places_owner_insert"    on public.places;
drop policy if exists "places_owner_update"    on public.places;
drop policy if exists "places_owner_delete"    on public.places;

create policy "places_public_read" on public.places
  for select using (true);
create policy "places_owner_insert" on public.places
  for insert to authenticated
  with check (owner_id = auth.uid()::text);
create policy "places_owner_update" on public.places
  for update to authenticated
  using (owner_id = auth.uid()::text)
  with check (owner_id = auth.uid()::text);
create policy "places_owner_delete" on public.places
  for delete to authenticated
  using (owner_id = auth.uid()::text);

-- 2) 머천트 store_id(text) 테이블 : 읽기 공개 + 쓰기 소유자 ----------------
-- table_units
alter table public.table_units enable row level security;
drop policy if exists "dev_all_table_units"        on public.table_units;
drop policy if exists "table_units_public_read"    on public.table_units;
drop policy if exists "table_units_owner_write"    on public.table_units;
create policy "table_units_public_read" on public.table_units
  for select using (true);
create policy "table_units_owner_write" on public.table_units
  for all to authenticated
  using (exists (select 1 from public.places p
                 where p.id::text = table_units.store_id
                   and p.owner_id = auth.uid()::text))
  with check (exists (select 1 from public.places p
                 where p.id::text = table_units.store_id
                   and p.owner_id = auth.uid()::text));

-- offer_benefits_catalog
alter table public.offer_benefits_catalog enable row level security;
drop policy if exists "dev_all_benefits"        on public.offer_benefits_catalog;
drop policy if exists "benefits_public_read"    on public.offer_benefits_catalog;
drop policy if exists "benefits_owner_write"    on public.offer_benefits_catalog;
create policy "benefits_public_read" on public.offer_benefits_catalog
  for select using (true);
create policy "benefits_owner_write" on public.offer_benefits_catalog
  for all to authenticated
  using (exists (select 1 from public.places p
                 where p.id::text = offer_benefits_catalog.store_id
                   and p.owner_id = auth.uid()::text))
  with check (exists (select 1 from public.places p
                 where p.id::text = offer_benefits_catalog.store_id
                   and p.owner_id = auth.uid()::text));

-- offer_rules (store_id 또는 place_id 로 소유권 확인 — 스키마 드리프트 대응)
alter table public.offer_rules enable row level security;
drop policy if exists "dev_all_rules"          on public.offer_rules;
drop policy if exists "offer_rules_read"       on public.offer_rules;
drop policy if exists "offer_rules_public_read" on public.offer_rules;
drop policy if exists "offer_rules_owner_write" on public.offer_rules;
create policy "offer_rules_public_read" on public.offer_rules
  for select using (true);
create policy "offer_rules_owner_write" on public.offer_rules
  for all to authenticated
  using (exists (select 1 from public.places p
                 where (p.id::text = offer_rules.store_id or p.id = offer_rules.place_id)
                   and p.owner_id = auth.uid()::text))
  with check (exists (select 1 from public.places p
                 where (p.id::text = offer_rules.store_id or p.id = offer_rules.place_id)
                   and p.owner_id = auth.uid()::text));

-- time_deals
alter table public.time_deals enable row level security;
drop policy if exists "dev_all_time_deals"      on public.time_deals;
drop policy if exists "time_deals_public_read"   on public.time_deals;
drop policy if exists "time_deals_owner_write"   on public.time_deals;
create policy "time_deals_public_read" on public.time_deals
  for select using (true);
create policy "time_deals_owner_write" on public.time_deals
  for all to authenticated
  using (exists (select 1 from public.places p
                 where p.id::text = time_deals.store_id
                   and p.owner_id = auth.uid()::text))
  with check (exists (select 1 from public.places p
                 where p.id::text = time_deals.store_id
                   and p.owner_id = auth.uid()::text));

-- store_menus
alter table public.store_menus enable row level security;
drop policy if exists "dev_all_store_menus"      on public.store_menus;
drop policy if exists "store_menus_public_read"   on public.store_menus;
drop policy if exists "store_menus_owner_write"   on public.store_menus;
create policy "store_menus_public_read" on public.store_menus
  for select using (true);
create policy "store_menus_owner_write" on public.store_menus
  for all to authenticated
  using (exists (select 1 from public.places p
                 where p.id::text = store_menus.store_id
                   and p.owner_id = auth.uid()::text))
  with check (exists (select 1 from public.places p
                 where p.id::text = store_menus.store_id
                   and p.owner_id = auth.uid()::text));

-- 3) reservations : PII(연락처) → 읽기·쓰기 모두 소유자만 --------------------
alter table public.reservations enable row level security;
drop policy if exists "dev_all_reservations"     on public.reservations;
drop policy if exists "reservations_owner_all"    on public.reservations;
create policy "reservations_owner_all" on public.reservations
  for all to authenticated
  using (exists (select 1 from public.places p
                 where p.id::text = reservations.store_id
                   and p.owner_id = auth.uid()::text))
  with check (exists (select 1 from public.places p
                 where p.id::text = reservations.store_id
                   and p.owner_id = auth.uid()::text));

-- 3.5) user_reservations (B2C 앱예약) : RLS 꺼져있었음 → 소유자 읽기만 ---------
-- 머천트는 place_id로 읽기만(useAppReservations). 생성/상태변경은 백엔드(직결) 경유.
-- user_id·장소·일시가 담긴 행동데이터라 anon 노출 차단 필수.
alter table public.user_reservations enable row level security;
drop policy if exists "user_reservations_owner_read" on public.user_reservations;
create policy "user_reservations_owner_read" on public.user_reservations
  for select to authenticated
  using (exists (select 1 from public.places p
                 where p.id = user_reservations.place_id
                   and p.owner_id = auth.uid()::text));

-- 4) store_tables / store_table_events : RLS 꺼져있었음 → 켜고 소유자 쓰기 ----
-- (테이블 배치·빈자리는 B2C 노출 정보라 읽기는 공개)
alter table public.store_tables enable row level security;
drop policy if exists "store_tables_public_read"  on public.store_tables;
drop policy if exists "store_tables_owner_write"  on public.store_tables;
create policy "store_tables_public_read" on public.store_tables
  for select using (true);
create policy "store_tables_owner_write" on public.store_tables
  for all to authenticated
  using (exists (select 1 from public.places p
                 where p.id = store_tables.place_id
                   and p.owner_id = auth.uid()::text))
  with check (exists (select 1 from public.places p
                 where p.id = store_tables.place_id
                   and p.owner_id = auth.uid()::text));

alter table public.store_table_events enable row level security;
drop policy if exists "ste_public_read"  on public.store_table_events;
drop policy if exists "ste_owner_write"   on public.store_table_events;
create policy "ste_public_read" on public.store_table_events
  for select using (true);
create policy "ste_owner_write" on public.store_table_events
  for all to authenticated
  using (exists (select 1 from public.places p
                 where p.id = store_table_events.place_id
                   and p.owner_id = auth.uid()::text))
  with check (exists (select 1 from public.places p
                 where p.id = store_table_events.place_id
                   and p.owner_id = auth.uid()::text));

-- 5) events (B2C 캘린더) : RLS 꺼져있었음 → 켜서 anon 차단 -------------------
-- 정책 없음 = anon/authenticated 접근 거부. 백엔드(직결)만 접근(RLS 우회).
alter table public.events enable row level security;
