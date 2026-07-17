"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { searchPlaces, type Place } from "@/lib/api/places";
import { supabase } from "@/lib/supabase/client";

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
      <div className="min-w-10 text-center text-base font-semibold">{value}</div>
      <Button type="button" className="h-11 w-11 p-0" onClick={() => onChange(value + 1)}>
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

function mapMainCategoryToDb(value: string) {
  if (value.includes("카페")) return "CAFE";
  if (value.includes("스터디룸") || value.includes("공간")) return "STUDY";
  if (value.includes("파티")) return "PARTY";
  if (value.includes("술집") || value.includes("포차")) return "BAR";
  return "FOOD";
}

export function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [storeName, setStoreName] = useState("");
  const [category, setCategory] = useState("식당/밥집");
  const [location, setLocation] = useState("안암동");
  const [autoFilled, setAutoFilled] = useState(false);
  const [lat, setLat] = useState(37.5866076);
  const [lng, setLng] = useState(127.0294157);

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
      return ["아메리카노", "라떼", "프랙치노"];
    }
    if (category === "술집/포차") {
      return ["해물파전", "모둠 오뎄탕", "삼겹 숙주"];
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
        seat6: "6인실 이상",
        room: "프라이빗 룸",
      };
    }
    return {
      seat1: "1인석 (홀/바)",
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
    if (typeof place.lat === "number") setLat(place.lat);
    if (typeof place.lng === "number") setLng(place.lng);
    setAutoFilled(true);
    setShowResults(false);
  }

  function clearSelection() {
    setSelectedPlace(null);
    setAutoFilled(false);
    setSearchResults([]);
  }

  async function handleComplete() {
    const payload = {
      name: storeName,
      category,
      main_category: mapMainCategoryToDb(category),
      address: location,
    };

    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData?.user) {
        window.alert("로그인 상태를 확인해 주세요.");
        return;
      }

      const persistDetails = async (storeId: string) => {
        const unitPayloads = [
          {
            name: capacityLabels.seat1,
            min_capacity: 1,
            max_capacity: 1,
            quantity: seat1,
            is_private: false,
          },
          {
            name: capacityLabels.seat2,
            min_capacity: 2,
            max_capacity: 2,
            quantity: seat2,
            is_private: false,
          },
          {
            name: capacityLabels.seat4,
            min_capacity: 4,
            max_capacity: 4,
            quantity: seat4,
            is_private: false,
          },
          {
            name: capacityLabels.seat6,
            min_capacity: 6,
            max_capacity: 10,
            quantity: seat6,
            is_private: false,
          },
          {
            name: capacityLabels.room,
            min_capacity: 4,
            max_capacity: 8,
            quantity: roomCount,
            is_private: true,
          },
        ]
          .filter((unit) => unit.quantity > 0)
          .map((unit) => ({
            ...unit,
            store_id: storeId,
          }));

        const menuPayloads = menus
          .filter((menu) => menu.name.trim().length > 0)
          .map((menu) => ({
            store_id: storeId,
            name: menu.name.trim(),
            price: Number(menu.price) || null,
          }));

        await supabase.from("table_units").delete().eq("store_id", storeId);
        if (unitPayloads.length > 0) {
          const { error: unitError } = await supabase
            .from("table_units")
            .insert(unitPayloads);
          if (unitError) throw unitError;
        }

        await supabase.from("store_menus").delete().eq("store_id", storeId);
        if (menuPayloads.length > 0) {
          const { error: menuError } = await supabase
            .from("store_menus")
            .insert(menuPayloads);
          if (menuError) throw menuError;
        }
      };

      if (selectedPlace?.id) {
        // 1) 소유권 claim (RLS 하에서 미소유 place는 claim_store 함수로만 owner 지정 가능)
        const { error: claimErr } = await supabase.rpc("claim_store", {
          p_place_id: selectedPlace.id,
        });
        if (claimErr) {
          console.error(claimErr);
          window.alert(
            `매장 등록에 실패했어요.${
              claimErr?.message ? ` (${claimErr.message})` : ""
            }`
          );
          return;
        }
        // 2) 소유자가 됐으니 나머지 정보 업데이트(owner_id는 위에서 세팅됨)
        const { data: store, error } = await supabase
          .from("places")
          .update({
            name: storeName,
            category,
            main_category: mapMainCategoryToDb(category),
            address: location,
            lat,
            lng,
          })
          .eq("id", selectedPlace.id)
          .select("id")
          .single();

        if (error || !store?.id) {
          if (error) console.error(error);
          window.alert(
            `서버 저장을 실패했습니다.${
              error?.message ? ` (${error.message})` : ""
            }`
          );
          return;
        }

        try {
          await persistDetails(String(store.id));
        } catch (detailError) {
          console.error(detailError);
          window.alert("수용량/메뉴 저장을 실패했습니다.");
          return;
        }

        window.alert("🎉 사장님, 준비가 완료되었습니다!");
        if (typeof window !== "undefined") {
          window.localStorage.setItem("rendezvous_last_store", String(store.id));
        }
        router.push(`/stores/${store.id}`);
        return;
      }

      const { data: store, error } = await supabase
        .from("places")
        .insert({
          ...payload,
          owner_id: userData.user.id,
          lat,
          lng,
        })
        .select("id")
        .single();

      if (error || !store?.id) {
        if (error) console.error(error);
        window.alert(
          `서버 저장을 실패했습니다.${
            error?.message ? ` (${error.message})` : ""
          }`
        );
        return;
      }

      try {
        await persistDetails(String(store.id));
      } catch (detailError) {
        console.error(detailError);
        window.alert("수용량/메뉴 저장을 실패했습니다.");
        return;
      }

      window.alert("🎉 사장님, 준비가 완료되었습니다!");
      if (typeof window !== "undefined") {
        window.localStorage.setItem("rendezvous_last_store", String(store.id));
      }
      router.push(`/stores/${store.id}`);
      return;
    } catch {
      window.alert("서버 저장을 실패했습니다.");
    }
  }

  const canGoNext = storeName.trim().length > 0 || step !== 1;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{"온보딩"}</h1>
        <p className="text-sm text-slate-500">
          {"가게 정보를 입력하여 매장 컨솔을 시작해 보세요."}
        </p>
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
              <div className="text-sm font-medium text-slate-600">{item.label}</div>
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
            <label className="text-sm font-medium">{"가게 이름"}</label>
            <div className="relative">
              <Input
                className="h-12 text-lg"
                value={storeName}
                onChange={(event) => {
                  setStoreName(event.target.value);
                  setSelectedPlace(null);
                }}
                placeholder="안암동 테스트 포차"
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
                      <span className="font-medium text-slate-900">{place.name}</span>
                      <span className="text-xs text-slate-500">
                        {place.address ?? "주소 정보 없음"}
                      </span>
                    </button>
                  ))}
                </div>
              ) : null}
              {showResults && searchResults.length === 0 && !isSearching ? (
                <div className="absolute z-10 mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500 shadow-lg">
                  {"검색 결과가 없습니다. 새로 입력해 주세요."}
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
                  {"새로 입력하기"}
                </button>
              ) : null}
              {isSearching ? "검색 중..." : null}
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">{"업종 선택"}</label>
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
            <label className="text-sm font-medium">{"위치"}</label>
            <Input value={location} onChange={(event) => setLocation(event.target.value)} />
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{capacityLabels.seat1}</span>
              <Counter value={seat1} onChange={setSeat1} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{capacityLabels.seat2}</span>
              <Counter value={seat2} onChange={setSeat2} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{capacityLabels.seat4}</span>
              <Counter value={seat4} onChange={setSeat4} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{capacityLabels.seat6}</span>
              <Counter value={seat6} onChange={setSeat6} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{capacityLabels.room}</span>
              <Counter value={roomCount} onChange={setRoomCount} />
            </div>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6">
          <p className="text-sm text-slate-600">
            {"우리 가게 간판 메뉴 3개만 알려주세요!"}
          </p>
          <div className="space-y-3">
            {menus.map((menu, index) => (
              <div key={index} className="grid gap-3 md:grid-cols-[2fr_1fr]">
                <Input
                  value={menu.name}
                  onChange={(event) => updateMenu(index, "name", event.target.value)}
                  placeholder={menuPlaceholders[index]}
                />
                <Input
                  value={menu.price}
                  onChange={(event) => updateMenu(index, "price", event.target.value)}
                  placeholder={pricePlaceholders[index]}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <Button
          variant="secondary"
          onClick={() => setStep((prev) => Math.max(1, prev - 1))}
          disabled={step === 1}
        >
          {"이전"}
        </Button>
        {step < 3 ? (
          <Button onClick={() => setStep((prev) => Math.min(3, prev + 1))} disabled={!canGoNext}>
            {"다음"}
          </Button>
        ) : (
          <Button onClick={handleComplete}>
            {"완료"}
          </Button>
        )}
      </div>
    </div>
  );
}
