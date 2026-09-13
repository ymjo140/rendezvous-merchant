# 점주 방문 확인 연동

## 동작

`/stores/{storeId}/visits`는 현재 Supabase 세션 토큰을 FastAPI에 전달한다. API가 Auth 서버에서 세션과 매장 소유권을 검증한다. 새 기능은 방문 테이블을 Supabase Data API로 직접 읽거나 쓰지 않으며 이전 localStorage 토큰을 대체 인증으로 사용하지 않는다.

QR과 대기 목록은 컴포넌트 메모리에만 보관한다. 요청 시간 제한은 15초다. 성공·실패를 구분하며 실패를 0명으로 표시하지 않는다. 화면이 보일 때만 약 5초마다 목록을 조회하고, QR은 약 120초마다 갱신한다. 숨김·복귀·포커스 복귀 시 이전 요청을 취소하고 새 자료를 조회한다. 401/403 목록·QR 응답은 화면을 비우고 자동 조회를 중지한다.

표시 시간은 서버의 `server_time`과 `expires_at` 차이에서 왕복 요청 시간과 2초 여유를 뺀 값이다. 로컬 벽시계가 잘못 설정돼도 남은 시간 계산에 사용하지 않는다. 만료 QR은 숨기며 외부 이미지 QR 서비스에 토큰을 전송하지 않는다. 손님 URL은 지정한 원점의 `/checkin/{storeId}#qr=...`만 허용한다. 짧게 살아 있는 QR은 이미지 저장·인쇄 대상으로 제공하지 않는다.

## 현장 승인

1. 손님이 앱에서 방문 승인을 요청한다.
2. 점주는 이름과 8자리 요청 번호를 손님 화면과 대조하고 실제 방문 여부를 확인한다.
3. 확인 항목을 체크한 뒤 방문 승인을 누른다. 일괄 승인은 제공하지 않는다.
4. 크루 첫 참가자는 공동 방문 대기, 같은 날 2시간 안에 두 번째 멤버가 확인하면 공동 방문 1회가 된다.

요청 번호는 UUID 앞 8자리의 표시값이며 인증 비밀값이 아니다. 인쇄 QR이나 번호만으로 승인이 되지 않는다. 요청자·현재 크루 멤버·매장 소유권·만료는 서버에서 검사한다.

승인 클릭 시 대조한 요청의 `created_at`을 `expected_created_at`으로 보낸다. 손님이 만료 요청을 갱신해 같은 ID가 재사용되더라도 서버가 잠금 안에서 버전을 대조해 이전 확인은 409로 거절한다. 화면의 확인 체크도 새 요청에는 재사용하지 않는다. 승인 요청은 자동 재시도하지 않는다. 응답을 못 받았으면 손님 화면과 최신 목록을 확인한다. 서버의 기존 멱등 처리로 재시도도 중복 참가·방문을 만들지 않는다.

## API 계약

| 요청 | 필요한 응답/입력 |
|---|---|
| POST `/api/merchant/stores/{id}/checkin-qr` | `token`, `checkin_path`, `server_time`, `expires_at` |
| GET `/api/merchant/stores/{id}/visit-requests` | `store.id/name`, `server_time`, `items`: id/name/community_id/verification_code/created_at/expires_at |
| POST `/api/merchant/visit-requests/{id}/approve` | JSON `expected_created_at`; 방문 id/status/already/참가자 수 반환 |

신규 서버 필드가 없는 구버전 API에서는 새 QR·목록을 표시하지 않는다. 서버에서는 소유 매장의 아직 유효한 대기 요청을 최대 100개 조회하고, 탈퇴·삭제된 크루 요청을 제외한다. 이 요청들에 `Cache-Control: private, no-store`를 적용한다. 기존 공개 범위나 기존 DB 테이블의 권한을 변경하는 작업은 포함하지 않는다.

## 배포와 확인

1. rendezvous의 `codex/merchant-visit-support` 변경을 검사·병합하고 FastAPI를 배포한다. 새 스키마 마이그레이션은 없다.
2. 운영 API의 배포 커밋과 준비 상태를 확인한다. GET `/api/health/live`, `/api/health/ready`가 해당 커밋으로 응답해야 한다.
3. 이 콘솔의 `codex/merchant-visit-desk` 변경을 검사·병합하고 Vercel 배포 결과를 확인한다.
4. 실제 매장 계정에서 QR 스캔·위치 권한 실패·직원 승인·만료·매장 전환을 확인한다. 결제·혜택은 계속 별도 정책으로 차단된다.

2026-09-13 운영 API 조회: 루트와 `/openapi.json`은 200이지만 상태 확인·점주 QR·방문 승인 경로가 명세에 없다. 상태 확인 두 경로도 404다. API 적용을 확인하기 전까지 이 콘솔 변경은 PR로 보관하고 운영 병합을 보류한다. Render 연결 저장소·브랜치·배포 로그 확인이 필요하다.

로컬 검증: 화면/계약 테스트 23개, 타입검사·기존 린트 증가 0건, 프로덕션 빌드. 본 앱 테스트와 PostgreSQL CI, 최종 병합·배포 결과는 양쪽 PR에 기록한다.

테스트 실행기는 자식 프로세스의 `NODE_ENV`를 `test`로 지정한다. 상위 빌드 작업이 `production`이어도 React DOM 테스트 도구가 동작하며, 뒤의 Next.js 프로덕션 빌드 환경에는 영향을 주지 않는다. CI도 `NODE_ENV=production npm test` 조건으로 이 경계를 검사한다.

아직 실기기 시각 검증과 실계정 방문은 수행하지 않았다. 기존 방문·예약·제휴 외 영역의 린트/권한 문제와 점주 모집·사용자 관찰은 남아 있다. 4주차 전체 베타 평가 완료를 의미하지 않는다.

참고: [Supabase getSession](https://supabase.com/docs/reference/javascript/auth-getsession), [Auth 상태 변경](https://supabase.com/docs/reference/javascript/auth-onauthstatechange), [Next.js 보안 수정](https://nextjs.org/blog/july-2026-security-release).
