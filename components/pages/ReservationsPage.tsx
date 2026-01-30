
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, Td, Th } from "@/components/ui/table";
import { Dialog } from "@/components/ui/dialog";
import type { TableUnit } from "@/domain/stores/types";
import { loadTableUnits, saveTableUnits } from "@/lib/utils/tableUnitsStore";
import {
  loadReservations,
  saveReservations,
  type StoredReservation,
} from "@/lib/utils/reservationsStore";
import { loadBenefits, saveBenefits, type StoredBenefit } from "@/lib/utils/benefitsStore";
import { loadRules, saveRules, type StoredRule } from "@/lib/utils/rulesStore";
import {
  loadTimeDeals,
  saveTimeDeals,
  type StoredTimeDeal,
} from "@/lib/utils/timeDealsStore";

type ReservationEntry = StoredReservation;

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

type ResizeState = {
  dealId: string;
  edge: "start" | "end";
};

const mockUnits: TableUnit[] = [
  {
    id: "unit-hall-4",
    name: "\uD640 4\uC778\uC11D",
    min_capacity: 2,
    max_capacity: 4,
    quantity: 4,
    is_private: false,
  },
  {
    id: "unit-terrace-2",
    name: "\uD14C\uB77C\uC2A4 2\uC778\uC11D",
    min_capacity: 1,
    max_capacity: 2,
    quantity: 2,
    is_private: false,
  },
  {
    id: "unit-vip",
    name: "VIP \uB8F8",
    min_capacity: 4,
    max_capacity: 8,
    quantity: 2,
    is_private: true,
  },
];

const mockReservations: ReservationEntry[] = [
  {
    id: "R-101",
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
};

const statusStyles: Record<ReservationEntry["status"], string> = {
  confirmed: "bg-emerald-100 text-emerald-700",
  pending: "bg-amber-100 text-amber-700",
  cancelled: "bg-slate-100 text-slate-500",
  no_show: "bg-rose-100 text-rose-700",
};

const statusOptions = [
  { value: "all", label: "\uC804\uCCB4" },
  { value: "confirmed", label: "\uD655\uC815" },
  { value: "pending", label: "\uB300\uAE30" },
  { value: "cancelled", label: "\uCDE8\uC18C" },
  { value: "no_show", label: "\uB178\uC1FC" },
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

export function ReservationsPage({ storeId }: { storeId?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const effectiveStoreId = useMemo(() => {
    if (storeId && storeId !== "undefined" && storeId !== "null") return storeId;
    const parts = pathname?.split("/").filter(Boolean) ?? [];
    const storesIndex = parts.indexOf("stores");
    if (storesIndex >= 0 && parts[storesIndex + 1]) {
      const candidate = parts[storesIndex + 1];
      if (candidate && candidate !== "undefined" && candidate !== "null") {
        return candidate;
      }
    }
    return undefined;
  }, [storeId, pathname]);
  const [resolvedStoreId, setResolvedStoreId] = useState<string | undefined>(
    undefined
  );
  const [statusFilter, setStatusFilter] = useState("all");
  const [view, setView] = useState<"scheduler" | "list">("scheduler");
  const [selectedDate, setSelectedDate] = useState(todayString);
  const [tableUnits, setTableUnits] = useState<TableUnit[]>([]);
  const [reservations, setReservations] = useState<ReservationEntry[]>([]);
  const [rules, setRules] = useState<StoredRule[]>([]);
  const [benefits, setBenefits] = useState<StoredBenefit[]>([]);
  const [timeDeals, setTimeDeals] = useState<StoredTimeDeal[]>([]);
  const [selectedReservation, setSelectedReservation] =
    useState<ReservationEntry | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CreateForm | null>(null);
  const [resizeState, setResizeState] = useState<ResizeState | null>(null);
  const timeDealRowRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (effectiveStoreId) {
      setResolvedStoreId(effectiveStoreId);
      if (typeof window !== "undefined") {
        window.localStorage.setItem("rendezvous_last_store", effectiveStoreId);
      }
      return;
    }
    if (typeof window !== "undefined") {
      const lastStore = window.localStorage.getItem("rendezvous_last_store");
      if (lastStore) {
        setResolvedStoreId(lastStore);
      }
    }
  }, [effectiveStoreId]);

  useEffect(() => {
    const local = loadReservations(resolvedStoreId);
    if (local) {
      setReservations(local);
      return;
    }
    const fallback = loadReservations();
    if (fallback) {
      setReservations(fallback);
      saveReservations(resolvedStoreId, fallback);
      return;
    }
    setReservations(mockReservations);
    saveReservations(resolvedStoreId, mockReservations);
  }, [resolvedStoreId]);

  useEffect(() => {
    const localUnits = loadTableUnits(resolvedStoreId);
    if (localUnits && localUnits.length > 0) {
      setTableUnits(localUnits);
      return;
    }
    const fallback = loadTableUnits();
    if (fallback && fallback.length > 0) {
      setTableUnits(fallback);
      saveTableUnits(resolvedStoreId, fallback);
      return;
    }
    setTableUnits(mockUnits);
    saveTableUnits(resolvedStoreId, mockUnits);
  }, [resolvedStoreId]);

  useEffect(() => {
    const localRules = loadRules(resolvedStoreId);
    if (localRules) {
      setRules(localRules);
      return;
    }
    const fallback = loadRules();
    if (fallback) {
      setRules(fallback);
      saveRules(resolvedStoreId, fallback);
      return;
    }
    setRules([]);
  }, [resolvedStoreId]);

  useEffect(() => {
    const localBenefits = loadBenefits(resolvedStoreId);
    if (localBenefits) {
      setBenefits(localBenefits);
      return;
    }
    const fallback = loadBenefits();
    if (fallback) {
      setBenefits(fallback);
      saveBenefits(resolvedStoreId, fallback);
      return;
    }
    setBenefits([]);
  }, [resolvedStoreId]);

  useEffect(() => {
    const localDeals = loadTimeDeals(resolvedStoreId);
    if (localDeals) {
      setTimeDeals(localDeals);
      return;
    }
    const fallback = loadTimeDeals();
    if (fallback) {
      setTimeDeals(fallback);
      saveTimeDeals(resolvedStoreId, fallback);
      return;
    }
    setTimeDeals([]);
  }, [resolvedStoreId]);
  useEffect(() => {
    if (!resizeState) return;
    const activeResize = resizeState;

    function handleMove(event: MouseEvent) {
      const ref = timeDealRowRef.current;
      if (!ref) return;
      const rect = ref.getBoundingClientRect();
      const x = event.clientX - rect.left - labelColumnWidth;
      const width = rect.width - labelColumnWidth;
      if (width <= 0) return;
      const slotsCount = buildSlots().length;
      const index = Math.min(
        Math.max(Math.floor((x / width) * slotsCount), 0),
        slotsCount - 1
      );
      const targetMinutes = startMinutes + index * slotMinutes;

      setTimeDeals((prev) => {
        if (!activeResize) return prev;
        const next = prev.map((deal) => {
          if (deal.id !== activeResize.dealId) return deal;
          const currentStart = timeToMinutes(deal.start_time.slice(11, 16));
          const currentEnd = timeToMinutes(deal.end_time.slice(11, 16));

          if (activeResize.edge === "start") {
            const nextStart = Math.min(targetMinutes, currentEnd - slotMinutes);
            const nextStartTime = minutesToTime(Math.max(startMinutes, nextStart));
            return {
              ...deal,
              start_time: `${deal.date}T${nextStartTime}:00`,
            };
          }

          const nextEnd = Math.max(
            targetMinutes + slotMinutes,
            currentStart + slotMinutes
          );
          const boundedEnd = Math.min(nextEnd, endMinutes);
          const nextEndTime = minutesToTime(boundedEnd);
          return {
            ...deal,
            end_time: `${deal.date}T${nextEndTime}:00`,
          };
        });
        saveTimeDeals(resolvedStoreId, next);
        return next;
      });
    }

    function handleUp() {
      setResizeState(null);
    }

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
  }, [resizeState, resolvedStoreId]);

  const filtered = useMemo(() => {
    return reservations.filter((item) => {
      const statusMatch = statusFilter === "all" || item.status === statusFilter;
      const dateMatch = item.date === selectedDate;
      return statusMatch && dateMatch;
    });
  }, [reservations, statusFilter, selectedDate]);

  const slots = useMemo(() => buildSlots(), []);
  const rows = useMemo(() => buildRows(tableUnits), [tableUnits]);
  const dateLabel = formatDateLabel(selectedDate);
  const timeDealsForDate = useMemo(
    () => timeDeals.filter((deal) => deal.date === selectedDate),
    [timeDeals, selectedDate]
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
    setReservations((prev) => {
      let next: ReservationEntry[];
      if (nextStatus === "cancelled") {
        next = prev.filter((item) => item.id !== reservationId);
      } else {
        next = prev.map((item) =>
          item.id === reservationId ? { ...item, status: nextStatus } : item
        );
      }
      saveReservations(resolvedStoreId, next);
      return next;
    });
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

    setReservations((prev) => {
      const next = [newReservation, ...prev];
      saveReservations(resolvedStoreId, next);
      return next;
    });

    setCreateOpen(false);
  }

  function toggleRule(ruleId: StoredRule["id"]) {
    setRules((prev) => {
      const next = prev.map((rule) =>
        rule.id === ruleId ? { ...rule, enabled: !rule.enabled } : rule
      );
      saveRules(resolvedStoreId, next);
      return next;
    });
  }

  function handleBenefitDragStart(benefit: StoredBenefit, event: React.DragEvent) {
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

    const newDeal: StoredTimeDeal = {
      id: `deal-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      benefitId,
      title: benefitTitle,
      date: selectedDate,
      start_time: `${selectedDate}T${startTime}:00`,
      end_time: `${selectedDate}T${endTime}:00`,
    };

    setTimeDeals((prev) => {
      const next = [newDeal, ...prev];
      saveTimeDeals(resolvedStoreId, next);
      return next;
    });
  }

  const activeReservations = filtered.filter((item) => item.status !== "cancelled");

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold">{"\uC608\uC57D \uBAA9\uB85D"}</h1>
          <p className="text-sm text-slate-500">{`\uB9E4\uC7A5 #${resolvedStoreId ?? ""}`}</p>
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
                  "\uB4DC\uB798\uADF8\uD574\uC11C \uC2A4\uCF00\uC904\uB7EC\uC5D0 \uB193\uC73C\uBA74 \uD0C0\uC784\uC138\uC77C\uC774 \uC0DD\uC131\uB429\uB2C8\uB2E4."
                }
              </p>
              {benefits.length === 0 ? (
                <p className="text-xs text-slate-500">
                  {
                    "\uD61C\uD0DD \uCE74\uD0C8\uB85C\uADF8\uC5D0\uC11C \uD61C\uD0DD\uC744 \uCD94\uAC00\uD574\uC8FC\uC138\uC694."
                  }
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {benefits.map((benefit) => (
                    <Button
                      key={String(benefit.id)}
                      variant="secondary"
                      className="h-8 rounded-full px-3 text-xs"
                      draggable
                      onDragStart={(event) => handleBenefitDragStart(benefit, event)}
                    >
                      {benefit.title}
                    </Button>
                  ))}
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
              ref={timeDealRowRef}
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
                    className="relative z-10 flex items-center gap-2 rounded-md bg-indigo-50 px-2 py-1 text-xs text-indigo-700"
                    style={{
                      gridColumn: `${columnStart} / ${columnEnd}`,
                      gridRow: "1",
                      alignSelf: "center",
                    }}
                  >
                    <button
                      type="button"
                      className="absolute left-0 top-0 h-full w-2 cursor-ew-resize rounded-l-md bg-indigo-200"
                      onMouseDown={() =>
                        setResizeState({ dealId: deal.id, edge: "start" })
                      }
                    />
                    <span className="truncate">{deal.title}</span>
                    <button
                      type="button"
                      className="absolute right-0 top-0 h-full w-2 cursor-ew-resize rounded-r-md bg-indigo-200"
                      onMouseDown={() =>
                        setResizeState({ dealId: deal.id, edge: "end" })
                      }
                    />
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
                    const isNoShow = reservation.status === "no_show";

                    return (
                      <div
                        key={reservation.id}
                        className={`z-10 flex items-center justify-between rounded-md px-2 py-1 text-xs ${
                          isExternal
                            ? "bg-slate-200 text-slate-700"
                            : isNoShow
                              ? "bg-rose-100 text-rose-700"
                              : "bg-slate-900 text-white"
                        } ${isExternal ? "cursor-pointer" : ""} ${
                          isNoShow ? "pointer-events-none" : ""
                        }`}
                        style={{
                          gridColumn: `${columnStart} / ${columnEnd}`,
                          gridRow: "1",
                          alignSelf: "center",
                          backgroundImage: isExternal
                            ? "repeating-linear-gradient(45deg, rgba(148,163,184,0.35), rgba(148,163,184,0.35) 6px, rgba(255,255,255,0.4) 6px, rgba(255,255,255,0.4) 12px)"
                            : undefined,
                        }}
                        onClick={() => {
                          if (isExternal) {
                            window.alert(
                              "\uC678\uBD80 \uD50C\uB7AB\uD3FC\uC5D0\uC11C \uAD00\uB9AC\uB418\uB294 \uC608\uC57D\uC785\uB2C8\uB2E4."
                            );
                          } else {
                            openDetail(reservation);
                          }
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
    </div>
  );
}
