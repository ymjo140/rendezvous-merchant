// 사업자등록번호 검증 — 국세청 체크섬 알고리즘(오프라인).
// 형식(10자리) + 검증코드 통과 여부만 확인. 실제 휴/폐업 진위확인은
// 국세청 공공데이터 API(키 필요) 연동 시 추가 — 로드맵.

const WEIGHTS = [1, 3, 7, 1, 3, 7, 1, 3, 5];

/** "123-45-67890" / "1234567890" 모두 허용 → 숫자 10자리로 정규화 */
export function normalizeBizNo(input: string): string {
  return (input || "").replace(/[^0-9]/g, "");
}

export function isValidBizNo(input: string): boolean {
  const digits = normalizeBizNo(input);
  if (digits.length !== 10) return false;
  if (/^(\d)\1{9}$/.test(digits)) return false; // 0000000000 등 동일숫자 차단
  const nums = digits.split("").map(Number);
  let sum = 0;
  for (let i = 0; i < 9; i += 1) {
    sum += nums[i] * WEIGHTS[i];
  }
  sum += Math.floor((nums[8] * 5) / 10);
  const check = (10 - (sum % 10)) % 10;
  return check === nums[9];
}

/** 표시용 포맷: 123-45-67890 */
export function formatBizNo(input: string): string {
  const d = normalizeBizNo(input);
  if (d.length !== 10) return input;
  return `${d.slice(0, 3)}-${d.slice(3, 5)}-${d.slice(5)}`;
}
