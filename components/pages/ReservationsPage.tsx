
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
import { useStoreId } from "@/components/layout/Layout";

type ReservationEntry = {
  id: string;
  store_id: string;
  guestName: string;
  partySize: number;
  date: string;
  status: "confirmed" | "pending" | "cancelled" | "no_show" | "blocked";
  unit_id: string;
  unit_index: number;
  start_time: string;
  end_time: string;
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
  partySize: string;
  date: string;
  startTime: string;
  endTime: string;
  unit_id: string;
  unit_index: number;
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

const mockReservations: ReservationEntry[] = [
  {
    id: "R-101",
    store_id: mockStoreId,
    guestName: "\uAE40\uBBFC\uC218",
    partySize: 4,
    date: "2026-02-01",
    status: "confirmed",
    unit_id: "unit-hall-4",
    unit_index: 1,
    start_time: "2026-02-01T18:00:00",
    end_time: "2026-02-01T20:00:00",
    source: "internal",
  },
  {
    id: "R-102",
    store_id: mockStoreId,
    guestName: "\uC774\uC9C0\uD604",
    partySize: 2,
    date: "2026-02-01",
    status: "pending",
    unit_id: "unit-terrace-2",
    unit_index: 2,
    start_time: "2026-02-01T19:00:00",
    end_time: "2026-02-01T21:00:00",
    source: "internal",
  },
  {
    id: "R-103",
    store_id: mockStoreId,
    guestName: "\uBC15\uC131\uC900",
    partySize: 6,
    date: "2026-02-01",
    status: "confirmed",
    unit_id: "unit-vip",
    unit_index: 1,
    start_time: "2026-02-01T20:30:00",
    end_time: "2026-02-01T22:30:00",
    source: "internal",
  },
  {
    id: "R-104",
    store_id: mockStoreId,
    guestName: "\uB124\uC774\uBC84 \uC608\uC57D(\uAE40\uCCA0\uC218)",
    partySize: 2,
    date: "2026-02-01",
    status: "confirmed",
    unit_id: "unit-hall-4",
    unit_index: 3,
    start_time: "2026-02-01T18:30:00",
    end_time: "2026-02-01T20:00:00",
    source: "external",
  },
  {
    id: "R-201",
    store_id: mockStoreId,
    guestName: "\uCD5C\uD558\uB9BC",
    partySize: 2,
    date: "2026-02-02",
    status: "confirmed",
    unit_id: "unit-terrace-2",
    unit_index: 1,
    start_time: "2026-02-02T17:30:00",
    end_time: "2026-02-02T19:30:00",
    source: "internal",
  },
  {
    id: "R-202",
    store_id: mockStoreId,
    guestName: "\uBC15\uC9C4\uC6C5",
    partySize: 4,
    date: "2026-02-02",
    status: "cancelled",
    unit_id: "unit-hall-4",
    unit_index: 3,
    start_time: "2026-02-02T18:30:00",
    end_time: "2026-02-02T20:30:00",
    source: "internal",
  },
  {
    id: "R-203",
    store_id: mockStoreId,
    guestName: "\uC724\uC9C4\uC11C",
    partySize: 3,
    date: "2026-02-02",
    status: "pending",
    unit_id: "unit-hall-4",
    unit_index: 2,
    start_time: "2026-02-02T19:00:00",
    end_time: "2026-02-02T21:00:00",
    source: "internal",
  },
  {
    id: "R-204",
    store_id: mockStoreId,
    guestName: "\uAD6C\uAE00 \uCE98\uB9B0\uB354 \uC678\uBD80\uC608\uC57D",
    partySize: 4,
    date: "2026-02-02",
    status: "confirmed",
    unit_id: "unit-vip",
    unit_index: 2,
    start_time: "2026-02-02T20:00:00",
    end_time: "2026-02-02T22:00:00",
    source: "external",
  },
  {
    id: "R-301",
    store_id: mockStoreId,
    guestName: "\uD64D\uB3C4\uD61C",
    partySize: 5,
    date: "2026-02-03",
    status: "confirmed",
    unit_id: "unit-vip",
    unit_index: 2,
    start_time: "2026-02-03T18:00:00",
    end_time: "2026-02-03T20:00:00",
    source: "internal",
  },
  {
    id: "R-302",
    store_id: mockStoreId,
    guestName: "\uAC15\uC720\uC9C4",
    partySize: 2,
    date: "2026-02-03",
    status: "no_show",
    unit_id: "unit-terrace-2",
    unit_index: 1,
    start_time: "2026-02-03T20:00:00",
    end_time: "2026-02-03T22:00:00",
    source: "internal",
  },
];
const statusLabelMap: Record<ReservationEntry["status"], string> = {
  confirmed: "\uD655\uC815",
  pending: "\uB300\uAE30",
  cancelled: "\uCDE8\uC18C",
  no_show: "\uB178\uC1FC",
  blocked: "\uC608\uC57D \uB9C9\uC74C",
};

const statusStyles: Record<ReservationEntry["status"], string> = {
  confirmed: "bg-emerald-100 text-emerald-700",
  pending: "bg-amber-100 text-amber-700",
  cancelled: "bg-slate-100 text-slate-500",
  no_show: "bg-rose-100 text-rose-700",
  blocked: "bg-slate-200 text-slate-700",
};

const statusOptions = [
  { value: "all", label: "\uC804\uCCB4" },
  { value: "confirmed", label: "\uD655\uC815" },
  { value: "pending", label: "\uB300\uAE30" },
  { value: "cancelled", label: "\uCDE8\uC18C" },
  { value: "no_show", label: "\uB178\uC1FC" },
  { value: "blocked", label: "\uC608\uC57D \uB9C9\uC74C" },
];

const startMinutes = 17 * 60;
const endMinutes = 24 * 60;
const slotMinutes = 30;
const labelColumnWidth = 160;
const dayLabels = [
  "\uC77C",
  "\uC6D4",
  "\uD654",
  "\uC218",
  "\uBAA9",
  "\uAE08",
  "\uD1A0",
];

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
  return `${year}\uB144 ${month}\uC6D4 ${day}\uC77C (${weekday})`;
}

function mapRowToEntry(row: ReservationRow): ReservationEntry {
  return {
    id: String(row.id),
    store_id: String(row.store_id),
    guestName: row.guest_name,
    partySize: row.party_size,
    date: row.date,
    status: row.status,
    unit_id: row.unit_id,
    unit_index: row.unit_index,
    start_time: row.start_time,
    end_time: row.end_time,
    source: row.source,
  };
}

function mapEntryToRow(entry: ReservationEntry): ReservationRow {
  return {
    id: entry.id,
    store_id: entry.store_id,
    guest_name: entry.guestName,
    party_size: entry.partySize,
    date: entry.date,
    status: entry.status,
    unit_id: entry.unit_id,
    unit_index: entry.unit_index,
    start_time: entry.start_time,
    end_time: entry.end_time,
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
  const [rules, setRules] = useState<RuleRow[]>([]);
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
  const [isTouch, setIsTouch] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

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

  if (!resolvedStoreId) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-600">
        {"\uAC00\uAC8C \uC815\uBCF4\uB97C \uBD88\uB7EC\uC62C \uC218 \uC5C6\uC2B5\uB2C8\uB2E4. \uB9E4\uC7A5\uC744 \uC120\uD0DD\uD574 \uC8FC\uC138\uC694."}
      </div>
    );
  }

  const storeKey = resolvedStoreId;
  const fallbackReservationRows = useMemo(
    () =>
      mockReservations.map((item) =>
        mapEntryToRow({ ...item, store_id: storeKey })
      ),
    [storeKey]
  );
  const reservations = useMemo(() => {
    const baseRows =
      reservationRows.length > 0
        ? reservationRows
        : isReservationsSupabaseReady
          ? []
          : fallbackReservationRows;
    return baseRows.map(mapRowToEntry);
  }, [reservationRows, fallbackReservationRows, isReservationsSupabaseReady]);

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
    setIsTouch(
      window.matchMedia("(pointer: coarse)").matches ||
        window.navigator.maxTouchPoints > 0
    );
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

  useEffect(() => {
    if (ruleRows.length > 0) {
      setRules(ruleRows);
      return;
    }
    setRules([]);
  }, [ruleRows]);

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
    : "\uB0A0\uC9DC \uB85C\uB529 \uC911";

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

  const activeReservations = useMemo(
    () => filtered.filter((item) => item.status !== "cancelled"),
    [filtered]
  );

  function openDetail(item: ReservationEntry) {
    if (item.source === "external") {
      window.alert(
        "\uC678\uBD80 \uD50C\uB7AB\uD3FC\uC5D0\uC11C \uAD00\uB9AC\uB418\uB294 \uC608\uC57D\uC785\uB2C8\uB2E4."
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
    setCreateForm({
      id: "",
      guestName: "",
      partySize: "2",
      date: selectedDate,
      startTime,
      endTime,
      unit_id: row.unit_id,
      unit_index: row.unit_index,
    });
    setCreateOpen(true);
  }

  function handleCreateSubmit() {
    if (!createForm) return;
    const { id, guestName, partySize, date, startTime, endTime } = createForm;

    if (!id.trim() || !guestName.trim()) {
      window.alert(
        "\uC608\uC57D \uBC88\uD638\uC640 \uACE0\uAC1D \uC774\uB984\uC744 \uC785\uB825\uD574\uC8FC\uC138\uC694."
      );
      return;
    }

    const start = timeToMinutes(startTime);
    const end = timeToMinutes(endTime);
    if (end <= start) {
      window.alert(
        "\uC885\uB8CC \uC2DC\uAC04\uC740 \uC2DC\uC791 \uC2DC\uAC04\uBCF4\uB2E4 \uB2A6\uC5B4\uC57C \uD569\uB2C8\uB2E4."
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
        "\uD574\uB2F9 \uC2DC\uAC04\uC5D0 \uC774\uBBF8 \uC608\uC57D\uC774 \uC788\uC2B5\uB2C8\uB2E4."
      );
      return;
    }

    const newReservation: ReservationEntry = {
      id: id.trim(),
      store_id: storeKey,
      guestName: guestName.trim(),
      partySize: Number(partySize) || 1,
      date,
      status: "confirmed",
      unit_id: createForm.unit_id,
      unit_index: createForm.unit_index,
      start_time: `${date}T${startTime}:00`,
      end_time: `${date}T${endTime}:00`,
      source: "internal",
    };

    createReservation.mutate(mapEntryToRow(newReservation));

    setCreateOpen(false);
  }

  function toggleRule(ruleId: RuleRow["id"]) {
    const target = rules.find((rule) => String(rule.id) === String(ruleId));
    if (!target) return;
    updateRule.mutate({ id: String(ruleId), enabled: !target.enabled });
  }

  function handleBenefitDragStart(benefit: BenefitRow, event: React.DragEvent) {
    event.dataTransfer.setData("benefitId", String(benefit.id));
    event.dataTransfer.setData("benefitTitle", benefit.title);
  }

  function handleBenefitDrop(slot: string, event: React.DragEvent) {
    event.preventDefault();
    const benefitId = event.dataTransfer.getData("benefitId");
    const benefitTitle = event.dataTransfer.getData("benefitTitle");
    if (!benefitId || !benefitTitle) return;

    const start = timeToMinutes(slot);
    const end = Math.min(start + 60, endMinutes);
    if (end <= start) return;

    const startTime = minutesToTime(start);
    const endTime = minutesToTime(end);

    const newDeal: TimeDealEntry = {
      id: `deal-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      store_id: storeKey,
      benefitId: String(benefitId),
      title: benefitTitle,
      date: selectedDate,
      start_time: `${selectedDate}T${startTime}:00`,
      end_time: `${selectedDate}T${endTime}:00`,
    };

    createTimeDeal.mutate(mapTimeDealEntryToRow(newDeal));
  }

  function createDealFromSlot(slot: string) {
    if (!activeBenefit) {
      window.alert("\uC801\uC6A9\uD560 \uD61C\uD0DD\uC744 \uBA3C\uC800 \uC120\uD0DD\uD574\uC8FC\uC138\uC694.");
      return;
    }
    const start = timeToMinutes(slot);
    const end = Math.min(start + 60, endMinutes);
    if (end <= start) return;

    const startTime = minutesToTime(start);
    const endTime = minutesToTime(end);
    const newDeal: TimeDealEntry = {
      id: `deal-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      store_id: storeKey,
      benefitId: String(activeBenefit.id),
      title: activeBenefit.title,
      date: selectedDate,
      start_time: `${selectedDate}T${startTime}:00`,
      end_time: `${selectedDate}T${endTime}:00`,
    };

    createTimeDeal.mutate(mapTimeDealEntryToRow(newDeal));
  }

  function openTimeDealCreate(benefit: BenefitRow) {
    const startTime = slots[0] ?? "18:00";
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
        "\uC885\uB8CC \uC2DC\uAC04\uC740 \uC2DC\uC791 \uC2DC\uAC04\uBCF4\uB2E4 \uB2A6\uC5B4\uC57C \uD569\uB2C8\uB2E4."
      );
      return;
    }
    if (timeDealForm.mode === "edit" && timeDealForm.id) {
      updateTimeDeal.mutate({
        id: timeDealForm.id,
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
        "\uD574\uB2F9 \uC2DC\uAC04\uC5D0 \uC774\uBBF8 \uC608\uC57D \uB610\uB294 \uB9C9\uC74C \uC0C1\uD0DC\uC785\uB2C8\uB2E4."
      );
      return;
    }

    const newBlock: ReservationEntry = {
      id: `B-${Date.now()}`,
      store_id: storeKey,
      guestName: "\uC678\uBD80 \uC608\uC57D/\uB9C8\uAC10",
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
          <h1 className="text-2xl font-semibold">{"\uC608\uC57D \uBAA9\uB85D"}</h1>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span>{`\uB9E4\uC7A5 #${resolvedStoreId ?? ""}`}</span>
            {showOfflineBadge ? (
              <Badge className="bg-amber-100 text-amber-700">
                {"\uC624\uD504\uB77C\uC778 \uC0C1\uD0DC"}
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
                "\uAD6C\uAE00/\uB124\uC774\uBC84 \uCE98\uB9B0\uB354\uC640 \uC5F0\uB3D9\uD558\uC5EC \uC911\uBCF5 \uC608\uC57D\uC744 \uBC29\uC9C0\uD569\uB2C8\uB2E4."
              )
            }
          >
            {"\uD83D\uDCC5 \uC678\uBD80 \uCE98\uB9B0\uB354 \uC5F0\uB3D9"}
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
            {"\u26D4 \uC608\uC57D \uB9C9\uAE30 \uBAA8\uB4DC"}
          </Button>
          <Button
            variant={view === "scheduler" ? "primary" : "secondary"}
            onClick={() => setView("scheduler")}
          >
            {"\uC2A4\uCF00\uC904\uB7EC \uBCF4\uAE30"}
          </Button>
          <Button
            variant={view === "list" ? "primary" : "secondary"}
            onClick={() => setView("list")}
          >
            {"\uB9AC\uC2A4\uD2B8 \uBCF4\uAE30"}
          </Button>
        </div>
      </div>
      {view === "scheduler" ? (
        <div className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
            <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-4">
              <div className="text-sm font-semibold">{"\uADDC\uCE59 \uBAA9\uB85D"}</div>
              {rules.length === 0 ? (
                <p className="text-xs text-slate-500">
                  {
                    "\uB4F1\uB85D\uB41C \uADDC\uCE59\uC774 \uC5C6\uC2B5\uB2C8\uB2E4. \uB8F0 \uC124\uC815\uC5D0\uC11C \uC0C8 \uADDC\uCE59\uC744 \uB9CC\uB4E4\uC5B4\uC8FC\uC138\uC694."
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
                          {rule.enabled ? "\uD65C\uC131" : "\uBE44\uD65C\uC131"}
                        </div>
                      </div>
                      <Button
                        variant={rule.enabled ? "primary" : "secondary"}
                        className="h-8 px-3 text-xs"
                        onClick={() => toggleRule(rule.id)}
                      >
                        {rule.enabled ? "\uCF1C\uC9D0" : "\uAEBC\uC9D0"}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-4">
              <div className="text-sm font-semibold">{"\uD61C\uD0DD \uBC84\uD2BC"}</div>
              <p className="text-xs text-slate-500">
                {
                  "\uB4DC\uB798\uADF8 \uB610\uB294 \uD0ED\uD558\uC5EC \uD0C0\uC784\uC138\uC77C\uC744 \uB9CC\uB4E4\uC5B4 \uBCF4\uC138\uC694."
                }
              </p>
              {isTouch ? (
                <p className="text-xs text-slate-400">
                  {"\uD0ED \uD6C4 \uC2DC\uAC04\uC744 \uC120\uD0DD\uD558\uBA74 \uC989\uC2DC \uC0DD\uC131\uB429\uB2C8\uB2E4."}
                </p>
              ) : null}
              {benefits.length === 0 ? (
                <p className="text-xs text-slate-500">
                  {
                    "\uD61C\uD0DD \uCE74\uD0C8\uB85C\uADF8\uC5D0\uC11C \uD61C\uD0DD\uC744 \uCD94\uAC00\uD574\uC8FC\uC138\uC694."
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
                        draggable
                        onDragStart={(event) => handleBenefitDragStart(benefit, event)}
                        onClick={() => {
                          if (isTouch) {
                            openTimeDealCreate(benefit);
                            return;
                          }
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
              "\uBE48 \uC2DC\uAC04\uB300\uB294 AI\uAC00 \uC608\uC57D\uC744 \uCD94\uCC9C\uD560 \uC218 \uC788\uB294 \uC2AC\uB86F\uC785\uB2C8\uB2E4."
            }
          </div>

          <div
            className="grid gap-px rounded-lg border border-slate-200 bg-slate-200 text-xs"
            style={{
              gridTemplateColumns: `${labelColumnWidth}px repeat(${slots.length}, minmax(24px, 1fr))`,
            }}
          >
            <div className="bg-white p-2 font-medium">{"\uD14C\uC774\uBE14"}</div>
            {slots.map((slot) => (
              <div key={slot} className="bg-white p-2 text-center text-slate-500">
                {slot}
              </div>
            ))}

            <div
              className="col-span-full grid"
              style={{
                gridTemplateColumns: `${labelColumnWidth}px repeat(${slots.length}, minmax(24px, 1fr))`,
              }}
            >
              <div className="bg-white p-2 text-slate-700">{"\uD0C0\uC784\uC138\uC77C"}</div>
                {slots.map((slot) => (
                  <div
                    key={`deal-slot-${slot}`}
                    className="bg-white p-2 border-l border-slate-100"
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={(event) => handleBenefitDrop(slot, event)}
                    onClick={() => {
                      if (isTouch) return;
                      createDealFromSlot(slot);
                    }}
                  />
                ))}
              {timeDealsForDate.map((deal) => {
                const start = toMinutes(deal.start_time);
                const end = toMinutes(deal.end_time);
                const startIndex = Math.max(
                  0,
                  Math.floor((start - startMinutes) / slotMinutes)
                );
                const endIndex = Math.min(
                  slots.length,
                  Math.ceil((end - startMinutes) / slotMinutes)
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
                (reservation) => reservation.status !== "no_show"
              );

              return (
                <div
                  key={row.id}
                  className="col-span-full grid"
                  style={{
                    gridTemplateColumns: `${labelColumnWidth}px repeat(${slots.length}, minmax(24px, 1fr))`,
                  }}
                >
                  <div className="bg-white p-2 text-slate-700">{row.label}</div>
                  {slots.map((slot) => {
                    const slotMinutesValue = timeToMinutes(slot);
                    const occupied = occupiedReservations.some((reservation) => {
                      const start = timeToMinutes(reservation.start_time.slice(11, 16));
                      const end = timeToMinutes(reservation.end_time.slice(11, 16));
                      return slotMinutesValue >= start && slotMinutesValue < end;
                    });

                    return (
                      <button
                        key={`${row.id}-${slot}`}
                        type="button"
                        className={`bg-white p-2 border-l border-slate-100 ${
                          occupied ? "cursor-not-allowed" : "hover:bg-slate-50"
                        }`}
                        onClick={() => {
                          if (occupied) return;
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
                    const start = toMinutes(reservation.start_time);
                    const end = toMinutes(reservation.end_time);
                    const startIndex = Math.max(
                      0,
                      Math.floor((start - startMinutes) / slotMinutes)
                    );
                    const endIndex = Math.min(
                      slots.length,
                      Math.ceil((end - startMinutes) / slotMinutes)
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
                              "\uC678\uBD80 \uD50C\uB7AB\uD3FC\uC5D0\uC11C \uAD00\uB9AC\uB418\uB294 \uC608\uC57D\uC785\uB2C8\uB2E4."
                            );
                            return;
                          }
                          openDetail(reservation);
                        }}
                      >
                        <span>{reservation.guestName}</span>
                        <span>{`${reservation.partySize}\uBA85`}</span>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {view === "list" && (
        <Table>
          <thead>
            <tr>
              <Th>{"\uC608\uC57D \uBC88\uD638"}</Th>
              <Th>{"\uACE0\uAC1D"}</Th>
              <Th>{"\uC778\uC6D0"}</Th>
              <Th>{"\uB0A0\uC9DC"}</Th>
              <Th>{"\uC2DC\uAC04"}</Th>
              <Th>{"\uC0C1\uD0DC"}</Th>
              <Th>{"\uC870\uCE58"}</Th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <Td colSpan={7}>
                  <div className="py-6 text-center text-sm text-slate-500">
                    {"\uC120\uD0DD\uD55C \uB0A0\uC9DC\uC5D0\uB294 \uC608\uC57D\uC774 \uC5C6\uC2B5\uB2C8\uB2E4."}
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
                          {"\uC678\uBD80"}
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
                      {"\uC0C1\uC138"}
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
              <div className="text-lg font-semibold">{"\uC608\uC57D \uC0C1\uC138"}</div>
              <Badge className={statusStyles[selectedReservation.status]}>
                {statusLabelMap[selectedReservation.status]}
              </Badge>
            </div>
            <div className="space-y-2 text-sm text-slate-600">
              <div>
                {"\uC608\uC57D \uBC88\uD638"}: {selectedReservation.id}
              </div>
              <div>
                {"\uACE0\uAC1D"}: {selectedReservation.guestName}
              </div>
              <div>
                {"\uC778\uC6D0"}: {selectedReservation.partySize}\uBA85
              </div>
              <div>
                {"\uC2DC\uAC04"}: {selectedReservation.start_time.slice(11, 16)}~
                {selectedReservation.end_time.slice(11, 16)}
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
                  {"\uB9C9\uC74C \uD574\uC81C"}
                </Button>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={() =>
                    updateReservationStatus(selectedReservation.id, "confirmed")
                  }
                >
                  {"\uD655\uC815"}
                </Button>
                <Button
                  variant="secondary"
                  className="bg-rose-50 text-rose-600 hover:bg-rose-100"
                  onClick={() =>
                    updateReservationStatus(selectedReservation.id, "no_show")
                  }
                >
                  {"\uB178\uC1FC"}
                </Button>
                <Button
                  variant="ghost"
                  className="text-rose-600 hover:bg-rose-50"
                  onClick={() =>
                    updateReservationStatus(selectedReservation.id, "cancelled")
                  }
                >
                  {"\uCDE8\uC18C"}
                </Button>
              </div>
            )}
          </div>
        ) : null}
      </Dialog>

      <Dialog open={createOpen}>
        {createForm ? (
          <div className="space-y-4">
            <div className="text-lg font-semibold">{"\uC0C8 \uC608\uC57D \uCD94\uAC00"}</div>
            <div className="grid gap-3 text-sm">
              <div className="space-y-1">
                <label className="text-xs text-slate-500">
                  {"\uC608\uC57D \uBC88\uD638"}
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
                <label className="text-xs text-slate-500">{"\uACE0\uAC1D"}</label>
                <input
                  className="h-10 w-full rounded-md border border-slate-200 px-3"
                  value={createForm.guestName}
                  onChange={(event) =>
                    setCreateForm({
                      ...createForm,
                      guestName: event.target.value,
                    })
                  }
                  placeholder="\uAE40\uBBFC\uC218"
                />
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs text-slate-500">{"\uC778\uC6D0"}</label>
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
                  <label className="text-xs text-slate-500">{"\uB0A0\uC9DC"}</label>
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
                    {"\uC2DC\uC791 \uC2DC\uAC04"}
                  </label>
                  <input
                    type="time"
                    className="h-10 w-full rounded-md border border-slate-200 px-3"
                    value={createForm.startTime}
                    onChange={(event) =>
                      setCreateForm({
                        ...createForm,
                        startTime: event.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-500">
                    {"\uC885\uB8CC \uC2DC\uAC04"}
                  </label>
                  <input
                    type="time"
                    className="h-10 w-full rounded-md border border-slate-200 px-3"
                    value={createForm.endTime}
                    onChange={(event) =>
                      setCreateForm({
                        ...createForm,
                        endTime: event.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <div className="text-xs text-slate-500">
                {`\uD14C\uC774\uBE14 ${createForm.unit_id}-${createForm.unit_index}`}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setCreateOpen(false)}>
                {"\uCDE8\uC18C"}
              </Button>
              <Button onClick={handleCreateSubmit}>{"\uCD94\uAC00"}</Button>
            </div>
          </div>
        ) : null}
      </Dialog>

      <Dialog open={timeDealDialogOpen}>
        {timeDealForm ? (
          <div className="space-y-4">
            <div className="text-lg font-semibold">
              {timeDealForm.mode === "edit"
                ? "\uD0C0\uC784\uC138\uC77C \uC218\uC815"
                : "\uD0C0\uC784\uC138\uC77C \uC0DD\uC131"}
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
                <span className="font-medium">{timeDealForm.title}</span>
                <Badge className="bg-indigo-100 text-indigo-700">
                  {"\uD61C\uD0DD"}
                </Badge>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs text-slate-500">
                    {"\uC2DC\uC791 \uC2DC\uAC04"}
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
                    {"\uC885\uB8CC \uC2DC\uAC04"}
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
                  {"\uC0AD\uC81C"}
                </Button>
              ) : null}
              <Button
                variant="secondary"
                onClick={() => setTimeDealDialogOpen(false)}
              >
                {"\uCDE8\uC18C"}
              </Button>
              <Button onClick={handleTimeDealSubmit}>
                {timeDealForm.mode === "edit" ? "\uC800\uC7A5" : "\uC0DD\uC131"}
              </Button>
            </div>
          </div>
        ) : null}
      </Dialog>

    </div>
  );
}
