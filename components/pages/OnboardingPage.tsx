"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { searchPlaces, type Place } from "@/lib/api/places";

const steps = [
  { id: 1, label: "기본 정보" },
  { id: 2, label: "공간/좌석" },
  { id: 3, label: "대표 메뉴" },
];

const categories = [
  "술집/포차",
  "식당/밥집",
  "카페/디저트",
  "스터디룸/공간",
  "파티룸",
];

function Counter({
  value,
  onChange,
}: {
  value: number;
  onChange: (next: number) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant="secondary"
        className="h-11 w-11 p-0"
        onClick={() => onChange(Math.max(0, value - 1))}
      >
        -
      </Button>
      <div className="min-w-10 text-center text-base font-semibold">
        {value}
      </div>
      <Button
        type="button"
        className="h-11 w-11 p-0"
        onClick={() => onChange(value + 1)}
      >
        +
      </Button>
    </div>
  );
}

function mapMainCategory(value?: string | null) {
  const key = (value ?? "").toUpperCase();
  if (key.includes("CAFE")) return "카페/디저트";
  if (key.includes("STUDY") || key.includes("OFFICE")) return "스터디룸/공간";
  if (key.includes("PARTY")) return "파티룸";
  if (key.includes("BAR") || key.includes("DRINK") || key.includes("PUB")) {
    return "술집/포차";
  }
  if (key.includes("FOOD") || key.includes("RESTAURANT")) {
    return "식당/밥집";
  }
  return "식당/밥집";
}

export function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [storeName, setStoreName] = useState("");
  const [category, setCategory] = useState("식당/밥집");
  const [location, setLocation] = useState("안암동");
  const [autoFilled, setAutoFilled] = useState(false);

  const [searchResults, setSearchResults] = useState<Place[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);

  const [seat1, setSeat1] = useState(4);
  const [seat2, setSeat2] = useState(6);
  const [seat4, setSeat4] = useState(10);
  const [seat6, setSeat6] = useState(2);
  const [roomCount, setRoomCount] = useState(1);

  const [menus, setMenus] = useState([
    { name: "", price: "" },
    { name: "", price: "" },
    { name: "", price: "" },
  ]);

  const isSpaceBusiness =
    category === "스터디룸/공간" || category === "파티룸";

  const menuPlaceholders = useMemo(() => {
    if (category === "카페/디저트") {
      return ["아메리카노", "카페라떼", "크로플"];
    }
    if (category === "술집/포차") {
      return ["해물파전", "모둠 오뎅탕", "닭볶음탕"];
    }
    return ["대표 메뉴 1", "대표 메뉴 2", "대표 메뉴 3"];
  }, [category]);

  const pricePlaceholders = useMemo(() => {
    if (category === "카페/디저트") {
      return ["4500", "5200", "7000"];
    }
    if (category === "술집/포차") {
      return ["15000", "18000", "22000"];
    }
    return ["10000", "12000", "15000"];
  }, [category]);

  const capacityLabels = useMemo(() => {
    if (isSpaceBusiness) {
      return {
        seat1: "1인 데스크",
        seat2: "2인 데스크",
        seat4: "4인실",
        seat6: "6인 이상 룸",
        room: "프라이빗 룸",
      };
    }
    return {
      seat1: "1인석 (혼밥/바 테이블)",
      seat2: "2인석 (커플/친구)",
      seat4: "4인석 (기본)",
      seat6: "6인 이상 (단체석)",
      room: "프라이빗 룸",
    };
  }, [isSpaceBusiness]);

  useEffect(() => {
    if (storeName.trim().length < 2 || selectedPlace) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    let active = true;
    setIsSearching(true);
    const timer = setTimeout(async () => {
      const data = await searchPlaces(storeName);
      if (!active) return;
      setSearchResults(data);
      setShowResults(true);
      setIsSearching(false);
    }, 300);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [storeName, selectedPlace]);

  function updateMenu(index: number, key: "name" | "price", value: string) {
    setMenus((prev) =>
      prev.map((menu, idx) => (idx === index ? { ...menu, [key]: value } : menu))
    );
  }

  function handleSelectPlace(place: Place) {
    setSelectedPlace(place);
    setStoreName(place.name);
    setLocation(place.address ?? "");
    setCategory(mapMainCategory(place.main_category));
    setAutoFilled(true);
    setShowResults(false);
  }

  function clearSelection() {
    setSelectedPlace(null);
    setAutoFilled(false);
    setSearchResults([]);
  }

  async function handleComplete(payload: Record<string, unknown>) {
    try {
      await fetch("/api/stores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch {
      // mock only
    }
    window.alert("🎉 사장님, 준비가 끝났습니다!");
    router.push(`/stores/${payload.storeId ?? "1"}`);
  }

  async function handleDevCreate() {
    const payload = {
      storeId: "1",
      name: "안암동 1등 포차",
      category: "술집/포차",
      location: "서울 성북구 안암로 145",
      capacity: {
        seat1: 4,
        seat2: 6,
        seat4: 10,
        seat6: 2,
        room: 3,
      },
      menus: [
        { name: "모둠 오뎅탕", price: "1.8만" },
        { name: "삼겹 숙주", price: "1.6만" },
      ],
    };
    await handleComplete(payload);
  }

  const canGoNext = storeName.trim().length > 0 || step !== 1;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold">온보딩</h1>
          <p className="text-sm text-slate-500">
            터치 몇 번으로 가게 등록을 마칠 수 있어요.
          </p>
        </div>
        <Button
          variant="ghost"
          className="border border-rose-300 text-rose-600 hover:bg-rose-50"
          onClick={handleDevCreate}
        >
          ⚡ DEV: 데모 가게 생성
        </Button>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-3">
          {steps.map((item, index) => (
            <div key={item.id} className="flex items-center gap-2">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${
                  step >= item.id
                    ? "bg-slate-900 text-white"
                    : "border border-slate-200 text-slate-400"
                }`}
              >
                {item.id}
              </div>
              <div className="text-sm font-medium text-slate-600">
                {item.label}
              </div>
              {index < steps.length - 1 ? (
                <div className="h-px w-8 bg-slate-200" />
              ) : null}
            </div>
          ))}
        </div>
        <div className="h-2 rounded-full bg-slate-100">
          <div
            className="h-2 rounded-full bg-slate-900"
            style={{ width: `${(step / steps.length) * 100}%` }}
          />
        </div>
      </div>

      {step === 1 && (
        <div className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">가게 이름</label>
            <div className="relative">
              <Input
                className="h-12 text-lg"
                value={storeName}
                onChange={(event) => {
                  setStoreName(event.target.value);
                  setSelectedPlace(null);
                }}
                placeholder="예: 안암동 데일리 포차"
              />
              {showResults && searchResults.length > 0 ? (
                <div className="absolute z-10 mt-2 w-full rounded-xl border border-slate-200 bg-white shadow-lg">
                  {searchResults.map((place) => (
                    <button
                      key={place.id}
                      type="button"
                      className="flex w-full flex-col items-start gap-1 px-4 py-3 text-left text-sm hover:bg-slate-50"
                      onClick={() => handleSelectPlace(place)}
                    >
                      <span className="font-medium text-slate-900">
                        {place.name}
                      </span>
                      <span className="text-xs text-slate-500">
                        {place.address ?? "주소 정보 없음"}
                      </span>
                    </button>
                  ))}
                </div>
              ) : null}
              {showResults && searchResults.length === 0 && !isSearching ? (
                <div className="absolute z-10 mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500 shadow-lg">
                  검색 결과가 없습니다. 새로 입력해 주세요.
                </div>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
              {autoFilled ? "📍 검색된 주소를 불러왔습니다." : null}
              {selectedPlace ? (
                <button
                  type="button"
                  className="text-slate-500 underline"
                  onClick={clearSelection}
                >
                  새로 입력하기
                </button>
              ) : null}
              {isSearching ? "검색 중..." : null}
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">업종 선택</label>
            <div className="flex flex-wrap gap-2">
              {categories.map((item) => {
                const selected = category === item;
                return (
                  <Button
                    key={item}
                    type="button"
                    variant={selected ? "primary" : "secondary"}
                    className="rounded-full"
                    onClick={() => setCategory(item)}
                  >
                    {item}
                  </Button>
                );
              })}
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">위치</label>
            <Input
              className="h-12"
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              placeholder="안암동"
            />
          </div>
          {!canGoNext ? (
            <div className="text-sm text-rose-500">
              가게 이름은 꼭 입력해 주세요.
            </div>
          ) : null}
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-medium">{capacityLabels.seat1}</div>
              <div className="text-xs text-slate-500">혼자 오는 손님용 좌석</div>
            </div>
            <Counter value={seat1} onChange={setSeat1} />
          </div>
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-medium">{capacityLabels.seat2}</div>
              <div className="text-xs text-slate-500">2인이 가장 많이 앉는 자리</div>
            </div>
            <Counter value={seat2} onChange={setSeat2} />
          </div>
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-medium">{capacityLabels.seat4}</div>
              <div className="text-xs text-slate-500">기본 테이블 수</div>
            </div>
            <Counter value={seat4} onChange={setSeat4} />
          </div>
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-medium">{capacityLabels.seat6}</div>
              <div className="text-xs text-slate-500">단체 예약 대응 좌석</div>
            </div>
            <Counter value={seat6} onChange={setSeat6} />
          </div>
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-medium">{capacityLabels.room}</div>
              <div className="text-xs text-slate-500">별도 공간 개수</div>
            </div>
            <Counter value={roomCount} onChange={setRoomCount} />
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6">
          <div className="text-sm font-medium">
            우리 가게 간판 메뉴 3가지만 알려주세요!
          </div>
          <div className="space-y-4">
            {menus.map((menu, index) => (
              <div key={`menu-${index}`} className="grid gap-2 md:grid-cols-2">
                <Input
                  className="h-12"
                  value={menu.name}
                  onChange={(event) =>
                    updateMenu(index, "name", event.target.value)
                  }
                  placeholder={`${menuPlaceholders[index]}`}
                />
                <Input
                  className="h-12"
                  value={menu.price}
                  onChange={(event) =>
                    updateMenu(index, "price", event.target.value)
                  }
                  placeholder={`${pricePlaceholders[index]}`}
                />
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge>메뉴는 나중에 수정할 수 있어요</Badge>
            <Badge>가격은 숫자만 입력해도 됩니다</Badge>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button
          variant="secondary"
          onClick={() => setStep((prev) => Math.max(1, prev - 1))}
        >
          이전
        </Button>
        <div className="flex flex-wrap gap-2">
          {step < 3 ? (
            <Button
              variant="ghost"
              onClick={() => setStep((prev) => Math.min(3, prev + 1))}
            >
              건너뛰기
            </Button>
          ) : null}
          {step < 3 ? (
            <Button
              onClick={() => {
                if (!canGoNext) return;
                setStep((prev) => Math.min(3, prev + 1));
              }}
            >
              다음
            </Button>
          ) : (
            <Button
              onClick={() =>
                handleComplete({
                  storeId: `store-${Date.now()}`,
                  name: storeName || "새 매장",
                  category,
                  location,
                  capacity: {
                    seat1,
                    seat2,
                    seat4,
                    seat6,
                    room: roomCount,
                  },
                  menus,
                })
              }
            >
              완료
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}