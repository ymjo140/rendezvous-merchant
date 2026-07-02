// =========================================================
// AI Yield Engine (휴리스틱)
// ---------------------------------------------------------
// 과거 데이터가 거의 없는 cold-start에서도 동작하고, 예약이
// 쌓일수록 실측 비중이 커지도록 설계한 "유휴 시간대 → 할인 제안" 엔진.
//
// 입력: 예약(reservations), 좌석(table_units), 기존 룰(rules), 업종(category)
// 출력: 시간대별 점유율 예측 그리드 + 유휴 슬롯 할인 룰 제안
//
// 순수 함수 모음(React/네트워크 의존 없음) → 단위 테스트 용이.
// =========================================================

export type Daypart = "LUNCH" | "AFTERNOON" | "DINNER" | "LATE";

export const DAYPARTS: { key: Daypart; label: string; start: string; end: string; hours: number }[] = [
  { key: "LUNCH", label: "점심", start: "11:00", end: "14:00", hours: 3 },
  { key: "AFTERNOON", label: "오후", start: "14:00", end: "17:00", hours: 3 },
  { key: "DINNER", label: "저녁", start: "17:00", end: "21:00", hours: 4 },
  { key: "LATE", label: "심야", start: "21:00", end: "24:00", hours: 3 },
];

export const DOW_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

// 입력 타입 (훅의 Row와 호환되는 최소 형태)
export type ReservationInput = {
  party_size: number;
  status: string;
  start_time: string; // ISO
};
export type TableUnitInput = {
  max_capacity: number;
  quantity: number;
};
export type ExistingRuleInput = {
  enabled?: boolean;
  // 머천트 RuleRow.days와 동일: 월요일 시작 7칸 배열 (index0=월 ... index6=일)
  days?: boolean[];
  time_blocks?: Array<{ start: string; end: string }>;
};

// 테이블 맵 점유 스냅샷(store_table_events) — 상태 변경 시점의 실측 점유율.
// 예약 데이터보다 강한 신호라 우선 블렌딩된다.
export type OccupancySnapshot = {
  ts: string; // ISO 시각
  occupancy: number; // 0~1 (occupied_seats / total_seats)
};

// 엔진 내부 dow는 JS getDay()(일=0..토=6). 머천트 days[]는 월=0 시작.
export function jsDowToUiIndex(dow: number): number {
  return (dow + 6) % 7; // 일(0)->6, 월(1)->0, ... 토(6)->5
}

// 업종별 시간대 수요 기준선 (0~1). 평일 기준, 주말 보정은 아래에서.
// F&B 일반값을 prior로 사용 — 데이터가 없을 때의 합리적 추정.
const BASELINE: Record<string, Record<Daypart, number>> = {
  RESTAURANT: { LUNCH: 0.7, AFTERNOON: 0.25, DINNER: 0.75, LATE: 0.35 },
  CAFE: { LUNCH: 0.45, AFTERNOON: 0.55, DINNER: 0.4, LATE: 0.2 },
  PUB: { LUNCH: 0.15, AFTERNOON: 0.2, DINNER: 0.6, LATE: 0.85 },
  BUSINESS: { LUNCH: 0.5, AFTERNOON: 0.55, DINNER: 0.3, LATE: 0.1 },
  DEFAULT: { LUNCH: 0.55, AFTERNOON: 0.35, DINNER: 0.65, LATE: 0.4 },
};

function baselineFor(category: string | undefined, dow: number, dp: Daypart): number {
  const table = BASELINE[(category || "DEFAULT").toUpperCase()] ?? BASELINE.DEFAULT;
  let v = table[dp];
  const isWeekend = dow === 0 || dow === 6;
  // 주말 보정: 저녁/심야↑, 점심 약간↑(브런치), 비즈니스는 주말↓
  if (isWeekend) {
    if (dp === "DINNER" || dp === "LATE") v = Math.min(1, v + 0.1);
    if (dp === "AFTERNOON") v = Math.min(1, v + 0.1);
    if ((category || "").toUpperCase() === "BUSINESS") v = Math.max(0, v - 0.2);
  }
  return v;
}

export function totalSeats(units: TableUnitInput[]): number {
  const seats = units.reduce((acc, u) => acc + (u.max_capacity || 0) * (u.quantity || 1), 0);
  return seats > 0 ? seats : 0;
}

// (dow, daypart) 동시 산출 — 자정~06시는 '전날 밤 장사'이므로 dow를 하루 당긴다.
// (예: 토 01:00 스냅샷은 금요일 심야 셀에 귀속 — 안 하면 토 심야 예측이 오염됨)
function slotOf(iso: string): { dow: number; dp: Daypart | null } {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { dow: -1, dp: null };
  const h = d.getHours();
  let dow = d.getDay();
  let dp: Daypart | null = null;
  if (h >= 11 && h < 14) dp = "LUNCH";
  else if (h >= 14 && h < 17) dp = "AFTERNOON";
  else if (h >= 17 && h < 21) dp = "DINNER";
  else if (h >= 21) dp = "LATE";
  else if (h < 6) {
    dp = "LATE";
    dow = (dow + 6) % 7; // 전날로 귀속
  }
  return { dow, dp };
}

const ACTIVE_STATUS = new Set(["confirmed", "pending", "seated", "completed"]);

// 실측 점유율: (dow, daypart)별 예약 좌석 합 / (좌석수 × 관측 주수)
export type Cell = {
  dow: number;
  daypart: Daypart;
  observed: number | null; // 실측 점유율(0~1) or null(데이터 없음)
  predicted: number; // 예측 점유율(0~1)
  samples: number; // 해당 슬롯 예약 건수
};

export function buildOccupancyGrid(params: {
  reservations: ReservationInput[];
  units: TableUnitInput[];
  category?: string;
  snapshots?: OccupancySnapshot[];
}): Cell[] {
  const { reservations, units, category, snapshots } = params;
  const seats = totalSeats(units);

  // 실측 스냅샷을 (dow, daypart)별로 집계 — 테이블맵에서 온 진짜 점유율
  const snapAgg = new Map<string, { sum: number; count: number }>();
  for (const s of snapshots ?? []) {
    const { dow, dp } = slotOf(s.ts);
    if (dow < 0 || !dp || !(s.occupancy >= 0)) continue;
    const key = `${dow}:${dp}`;
    const cur = snapAgg.get(key) ?? { sum: 0, count: 0 };
    cur.sum += Math.min(1, Math.max(0, s.occupancy));
    cur.count += 1;
    snapAgg.set(key, cur);
  }

  // 슬롯별 예약 좌석 합 + 건수 집계
  const agg = new Map<string, { seatSum: number; count: number; weeks: Set<string> }>();
  for (const r of reservations) {
    if (!ACTIVE_STATUS.has((r.status || "").toLowerCase())) continue;
    const { dow, dp } = slotOf(r.start_time);
    if (dow < 0 || !dp) continue;
    const key = `${dow}:${dp}`;
    const cur = agg.get(key) ?? { seatSum: 0, count: 0, weeks: new Set<string>() };
    cur.seatSum += r.party_size || 1;
    cur.count += 1;
    // 주차 식별(연-주) → 관측 주수로 평균
    const d = new Date(r.start_time);
    cur.weeks.add(`${d.getFullYear()}-${Math.floor((d.getTime()) / (7 * 864e5))}`);
    agg.set(key, cur);
  }

  const cells: Cell[] = [];
  for (let dow = 0; dow < 7; dow += 1) {
    for (const { key: dp } of DAYPARTS) {
      const a = agg.get(`${dow}:${dp}`);
      const base = baselineFor(category, dow, dp);
      let observed: number | null = null;
      let samples = 0;
      if (a && seats > 0) {
        const weeks = Math.max(a.weeks.size, 1);
        observed = Math.min(1, a.seatSum / (seats * weeks));
        samples = a.count;
      }
      // 블렌딩: 관측 표본이 많을수록 실측을 신뢰 (w = samples/(samples+k))
      const k = 4; // 신뢰 전환 상수
      const w = samples > 0 ? samples / (samples + k) : 0;
      let predicted = observed === null ? base : w * observed + (1 - w) * base;

      // 🪑 테이블맵 실측 스냅샷 — 있으면 최우선 블렌딩 (wS = n/(n+2))
      const snap = snapAgg.get(`${dow}:${dp}`);
      if (snap && snap.count > 0) {
        const snapMean = snap.sum / snap.count;
        const wS = snap.count / (snap.count + 2);
        predicted = wS * snapMean + (1 - wS) * predicted;
        observed = observed === null ? round2(snapMean) : observed;
        samples += snap.count;
      }

      cells.push({ dow, daypart: dp, observed, predicted: round2(predicted), samples });
    }
  }
  return cells;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

// 기존 룰이 (dow, daypart)를 커버하는지
function ruleCovers(rule: ExistingRuleInput, dow: number, dp: Daypart): boolean {
  if (rule.enabled === false) return false;
  const days = rule.days ?? [];
  const hasDays = days.some(Boolean);
  const dayHit = !hasDays ? true : Boolean(days[jsDowToUiIndex(dow)]);
  if (!dayHit) return false;
  const blocks = rule.time_blocks ?? [];
  if (blocks.length === 0) return true; // 시간 미지정이면 전체 커버로 간주
  const part = DAYPARTS.find((d) => d.key === dp)!;
  return blocks.some((b) => overlaps(b.start, b.end, part.start, part.end));
}
function toMin(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}
function overlaps(s1: string, e1: string, s2: string, e2: string): boolean {
  // 자정 넘김 블록(예: 21:00~00:00, 22:00~02:00)은 [s1,24:00]+[00:00,e1]로 분해해 비교
  const a = toMin(s1);
  let b = toMin(e1);
  const c = toMin(s2);
  const d = toMin(e2);
  if (b <= a) {
    // wrap: [a,1440) 또는 [0,b)와 겹치면 커버
    return (a < d && c < 1440) || (0 < d && c < b);
  }
  return a < d && c < b;
}

// 유휴 정도 → 할인율(%) 매핑
function discountFor(predicted: number): number {
  if (predicted <= 0.1) return 25;
  if (predicted <= 0.2) return 20;
  if (predicted <= 0.3) return 15;
  return 10; // ~0.4 경계
}

export type Suggestion = {
  dow: number;
  dowLabel: string;
  daypart: Daypart;
  daypartLabel: string;
  start: string;
  end: string;
  predicted: number; // 예측 점유율
  discountPct: number; // 제안 할인율
  expectedExtraSeats: number; // 예상 추가 좌석
  reason: string;
  confidence: "데이터 기반" | "추정"; // 실측 표본 유무
};

export function suggestRules(params: {
  reservations: ReservationInput[];
  units: TableUnitInput[];
  rules: ExistingRuleInput[];
  category?: string;
  snapshots?: OccupancySnapshot[];
  idleThreshold?: number; // 이 값 미만이면 유휴 (기본 0.4)
  maxSuggestions?: number;
}): { grid: Cell[]; suggestions: Suggestion[] } {
  const { reservations, units, rules, category, snapshots } = params;
  const idleThreshold = params.idleThreshold ?? 0.4;
  const maxSuggestions = params.maxSuggestions ?? 8;
  const seats = totalSeats(units);

  const grid = buildOccupancyGrid({ reservations, units, category, snapshots });

  const candidates = grid
    .filter((c) => c.predicted < idleThreshold)
    .filter((c) => !rules.some((r) => ruleCovers(r, c.dow, c.daypart)))
    .sort((a, b) => a.predicted - b.predicted); // 가장 한가한 곳 우선

  const suggestions: Suggestion[] = candidates.slice(0, maxSuggestions).map((c) => {
    const part = DAYPARTS.find((d) => d.key === c.daypart)!;
    const discountPct = discountFor(c.predicted);
    // 예상 효과: 목표 점유율(0.6)까지 유휴분의 일부(전환율 0.3)를 채운다고 가정
    const target = 0.6;
    const gap = Math.max(0, target - c.predicted);
    const expectedExtraSeats = seats > 0 ? Math.round(seats * gap * 0.3) : Math.round(gap * 10);
    return {
      dow: c.dow,
      dowLabel: DOW_LABELS[c.dow],
      daypart: c.daypart,
      daypartLabel: part.label,
      start: part.start,
      end: part.end,
      predicted: c.predicted,
      discountPct,
      expectedExtraSeats,
      reason: `${DOW_LABELS[c.dow]} ${part.label}(${part.start}~${part.end}) 예상 점유율 ${Math.round(
        c.predicted * 100
      )}% — 유휴 시간대`,
      confidence: c.samples > 0 ? "데이터 기반" : "추정",
    };
  });

  return { grid, suggestions };
}
