"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HotDealCard } from "@/components/offers/HotDealCard";
import { BenefitType } from "@/domain/offers/types";
import { useBenefits } from "@/lib/hooks/useBenefits";
import { useRules } from "@/lib/hooks/useRules";
import { useStoreId } from "@/components/layout/Layout";

const dayLabels = [
  "월",
  "화",
  "수",
  "목",
  "금",
  "토",
  "일",
];
const dayCodes = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

const benefitTypes = [
  { value: BenefitType.FREE_MENU_ITEM, label: "메뉴 증정" },
  { value: BenefitType.SPACE_UPGRADE, label: "룸/좌석 업그레이드" },
  { value: BenefitType.TIME_EXTENSION, label: "시간 연장" },
  { value: BenefitType.PERCENT_DISCOUNT, label: "정률 할인" },
  { value: BenefitType.FIXED_AMOUNT_OFF, label: "정액 할인" },
];

const benefitTypeLabelMap: Record<BenefitType, string> = {
  [BenefitType.PERCENT_DISCOUNT]: "정률 할인",
  [BenefitType.FIXED_AMOUNT_OFF]: "정액 할인",
  [BenefitType.FREE_MENU_ITEM]: "메뉴 증정",
  [BenefitType.SIZE_UPGRADE]: "사이즈업",
  [BenefitType.UNLIMITED_REFILL]: "무제한 리필",
  [BenefitType.TIME_EXTENSION]: "시간 연장",
  [BenefitType.EARLY_ACCESS]: "얼리 체크인",
  [BenefitType.LATE_CHECKOUT]: "레이트 체크아웃",
  [BenefitType.SPACE_UPGRADE]: "룸/좌석 업그레이드",
  [BenefitType.FREE_EQUIPMENT]: "장비 대여",
  [BenefitType.CORKAGE_FREE]: "콜키지 프리",
};

const mockBenefits = [
  { id: "1", title: "음료 1잔", type: BenefitType.FREE_MENU_ITEM },
  { id: "2", title: "창가 좌석", type: BenefitType.SPACE_UPGRADE },
];

// 혜택 종류별 입력 안내 — 사장님이 뭘 적어야 하는지 바로 알게
const benefitValueHints: Partial<Record<BenefitType, { placeholder: string; hint: string }>> = {
  [BenefitType.PERCENT_DISCOUNT]: { placeholder: "예: 10", hint: "할인율 숫자만 (%) — 10을 넣으면 10% 할인" },
  [BenefitType.FIXED_AMOUNT_OFF]: { placeholder: "예: 5000", hint: "할인 금액 숫자만 (원)" },
  [BenefitType.FREE_MENU_ITEM]: { placeholder: "예: 아메리카노 1잔", hint: "증정할 메뉴 이름" },
  [BenefitType.SPACE_UPGRADE]: { placeholder: "예: 룸 무료 업그레이드", hint: "업그레이드 내용" },
  [BenefitType.TIME_EXTENSION]: { placeholder: "예: 30분 연장", hint: "연장 내용" },
};

// 시간 입력 15분 단위 스냅
function snap15(t: string): string {
  const m = /^(\d{1,2}):(\d{2})$/.exec(t);
  if (!m) return t;
  const total = Math.round((parseInt(m[1], 10) * 60 + parseInt(m[2], 10)) / 15) * 15;
  return `${String(Math.floor(total / 60) % 24).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

// 15분 단위 전용 시간 드롭다운 — 브라우저 time input은 step을 무시하는 경우가 있어 확실하게
const TIME_OPTIONS: string[] = (() => {
  const out: string[] = [];
  for (let h = 0; h < 24; h += 1) {
    for (const m of [0, 15, 30, 45]) {
      out.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    }
  }
  return out;
})();

function TimeSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const v = snap15(value);
  return (
    <Select value={v} onChange={(event) => onChange(event.target.value)}>
      {TIME_OPTIONS.map((t) => (
        <option key={t} value={t}>
          {t}
        </option>
      ))}
    </Select>
  );
}

const mockRule = {
  name: "평일 저녁 4인 룰",
  days: [true, true, true, true, false, false, false],
  timeBlocks: [{ start: "18:00", end: "20:00" }],
  partyMin: "4",
  partyMax: "6",
  leadMin: "30",
  leadMax: "240",
  benefitId: "1",
  benefitType: BenefitType.FREE_MENU_ITEM,
  benefitValue: "음료 1잔",
  dailyCap: "20",
  minSpend: "30000",
  visibility: "public",
};

type BenefitItem = {
  id: string | number;
  title: string;
  type?: BenefitType;
};

type RuleResponse = {
  id?: string | number;
  name?: string;
  days?: boolean[];
  timeBlocks?: Array<{ start: string; end: string }>;
  partySize?: { min?: number; max?: number };
  leadTime?: { min?: number; max?: number };
  benefit?: { id?: string | number; type?: BenefitType };
  benefitValue?: string;
  guardrails?: { dailyCap?: number; minSpend?: number };
  visibility?: "public" | "private";
};

type PresetSetters = {
  setName: (value: string) => void;
  setBenefitType: (value: BenefitType) => void;
  setBenefitValue: (value: string) => void;
  setPartyMin: (value: string) => void;
  setPartyMax: (value: string) => void;
  setLeadMin: (value: string) => void;
  setLeadMax: (value: string) => void;
  setTimeBlocks: (value: Array<{ start: string; end: string }>) => void;
  setMinSpend: (value: string) => void;
};

const presets = [
  {
    key: "rainy",
    label: "⚡ 비오는 날 공실 채우기",
    apply: (setters: PresetSetters) => {
      setters.setName("비오는 날 번개");
      setters.setBenefitType(BenefitType.FREE_MENU_ITEM);
      setters.setBenefitValue("전/막걸리");
      setters.setPartyMin("2");
      setters.setPartyMax("4");
      setters.setLeadMin("0");
      setters.setLeadMax("1440");
    },
  },
  {
    key: "group",
    label: "👨‍👩‍👧‍👦 단체 회식 유치",
    apply: (setters: PresetSetters) => {
      setters.setName("단체 회식 우대");
      setters.setBenefitType(BenefitType.FREE_MENU_ITEM);
      setters.setBenefitValue("소주 2병");
      setters.setPartyMin("6");
      setters.setPartyMax("12");
      setters.setMinSpend("100000");
    },
  },
  {
    key: "closing",
    label: "⏰ 마감 직전 타임세일",
    apply: (setters: PresetSetters) => {
      setters.setName("마감 떨이 할인");
      setters.setBenefitType(BenefitType.PERCENT_DISCOUNT);
      setters.setBenefitValue("20%");
      setters.setTimeBlocks([{ start: "21:00", end: "23:00" }]);
      setters.setLeadMin("30");
      setters.setLeadMax("240");
    },
  },
];

function buildBenefitMessage(type: BenefitType, value: string) {
  switch (type) {
    case BenefitType.TIME_EXTENSION:
      return `⏰ 이용 시간 ${value || "30분"} 연장 혜택!`;
    case BenefitType.EARLY_ACCESS:
      return `⏰ ${value || "10분"} 일찍 입장 혜택!`;
    case BenefitType.LATE_CHECKOUT:
      return `⏰ ${value || "10분"} 늑게 체크아웃 혜택!`;
    case BenefitType.SPACE_UPGRADE:
      return `✨ ${value || "룸/좌석 업그레이드"} 무료 업그레이드!`;
    case BenefitType.FREE_EQUIPMENT:
      return `✨ ${value || "장비"} 대여 혜택!`;
    case BenefitType.CORKAGE_FREE:
      return "✨ 콜키지 프리 혜택!";
    case BenefitType.FREE_MENU_ITEM:
      return `🎁 ${value || "메뉴 증정"} 혜택!`;
    case BenefitType.SIZE_UPGRADE:
      return `🎁 ${value || "사이즈업"} 혜택!`;
    case BenefitType.UNLIMITED_REFILL:
      return "🎁 무제한 리필 혜택!";
    case BenefitType.PERCENT_DISCOUNT:
      return `💸 ${value || "10%"} 할인 혜택!`;
    case BenefitType.FIXED_AMOUNT_OFF:
      return `💸 ${value || "5000원"} 할인 혜택!`;
    default:
      return value || "혜택";
  }
}

export function RuleBuilderPage({
  storeId,
  ruleId,
}: {
  storeId?: string;
  ruleId?: string;
}) {
  const router = useRouter();
  const contextStoreId = useStoreId();
  const resolvedStoreId =
    storeId && storeId !== "undefined" && storeId !== "null"
      ? storeId
      : contextStoreId ?? undefined;

  if (!resolvedStoreId) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-600">
        {"가게 정보를 불러올 수 없습니다. 매장을 선택해 주세요."}
      </div>
    );
  }

  const storeIdValue = resolvedStoreId;
  const storeName =
    storeIdValue === "dev-store"
      ? "테스트 매장"
      : "데모 스토어";
  const storeCategory = "식당/밥집";
  const { data: benefitRows = [] } = useBenefits(storeIdValue);
  const { data: ruleRows = [], createRule, updateRule } = useRules(storeIdValue);

  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [days, setDays] = useState([true, true, true, true, false, false, false]);
  const [recurrenceDays, setRecurrenceDays] = useState<string[]>(
    dayCodes.filter((_, index) => [true, true, true, true, false, false, false][index])
  );
  const [activeTimeStart, setActiveTimeStart] = useState("18:00");
  const [activeTimeEnd, setActiveTimeEnd] = useState("20:00");
  const [isAutoApply, setIsAutoApply] = useState(false);
  const [timeBlocks, setTimeBlocks] = useState([
    { start: "18:00", end: "20:00" },
  ]);
  const [partyMin, setPartyMin] = useState("2");
  const [partyMax, setPartyMax] = useState("4");
  const [leadMin, setLeadMin] = useState("30");
  const [leadMax, setLeadMax] = useState("240");
  const [benefitId, setBenefitId] = useState("1");
  const [benefitType, setBenefitType] = useState<BenefitType>(
    BenefitType.FREE_MENU_ITEM
  );
  const [benefitValue, setBenefitValue] = useState("");
  const [dailyCap, setDailyCap] = useState("20");
  const [minSpend, setMinSpend] = useState("30000");
  const [visibility, setVisibility] = useState<"public" | "private">("public");
  // 핫딜 운영루프: 수량(0=무제한) / 유효기간
  const [inventoryCap, setInventoryCap] = useState("0");
  const [validFrom, setValidFrom] = useState("");
  const [validTo, setValidTo] = useState("");
  const [catalog, setCatalog] = useState<BenefitItem[]>([]);
  // 혜택 입력 모드: 저장된 혜택(카탈로그) 선택 vs 직접 입력
  const [benefitMode, setBenefitMode] = useState<"saved" | "custom">("saved");
  useEffect(() => {
    if (catalog.length === 0) setBenefitMode("custom");
  }, [catalog.length]);

  useEffect(() => {
    if (benefitRows.length > 0) {
      setCatalog(
        benefitRows.map((item) => ({
          id: item.id,
          title: item.title,
          type: item.type,
        }))
      );
    } else {
      // 혜택 미등록이면 가짜 혜택(mock) 대신 빈 목록 — 존재하지 않는 benefit_id로 룰 저장되는 것 방지
      setCatalog([]);
    }

    async function loadRule() {
      if (ruleId) {
        const localTarget = ruleRows.find((item) => String(item.id) === String(ruleId));
        if (localTarget) {
          setName(localTarget.name ?? "");
          setDays(localTarget.days ?? days);
          setTimeBlocks(localTarget.time_blocks ?? timeBlocks);
          setPartyMin(String(localTarget.party_min ?? partyMin));
          setPartyMax(String(localTarget.party_max ?? partyMax));
          setInventoryCap(String(localTarget.inventory_cap ?? 0));
          setValidFrom(localTarget.valid_from ?? "");
          setValidTo(localTarget.valid_to ?? "");
          setLeadMin(String(localTarget.lead_min ?? leadMin));
          setLeadMax(String(localTarget.lead_max ?? leadMax));
          setBenefitId(String(localTarget.benefit_id ?? benefitId));
          setBenefitType((localTarget.benefit_type ?? benefitType) as BenefitType);
          setBenefitValue(String(localTarget.benefit_value ?? benefitValue));
          const guardrails = localTarget.guardrails ?? {};
          setDailyCap(String(guardrails.daily_cap ?? dailyCap));
          setMinSpend(String(guardrails.min_spend ?? minSpend));
          setVisibility((localTarget.visibility as "public" | "private") ?? "public");
          setRecurrenceDays(
            localTarget.recurrence_days && localTarget.recurrence_days.length > 0
              ? localTarget.recurrence_days
              : (localTarget.days ?? days)
                  .map((enabled, idx) => (enabled ? dayCodes[idx] : null))
                  .filter(Boolean) as string[]
          );
          setActiveTimeStart(
            localTarget.active_time_start ?? timeBlocks[0]?.start ?? "18:00"
          );
          setActiveTimeEnd(
            localTarget.active_time_end ?? timeBlocks[0]?.end ?? "20:00"
          );
          setIsAutoApply(Boolean(localTarget.is_auto_apply));
          return;
        }
      }

      if (ruleId) {
        setName(mockRule.name);
        setDays(mockRule.days);
        setTimeBlocks(mockRule.timeBlocks);
        setPartyMin(mockRule.partyMin);
        setPartyMax(mockRule.partyMax);
        setLeadMin(mockRule.leadMin);
        setLeadMax(mockRule.leadMax);
        setBenefitId(mockRule.benefitId);
        setBenefitType(mockRule.benefitType);
        setBenefitValue(mockRule.benefitValue);
        setDailyCap(mockRule.dailyCap);
        setMinSpend(mockRule.minSpend);
        setVisibility(mockRule.visibility as "public" | "private");
        setRecurrenceDays(
          mockRule.days
            .map((enabled, idx) => (enabled ? dayCodes[idx] : null))
            .filter(Boolean) as string[]
        );
        setActiveTimeStart(mockRule.timeBlocks[0]?.start ?? "18:00");
        setActiveTimeEnd(mockRule.timeBlocks[0]?.end ?? "20:00");
        setIsAutoApply(false);
      }
      return;
    }

    void loadRule();
  }, [storeIdValue, ruleId, benefitRows, ruleRows]);

  useEffect(() => {
    if (!catalog.length) return;
    const exists = catalog.some((item) => String(item.id) === String(benefitId));
    if (!exists) {
      setBenefitId(String(catalog[0].id));
    }
  }, [catalog, benefitId]);

  const summary = useMemo(() => {
    const benefit = catalog.find((item) => String(item.id) === benefitId);
    return {
      name,
      days: days
        .map((enabled, index) => (enabled ? dayLabels[index] : null))
        .filter(Boolean)
        .join(", "),
      timeBlocks: timeBlocks
        .map((block) => `${block.start}~${block.end}`)
        .join(", "),
      partySize: `${partyMin}~${partyMax}`,
      leadTime: `${leadMin}~${leadMax} 분`,
      benefit: benefit ? benefit.title : benefitTypeLabelMap[benefitType],
      benefitValue,
      guardrails: `하루 선착순 ${dailyCap}팀, 최소 결제 금액 ${minSpend}원`,
      visibility,
      benefitType: benefit?.type ?? benefitType,
    };
  }, [
    name,
    days,
    timeBlocks,
    partyMin,
    partyMax,
    leadMin,
    leadMax,
    benefitId,
    benefitType,
    benefitValue,
    dailyCap,
    minSpend,
    catalog,
    visibility,
  ]);

  async function handleSave() {
    const payload = {
      name,
      days,
      timeBlocks,
      partySize: { min: Number(partyMin), max: Number(partyMax) },
      leadTime: { min: Number(leadMin), max: Number(leadMax) },
      benefitId,
      benefitType,
      benefitValue,
      guardrails: { dailyCap: Number(dailyCap), minSpend: Number(minSpend) },
      visibility,
      is_private: visibility === "private",
    };

    const placeId = Number(storeIdValue);
    const ruleRow = {
      id: ruleId ?? crypto.randomUUID(),
      place_id: Number.isFinite(placeId) ? placeId : undefined,
      name,
      enabled: true,
      days,
      // 반복 정보는 UI에서 재입력받지 않고 요일/첫 시간대에서 자동 유도
      recurrence_days: days
        .map((enabled, idx) => (enabled ? dayCodes[idx] : null))
        .filter(Boolean) as string[],
      active_time_start: timeBlocks[0]?.start ?? activeTimeStart,
      active_time_end: timeBlocks[0]?.end ?? activeTimeEnd,
      is_auto_apply: isAutoApply,
      time_blocks: timeBlocks,
      party_min: Number(partyMin),
      party_max: Number(partyMax),
      lead_min: Number(leadMin),
      lead_max: Number(leadMax),
      benefit_id: benefitId,
      benefit_title: summary.benefit,
      benefit_type: String(benefitType),
      benefit_value: benefitValue,
      guardrails: { daily_cap: Number(dailyCap), min_spend: Number(minSpend) },
      visibility,
      inventory_cap: Number(inventoryCap) || 0,
      valid_from: validFrom || null,
      valid_to: validTo || null,
    };

    try {
      if (ruleId) {
        const { id, ...payload } = ruleRow;
        await updateRule.mutateAsync({ id: String(id), ...payload });
      } else {
        await createRule.mutateAsync(ruleRow);
      }
      window.alert("성공적으로 저장되었습니다!");
      router.push(`/stores/${storeIdValue}/offers/rules`);
    } catch (error) {
      console.error(error);
      window.alert("서버 저장을 실패했습니다.");
    }
  }

  const previewMessage = buildBenefitMessage(
    summary.benefitType as BenefitType,
    summary.benefitValue
  );

  const presetSetters: PresetSetters = {
    setName,
    setBenefitType,
    setBenefitValue,
    setPartyMin,
    setPartyMax,
    setLeadMin,
    setLeadMax,
    setTimeBlocks,
    setMinSpend,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{"룰 빌더"}</h1>
          <p className="text-sm text-slate-500">
            {"조건 / 혜택 / 상세 조건 설정 / 미리보기"}
          </p>
        </div>
        <Button onClick={handleSave}>{"저장"}</Button>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
        <div className="text-sm font-medium">{`단계 ${step}`}</div>
        {step === 1 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="text-sm font-medium">{"⚡ 자주 쓰는 규칙 불러오기"}</div>
              <div className="flex flex-wrap gap-2">
                {presets.map((preset) => (
                  <Button
                    key={preset.key}
                    variant="secondary"
                    className="rounded-full"
                    onClick={() => preset.apply(presetSetters)}
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{"규칙 이름"}</label>
              <Input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="평일 저녁 4인 룰"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{"요일"}</label>
              <div className="flex flex-wrap gap-2">
                {dayLabels.map((label, index) => (
                  <label key={label} className="flex items-center gap-1 text-sm">
                    <input
                      type="checkbox"
                      checked={days[index]}
                      onChange={() =>
                        setDays((prev) =>
                          prev.map((value, idx) => (idx === index ? !value : value))
                        )
                      }
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{"적용할 시간대"}</label>
              <div className="space-y-2">
                {timeBlocks.map((block, index) => (
                  <div key={`${block.start}-${index}`} className="flex gap-2">
                    <TimeSelect
                      value={block.start}
                      onChange={(v) =>
                        setTimeBlocks((prev) =>
                          prev.map((item, idx) => (idx === index ? { ...item, start: v } : item))
                        )
                      }
                    />
                    <TimeSelect
                      value={block.end}
                      onChange={(v) =>
                        setTimeBlocks((prev) =>
                          prev.map((item, idx) => (idx === index ? { ...item, end: v } : item))
                        )
                      }
                    />
                    <Button
                      variant="ghost"
                      onClick={() =>
                        setTimeBlocks((prev) => prev.filter((_, idx) => idx !== index))
                      }
                    >
                      {"삭제"}
                    </Button>
                  </div>
                ))}
              </div>
              <Button
                variant="secondary"
                onClick={() =>
                  setTimeBlocks((prev) => [...prev, { start: "18:00", end: "20:00" }])
                }
              >
                {"시간대 추가"}
              </Button>
            </div>
            {/* 반복은 별도 요일/시간 재입력 없이 체크 하나 — 위의 요일·시간대가 매주 그대로 반복됨 */}
            <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={isAutoApply}
                onChange={(event) => setIsAutoApply(event.target.checked)}
              />
              <span>
                {"🔁 매주 반복"}
                <span className="ml-1 text-xs text-slate-400">
                  {"— 위에서 고른 요일·시간대가 매주 자동 적용돼요 (예약 스케줄러에도 표시)"}
                </span>
              </span>
            </label>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">{"인원 제한 (최소)"}</label>
                <Input
                  type="number"
                  value={partyMin}
                  onChange={(event) => setPartyMin(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{"인원 제한 (최대)"}</label>
                <Input
                  type="number"
                  value={partyMax}
                  onChange={(event) => setPartyMax(event.target.value)}
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {"예약 마감 (방문 N분 전까지)"}
                </label>
                <Input
                  type="number"
                  step={15}
                  min={0}
                  value={leadMin}
                  onChange={(event) => setLeadMin(event.target.value)}
                  onBlur={(event) => {
                    const n = Math.max(0, Math.round((Number(event.target.value) || 0) / 15) * 15);
                    setLeadMin(String(n));
                  }}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {"예약 오픈 (방문 N분 전부터)"}
                </label>
                <Input
                  type="number"
                  step={15}
                  min={0}
                  value={leadMax}
                  onChange={(event) => setLeadMax(event.target.value)}
                  onBlur={(event) => {
                    const n = Math.max(0, Math.round((Number(event.target.value) || 0) / 15) * 15);
                    setLeadMax(String(n));
                  }}
                />
              </div>
            </div>
          </div>
        )}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <div className="text-sm font-medium">{"손님에게 어떤 혜택을 드릴까요?"}</div>
              <p className="mt-0.5 text-xs text-slate-400">
                {"자주 쓰는 혜택은 저장해두고 골라 쓸 수 있어요."}
              </p>
            </div>

            {/* 모드 선택: 저장된 혜택 vs 직접 입력 */}
            <div className="grid grid-cols-2 rounded-xl bg-slate-100 p-1 text-sm font-semibold">
              <button
                type="button"
                onClick={() => catalog.length > 0 && setBenefitMode("saved")}
                className={`rounded-lg py-2 transition-colors ${
                  benefitMode === "saved"
                    ? "bg-white text-slate-900 shadow-sm"
                    : catalog.length === 0
                      ? "cursor-not-allowed text-slate-300"
                      : "text-slate-500"
                }`}
              >
                {`📁 저장된 혜택${catalog.length > 0 ? ` (${catalog.length})` : ""}`}
              </button>
              <button
                type="button"
                onClick={() => setBenefitMode("custom")}
                className={`rounded-lg py-2 transition-colors ${
                  benefitMode === "custom" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
                }`}
              >
                {"✏️ 직접 입력"}
              </button>
            </div>

            {benefitMode === "saved" ? (
              <div className="space-y-2">
                <label className="text-sm font-medium">{"혜택 선택"}</label>
                <div className="space-y-1.5">
                  {catalog.map((benefit) => {
                    const on = String(benefitId) === String(benefit.id);
                    return (
                      <button
                        key={benefit.id}
                        type="button"
                        onClick={() => {
                          setBenefitId(String(benefit.id));
                          if (benefit.type) setBenefitType(benefit.type);
                          setBenefitValue(benefit.title);
                        }}
                        className={`flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-left text-sm transition-colors ${
                          on ? "border-brand bg-amber-50 font-semibold" : "border-slate-200 bg-white hover:border-brand"
                        }`}
                      >
                        <span>{benefit.title}</span>
                        <span className="text-xs text-slate-400">
                          {benefit.type ? benefitTypeLabelMap[benefit.type] ?? "" : ""}
                          {on && " ✓"}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <button
                  type="button"
                  onClick={() => router.push(`/stores/${storeIdValue}/offers/benefits`)}
                  className="text-xs font-semibold text-brand"
                >
                  {"+ 새 혜택 만들기 (혜택 카탈로그로 이동)"}
                </button>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">{"혜택 종류"}</label>
                  <Select
                    value={benefitType}
                    onChange={(event) => {
                      setBenefitType(event.target.value as BenefitType);
                      setBenefitValue("");
                    }}
                  >
                    {benefitTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">{"혜택 내용"}</label>
                  <Input
                    value={benefitValue}
                    onChange={(event) => setBenefitValue(event.target.value)}
                    placeholder={benefitValueHints[benefitType]?.placeholder ?? "예: 10% 할인"}
                  />
                  <p className="text-xs text-slate-400">
                    {benefitValueHints[benefitType]?.hint ?? "손님 앱 핫딜 카드에 그대로 표시돼요."}
                  </p>
                </div>
                {catalog.length === 0 && (
                  <p className="text-xs text-slate-400">
                    {"💡 자주 쓰는 혜택이라면 "}
                    <button
                      type="button"
                      onClick={() => router.push(`/stores/${storeIdValue}/offers/benefits`)}
                      className="font-semibold text-brand"
                    >
                      {"혜택 카탈로그"}
                    </button>
                    {"에 저장해두면 다음부터 골라 쓸 수 있어요."}
                  </p>
                )}
              </>
            )}
          </div>
        )}
        {step === 3 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{"하루 선착순 (팀)"}</label>
              <Input
                value={dailyCap}
                onChange={(event) => setDailyCap(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{"최소 결제 금액 (객단가)"}</label>
              <Input
                value={minSpend}
                onChange={(event) => setMinSpend(event.target.value)}
              />
            </div>
            {/* 핫딜 수량 / 유효기간 (소진·만료 시 B2C 노출 자동 중단) */}
            <div className="space-y-2">
              <label className="text-sm font-medium">{"핫딜 수량 (0 = 무제한)"}</label>
              <Input
                type="number"
                value={inventoryCap}
                onChange={(event) => setInventoryCap(event.target.value)}
                placeholder="예: 20 (수량 소진 시 자동 마감)"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">{"유효 시작일"}</label>
                <Input type="date" value={validFrom} onChange={(event) => setValidFrom(event.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{"유효 종료일"}</label>
                <Input type="date" value={validTo} onChange={(event) => setValidTo(event.target.value)} />
              </div>
            </div>
            <p className="text-xs text-slate-400">{"비워두면 상시 진행. 수량 소진·기간 만료 시 앱에서 자동으로 내려갑니다."}</p>
            <div className="space-y-2">
              <label className="text-sm font-medium">{"상세 조건 설정"}</label>
              <div className="space-y-2 text-sm text-slate-600">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="visibility"
                    value="public"
                    checked={visibility === "public"}
                    onChange={() => setVisibility("public")}
                  />
                  {"공개"}
                  <span className="text-xs text-slate-500">
                    {"핫딜 탭에 모든 사람에게 노출합니다. (공실 해결 최적)"}
                  </span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="visibility"
                    value="private"
                    checked={visibility === "private"}
                    onChange={() => setVisibility("private")}
                  />
                  {"비공개 제안"}
                  <span className="text-xs text-slate-500">
                    {
                      "핫딜 탭에 노출하지 않고, AI가 적합한 손님에게만 제안합니다. (브랜드 보호)"
                    }
                  </span>
                </label>
              </div>
            </div>
          </div>
        )}
        {step === 4 && (
          <Card>
            <CardHeader>
              <CardTitle>{"미리보기"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-slate-600">
              <div>{"사장님, 학생들에게는 이렇게 보입니다."}</div>
              <HotDealCard
                title={summary.name || "-"}
                benefit={previewMessage}
                timer="마감까지 02:15"
                visibility={summary.visibility}
                storeName={storeName}
                category={storeCategory}
              />
              <div>{"요일: "}{summary.days || "-"}</div>
              <div>{"시간대: "}{summary.timeBlocks || "-"}</div>
              <div>{"인원 제한: "}{summary.partySize}</div>
              <div>{"예약 마감/오픈: "}{summary.leadTime}</div>
              <div>{"상세 조건 설정: "}{summary.guardrails}</div>
            </CardContent>
          </Card>
        )}
        <div className="flex justify-between">
          <Button
            variant="secondary"
            onClick={() => setStep((prev) => Math.max(1, prev - 1))}
            disabled={step === 1}
          >
            {"이전"}
          </Button>
          {step < 4 ? (
            <Button onClick={() => setStep((prev) => prev + 1)}>
              {"다음"}
            </Button>
          ) : (
            <Button onClick={handleSave}>{"완료"}</Button>
          )}
        </div>
      </div>
    </div>
  );
}
