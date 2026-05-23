-- =========================================================
-- offer_rules 보안 강화 (Option A: 백엔드 경유 쓰기)
-- ---------------------------------------------------------
-- anon 키(브라우저 노출)로는 읽기만 허용하고, 쓰기(INSERT/UPDATE/DELETE)는
-- FastAPI 백엔드가 DATABASE_URL(service role)로 수행한다. 백엔드는 JWT 인증 +
-- 가게 소유권(places.owner_id == user.id) 검증 후에만 쓴다.
--
-- ⚠️ 실행 순서 주의 (앱 다운 방지):
--   1) 백엔드 배포(merchant offer-rules 엔드포인트)  →
--   2) 머천트 프론트 배포(useRules 쓰기 백엔드 경유)  →
--   3) 그 다음에 이 SQL 실행.
--   (이 SQL을 먼저 실행하면, 아직 supabase 직접 쓰기를 하는 구버전 앱이 멈춤)
-- =========================================================

alter table public.offer_rules enable row level security;

-- 개발용 전체 허용 정책 제거
drop policy if exists "dev_all_rules" on public.offer_rules;

-- anon/authenticated: 읽기(SELECT)만 허용 — 머천트 목록/실시간 구독 + 손님 앱 조회
drop policy if exists "offer_rules_read" on public.offer_rules;
create policy "offer_rules_read" on public.offer_rules
  for select using (true);

-- INSERT/UPDATE/DELETE 정책을 만들지 않음 → anon 쓰기는 RLS로 차단됨.
-- (service role 연결은 RLS를 우회하므로 백엔드 쓰기는 정상 동작)
