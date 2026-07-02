"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase/client";
import { toast } from "@/components/ui/toaster";
import { useTableUnits } from "@/lib/hooks/useTableUnits";
import { useAppReservations } from "@/lib/hooks/useAppReservations";

// 🪑 테이블 맵 v2.5 — 수용량 통합 + 예약 배정 + 합석 + 구역/층 + 실측 스냅샷.
// 상태가 바뀔 때마다 점유 스냅샷(store_table_events)을 남겨 AI 수익엔진의
// 점유율 추정이 '실측'으로 진화한다.

type TableStatus = "empty" | "occupied" | "reserved";
type TableShape = "square" | "round" | "long" | "bar";
type ZoneType = "hall" | "window" | "room" | "outdoor" | "bar";

type StoreTable = {
  id: number;
  place_id: number;
  label: string;
  capacity: number;
  max_capacity: number | null;
  shape: TableShape;
  zone_type: ZoneType;
  area: string;
  pos_x: number;
  pos_y: number;
  rotated: boolean;
  status: TableStatus;
  is_empty: boolean; // 하위호환
  mergeable: boolean;
  reserved_note: string | null;
  deal_percent: number | null;
};

const COLS = 6;
const ROWS = 8;
const DEALS = [null, 10, 20, 30] as const;
const DEFAULT_AREA = "1층";

const SHAPES: { key: TableShape; label: string; icon: string }[] = [
  { key: "square", label: "네모", icon: "⬜" },
  { key: "round", label: "원형", icon: "⚪" },
  { key: "long", label: "긴 테이블", icon: "▭" },
  { key: "bar", label: "바(bar)", icon: "🍸" },
];

const ZONES: { key: ZoneType; label: string }[] = [
  { key: "hall", label: "홀" },
  { key: "window", label: "창가" },
  { key: "room", label: "룸" },
  { key: "outdoor", label: "야외" },
  { key: "bar", label: "바" },
];

const ZONE_LABEL: Record<ZoneType, string> = {
  hall: "홀", window: "창가", room: "룸", outdoor: "야외", bar: "바",
};

const STATUS_STYLE: Record<TableStatus, string> = {
  empty: "border-emerald-400 bg-emerald-100",
  occupied: "border-slate-300 bg-slate-300/70",
  reserved: "border-amber-400 bg-amber-100",
};

function cellsOf(t: Pick<StoreTable, "pos_x" | "pos_y" | "shape" | "rotated">): [number, number][] {
  const cells: [number, number][] = [[t.pos_x, t.pos_y]];
  if (t.shape === "long") {
    cells.push(t.rotated ? [t.pos_x, t.pos_y + 1] : [t.pos_x + 1, t.pos_y]);
  }
  return cells;
}

export function TableMapPage({ storeId }: { storeId?: string }) {
  const placeId = Number(storeId);
  const [tables, setTables] = useState<StoreTable[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<StoreTable | null>(null);
  const [addCell, setAddCell] = useState<{ x: number; y: number } | null>(null);
  const [addShape, setAddShape] = useState<TableShape>("square");
  const [addCapacity, setAddCapacity] = useState(4);
  const [addZone, setAddZone] = useState<ZoneType>("hall");
  const [moveMode, setMoveMode] = useState(false);
  const [area, setArea] = useState(DEFAULT_AREA);
  const [assignRes, setAssignRes] = useState<{ id: string; time: string; party: number } | null>(null);
  const { data: units = [] } = useTableUnits(storeId);
  const { data: appReservations = [] } = useAppReservations(storeId);

  const load = async () => {
    if (!Number.isFinite(placeId)) return;
    const { data, error } = await supabase
      .from("store_tables")
      .select("*")
      .eq("place_id", placeId)
      .order("id", { ascending: true });
    if (!error) setTables((data ?? []) as StoreTable[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [placeId]);

  // 구역 목록(등록된 것 + 기본)
  const areas = useMemo(() => {
    const set = new Set<string>([DEFAULT_AREA]);
    tables.forEach((t) => set.add(t.area || DEFAULT_AREA));
    return Array.from(set);
  }, [tables]);

  const areaTables = useMemo(
    () => tables.filter((t) => (t.area || DEFAULT_AREA) === area),
    [tables, area]
  );

  // 현재 구역 점유 셀
  const covered = useMemo(() => {
    const map = new Map<string, StoreTable>();
    areaTables.forEach((t) => cellsOf(t).forEach(([x, y]) => map.set(`${x},${y}`, t)));
    return map;
  }, [areaTables]);

  const emptyTables = tables.filter((t) => t.status === "empty");
  const emptySeats = emptyTables.reduce((a, t) => a + t.capacity, 0);
  const totalSeats = tables.reduce((a, t) => a + t.capacity, 0);

  // 오늘의 다가오는 앱 예약(확정) — 테이블 배정 대상
  const upcomingReservations = useMemo(() => {
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    const nowMin = today.getHours() * 60 + today.getMinutes();
    const assignedIds = new Set(
      tables.filter((t) => t.reserved_note).map((t) => (t.reserved_note || "").split("|")[0])
    );
    return appReservations
      .filter((r) => r.status === "confirmed" && r.date === todayStr)
      .filter((r) => {
        const [h, m] = (r.time || "00:00").split(":").map(Number);
        return h * 60 + (m || 0) >= nowMin - 30; // 30분 지난 예약은 제외
      })
      .filter((r) => !assignedIds.has(String(r.id)))
      .slice(0, 5);
  }, [appReservations, tables]);

  // 📸 점유 스냅샷 기록 — AI 수익엔진 실측 점유율의 원천
  const logSnapshot = async (nextTables: StoreTable[]) => {
    try {
      const total = nextTables.reduce((a, t) => a + t.capacity, 0);
      const occupied = nextTables
        .filter((t) => t.status !== "empty")
        .reduce((a, t) => a + t.capacity, 0);
      await supabase.from("store_table_events").insert({
        place_id: placeId,
        occupied_seats: occupied,
        total_seats: total,
        empty_tables: nextTables.filter((t) => t.status === "empty").length,
      });
    } catch {
      /* 스냅샷 실패는 무시 */
    }
  };

  // 상태 변경 → 손님앱 신호 + 시설 자동 태깅 + 스냅샷
  const syncPlaceMeta = async (nextTables: StoreTable[]) => {
    const anyEmpty = nextTables.some((t) => t.status === "empty");
    const patch: Record<string, any> = {
      vacancy_until: anyEmpty ? new Date(Date.now() + 120 * 60_000).toISOString() : null,
    };
    try {
      const featAdd: Record<string, boolean> = {};
      if (nextTables.some((t) => t.zone_type === "room")) featAdd.private_room = true;
      if (nextTables.some((t) => t.zone_type === "outdoor")) featAdd.rooftop = true;
      if (Object.keys(featAdd).length > 0) {
        const { data } = await supabase.from("places").select("features").eq("id", placeId).maybeSingle();
        const feat = data?.features && typeof data.features === "object" ? data.features : {};
        patch.features = { ...feat, ...featAdd };
      }
    } catch {
      /* 태깅 실패 무시 */
    }
    await supabase.from("places").update(patch).eq("id", placeId);
    logSnapshot(nextTables);
  };

  const canPlace = (x: number, y: number, shape: TableShape, rotated: boolean, ignoreId?: number) => {
    const cells = cellsOf({ pos_x: x, pos_y: y, shape, rotated });
    return cells.every(([cx, cy]) => {
      if (cx >= COLS || cy >= ROWS) return false;
      const hit = covered.get(`${cx},${cy}`);
      return !hit || hit.id === ignoreId;
    });
  };

  const addTable = async () => {
    if (!addCell) return;
    const rotated = addShape === "long" && !canPlace(addCell.x, addCell.y, "long", false);
    if (!canPlace(addCell.x, addCell.y, addShape, rotated)) {
      toast("자리가 부족해요. 다른 칸을 선택해주세요.", "error");
      return;
    }
    const label = `T${tables.length + 1}`;
    const { data, error } = await supabase
      .from("store_tables")
      .insert({
        place_id: placeId,
        label,
        capacity: addCapacity,
        shape: addShape,
        zone_type: addZone,
        area,
        pos_x: addCell.x,
        pos_y: addCell.y,
        rotated,
        status: "occupied",
        is_empty: false,
        mergeable: false,
      })
      .select("*")
      .single();
    if (error || !data) {
      toast("테이블 추가에 실패했어요.", "error");
      return;
    }
    const next = [...tables, data as StoreTable];
    setTables(next);
    setAddCell(null);
    syncPlaceMeta(next);
    toast(`${label} · ${ZONE_LABEL[addZone]} ${addCapacity}인 추가!`, "success");
  };

  const importFromUnits = async () => {
    if (units.length === 0) {
      toast("기존 수용량 정보가 없어요. 빈 칸을 탭해 직접 추가해주세요.", "error");
      return;
    }
    const rows: any[] = [];
    let idx = 0;
    units.forEach((u) => {
      for (let q = 0; q < (u.quantity || 1); q += 1) {
        rows.push({
          place_id: placeId,
          label: `${u.name || "T"}${q + 1}`,
          capacity: u.max_capacity || 4,
          shape: "square",
          zone_type: "hall",
          area: DEFAULT_AREA,
          pos_x: idx % COLS,
          pos_y: Math.floor(idx / COLS),
          rotated: false,
          status: "occupied",
          is_empty: false,
          mergeable: false,
        });
        idx += 1;
      }
    });
    const { data, error } = await supabase.from("store_tables").insert(rows).select("*");
    if (error) {
      toast("불러오기에 실패했어요.", "error");
      return;
    }
    setTables((prev) => [...prev, ...((data ?? []) as StoreTable[])]);
    toast(`${rows.length}개 테이블을 불러왔어요. 탭해서 모양·위치를 다듬어주세요.`, "success");
  };

  const updateTable = async (t: StoreTable, patch: Partial<StoreTable>): Promise<boolean> => {
    if (patch.status) {
      patch.is_empty = patch.status === "empty";
      // 착석(occupied)은 배정 기록(note)을 유지해 '다가오는 예약' 중복 배정을 막고,
      // 비움(empty)일 때만 배정 해제. 할인은 빈 테이블에만 유효.
      if (patch.status === "empty") patch.reserved_note = null;
      if (patch.status !== "empty") patch.deal_percent = null;
    }
    const { error } = await supabase.from("store_tables").update(patch).eq("id", t.id);
    if (error) {
      toast("저장에 실패했어요.", "error");
      return false;
    }
    const next = tables.map((x) => (x.id === t.id ? { ...x, ...patch } : x));
    setTables(next);
    setSelected((prev) => (prev && prev.id === t.id ? { ...prev, ...patch } : prev));
    if ("status" in patch || "zone_type" in patch) await syncPlaceMeta(next);
    return true;
  };

  const removeTable = async (t: StoreTable) => {
    const { error } = await supabase.from("store_tables").delete().eq("id", t.id);
    if (error) {
      toast("삭제에 실패했어요.", "error");
      return;
    }
    const next = tables.filter((x) => x.id !== t.id);
    setTables(next);
    setSelected(null);
    setMoveMode(false);
    await syncPlaceMeta(next);
  };

  const moveTo = async (x: number, y: number) => {
    if (!selected) return;
    if (!canPlace(x, y, selected.shape, selected.rotated, selected.id)) {
      toast("그 자리엔 놓을 수 없어요.", "error");
      return;
    }
    const ok = await updateTable(selected, { pos_x: x, pos_y: y, area });
    if (!ok) return; // 저장 실패 시 이동 모드 유지(성공 오인 방지)
    setMoveMode(false);
    toast("이동 완료!", "success");
  };

  const bulkStatus = async (status: TableStatus) => {
    const { error } = await supabase
      .from("store_tables")
      .update({ status, is_empty: status === "empty", deal_percent: null, reserved_note: null })
      .eq("place_id", placeId);
    if (error) {
      toast("일괄 변경에 실패했어요.", "error");
      return;
    }
    const next = tables.map((t) => ({
      ...t, status, is_empty: status === "empty", deal_percent: null, reserved_note: null,
    }));
    setTables(next);
    setSelected(null);
    await syncPlaceMeta(next);
    toast(status === "empty" ? "전부 비움으로 변경!" : "전부 사용중으로 변경!", "success");
  };

  // 예약 → 테이블 배정
  const assignToTable = async (t: StoreTable) => {
    if (!assignRes) return;
    if (t.status === "occupied" && !window.confirm(`${t.label}은 지금 사용중이에요. 이 테이블에 예약을 배정할까요?`)) {
      return;
    }
    const res = assignRes;
    const ok = await updateTable(t, {
      status: "reserved",
      reserved_note: `${res.id}|${res.time} ${res.party}인 예약`,
    });
    if (!ok) return; // 저장 실패 시 배정 모드 유지(성공 오인 방지)
    setAssignRes(null);
    toast(`${t.label}에 ${res.time} 예약 배정!`, "success");
  };

  const noteText = (t: StoreTable) => (t.reserved_note || "").split("|")[1] || "";

  const addArea = () => {
    const name = window.prompt("새 구역 이름 (예: 2층, 테라스, 룸존)");
    if (name && name.trim()) setArea(name.trim());
  };

  return (
    <div className="space-y-4 pb-44">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">🪑 테이블 맵</h1>
          <p className="text-sm text-slate-500">
            테이블 배치·인원·빈자리를 한 곳에서 관리해요. (기존 &lsquo;수용량&rsquo; 메뉴 통합)
          </p>
        </div>
        <div className="flex gap-1.5 flex-shrink-0">
          <Button variant="secondary" className="h-8 text-xs" onClick={() => bulkStatus("empty")}>
            전부 비움
          </Button>
          <Button variant="secondary" className="h-8 text-xs" onClick={() => bulkStatus("occupied")}>
            전부 사용중
          </Button>
        </div>
      </div>

      {/* 현황 요약 */}
      <Card className={emptyTables.length > 0 ? "border-emerald-300 bg-emerald-50/50" : ""}>
        <CardContent className="flex items-center justify-between p-4">
          <div className="text-sm">
            {emptyTables.length > 0 ? (
              <span className="font-bold text-emerald-700">
                🟢 지금 {emptyTables.length}테이블 · 최대 {emptySeats}명 앉을 수 있어요
              </span>
            ) : (
              <span className="text-slate-500">지금 비어있는 테이블이 없어요</span>
            )}
            <div className="text-xs text-slate-400 mt-0.5">
              총 {tables.length}테이블 · {totalSeats}석 · 손님 앱 &lsquo;지금 빈자리&rsquo;에 자동 반영
            </div>
          </div>
          {tables.length === 0 && units.length > 0 && (
            <Button onClick={importFromUnits} variant="secondary" className="text-xs h-9">
              📥 기존 수용량에서 불러오기
            </Button>
          )}
        </CardContent>
      </Card>

      {/* 🟡 다가오는 앱 예약 → 테이블 배정 */}
      {upcomingReservations.length > 0 && (
        <Card className="border-amber-200">
          <CardContent className="p-4 space-y-2">
            <div className="text-sm font-bold text-amber-700">
              📅 오늘 다가오는 예약 {upcomingReservations.length}건 — 테이블을 배정해두세요
            </div>
            <div className="flex flex-wrap gap-2">
              {upcomingReservations.map((r) => {
                // 손님이 자리를 지정한 예약 → 칩 탭 한 번에 그 테이블로 자동 배정
                const wanted = r.table_id ? tables.find((t) => t.id === r.table_id) : undefined;
                return (
                  <button
                    key={r.id}
                    onClick={() => {
                      if (wanted) {
                        setAssignRes({ id: String(r.id), time: r.time, party: r.party_size });
                        // assignToTable은 assignRes state를 쓰므로 직접 값 전달 버전으로 처리
                        updateTable(wanted, {
                          status: "reserved",
                          reserved_note: `${r.id}|${r.time} ${r.party_size}인 예약`,
                        }).then((ok) => {
                          setAssignRes(null);
                          if (ok) toast(`손님 지정석 ${wanted.label}에 자동 배정!`, "success");
                        });
                        return;
                      }
                      setAssignRes(
                        assignRes?.id === String(r.id)
                          ? null
                          : { id: String(r.id), time: r.time, party: r.party_size }
                      );
                    }}
                    className={`rounded-xl border-2 px-3 py-2 text-xs font-bold transition-colors ${
                      assignRes?.id === String(r.id)
                        ? "border-amber-500 bg-amber-100 text-amber-800"
                        : "border-slate-200 text-slate-600 hover:border-amber-300"
                    }`}
                  >
                    {r.time} · {r.party_size}인
                    {r.table_label ? ` · 🪑${r.table_label} 지정` : ""}
                    {assignRes?.id === String(r.id) && !wanted ? " → 테이블 탭!" : ""}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 구역/층 탭 */}
      <div className="flex items-center gap-1.5 overflow-x-auto">
        {areas.map((a) => (
          <button
            key={a}
            onClick={() => setArea(a)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-bold flex-shrink-0 transition-colors ${
              area === a ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
            }`}
          >
            {a}
          </button>
        ))}
        <button onClick={addArea} className="rounded-full bg-slate-100 px-3 py-1.5 text-xs text-slate-400 flex-shrink-0 hover:bg-slate-200">
          + 구역
        </button>
      </div>

      {/* 이동/배정 모드 안내 */}
      {moveMode && selected && (
        <div className="rounded-xl bg-sky-50 border border-sky-200 px-4 py-2.5 text-sm font-bold text-sky-700 flex items-center justify-between">
          <span>📍 {selected.label} 테이블을 옮길 칸을 탭하세요 (다른 구역 탭으로 이동도 가능)</span>
          <button onClick={() => setMoveMode(false)} className="text-xs text-sky-500">취소</button>
        </div>
      )}
      {assignRes && (
        <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-2.5 text-sm font-bold text-amber-700 flex items-center justify-between">
          <span>🟡 {assignRes.time} {assignRes.party}인 예약 — 배정할 테이블을 탭하세요</span>
          <button onClick={() => setAssignRes(null)} className="text-xs text-amber-500">취소</button>
        </div>
      )}

      {/* 테이블 맵 격자 */}
      <Card>
        <CardContent className="p-3">
          {loading ? (
            <p className="py-8 text-center text-sm text-slate-400">불러오는 중...</p>
          ) : (
            <div
              className="grid gap-1.5 rounded-xl bg-slate-100 p-2"
              style={{ gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))`, gridAutoRows: "1fr" }}
            >
              {Array.from({ length: COLS * ROWS }, (_, i) => {
                const x = i % COLS;
                const y = Math.floor(i / COLS);
                if (covered.has(`${x},${y}`)) return null;
                return (
                  <button
                    key={`cell-${i}`}
                    style={{ gridColumnStart: x + 1, gridRowStart: y + 1 }}
                    onClick={() => {
                      if (moveMode) {
                        moveTo(x, y);
                        return;
                      }
                      setSelected(null);
                      setAddCell({ x, y });
                    }}
                    className={`aspect-square rounded-lg border-2 border-dashed transition-colors ${
                      addCell?.x === x && addCell?.y === y
                        ? "border-brand bg-amber-50"
                        : moveMode
                        ? "border-sky-300 bg-sky-50/60 hover:border-sky-400"
                        : "border-slate-200 bg-white/60 hover:border-slate-300"
                    }`}
                  >
                    <span className="text-slate-300 text-lg">{moveMode ? "📍" : "+"}</span>
                  </button>
                );
              })}

              {areaTables.map((t) => {
                const isSel = selected?.id === t.id;
                const spanCol = t.shape === "long" && !t.rotated ? 2 : 1;
                const spanRow = t.shape === "long" && t.rotated ? 2 : 1;
                return (
                  <button
                    key={`t-${t.id}`}
                    style={{
                      gridColumnStart: t.pos_x + 1,
                      gridRowStart: t.pos_y + 1,
                      gridColumnEnd: `span ${spanCol}`,
                      gridRowEnd: `span ${spanRow}`,
                    }}
                    onClick={() => {
                      if (assignRes) {
                        assignToTable(t);
                        return;
                      }
                      setAddCell(null);
                      setSelected(t);
                      setMoveMode(false);
                    }}
                    className={`relative border-2 flex flex-col items-center justify-center transition-all min-h-0 ${
                      t.shape === "round" ? "rounded-full aspect-square" : "rounded-lg"
                    } ${t.shape !== "long" ? "aspect-square" : ""} ${STATUS_STYLE[t.status] || STATUS_STYLE.occupied} ${
                      isSel ? "ring-2 ring-brand ring-offset-1" : ""
                    } ${assignRes ? "hover:ring-2 hover:ring-amber-400" : ""}`}
                  >
                    <span className="text-[11px] font-bold text-slate-700 leading-tight">
                      {t.shape === "bar" ? "🍸" : ""}{t.label}
                      {t.mergeable ? " ⛓" : ""}
                    </span>
                    <span className="text-[10px] text-slate-500 leading-tight">
                      {t.capacity}인{t.zone_type !== "hall" ? ` · ${ZONE_LABEL[t.zone_type]}` : ""}
                    </span>
                    {t.status === "reserved" && (
                      <span className="text-[9px] font-bold text-amber-600 leading-tight truncate max-w-full px-0.5">
                        {noteText(t) || "예약석"}
                      </span>
                    )}
                    {t.status === "empty" && t.deal_percent ? (
                      <span className="absolute -top-1.5 -right-1.5 rounded-full bg-rose-500 px-1.5 py-0.5 text-[9px] font-bold text-white">
                        -{t.deal_percent}%
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          )}
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-500">
            <span>🟩 비어있음</span>
            <span>⬜ 사용중</span>
            <span>🟨 예약석</span>
            <span>⛓ 합석 가능</span>
            <span>🔴 -N% 테이블 한정 할인</span>
          </div>
        </CardContent>
      </Card>

      {/* 하단 패널 — 테이블 추가 */}
      {addCell && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white p-4 shadow-2xl">
          <div className="mx-auto max-w-3xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-sm font-bold text-slate-700">새 테이블 · {area}</div>
              <button onClick={() => setAddCell(null)} className="text-xs text-slate-400">취소</button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex gap-1">
                {SHAPES.map((s) => (
                  <button
                    key={s.key}
                    onClick={() => {
                      setAddShape(s.key);
                      if (s.key === "long" && addCapacity < 6) setAddCapacity(6);
                      if (s.key === "bar") setAddCapacity(1);
                    }}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                      addShape === s.key ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {s.icon} {s.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex gap-1">
                {(addShape === "bar" ? [1, 2, 3, 4] : [2, 4, 6, 8, 10]).map((c) => (
                  <button
                    key={c}
                    onClick={() => setAddCapacity(c)}
                    className={`rounded-full px-2.5 py-1.5 text-xs font-semibold ${
                      addCapacity === c ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {c}인
                  </button>
                ))}
              </div>
              <span className="text-slate-200">|</span>
              <div className="flex gap-1">
                {ZONES.map((z) => (
                  <button
                    key={z.key}
                    onClick={() => setAddZone(z.key)}
                    className={`rounded-full px-2.5 py-1.5 text-xs font-semibold ${
                      addZone === z.key ? "bg-teal-600 text-white" : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {z.label}
                  </button>
                ))}
              </div>
              <Button onClick={addTable} className="ml-auto bg-brand hover:bg-brand-dark">
                여기에 추가
              </Button>
            </div>
            {(addZone === "room" || addZone === "outdoor") && (
              <p className="text-[11px] text-teal-600">
                💡 {addZone === "room" ? "룸" : "야외"} 테이블을 등록하면 손님 앱 필터(
                {addZone === "room" ? "룸/프라이빗" : "루프탑/야외"})에도 자동 반영돼요.
              </p>
            )}
          </div>
        </div>
      )}

      {/* 하단 패널 — 테이블 관리 */}
      {selected && !moveMode && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white p-4 shadow-2xl">
          <div className="mx-auto max-w-3xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-sm font-bold text-slate-800">
                {selected.label} · {ZONE_LABEL[selected.zone_type]} {selected.capacity}인
                <span className="ml-2 text-xs">
                  {selected.status === "empty" && <span className="text-emerald-600 font-bold">🟢 비어있음</span>}
                  {selected.status === "occupied" && <span className="text-slate-400">⬜ 사용중</span>}
                  {selected.status === "reserved" && (
                    <span className="text-amber-600 font-bold">🟡 {noteText(selected) || "예약석"}</span>
                  )}
                </span>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setMoveMode(true)} className="text-xs text-sky-500 hover:text-sky-700 font-bold">
                  📍 이동
                </button>
                <button onClick={() => removeTable(selected)} className="text-xs text-rose-400 hover:text-rose-600">
                  삭제
                </button>
                <button onClick={() => setSelected(null)} className="text-xs text-slate-400">
                  닫기
                </button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {([
                { key: "empty", label: "🟢 비어있음", cls: "border-emerald-400 bg-emerald-50 text-emerald-700" },
                { key: "occupied", label: "⬜ 사용중", cls: "border-slate-300 bg-slate-50 text-slate-600" },
                { key: "reserved", label: "🟡 예약석", cls: "border-amber-400 bg-amber-50 text-amber-700" },
              ] as { key: TableStatus; label: string; cls: string }[]).map((s) => (
                <button
                  key={s.key}
                  onClick={() =>
                    updateTable(selected, {
                      status: s.key,
                      deal_percent: s.key === "empty" ? selected.deal_percent : null,
                    })
                  }
                  className={`rounded-xl border-2 py-3 text-sm font-bold transition-all ${
                    selected.status === s.key ? s.cls + " ring-1 ring-offset-1" : "border-slate-200 text-slate-400"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {/* ⛓ 합석 가능 */}
            <button
              onClick={() => updateTable(selected, { mergeable: !selected.mergeable })}
              className={`w-full rounded-xl border-2 py-2.5 text-sm font-bold transition-colors ${
                selected.mergeable
                  ? "border-indigo-400 bg-indigo-50 text-indigo-700"
                  : "border-slate-200 text-slate-400 hover:border-slate-300"
              }`}
            >
              ⛓ 옆 테이블과 합석(붙이기) 가능 {selected.mergeable ? "ON" : "OFF"}
            </button>

            {selected.status === "empty" && (
              <div>
                <div className="mb-1.5 text-xs font-bold text-slate-500">
                  💸 이 테이블만 할인 (빨리 채우고 싶을 때)
                </div>
                <div className="flex gap-2">
                  {DEALS.map((d) => (
                    <button
                      key={String(d)}
                      onClick={() => updateTable(selected, { deal_percent: d })}
                      className={`flex-1 rounded-xl border-2 py-2.5 text-sm font-bold transition-colors ${
                        selected.deal_percent === d
                          ? "border-rose-400 bg-rose-50 text-rose-600"
                          : "border-slate-200 text-slate-500 hover:border-slate-300"
                      }`}
                    >
                      {d ? `-${d}%` : "할인 없음"}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
