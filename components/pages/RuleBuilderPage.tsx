"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchWithAuth, baseURL } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { HotDealCard } from "@/components/offers/HotDealCard";
import { BenefitType } from "@/domain/offers/types";
import { loadBenefits } from "@/lib/utils/benefitsStore";
import { loadRules, saveRules } from "@/lib/utils/rulesStore";

const dayLabels = ["월", "화", "수", "목", "금", "토", "일"];

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

const mockRule = {
  name: "평일 저녁 4인",
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

const presets = [
  {
    key: "rainy",
    label: "🌧️ 비오는 날 공실 채우기",
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

function buildBenefitMessage(type: BenefitType, value: string) {
  switch (type) {
    case BenefitType.TIME_EXTENSION:
      return `⏰ 이용 시간 ${value || "30분"} 연장 혜택!`;
    case BenefitType.EARLY_ACCESS:
      return `⏰ ${value || "10분"} 일찍 입장 혜택!`;
    case BenefitType.LATE_CHECKOUT:
      return `⏰ ${value || "10분"} 늦게 체크아웃 혜택!`;
    case BenefitType.SPACE_UPGRADE:
      return `✨ ${value || "룸 업그레이드"} 무료 업그레이드!`;
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
  const pathname = usePathname();
  const resolvedStoreId =
    storeId ?? (pathname.match(/\/stores\/([^/]+)/)?.[1] ?? "default");
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [days, setDays] = useState([true, true, true, true, false, false, false]);
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
  const [catalog, setCatalog] = useState<BenefitItem[]>(mockBenefits);

  useEffect(() => {
    let active = true;

    async function loadCatalog() {
      const local = loadBenefits(resolvedStoreId);
      if (local && local.length > 0) {
        setCatalog(local);
      }
      if (!resolvedStoreId || resolvedStoreId === "default" || !baseURL) {
        if (!local || local.length === 0) {
          setCatalog(mockBenefits);
        }
        return;
      }
      try {
        const data = await fetchWithAuth<BenefitItem[]>(
          endpoints.benefits(resolvedStoreId)
        );
        if (active && Array.isArray(data)) {
          setCatalog(data);
        }
      } catch {
        if (!local || local.length === 0) {
          setCatalog(mockBenefits);
        }
      }
    }

    async function loadRule() {
      if (!resolvedStoreId || resolvedStoreId === "default" || !ruleId || !baseURL) {
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
        }
        return;
      }

      try {
        const data = await fetchWithAuth<RuleResponse[] | RuleResponse>(
          endpoints.offerRules(resolvedStoreId)
        );
        const target = Array.isArray(data)
          ? data.find((item) => String(item.id) === String(ruleId))
          : null;
        if (target) {
          setName(target.name ?? "");
          setDays(target.days ?? days);
          setTimeBlocks(target.timeBlocks ?? timeBlocks);
          setPartyMin(String(target.partySize?.min ?? partyMin));
          setPartyMax(String(target.partySize?.max ?? partyMax));
          setLeadMin(String(target.leadTime?.min ?? leadMin));
          setLeadMax(String(target.leadTime?.max ?? leadMax));
          setBenefitId(String(target.benefit?.id ?? benefitId));
          setBenefitType((target.benefit?.type ?? benefitType) as BenefitType);
          setBenefitValue(String(target.benefitValue ?? benefitValue));
          setDailyCap(String(target.guardrails?.dailyCap ?? dailyCap));
          setMinSpend(String(target.guardrails?.minSpend ?? minSpend));
          setVisibility((target.visibility as "public" | "private") ?? "public");
        }
      } catch {
        // ignore
      }
    }

    void loadCatalog();
    void loadRule();

    return () => {
      active = false;
    };
  }, [resolvedStoreId, ruleId]);

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

    const localRule = {
      id: ruleId ?? `rule-${Date.now()}`,
      name,
      enabled: true,
      days,
      timeBlocks,
      partySize: { min: Number(partyMin), max: Number(partyMax) },
      leadTime: { min: Number(leadMin), max: Number(leadMax) },
      benefit: { title: summary.benefit },
    };

    const existing = loadRules(resolvedStoreId) ?? [];
    const next = ruleId
      ? existing.map((item) =>
          String(item.id) === String(ruleId) ? { ...item, ...localRule } : item
        )
      : [localRule, ...existing];
    saveRules(resolvedStoreId, next);

    if (!baseURL || resolvedStoreId === "default") {
      window.alert("성공적으로 저장되었습니다!");
      router.push(`/stores/${resolvedStoreId}/offers/rules`);
      return;
    }

    try {
      await fetchWithAuth(endpoints.offerRules(resolvedStoreId), {
        method: ruleId ? "PATCH" : "POST",
        body: JSON.stringify({ id: ruleId, ...payload }),
      });
      window.alert("성공적으로 저장되었습니다!");
      router.push(`/stores/${resolvedStoreId}/offers/rules`);
    } catch {
      window.alert("서버 저장에 실패했습니다. 로컬에 임시 저장되었습니다.");
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
          <h1 className="text-2xl font-semibold">룰 빌더</h1>
          <p className="text-sm text-slate-500">
            조건 / 혜택 / 상세 조건 설정 / 미리보기
          </p>
        </div>
        <Button onClick={handleSave}>저장</Button>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
        <div className="text-sm font-medium">단계 {step}</div>
        {step === 1 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="text-sm font-medium">⚡ 자주 쓰는 규칙 불러오기</div>
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
              <label className="text-sm font-medium">규칙 이름</label>
              <Input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="평일 저녁 4인"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">요일</label>
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
              <label className="text-sm font-medium">적용할 시간대</label>
              <div className="space-y-2">
                {timeBlocks.map((block, index) => (
                  <div key={`${block.start}-${index}`} className="flex gap-2">
                    <Input
                      type="time"
                      value={block.start}
                      onChange={(event) =>
                        setTimeBlocks((prev) =>
                          prev.map((item, idx) =>
                            idx === index
                              ? { ...item, start: event.target.value }
                              : item
                          )
                        )
                      }
                    />
                    <Input
                      type="time"
                      value={block.end}
                      onChange={(event) =>
                        setTimeBlocks((prev) =>
                          prev.map((item, idx) =>
                            idx === index
                              ? { ...item, end: event.target.value }
                              : item
                          )
                        )
                      }
                    />
                    <Button
                      variant="ghost"
                      onClick={() =>
                        setTimeBlocks((prev) => prev.filter((_, idx) => idx !== index))
                      }
                    >
                      삭제
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
                시간대 추가
              </Button>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">인원 제한 (최소)</label>
                <Input
                  type="number"
                  value={partyMin}
                  onChange={(event) => setPartyMin(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">인원 제한 (최대)</label>
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
                  예약 마감 (방문 N분 전까지)
                </label>
                <Input
                  type="number"
                  value={leadMin}
                  onChange={(event) => setLeadMin(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  예약 오픈 (방문 N분 전부터)
                </label>
                <Input
                  type="number"
                  value={leadMax}
                  onChange={(event) => setLeadMax(event.target.value)}
                />
              </div>
            </div>
          </div>
        )}
        {step === 2 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">내 혜택 불러오기</label>
              <Select
                value={benefitId}
                onChange={(event) => setBenefitId(event.target.value)}
              >
                {catalog.map((benefit) => (
                  <option key={benefit.id} value={String(benefit.id)}>
                    {benefit.title}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">혜택 종류</label>
              <Select
                value={benefitType}
                onChange={(event) => setBenefitType(event.target.value as BenefitType)}
              >
                {benefitTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">혜택 내용</label>
              <Input
                value={benefitValue}
                onChange={(event) => setBenefitValue(event.target.value)}
                placeholder="예: 전/막걸리, 10% 할인"
              />
            </div>
          </div>
        )}
        {step === 3 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">하루 선착순 (팀)</label>
              <Input
                value={dailyCap}
                onChange={(event) => setDailyCap(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">최소 결제 금액 (객단가)</label>
              <Input
                value={minSpend}
                onChange={(event) => setMinSpend(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">상세 조건 설정</label>
              <div className="space-y-2 text-sm text-slate-600">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="visibility"
                    value="public"
                    checked={visibility === "public"}
                    onChange={() => setVisibility("public")}
                  />
                  공개
                  <span className="text-xs text-slate-500">
                    핫딜 탭에 모든 사람에게 노출합니다. (공실 해결에 최적)
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
                  비공개 제안
                  <span className="text-xs text-slate-500">
                    핫딜 탭에 노출하지 않고, AI가 적합한 손님에게만 은밀하게 제안합니다.
                    (브랜드 이미지 보호)
                  </span>
                </label>
              </div>
            </div>
          </div>
        )}
        {step === 4 && (
          <Card>
            <CardHeader>
              <CardTitle>미리보기</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-slate-600">
              <div>사장님, 학생들에게는 이렇게 보입니다.</div>
              <HotDealCard
                title={summary.name || "-"}
                benefit={previewMessage}
                timer="마감까지 02:15"
                visibility={summary.visibility}
              />
              <div>요일: {summary.days || "-"}</div>
              <div>시간대: {summary.timeBlocks || "-"}</div>
              <div>인원 제한: {summary.partySize}</div>
              <div>예약 마감/오픈: {summary.leadTime}</div>
              <div>상세 조건 설정: {summary.guardrails}</div>
            </CardContent>
          </Card>
        )}
        <div className="flex justify-between">
          <Button
            variant="secondary"
            onClick={() => setStep((prev) => Math.max(1, prev - 1))}
            disabled={step === 1}
          >
            이전
          </Button>
          {step < 4 ? (
            <Button onClick={() => setStep((prev) => prev + 1)}>
              다음
            </Button>
          ) : (
            <Button onClick={handleSave}>완료</Button>
          )}
        </div>
      </div>
    </div>
  );
}
