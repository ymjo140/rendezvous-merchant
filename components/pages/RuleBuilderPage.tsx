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
import { useBenefits } from "@/lib/hooks/useBenefits";
import { useRules } from "@/lib/hooks/useRules";

const dayLabels = ["??, "??, "??, "紐?, "湲?, "??, "??];

const benefitTypes = [
  { value: BenefitType.FREE_MENU_ITEM, label: "硫붾돱 利앹젙" },
  { value: BenefitType.SPACE_UPGRADE, label: "猷?醫뚯꽍 ?낃렇?덉씠?? },
  { value: BenefitType.TIME_EXTENSION, label: "?쒓컙 ?곗옣" },
  { value: BenefitType.PERCENT_DISCOUNT, label: "?뺣쪧 ?좎씤" },
  { value: BenefitType.FIXED_AMOUNT_OFF, label: "?뺤븸 ?좎씤" },
];

const benefitTypeLabelMap: Record<BenefitType, string> = {
  [BenefitType.PERCENT_DISCOUNT]: "?뺣쪧 ?좎씤",
  [BenefitType.FIXED_AMOUNT_OFF]: "?뺤븸 ?좎씤",
  [BenefitType.FREE_MENU_ITEM]: "硫붾돱 利앹젙",
  [BenefitType.SIZE_UPGRADE]: "?ъ씠利덉뾽",
  [BenefitType.UNLIMITED_REFILL]: "臾댁젣??由ы븘",
  [BenefitType.TIME_EXTENSION]: "?쒓컙 ?곗옣",
  [BenefitType.EARLY_ACCESS]: "?쇰━ 泥댄겕??,
  [BenefitType.LATE_CHECKOUT]: "?덉씠??泥댄겕?꾩썐",
  [BenefitType.SPACE_UPGRADE]: "猷?醫뚯꽍 ?낃렇?덉씠??,
  [BenefitType.FREE_EQUIPMENT]: "?λ퉬 ???,
  [BenefitType.CORKAGE_FREE]: "肄쒗궎吏 ?꾨━",
};

const mockBenefits = [
  { id: "1", title: "?뚮즺 1??, type: BenefitType.FREE_MENU_ITEM },
  { id: "2", title: "李쎄? 醫뚯꽍", type: BenefitType.SPACE_UPGRADE },
];

const mockRule = {
  name: "?됱씪 ???4??,
  days: [true, true, true, true, false, false, false],
  timeBlocks: [{ start: "18:00", end: "20:00" }],
  partyMin: "4",
  partyMax: "6",
  leadMin: "30",
  leadMax: "240",
  benefitId: "1",
  benefitType: BenefitType.FREE_MENU_ITEM,
  benefitValue: "?뚮즺 1??,
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
    label: "?뙢截?鍮꾩삤????怨듭떎 梨꾩슦湲?,
    apply: (setters: PresetSetters) => {
      setters.setName("鍮꾩삤????踰덇컻");
      setters.setBenefitType(BenefitType.FREE_MENU_ITEM);
      setters.setBenefitValue("??留됯구由?);
      setters.setPartyMin("2");
      setters.setPartyMax("4");
      setters.setLeadMin("0");
      setters.setLeadMax("1440");
    },
  },
  {
    key: "group",
    label: "?뫅?랅윉⒱랅윉㎮랅윉??⑥껜 ?뚯떇 ?좎튂",
    apply: (setters: PresetSetters) => {
      setters.setName("?⑥껜 ?뚯떇 ?곕?");
      setters.setBenefitType(BenefitType.FREE_MENU_ITEM);
      setters.setBenefitValue("?뚯＜ 2蹂?);
      setters.setPartyMin("6");
      setters.setPartyMax("12");
      setters.setMinSpend("100000");
    },
  },
  {
    key: "closing",
    label: "??留덇컧 吏곸쟾 ??꾩꽭??,
    apply: (setters: PresetSetters) => {
      setters.setName("留덇컧 ?⑥씠 ?좎씤");
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
      return `???댁슜 ?쒓컙 ${value || "30遺?} ?곗옣 ?쒗깮!`;
    case BenefitType.EARLY_ACCESS:
      return `??${value || "10遺?} ?쇱컢 ?낆옣 ?쒗깮!`;
    case BenefitType.LATE_CHECKOUT:
      return `??${value || "10遺?} ??쾶 泥댄겕?꾩썐 ?쒗깮!`;
    case BenefitType.SPACE_UPGRADE:
      return `??${value || "猷??낃렇?덉씠??} 臾대즺 ?낃렇?덉씠??`;
    case BenefitType.FREE_EQUIPMENT:
      return `??${value || "?λ퉬"} ????쒗깮!`;
    case BenefitType.CORKAGE_FREE:
      return "??肄쒗궎吏 ?꾨━ ?쒗깮!";
    case BenefitType.FREE_MENU_ITEM:
      return `?럞 ${value || "硫붾돱 利앹젙"} ?쒗깮!`;
    case BenefitType.SIZE_UPGRADE:
      return `?럞 ${value || "?ъ씠利덉뾽"} ?쒗깮!`;
    case BenefitType.UNLIMITED_REFILL:
      return "?럞 臾댁젣??由ы븘 ?쒗깮!";
    case BenefitType.PERCENT_DISCOUNT:
      return `?뮯 ${value || "10%"} ?좎씤 ?쒗깮!`;
    case BenefitType.FIXED_AMOUNT_OFF:
      return `?뮯 ${value || "5000??} ?좎씤 ?쒗깮!`;
    default:
      return value || "?쒗깮";
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
  const storeName =
    resolvedStoreId === "dev-store"
      ? "\uD14C\uC2A4\uD2B8 \uB9E4\uC7A5"
      : "\uB370\uBAA8 \uC2A4\uD1A0\uC5B4";
  const storeCategory = "\uC2DD\uB2F9/\uBC25\uC9D1";
  const { data: benefitRows = [] } = useBenefits(resolvedStoreId);
  const { data: ruleRows = [], createRule, updateRule } = useRules(resolvedStoreId);
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
    if (benefitRows.length > 0) {
      setCatalog(
        benefitRows.map((item) => ({
          id: item.id,
          title: item.title,
          type: item.type,
        }))
      );
    } else {
      setCatalog(mockBenefits);
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
          setLeadMin(String(localTarget.lead_min ?? leadMin));
          setLeadMax(String(localTarget.lead_max ?? leadMax));
          setBenefitId(String(localTarget.benefit_id ?? benefitId));
          setBenefitType((localTarget.benefit_type ?? benefitType) as BenefitType);
          setBenefitValue(String(localTarget.benefit_value ?? benefitValue));
          const guardrails = localTarget.guardrails ?? {};
          setDailyCap(String(guardrails.daily_cap ?? dailyCap));
          setMinSpend(String(guardrails.min_spend ?? minSpend));
          setVisibility((localTarget.visibility as "public" | "private") ?? "public");
          return;
        }
      }
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

    void loadRule();
  }, [resolvedStoreId, ruleId, benefitRows, ruleRows]);

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
      leadTime: `${leadMin}~${leadMax} 遺?,
      benefit: benefit ? benefit.title : benefitTypeLabelMap[benefitType],
      benefitValue,
      guardrails: `?섎（ ?좎갑??${dailyCap}?, 理쒖냼 寃곗젣 湲덉븸 ${minSpend}??,
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

    const ruleRow = {
      id: ruleId ?? crypto.randomUUID(),
      store_id: resolvedStoreId ?? "dev-store",
      name,
      enabled: true,
      days,
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
    };

    try {
      if (ruleId) {
        await updateRule.mutateAsync({ id: String(ruleRow.id), ...ruleRow });
      } else {
        await createRule.mutateAsync(ruleRow);
      }
    } catch {
      // ignore
    }

    if (!baseURL || resolvedStoreId === "default") {
      window.alert("\uC131\uACF5\uC801\uC73C\uB85C \uC800\uC7A5\uB418\uC5C8\uC2B5\uB2C8\uB2E4!");
      router.push(`/stores/${resolvedStoreId}/offers/rules`);
      return;
    }

    try {
      await fetchWithAuth(endpoints.offerRules(resolvedStoreId), {
        method: ruleId ? "PATCH" : "POST",
        body: JSON.stringify({ id: ruleId, ...payload }),
      });
      window.alert("\uC131\uACF5\uC801\uC73C\uB85C \uC800\uC7A5\uB418\uC5C8\uC2B5\uB2C8\uB2E4!");
      router.push(`/stores/${resolvedStoreId}/offers/rules`);
    } catch {
      window.alert("\uC11C\uBC84 \uC800\uC7A5\uC740 \uC2E4\uD328\uD588\uC9C0\uB9CC, \uD654\uBA74\uC5D0\uB294 \uBC18\uC601\uB418\uC5C8\uC2B5\uB2C8\uB2E4.");
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
          <h1 className="text-2xl font-semibold">猷?鍮뚮뜑</h1>
          <p className="text-sm text-slate-500">
            議곌굔 / ?쒗깮 / ?곸꽭 議곌굔 ?ㅼ젙 / 誘몃━蹂닿린
          </p>
        </div>
        <Button onClick={handleSave}>???/Button>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
        <div className="text-sm font-medium">?④퀎 {step}</div>
        {step === 1 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="text-sm font-medium">???먯＜ ?곕뒗 洹쒖튃 遺덈윭?ㅺ린</div>
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
              <label className="text-sm font-medium">洹쒖튃 ?대쫫</label>
              <Input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="?됱씪 ???4??
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">?붿씪</label>
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
              <label className="text-sm font-medium">?곸슜???쒓컙?</label>
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
                      ??젣
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
                ?쒓컙? 異붽?
              </Button>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">?몄썝 ?쒗븳 (理쒖냼)</label>
                <Input
                  type="number"
                  value={partyMin}
                  onChange={(event) => setPartyMin(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">?몄썝 ?쒗븳 (理쒕?)</label>
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
                  ?덉빟 留덇컧 (諛⑸Ц N遺??꾧퉴吏)
                </label>
                <Input
                  type="number"
                  value={leadMin}
                  onChange={(event) => setLeadMin(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  ?덉빟 ?ㅽ뵂 (諛⑸Ц N遺??꾨???
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
              <label className="text-sm font-medium">???쒗깮 遺덈윭?ㅺ린</label>
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
              <label className="text-sm font-medium">?쒗깮 醫낅쪟</label>
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
              <label className="text-sm font-medium">?쒗깮 ?댁슜</label>
              <Input
                value={benefitValue}
                onChange={(event) => setBenefitValue(event.target.value)}
                placeholder="?? ??留됯구由? 10% ?좎씤"
              />
            </div>
          </div>
        )}
        {step === 3 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">?섎（ ?좎갑??(?)</label>
              <Input
                value={dailyCap}
                onChange={(event) => setDailyCap(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">理쒖냼 寃곗젣 湲덉븸 (媛앸떒媛)</label>
              <Input
                value={minSpend}
                onChange={(event) => setMinSpend(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">?곸꽭 議곌굔 ?ㅼ젙</label>
              <div className="space-y-2 text-sm text-slate-600">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="visibility"
                    value="public"
                    checked={visibility === "public"}
                    onChange={() => setVisibility("public")}
                  />
                  怨듦컻
                  <span className="text-xs text-slate-500">
                    ?ル뵜 ??뿉 紐⑤뱺 ?щ엺?먭쾶 ?몄텧?⑸땲?? (怨듭떎 ?닿껐??理쒖쟻)
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
                  鍮꾧났媛??쒖븞
                  <span className="text-xs text-slate-500">
                    ?ル뵜 ??뿉 ?몄텧?섏? ?딄퀬, AI媛 ?곹빀???먮떂?먭쾶留??諛?섍쾶 ?쒖븞?⑸땲??
                    (釉뚮옖???대?吏 蹂댄샇)
                  </span>
                </label>
              </div>
            </div>
          </div>
        )}
        {step === 4 && (
          <Card>
            <CardHeader>
              <CardTitle>誘몃━蹂닿린</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-slate-600">
              <div>?ъ옣?? ?숈깮?ㅼ뿉寃뚮뒗 ?대젃寃?蹂댁엯?덈떎.</div>
              <HotDealCard
                title={summary.name || "-"}
                benefit={previewMessage}
                timer="\uB9C8\uAC10\uAE4C\uC9C0 02:15"
                visibility={summary.visibility}
                storeName={storeName}
                category={storeCategory}
              />
              <div>?붿씪: {summary.days || "-"}</div>
              <div>?쒓컙?: {summary.timeBlocks || "-"}</div>
              <div>?몄썝 ?쒗븳: {summary.partySize}</div>
              <div>?덉빟 留덇컧/?ㅽ뵂: {summary.leadTime}</div>
              <div>?곸꽭 議곌굔 ?ㅼ젙: {summary.guardrails}</div>
            </CardContent>
          </Card>
        )}
        <div className="flex justify-between">
          <Button
            variant="secondary"
            onClick={() => setStep((prev) => Math.max(1, prev - 1))}
            disabled={step === 1}
          >
            ?댁쟾
          </Button>
          {step < 4 ? (
            <Button onClick={() => setStep((prev) => prev + 1)}>
              ?ㅼ쓬
            </Button>
          ) : (
            <Button onClick={handleSave}>?꾨즺</Button>
          )}
        </div>
      </div>
    </div>
  );
}






