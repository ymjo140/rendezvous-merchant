"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

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

export function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [storeName, setStoreName] = useState("");
  const [category, setCategory] = useState("식당/밥집");
  const [location, setLocation] = useState("안암동");

  const [table4, setTable4] = useState(6);
  const [table6, setTable6] = useState(2);
  const [privateRoom, setPrivateRoom] = useState(false);

  const [room4, setRoom4] = useState(2);
  const [room6, setRoom6] = useState(1);
  const [room10, setRoom10] = useState(0);

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

  function updateMenu(index: number, key: "name" | "price", value: string) {
    setMenus((prev) =>
      prev.map((menu, idx) => (idx === index ? { ...menu, [key]: value } : menu))
    );
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
      location: "안암동",
      capacity: {
        table4: 10,
        privateRoom: 2,
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
            <Input
              className="h-12 text-lg"
              value={storeName}
              onChange={(event) => setStoreName(event.target.value)}
              placeholder="예: 안암동 데일리 포차"
            />
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
        <div className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6">
          {!isSpaceBusiness ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-medium">기본 4인석</div>
                  <div className="text-xs text-slate-500">주력 좌석 개수를 알려주세요.</div>
                </div>
                <Counter value={table4} onChange={setTable4} />
              </div>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-medium">단체 6인석</div>
                  <div className="text-xs text-slate-500">모임 예약에 쓰입니다.</div>
                </div>
                <Counter value={table6} onChange={setTable6} />
              </div>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-medium">프라이빗 룸</div>
                  <div className="text-xs text-slate-500">룸이 있다면 켜주세요.</div>
                </div>
                <button
                  type="button"
                  onClick={() => setPrivateRoom((prev) => !prev)}
                  className={`h-11 w-20 rounded-full border text-sm font-medium ${
                    privateRoom
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-200 text-slate-600"
                  }`}
                >
                  {privateRoom ? "있음" : "없음"}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-medium">4인실</div>
                  <div className="text-xs text-slate-500">기본 스터디룸</div>
                </div>
                <Counter value={room4} onChange={setRoom4} />
              </div>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-medium">6인실</div>
                  <div className="text-xs text-slate-500">중형 룸</div>
                </div>
                <Counter value={room6} onChange={setRoom6} />
              </div>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-medium">10인 세미나실</div>
                  <div className="text-xs text-slate-500">대형 모임 공간</div>
                </div>
                <Counter value={room10} onChange={setRoom10} />
              </div>
            </div>
          )}
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
                  capacity: isSpaceBusiness
                    ? { room4, room6, room10 }
                    : { table4, table6, privateRoom },
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