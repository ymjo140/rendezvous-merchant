# 랑데부 사장님 콘솔

가게 정보·예약·크루 제휴를 관리하는 Next.js 앱이다. 손님 앱과 FastAPI는 [rendezvous](https://github.com/ymjo140/rendezvous) 저장소에서 관리한다.

## 실행과 검사

Node 24.19.0과 npm 11.9.0을 사용한다. `.env.example`을 `.env.local`로 복사하고 연결된 프로젝트의 공개 환경 변수를 지정한다. Supabase service-role 키는 브라우저 환경 변수에 넣지 않는다.

```sh
npm ci
npm run dev
npm run check
npm test
npm run build
```

`NEXT_PUBLIC_API_URL`은 FastAPI 원점, `NEXT_PUBLIC_B2C_URL`은 손님 앱 원점이다. /api나 /checkin 경로를 덧붙이지 않는다. 개발용 HTTP는 localhost를 사용한다. 운영 QR은 지정한 손님 앱의 HTTPS 주소로 연결된다.

Next/React는 손님 앱과 같은 16.3.4/19.2.8로 맞췄다. Supabase 2.93.3과 QR 렌더러 4.2.0은 기존 잠금파일 버전으로 고정했다.

## 방문 확인

`/stores/{storeId}/visits`에서 유효한 현장 QR을 표시하고 승인 대기 요청을 처리한다. 메뉴의 **방문 확인**, 가게 관리·설정의 **현장 QR·승인 대기 열기**에서 진입한다.

- 현장 QR은 약 2분마다 갱신하며 서버가 정한 유효기간 전에 숨긴다. 손님은 QR과 현재 위치를 함께 확인한다.
- 직원 승인에서는 손님의 앱 이름·요청 번호·실제 방문을 확인한다. 만료 후 갱신한 요청은 다시 확인해야 한다.
- 인쇄용 QR은 방문 요청 화면의 입구다. 인쇄물을 스캔하는 것만으로 방문이 인증되지는 않는다.
- 세션 종료·계정/매장 변경·화면 숨김 시 QR과 대기 데이터를 비운다. 결제·할인 실행은 이 기능에 포함되지 않는다.

API 계약과 배포 순서는 [방문 확인 운영 문서](docs/visit-desk.md)에 정리했다.

## CI의 범위

PR과 main/codex 브랜치의 push에서 설치·타입검사·린트 증가 검사·화면 테스트·프로덕션 빌드를 실행한다. Vercel도 같은 검사 후 빌드한다. CI의 가짜 공개 환경 변수는 빌드 검증 전용이며 운영 배포 환경 변수를 대체하지 않는다.

기존 린트 오류 88개·경고 21개는 `scripts/lint-baseline.json`에 파일·규칙별로 기록했다. `npm run lint`는 이 개수를 늘리거나 새 파일에 문제를 추가하면 실패한다. 전체 기존 문제는 `npm run lint:all`로 확인한다. 기존 오류가 모두 해결됐다는 의미가 아니다. 새 방문 화면은 예외 항목을 추가하지 않았다.

DOM 테스트는 가짜 세션·API·시간으로 실행한다. 실계정/실기기의 카메라, 위치 권한, 카카오 로그인과 운영 매장 방문을 대신하지 않는다.
