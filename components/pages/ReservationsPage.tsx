
"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, Td, Th } from "@/components/ui/table";
import { Dialog } from "@/components/ui/dialog";
import type { TableUnit } from "@/domain/stores/types";
import { useTableUnits } from "@/lib/hooks/useTableUnits";
import { useBenefits, type BenefitRow } from "@/lib/hooks/useBenefits";
import { useRules, type RuleRow } from "@/lib/hooks/useRules";
import {
  useReservations,
  type ReservationRow,
} from "@/lib/hooks/useReservations";
import { useTimeDeals, type TimeDealRow } from "@/lib/hooks/useTimeDeals";
import { autoAssign as runAutoAssign } from "@/lib/hooks/useAutoAssign";
import { useStoreId } from "@/components/layout/Layout";
import { AppReservationsPanel } from "@/components/reservations/AppReservationsPanel";

type ReservationEntry = {
  id: string;
  store_id: string;
  guestName: string;
  guestPhone?: string;
  partySize: number;
  date: string;
  status: "confirmed" | "pending" | "cancelled" | "no_show" | "blocked";
  unit_id: string;
  unit_index: number;
  start_time: string;
  end_time: string;
  notes?: string;
  source?: "internal" | "external" | "manual";
};

type TimeDealEntry = {
  id: string;
  store_id: string;
  benefitId: string;
  title: string;
  date: string;
  start_time: string;
  end_time: string;
};

type RowInfo = {
  id: string;
  unit_id: string;
  unit_index: number;
  label: string;
};

type CreateForm = {
  id: string;
  guestName: string;
  guestPhone: string;
  partySize: string;
  date: string;
  startTime: string;
  endTime: string;
  unit_id: string;
  unit_index: number;
  autoAssign: boolean;
  notes: string;
};

type TimeDealForm = {
  mode: "create" | "edit";
  id?: string;
  benefitId: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
};

const mockStoreId = "dev-store";

const mockReservations: ReservationEntry[] = [];
const statusLabelMap: Record<ReservationEntry["status"], string> = {
  confirmed: "확정",
  pending: "대기",
  cancelled: "취소",
  no_show: "노쇼",
  blocked: "예약 막음",
};

const statusStyles: Record<ReservationEntry["status"], string> = {
  confirmed: "bg-emerald-100 text-emerald-700",
  pending: "bg-amber-100 text-amber-700",
  cancelled: "bg-slate-100 text-slate-500",
  no_show: "bg-rose-100 text-rose-700",
  blocked: "bg-slate-200 text-slate-700",
};

const statusOptions = [
  { value: "all", label: "전체" },
  { value: "confirmed", label: "확정" },
  { value: "pending", label: "대기" },
  { value: "cancelled", label: "취소" },
  { value: "no_show", label: "노쇼" },
  { value: "blocked", label: "예약 막음" },
];

const startMinutes = 9 * 60;
const endMinutes = 24 * 60;
const slotMinutes = 30;
const labelColumnWidth = 160;
const dayLabels = [
  "일",
  "월",
  "화",
  "수",
  "목",
  "금",
  "토",
];
const dayCodes = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

function toMinutes(dateString: string) {
  const date = new Date(dateString);
  return date.getHours() * 60 + date.getMinutes();
}

function timeToMinutes(time: string) {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function minutesToTime(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function parseDateSafe(dateStr: string) {
  return new Date(dateStr);
}

function buildSlots() {
  const slots: string[] = [];
  for (let minutes = startMinutes; minutes < endMinutes; minutes += slotMinutes) {
    const hour = Math.floor(minutes / 60);
    const min = minutes % 60;
    slots.push(`${String(hour).padStart(2, "0")}:${String(min).padStart(2, "0")}`);
  }
  return slots;
}

function buildRows(units: TableUnit[]) {
  return units.flatMap((unit) =>
    Array.from({ length: unit.quantity }).map((_, index) => ({
      id: `${unit.id}-${index + 1}`,
      unit_id: unit.id,
      unit_index: index + 1,
      label: `${unit.name}-${index + 1}`,
    }))
  );
}

function todayString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(dateString: string, delta: number) {
  const date = new Date(`${dateString}T00:00:00`);
  date.setDate(date.getDate() + delta);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDateLabel(dateString: string) {
  const date = new Date(`${dateString}T00:00:00`);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const weekday = dayLabels[date.getDay()];
  return `${year}년 ${month}월 ${day}일 (${weekday})`;
}

function getDayCode(dateString: string) {
  const date = new Date(`${dateString}T00:00:00`);
  return dayCodes[date.getDay()];
}

function mapRowToEntry(row: ReservationRow): ReservationEntry {
  return {
    id: String(row.id),
    store_id: String(row.store_id),
    guestName: row.guest_name,
    guestPhone: row.guest_phone ?? undefined,
    partySize: row.party_size,
    date: row.date,
    status: row.status,
    unit_id: row.unit_id,
    unit_index: row.unit_index,
    start_time: row.start_time,
    end_time: row.end_time,
    notes: row.notes ?? undefined,
    source: row.source,
  };
}

function mapEntryToRow(entry: ReservationEntry): ReservationRow {
  return {
    id: entry.id,
    store_id: entry.store_id,
    guest_name: entry.guestName,
    guest_phone: entry.guestPhone ?? null,
    party_size: entry.partySize,
    date: entry.date,
    status: entry.status,
    unit_id: entry.unit_id,
    unit_index: entry.unit_index,
    start_time: entry.start_time,
    end_time: entry.end_time,
    notes: entry.notes ?? null,
    source: entry.source,
  };
}

function mapTimeDealRowToEntry(row: TimeDealRow): TimeDealEntry {
  return {
    id: String(row.id),
    store_id: String(row.store_id),
    benefitId: row.benefit_id,
    title: row.title,
    date: row.date,
    start_time: row.start_time,
    end_time: row.end_time,
  };
}

function mapTimeDealEntryToRow(entry: TimeDealEntry): TimeDealRow {
  return {
    id: entry.id,
    store_id: entry.store_id,
    benefit_id: entry.benefitId,
    title: entry.title,
    date: entry.date,
    start_time: entry.start_time,
    end_time: entry.end_time,
  };
}

export function ReservationsPage({ storeId }: { storeId?: string }) {
  const contextStoreId = useStoreId();
  const resolvedStoreId =
    storeId && storeId !== "undefined" && storeId !== "null"
      ? storeId
      : contextStoreId ?? undefined;
  const [statusFilter, setStatusFilter] = useState("all");
  const [view, setView] = useState<"scheduler" | "list">("scheduler");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [tableUnits, setTableUnits] = useState<TableUnit[]>([]);
  const [benefits, setBenefits] = useState<BenefitRow[]>([]);
  const [selectedReservation, setSelectedReservation] =
    useState<ReservationEntry | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CreateForm | null>(null);
  const [activeBenefit, setActiveBenefit] = useState<BenefitRow | null>(null);
  const [timeDealDialogOpen, setTimeDealDialogOpen] = useState(false);
  const [timeDealForm, setTimeDealForm] = useState<TimeDealForm | null>(null);
  const [blockMode, setBlockMode] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [autoRuleDialog, setAutoRuleDialog] = useState<RuleRow | null>(null);
  const [hiddenAutoRules, setHiddenAutoRules] = useState<Record<string, boolean>>(
    {}
  );

  const {
    data: reservationRows = [],
    error: reservationsError,
    createReservation,
    updateReservation,
    deleteReservation,
    isSupabaseConfigured: isReservationsSupabaseReady,
  } = useReservations(resolvedStoreId);

  const {
    data: unitRows = [],
    error: unitsError,
    isSupabaseConfigured: isUnitsSupabaseReady,
  } = useTableUnits(resolvedStoreId);

  const {
    data: benefitRows = [],
    isSupabaseConfigured: isBenefitsSupabaseReady,
  } = useBenefits(resolvedStoreId);

  const {
    data: ruleRows = [],
    updateRule,
    isSupabaseConfigured: isRulesSupabaseReady,
  } = useRules(resolvedStoreId);

  const {
    data: timeDealRows = [],
    error: timeDealsError,
    createTimeDeal,
    updateTimeDeal,
    deleteTimeDeal,
    isSupabaseConfigured: isTimeDealsSupabaseReady,
  } = useTimeDeals(resolvedStoreId);

  const hasDataAccessError = Boolean(
    reservationsError ||
      unitsError ||
      timeDealsError ||
      (!isReservationsSupabaseReady && !isUnitsSupabaseReady)
  );

  if (!resolvedStoreId) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-600">
        {"가게 정보를 불러올 수 없습니다. 매장을 선택해 주세요."}
      </div>
    );
  }

  if (hasDataAccessError) {
    return (
      <div className="rounded-lg border border-rose-200 bg-white p-6 text-sm text-rose-600">
        {"데이터 접근에 실패했습니다. 서버 권한(RLS) 설정과 로그인 세션을 확인해 주세요."}
      </div>
    );
  }

  const storeKey = resolvedStoreId;
  const reservations = useMemo(
    () => reservationRows.map(mapRowToEntry),
    [reservationRows]
  );

  const timeDeals = useMemo(() => {
    return timeDealRows.map(mapTimeDealRowToEntry);
  }, [timeDealRows]);

  const showOfflineBadge =
    !isOnline ||
    !isReservationsSupabaseReady ||
    !isUnitsSupabaseReady ||
    !isBenefitsSupabaseReady ||
    !isRulesSupabaseReady ||
    !isTimeDealsSupabaseReady ||
    Boolean(reservationsError) ||
    Boolean(timeDealsError);

  // storeId is provided by route params; no pathname/localStorage fallback

  useEffect(() => {
    if (typeof window === "undefined") return;
    setIsOnline(window.navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    if (!selectedDate) {
      setSelectedDate(todayString());
    }
  }, [selectedDate]);

  useEffect(() => {
    if (unitRows.length > 0) {
      setTableUnits(
        unitRows.map((unit) => ({
          id: unit.id,
          name: unit.name,
          min_capacity: unit.min_capacity,
          max_capacity: unit.max_capacity,
          quantity: unit.quantity,
          is_private: unit.is_private,
        }))
      );
      return;
    }
    setTableUnits([]);
  }, [unitRows, isUnitsSupabaseReady, unitsError]);

  const rules = ruleRows;

  useEffect(() => {
    if (benefitRows.length > 0) {
      setBenefits(benefitRows);
      return;
    }
    setBenefits([]);
  }, [benefitRows]);

  

  const dateKey = selectedDate || "1970-01-01";
  const dateLabel = selectedDate
    ? formatDateLabel(selectedDate)
    : "날짜 로딩 중";

  const filtered = useMemo(() => {
    return reservations.filter((item) => {
      const statusMatch = statusFilter === "all" || item.status === statusFilter;
      const dateMatch = item.date === dateKey;
      return statusMatch && dateMatch;
    });
  }, [reservations, statusFilter, dateKey]);

  const slots = useMemo(() => buildSlots(), []);
  const rows = useMemo(() => buildRows(tableUnits), [tableUnits]);
  const timeDealsForDate = useMemo(
    () => timeDeals.filter((deal) => deal.date === dateKey),
    [timeDeals, dateKey]
  );
  const autoRulesForDate = useMemo(() => {
    if (!dateKey) return [];
    const dayCode = getDayCode(dateKey);
    return rules.filter(
      (rule) =>
        rule.is_auto_apply &&
        Array.isArray(rule.recurrence_days) &&
        rule.recurrence_days.includes(dayCode) &&
        rule.active_time_start &&
        rule.active_time_end &&
        !hiddenAutoRules[`${rule.id}-${dateKey}`]
    );
  }, [rules, dateKey, hiddenAutoRules]);

  const activeReservations = useMemo(
    () => filtered.filter((item) => item.status !== "cancelled"),
    [filtered]
  );
  const unitOptions = useMemo(
    () =>
      tableUnits.map((unit) => ({
        id: unit.id,
        label: unit.name,
        quantity: unit.quantity,
      })),
    [tableUnits]
  );
  const selectedUnit = useMemo(() => {
    if (!createForm) return undefined;
    return unitOptions.find(
      (unit) => String(unit.id) === String(createForm.unit_id)
    );
  }, [createForm, unitOptions]);
  const unitIndexOptions = useMemo(() => {
    const count = selectedUnit?.quantity ?? 0;
    return Array.from({ length: count }, (_, index) => index + 1);
  }, [selectedUnit]);

  function openDetail(item: ReservationEntry) {
    if (item.source === "external") {
      window.alert(
        "외부 플랫폼에서 관리되는 예약입니다."
      );
      return;
    }
    setSelectedReservation(item);
    setDialogOpen(true);
  }

  function updateReservationStatus(
    reservationId: string,
    nextStatus: ReservationEntry["status"]
  ) {
    if (nextStatus === "cancelled") {
      deleteReservation.mutate({ id: reservationId });
    } else {
      updateReservation.mutate({ id: reservationId, status: nextStatus });
    }
    setDialogOpen(false);
  }

  function openCreate(row: RowInfo, slot: string) {
    const startTime = slot;
    const endTime = minutesToTime(timeToMinutes(slot) + 120);
    const fallbackUnit = tableUnits[0];
    setCreateForm({
      id: "",
      guestName: "",
      guestPhone: "",
      partySize: "2",
      date: selectedDate,
      startTime,
      endTime,
      unit_id: row.unit_id ?? fallbackUnit?.id ?? "",
      unit_index: row.unit_index ?? 1,
      autoAssign: true,
      notes: "",
    });
    setCreateOpen(true);
  }

  function handleCreateSubmit() {
    if (!createForm) return;
    const {
      id,
      guestName,
      guestPhone,
      partySize,
      date,
      startTime,
      endTime,
      autoAssign,
      notes,
    } = createForm;

    if (!id.trim() || !guestName.trim()) {
      window.alert(
        "예약 번호와 고객 이름을 입력해주세요."
      );
      return;
    }
    if (!createForm.unit_id) {
      window.alert("테이블 유형을 선택해 주세요.");
      return;
    }

    const start = timeToMinutes(startTime);
    const end = timeToMinutes(endTime);
    if (end <= start) {
      window.alert(
        "종료 시간은 시작 시간보다 늦어야 합니다."
      );
      return;
    }

    const overlap = reservations.some((item) => {
      if (item.date !== date) return false;
      if (item.unit_id !== createForm.unit_id) return false;
      if (item.unit_index !== createForm.unit_index) return false;
      if (item.status === "cancelled" || item.status === "no_show") return false;
      const itemStart = timeToMinutes(item.start_time.slice(11, 16));
      const itemEnd = timeToMinutes(item.end_time.slice(11, 16));
      return start < itemEnd && end > itemStart;
    });

    if (overlap) {
      window.alert(
        "해당 시간에 이미 예약이 있습니다."
      );
      return;
    }

    let assignedUnitId = createForm.unit_id;
    let assignedUnitIndex = createForm.unit_index;
    let nextStatus: ReservationEntry["status"] = "confirmed";

    if (autoAssign) {
      const assignment = runAutoAssign(
        {
          partySize: Number(partySize) || 1,
          date,
          startTime,
          endTime,
        },
        tableUnits,
        reservations
      );
      if (assignment) {
        assignedUnitId = assignment.unit_id;
        assignedUnitIndex = assignment.unit_index;
        window.alert(
          `✅ ${assignment.label} 테이블에 배정되었습니다.`
        );
      } else {
        nextStatus = "pending";
        window.alert(
          "⚠️ 가능한 빈 테이블이 없습니다. 대기 상태로 등록합니다."
        );
      }
    }

    const newReservation: ReservationEntry = {
      id: id.trim(),
      store_id: storeKey,
      guestName: guestName.trim(),
      guestPhone: guestPhone.trim(),
      partySize: Number(partySize) || 1,
      date,
      status: nextStatus,
      unit_id: assignedUnitId,
      unit_index: assignedUnitIndex,
      start_time: `${date}T${startTime}:00`,
      end_time: `${date}T${endTime}:00`,
      source: "internal",
      notes: notes.trim(),
    };

    createReservation.mutate(mapEntryToRow(newReservation));

    setCreateOpen(false);
  }

  function toggleRule(ruleId: RuleRow["id"]) {
    const target = rules.find((rule) => String(rule.id) === String(ruleId));
    if (!target) return;
    updateRule.mutate({ id: String(ruleId), enabled: !target.enabled });
  }

  function openTimeDealCreate(slot?: string) {
    const benefit = activeBenefit ?? benefits[0];
    if (!benefit) {
      window.alert("타임세일을 만들 혜택을 선택해 주세요.");
      return;
    }
    const startTime = slot ?? slots[0] ?? "18:00";
    const endTime = minutesToTime(timeToMinutes(startTime) + 60);
    setTimeDealForm({
      mode: "create",
      benefitId: String(benefit.id),
      title: benefit.title,
      date: selectedDate,
      startTime,
      endTime,
    });
    setTimeDealDialogOpen(true);
  }

  function openTimeDealEdit(deal: TimeDealEntry) {
    setTimeDealForm({
      mode: "edit",
      id: deal.id,
      benefitId: deal.benefitId,
      title: deal.title,
      date: deal.date,
      startTime: deal.start_time.slice(11, 16),
      endTime: deal.end_time.slice(11, 16),
    });
    setTimeDealDialogOpen(true);
  }

  function handleTimeDealSubmit() {
    if (!timeDealForm) return;
    const start = timeToMinutes(timeDealForm.startTime);
    const end = timeToMinutes(timeDealForm.endTime);
    if (end <= start) {
      window.alert(
        "종료 시간은 시작 시간보다 늦어야 합니다."
      );
      return;
    }
    if (timeDealForm.mode === "edit" && timeDealForm.id) {
      updateTimeDeal.mutate({
        id: timeDealForm.id,
        benefit_id: timeDealForm.benefitId,
        title: timeDealForm.title,
        start_time: `${timeDealForm.date}T${timeDealForm.startTime}:00`,
        end_time: `${timeDealForm.date}T${timeDealForm.endTime}:00`,
      });
    } else {
      const newDeal: TimeDealEntry = {
        id: `deal-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        store_id: storeKey,
        benefitId: timeDealForm.benefitId,
        title: timeDealForm.title,
        date: timeDealForm.date,
        start_time: `${timeDealForm.date}T${timeDealForm.startTime}:00`,
        end_time: `${timeDealForm.date}T${timeDealForm.endTime}:00`,
      };
      createTimeDeal.mutate(mapTimeDealEntryToRow(newDeal));
    }
    setTimeDealDialogOpen(false);
  }

  function hideAutoRuleForDate(ruleId: string) {
    setHiddenAutoRules((prev) => ({
      ...prev,
      [`${ruleId}-${dateKey}`]: true,
    }));
    setAutoRuleDialog(null);
  }

  function handleTimeDealDelete() {
    if (!timeDealForm?.id) return;
    deleteTimeDeal.mutate({ id: timeDealForm.id });
    setTimeDealDialogOpen(false);
  }

  function createBlockedSlot(row: RowInfo, slot: string) {
    const startTime = slot;
    const endTime = minutesToTime(timeToMinutes(slot) + 60);
    const start = timeToMinutes(startTime);
    const end = timeToMinutes(endTime);
    const overlap = reservations.some((item) => {
      if (item.date !== selectedDate) return false;
      if (item.unit_id !== row.unit_id) return false;
      if (item.unit_index !== row.unit_index) return false;
      if (item.status === "cancelled" || item.status === "no_show") return false;
      const itemStart = timeToMinutes(item.start_time.slice(11, 16));
      const itemEnd = timeToMinutes(item.end_time.slice(11, 16));
      return start < itemEnd && end > itemStart;
    });
    if (overlap) {
      window.alert(
        "해당 시간에 이미 예약 또는 막음 상태입니다."
      );
      return;
    }

    const newBlock: ReservationEntry = {
      id: `B-${Date.now()}`,
      store_id: storeKey,
      guestName: "외부 예약/마감",
      partySize: 0,
      date: selectedDate,
      status: "blocked",
      unit_id: row.unit_id,
      unit_index: row.unit_index,
      start_time: `${selectedDate}T${startTime}:00`,
      end_time: `${selectedDate}T${endTime}:00`,
      source: "manual",
    };
    createReservation.mutate(mapEntryToRow(newBlock));
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold">{"예약 목록"}</h1>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span>{`매장 #${resolvedStoreId ?? ""}`}</span>
            {showOfflineBadge ? (
              <Badge className="bg-amber-100 text-amber-700">
                {"오프라인 상태"}
              </Badge>
            ) : null}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-2 py-1 text-sm">
            <Button
              variant="ghost"
              onClick={() => setSelectedDate((prev) => addDays(prev, -1))}
            >
              {"<"}
            </Button>
            <div className="relative px-2 text-sm font-medium">
              {dateLabel}
              <input
                type="date"
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                value={selectedDate}
                onChange={(event) => setSelectedDate(event.target.value)}
              />
            </div>
            <Button
              variant="ghost"
              onClick={() => setSelectedDate((prev) => addDays(prev, 1))}
            >
              {">"}
            </Button>
          </div>
          <Button
            variant="ghost"
            className="border border-slate-300 text-slate-700"
            onClick={() =>
              window.alert(
                "구글/네이버 캘린더와 연동하여 중복 예약을 방지합니다."
              )
            }
          >
            {"📅 외부 캘린더 연동"}
          </Button>
          <select
            className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <Button
            variant={blockMode ? "primary" : "secondary"}
            className="h-9"
            onClick={() => setBlockMode((prev) => !prev)}
          >
            {"⛔ 예약 막기 모드"}
          </Button>
          <Button
            variant={view === "scheduler" ? "primary" : "secondary"}
            onClick={() => setView("scheduler")}
          >
            {"스케줄러 보기"}
          </Button>
          <Button
            variant={view === "list" ? "primary" : "secondary"}
            onClick={() => setView("list")}
          >
            {"리스트 보기"}
          </Button>
        </div>
      </div>

      {/* 📱 앱(B2C)에서 들어온 예약 — 확정/완료/취소(환불) */}
      <AppReservationsPanel storeId={resolvedStoreId} />

      {view === "scheduler" ? (
        <div className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
            <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-4">
              <div className="text-sm font-semibold">{"규칙 목록"}</div>
              {rules.length === 0 ? (
                <p className="text-xs text-slate-500">
                  {
                    "등록된 규칙이 없습니다. 룰 설정에서 새 규칙을 만들어주세요."
                  }
                </p>
              ) : (
                <div className="grid gap-2 md:grid-cols-2">
                  {rules.map((rule) => (
                    <div
                      key={String(rule.id)}
                      className="flex items-center justify-between gap-2 rounded-md border border-slate-200 px-3 py-2"
                    >
                      <div className="text-sm">
                        <div className="font-medium text-slate-900">{rule.name}</div>
                        <div className="text-xs text-slate-500">
                          {rule.enabled ? "활성" : "비활성"}
                        </div>
                      </div>
                      <Button
                        variant={rule.enabled ? "primary" : "secondary"}
                        className="h-8 px-3 text-xs"
                        onClick={() => toggleRule(rule.id)}
                      >
                        {rule.enabled ? "켜짐" : "꺼짐"}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-4">
              <div className="text-sm font-semibold">{"혜택 버튼"}</div>
              <p className="text-xs text-slate-500">
                {
                  "타임세일은 시간대를 클릭한 후 시간을 설정해서 생성합니다."
                }
              </p>
              {benefits.length === 0 ? (
                <p className="text-xs text-slate-500">
                  {
                    "혜택 카탈로그에서 혜택을 추가해주세요."
                  }
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {benefits.map((benefit) => {
                    const isActive = activeBenefit?.id === benefit.id;
                    return (
                      <Button
                        key={String(benefit.id)}
                        variant={isActive ? "primary" : "secondary"}
                        className="h-8 rounded-full px-3 text-xs"
                        onClick={() => {
                          setActiveBenefit(isActive ? null : benefit);
                        }}
                      >
                        {benefit.title}
                      </Button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="text-sm text-slate-500">
            {
              "빈 시간대는 AI가 예약을 추천할 수 있는 슬롯입니다."
            }
          </div>

          <div className="overflow-x-auto pb-1">
          <div
            className="grid gap-px rounded-lg border border-slate-200 bg-slate-200 text-xs"
            style={{
              gridTemplateColumns: `${labelColumnWidth}px repeat(${slots.length}, minmax(64px, 1fr))`,
            }}
          >
            <div className="sticky left-0 z-20 bg-white p-2 font-medium">{"테이블"}</div>
            {slots.map((slot) => {
              const slotEnd = minutesToTime(timeToMinutes(slot) + slotMinutes);
              return (
                <div
                  key={slot}
                  className="bg-white p-2 text-center text-[11px] text-slate-500 leading-tight"
                >
                  <div>{slot}</div>
                  <div className="text-[10px] text-slate-400">
                    {`~${slotEnd}`}
                  </div>
                </div>
              );
            })}

            <div
              className="col-span-full grid"
              style={{
                gridTemplateColumns: `${labelColumnWidth}px repeat(${slots.length}, minmax(64px, 1fr))`,
              }}
            >
              <div className="sticky left-0 z-20 bg-white p-2 text-slate-700">{"타임세일"}</div>
                {slots.map((slot) => (
                  <div
                    key={`deal-slot-${slot}`}
                    className="bg-white p-2 border-l border-slate-100 cursor-pointer"
                    onClick={() => openTimeDealCreate(slot)}
                  />
                ))}
              {autoRulesForDate.map((rule) => {
                const start = timeToMinutes(rule.active_time_start ?? "18:00");
                const end = timeToMinutes(rule.active_time_end ?? "20:00");
                const startIndex = Math.max(
                  0,
                  Math.floor((start - startMinutes) / slotMinutes)
                );
                const endIndex = Math.min(
                  slots.length,
                  Math.max(
                    startIndex + 1,
                    Math.floor((end - startMinutes - 1) / slotMinutes) + 1
                  )
                );
                const columnStart = 2 + startIndex;
                const columnEnd = Math.max(columnStart + 1, 2 + endIndex);
                const label = `🔄 [자동적용] ${rule.benefit_title ?? rule.name}`;

                return (
                  <div
                    key={`auto-${rule.id}`}
                    className="relative z-10 flex items-center gap-2 rounded-md bg-indigo-100/70 px-2 py-1 text-xs text-indigo-700 cursor-pointer"
                    style={{
                      gridColumn: `${columnStart} / ${columnEnd}`,
                      gridRow: "1",
                      alignSelf: "center",
                    }}
                    onClick={(event) => {
                      event.stopPropagation();
                      setAutoRuleDialog(rule);
                    }}
                  >
                    <span className="truncate">{label}</span>
                  </div>
                );
              })}
              {timeDealsForDate.map((deal) => {
                const start = timeToMinutes(deal.start_time.slice(11, 16));
                const end = timeToMinutes(deal.end_time.slice(11, 16));
                const startIndex = Math.max(
                  0,
                  Math.floor((start - startMinutes) / slotMinutes)
                );
                const endIndex = Math.min(
                  slots.length,
                  Math.max(
                    startIndex + 1,
                    Math.floor((end - startMinutes - 1) / slotMinutes) + 1
                  )
                );
                const columnStart = 2 + startIndex;
                const columnEnd = Math.max(columnStart + 1, 2 + endIndex);

                  return (
                    <div
                      key={deal.id}
                      className="relative z-10 flex items-center gap-2 rounded-md bg-indigo-50 px-2 py-1 text-xs text-indigo-700 cursor-pointer"
                      style={{
                        gridColumn: `${columnStart} / ${columnEnd}`,
                        gridRow: "1",
                        alignSelf: "center",
                      }}
                      onClick={(event) => {
                        event.stopPropagation();
                        openTimeDealEdit(deal);
                      }}
                    >
                    <span className="truncate">{deal.title}</span>
                  </div>
                );
              })}
            </div>

            {rows.map((row) => {
              const rowReservations = activeReservations.filter(
                (reservation) =>
                  reservation.unit_id === row.unit_id &&
                  reservation.unit_index === row.unit_index
              );
              const occupiedReservations = rowReservations.filter(
                (reservation) =>
                  reservation.status === "confirmed" ||
                  reservation.status === "pending" ||
                  reservation.status === "blocked"
              );

              return (
                <div
                  key={row.id}
                  className="col-span-full grid"
                  style={{
                    gridTemplateColumns: `${labelColumnWidth}px repeat(${slots.length}, minmax(64px, 1fr))`,
                  }}
                >
                  <div className="sticky left-0 z-20 bg-white p-2 text-slate-700">{row.label}</div>
                  {slots.map((slot) => {
                    const currentSlotDate = new Date(`${selectedDate}T${slot}:00`);
                    const currentSlotTime = currentSlotDate.getTime();
                    const blockingReservation = occupiedReservations.find(
                      (reservation) => {
                        const resStart = parseDateSafe(reservation.start_time).getTime();
                        const resEnd = parseDateSafe(reservation.end_time).getTime();
                        if (Number.isNaN(resStart) || Number.isNaN(resEnd)) {
                          return false;
                        }
                        return currentSlotTime >= resStart && currentSlotTime < resEnd;
                      }
                    );
                    const occupied = Boolean(blockingReservation);
                    const blockingLabel = blockingReservation
                      ? blockingReservation.status === "blocked"
                        ? "예약 막음"
                        : blockingReservation.guestName
                      : "";

                    return (
                      <button
                        key={`${row.id}-${slot}`}
                        type="button"
                        className={`bg-white p-2 border-l border-slate-100 ${
                          occupied ? "bg-slate-50 cursor-pointer" : "hover:bg-slate-50"
                        }`}
                        onClick={() => {
                          if (occupied && blockingReservation) {
                            const slotStr = currentSlotDate.toLocaleTimeString();
                            const startStr = new Date(
                              blockingReservation.start_time
                            ).toLocaleTimeString();
                            const endStr = new Date(
                              blockingReservation.end_time
                            ).toLocaleTimeString();
                            window.alert(
                              `⛔ 예약 불가 (정밀 진단)\\n\\n[${blockingLabel}]님의 예약과 겹칩니다.\\n--------------------------------\\n선택 시간: ${slot} (Timestamp: ${currentSlotTime})\\n예약 시작: ${startStr} (Timestamp: ${new Date(
                                blockingReservation.start_time
                              ).getTime()})\\n예약 종료: ${endStr} (Timestamp: ${new Date(
                                blockingReservation.end_time
                              ).getTime()})\\n--------------------------------\\n예약 종료 시간이 예상과 다르면 (오전/오후, 날짜 바뀐 등), DB 타임존 저장 문제를 확인해주세요.`
                            );
                            return;
                          }
                          if (blockMode) {
                            createBlockedSlot(row, slot);
                            return;
                          }
                          openCreate(row, slot);
                        }}
                      />
                    );
                  })}
                  {rowReservations.map((reservation) => {
                    const start = timeToMinutes(reservation.start_time.slice(11, 16));
                    const end = timeToMinutes(reservation.end_time.slice(11, 16));
                    const startIndex = Math.max(
                      0,
                      Math.floor((start - startMinutes) / slotMinutes)
                    );
                    const endIndex = Math.min(
                      slots.length,
                      Math.max(
                        startIndex + 1,
                        Math.floor((end - startMinutes - 1) / slotMinutes) + 1
                      )
                    );
                    const columnStart = 2 + startIndex;
                    const columnEnd = Math.max(columnStart + 1, 2 + endIndex);
                    const isExternal = reservation.source === "external";
                    const isBlocked = reservation.status === "blocked";
                    const isNoShow = reservation.status === "no_show";

                    return (
                      <div
                        key={reservation.id}
                        className={`z-10 flex items-center justify-between rounded-md px-2 py-1 text-xs ${
                          isBlocked
                            ? "bg-slate-200 text-slate-700"
                            : isExternal
                              ? "bg-slate-200 text-slate-700"
                              : isNoShow
                                ? "bg-rose-100 text-rose-700"
                                : "bg-slate-900 text-white"
                        } ${isExternal || isBlocked ? "cursor-pointer" : ""} ${
                          isNoShow ? "pointer-events-none" : ""
                        }`}
                        style={{
                          gridColumn: `${columnStart} / ${columnEnd}`,
                          gridRow: "1",
                          alignSelf: "center",
                          backgroundImage: isExternal || isBlocked
                            ? "repeating-linear-gradient(45deg, rgba(148,163,184,0.35), rgba(148,163,184,0.35) 6px, rgba(255,255,255,0.4) 6px, rgba(255,255,255,0.4) 12px)"
                            : undefined,
                        }}
                        onClick={() => {
                          if (isExternal) {
                            window.alert(
                              "외부 플랫폼에서 관리되는 예약입니다."
                            );
                            return;
                          }
                          openDetail(reservation);
                        }}
                      >
                        <span>{reservation.guestName}</span>
                        <span>{`${reservation.partySize}명`}</span>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
          </div>
        </div>
      ) : null}

      {view === "list" && (
        <Table>
          <thead>
            <tr>
              <Th>{"예약 번호"}</Th>
              <Th>{"고객"}</Th>
              <Th>{"인원"}</Th>
              <Th>{"날짜"}</Th>
              <Th>{"시간"}</Th>
              <Th>{"상태"}</Th>
              <Th>{"조치"}</Th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <Td colSpan={7}>
                  <div className="py-6 text-center text-sm text-slate-500">
                    {"선택한 날짜에는 예약이 없습니다."}
                  </div>
                </Td>
              </tr>
            ) : (
              filtered.map((row) => (
                <tr key={row.id}>
                  <Td>{row.id}</Td>
                  <Td>
                    <div className="flex items-center gap-2">
                      <span>{row.guestName}</span>
                      {row.source === "external" ? (
                        <Badge className="bg-slate-200 text-slate-600">
                          {"외부"}
                        </Badge>
                      ) : null}
                    </div>
                  </Td>
                  <Td>{row.partySize}</Td>
                  <Td>{row.date}</Td>
                  <Td>
                    {row.start_time.slice(11, 16)}~{row.end_time.slice(11, 16)}
                  </Td>
                  <Td>
                    <span
                      className={`rounded-full px-2 py-1 text-xs ${statusStyles[row.status]}`}
                    >
                      {statusLabelMap[row.status]}
                    </span>
                  </Td>
                  <Td>
                    <Button variant="ghost" onClick={() => openDetail(row)}>
                      {"상세"}
                    </Button>
                  </Td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      )}
      <Dialog open={dialogOpen}>
        {selectedReservation ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-lg font-semibold">{"예약 상세"}</div>
              <Badge className={statusStyles[selectedReservation.status]}>
                {statusLabelMap[selectedReservation.status]}
              </Badge>
            </div>
            <div className="space-y-2 text-sm text-slate-600">
              <div>
                {"예약 번호"}: {selectedReservation.id}
              </div>
              <div>
                {"고객"}: {selectedReservation.guestName}
              </div>
              <div>
                {"연락처"}: {selectedReservation.guestPhone || "-"}
              </div>
              <div>
                {"인원"}: {selectedReservation.partySize}명
              </div>
              <div>
                {"시간"}: {selectedReservation.start_time.slice(11, 16)}~
                {selectedReservation.end_time.slice(11, 16)}
              </div>
              <div>
                {"요청 사항"}: {selectedReservation.notes || "-"}
              </div>
            </div>
            {selectedReservation.status === "blocked" ? (
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="secondary"
                  onClick={() =>
                    updateReservationStatus(selectedReservation.id, "cancelled")
                  }
                >
                  {"막음 해제"}
                </Button>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={() =>
                    updateReservationStatus(selectedReservation.id, "confirmed")
                  }
                >
                  {"확정"}
                </Button>
                <Button
                  variant="secondary"
                  className="bg-rose-50 text-rose-600 hover:bg-rose-100"
                  onClick={() =>
                    updateReservationStatus(selectedReservation.id, "no_show")
                  }
                >
                  {"노쇼"}
                </Button>
                <Button
                  variant="ghost"
                  className="text-rose-600 hover:bg-rose-50"
                  onClick={() =>
                    updateReservationStatus(selectedReservation.id, "cancelled")
                  }
                >
                  {"취소"}
                </Button>
              </div>
            )}
          </div>
        ) : null}
      </Dialog>

      <Dialog open={createOpen}>
        {createForm ? (
          <div className="space-y-4">
            <div className="text-lg font-semibold">{"새 예약 추가"}</div>
            <div className="grid gap-3 text-sm">
              <div className="space-y-1">
                <label className="text-xs text-slate-500">
                  {"예약 번호"}
                </label>
                <input
                  className="h-10 w-full rounded-md border border-slate-200 px-3"
                  value={createForm.id}
                  onChange={(event) =>
                    setCreateForm({ ...createForm, id: event.target.value })
                  }
                  placeholder="R-101"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-500">{"고객"}</label>
                <input
                  className="h-10 w-full rounded-md border border-slate-200 px-3"
                  value={createForm.guestName}
                  onChange={(event) =>
                    setCreateForm({
                      ...createForm,
                      guestName: event.target.value,
                    })
                  }
                  placeholder="김민수"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-500">{"연락처"}</label>
                <input
                  className="h-10 w-full rounded-md border border-slate-200 px-3"
                  value={createForm.guestPhone}
                  onChange={(event) =>
                    setCreateForm({
                      ...createForm,
                      guestPhone: event.target.value,
                    })
                  }
                  placeholder="010-1234-5678"
                />
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs text-slate-500">{"인원"}</label>
                  <input
                    type="number"
                    className="h-10 w-full rounded-md border border-slate-200 px-3"
                    value={createForm.partySize}
                    onChange={(event) =>
                      setCreateForm({
                        ...createForm,
                        partySize: event.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-500">{"날짜"}</label>
                  <input
                    type="date"
                    className="h-10 w-full rounded-md border border-slate-200 px-3"
                    value={createForm.date}
                    onChange={(event) =>
                      setCreateForm({ ...createForm, date: event.target.value })
                    }
                  />
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs text-slate-500">
                    {"테이블 유형"}
                  </label>
                  <select
                    className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
                    value={createForm.unit_id}
                    onChange={(event) => {
                      const nextId = event.target.value;
                      const nextUnit = unitOptions.find(
                        (unit) => String(unit.id) === String(nextId)
                      );
                      const nextIndex = Math.min(
                        createForm.unit_index,
                        nextUnit?.quantity ?? 1
                      );
                      setCreateForm({
                        ...createForm,
                        unit_id: nextId,
                        unit_index: nextIndex,
                      });
                    }}
                    disabled={unitOptions.length === 0}
                  >
                    {unitOptions.length === 0 ? (
                      <option value="">
                        {"수용량에서 테이블을 등록해 주세요."}
                      </option>
                    ) : null}
                    {unitOptions.map((unit) => (
                      <option key={String(unit.id)} value={String(unit.id)}>
                        {unit.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-500">
                    {"테이블 번호"}
                  </label>
                  <select
                    className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
                    value={String(createForm.unit_index)}
                    onChange={(event) =>
                      setCreateForm({
                        ...createForm,
                        unit_index: Number(event.target.value),
                      })
                    }
                    disabled={unitIndexOptions.length === 0}
                  >
                    {unitIndexOptions.length === 0 ? (
                      <option value="1">{"-"}</option>
                    ) : null}
                    {unitIndexOptions.map((indexValue) => (
                      <option key={indexValue} value={indexValue}>
                        {indexValue}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs text-slate-500">
                    {"시작 시간"}
                  </label>
                  <select
                    className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
                    value={createForm.startTime}
                    onChange={(event) =>
                      setCreateForm({
                        ...createForm,
                        startTime: event.target.value,
                      })
                    }
                  >
                    {slots.map((slot) => (
                      <option key={slot} value={slot}>
                        {slot}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-500">
                    {"종료 시간"}
                  </label>
                  <select
                    className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
                    value={createForm.endTime}
                    onChange={(event) =>
                      setCreateForm({
                        ...createForm,
                        endTime: event.target.value,
                      })
                    }
                  >
                    {slots.map((slot) => (
                      <option key={slot} value={slot}>
                        {slot}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-500">{"요청 사항"}</label>
                <input
                  className="h-10 w-full rounded-md border border-slate-200 px-3"
                  value={createForm.notes}
                  onChange={(event) =>
                    setCreateForm({
                      ...createForm,
                      notes: event.target.value,
                    })
                  }
                  placeholder="창가 좌석"
                />
              </div>
              <div className="text-xs text-slate-500">
                {selectedUnit
                  ? `${selectedUnit.label}-${createForm.unit_index}`
                  : `테이블 ${createForm.unit_id}-${createForm.unit_index}`}
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={createForm.autoAssign}
                  onChange={(event) =>
                    setCreateForm({ ...createForm, autoAssign: event.target.checked })
                  }
                />
                {"테이블 자동 배정"}
              </label>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setCreateOpen(false)}>
                {"취소"}
              </Button>
              <Button onClick={handleCreateSubmit}>{"추가"}</Button>
            </div>
          </div>
        ) : null}
      </Dialog>

      <Dialog open={timeDealDialogOpen}>
        {timeDealForm ? (
          <div className="space-y-4">
            <div className="text-lg font-semibold">
              {timeDealForm.mode === "edit"
                ? "타임세일 수정"
                : "타임세일 생성"}
            </div>
            <div className="space-y-2 text-sm">
              <div className="space-y-1">
                <label className="text-xs text-slate-500">
                  {"혜택 선택"}
                </label>
                <select
                  className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
                  value={timeDealForm.benefitId}
                  onChange={(event) => {
                    const next = benefits.find(
                      (item) => String(item.id) === event.target.value
                    );
                    setTimeDealForm({
                      ...timeDealForm,
                      benefitId: event.target.value,
                      title: next?.title ?? timeDealForm.title,
                    });
                  }}
                >
                  {benefits.map((benefit) => (
                    <option key={String(benefit.id)} value={String(benefit.id)}>
                      {benefit.title}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs text-slate-500">
                    {"시작 시간"}
                  </label>
                  <select
                    className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
                    value={timeDealForm.startTime}
                    onChange={(event) =>
                      setTimeDealForm({
                        ...timeDealForm,
                        startTime: event.target.value,
                      })
                    }
                  >
                    {slots.map((slot) => (
                      <option key={`deal-start-${slot}`} value={slot}>
                        {slot}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-500">
                    {"종료 시간"}
                  </label>
                  <select
                    className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
                    value={timeDealForm.endTime}
                    onChange={(event) =>
                      setTimeDealForm({
                        ...timeDealForm,
                        endTime: event.target.value,
                      })
                    }
                  >
                    {slots.map((slot) => (
                      <option key={`deal-end-${slot}`} value={slot}>
                        {slot}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap justify-end gap-2">
              {timeDealForm.mode === "edit" ? (
                <Button
                  variant="ghost"
                  className="text-rose-600 hover:bg-rose-50"
                  onClick={handleTimeDealDelete}
                >
                  {"삭제"}
                </Button>
              ) : null}
              <Button
                variant="secondary"
                onClick={() => setTimeDealDialogOpen(false)}
              >
                {"취소"}
              </Button>
              <Button onClick={handleTimeDealSubmit}>
                {timeDealForm.mode === "edit" ? "저장" : "생성"}
              </Button>
            </div>
          </div>
        ) : null}
      </Dialog>

      <Dialog open={Boolean(autoRuleDialog)}>
        {autoRuleDialog ? (
          <div className="space-y-4">
            <div className="text-lg font-semibold">
              {"자동 적용 룰"}
            </div>
            <div className="text-sm text-slate-600">
              {`${autoRuleDialog.name} (${autoRuleDialog.active_time_start ?? ""}~${autoRuleDialog.active_time_end ?? ""})`}
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setAutoRuleDialog(null)}>
                {"닫기"}
              </Button>
              <Button
                className="bg-rose-600 hover:bg-rose-700"
                onClick={() => hideAutoRuleForDate(String(autoRuleDialog.id))}
              >
                {"이 날만 끌기"}
              </Button>
            </div>
          </div>
        ) : null}
      </Dialog>

    </div>
  );
}




