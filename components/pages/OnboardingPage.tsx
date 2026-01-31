"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { searchPlaces, type Place } from "@/lib/api/places";
import { supabase } from "@/lib/supabase/client";

const steps = [
  { id: 1, label: "\uAE30\uBCF8 \uC815\uBCF4" },
  { id: 2, label: "\uACF5\uAC04/\uC88C\uC11D" },
  { id: 3, label: "\uB300\uD45C \uBA54\uB274" },
];

const categories = [
  "\uC220\uC9D1/\uD3EC\uCC28",
  "\uC2DD\uB2F9/\uBC25\uC9D1",
  "\uCE74\uD398/\uB514\uC800\uD2B8",
  "\uC2A4\uD130\uB514\uB8F8/\uACF5\uAC04",
  "\uD30C\uD2F0\uB8F8",
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
  if (key.includes("CAFE")) return "\uCE74\uD398/\uB514\uC800\uD2B8";
  if (key.includes("STUDY") || key.includes("OFFICE")) return "\uC2A4\uD130\uB514\uB8F8/\uACF5\uAC04";
  if (key.includes("PARTY")) return "\uD30C\uD2F0\uB8F8";
  if (key.includes("BAR") || key.includes("DRINK") || key.includes("PUB")) {
    return "\uC220\uC9D1/\uD3EC\uCC28";
  }
  if (key.includes("FOOD") || key.includes("RESTAURANT")) {
    return "\uC2DD\uB2F9/\uBC25\uC9D1";
  }
  return "\uC2DD\uB2F9/\uBC25\uC9D1";
}

function mapMainCategoryToDb(value: string) {
  if (value.includes("\uCE74\uD398")) return "CAFE";
  if (value.includes("\uC2A4\uD130\uB514\uB8F8") || value.includes("\uACF5\uAC04")) return "STUDY";
  if (value.includes("\uD30C\uD2F0")) return "PARTY";
  if (value.includes("\uC220\uC9D1") || value.includes("\uD3EC\uCC28")) return "BAR";
  return "FOOD";
}

export function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [storeName, setStoreName] = useState("");
  const [category, setCategory] = useState("\uC2DD\uB2F9/\uBC25\uC9D1");
  const [location, setLocation] = useState("\uC548\uC554\uB3D9");
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
    category === "\uC2A4\uD130\uB514\uB8F8/\uACF5\uAC04" || category === "\uD30C\uD2F0\uB8F8";

  const menuPlaceholders = useMemo(() => {
    if (category === "\uCE74\uD398/\uB514\uC800\uD2B8") {
      return ["\uC544\uBA54\uB9AC\uCE74\uB178", "\uB77C\uB5BC", "\uD504\uB799\uCE58\uB178"];
    }
    if (category === "\uC220\uC9D1/\uD3EC\uCC28") {
      return ["\uD574\uBB3C\uD30C\uC804", "\uBAA8\uB460 \uC624\uB384\uD0D5", "\uC0BC\uACB9 \uC219\uC8FC"];
    }
    return ["\uB300\uD45C \uBA54\uB274 1", "\uB300\uD45C \uBA54\uB274 2", "\uB300\uD45C \uBA54\uB274 3"];
  }, [category]);

  const pricePlaceholders = useMemo(() => {
    if (category === "\uCE74\uD398/\uB514\uC800\uD2B8") {
      return ["4500", "5200", "7000"];
    }
    if (category === "\uC220\uC9D1/\uD3EC\uCC28") {
      return ["15000", "18000", "22000"];
    }
    return ["10000", "12000", "15000"];
  }, [category]);

  const capacityLabels = useMemo(() => {
    if (isSpaceBusiness) {
      return {
        seat1: "1\uC778 \uB370\uC2A4\uD06C",
        seat2: "2\uC778 \uB370\uC2A4\uD06C",
        seat4: "4\uC778\uC2E4",
        seat6: "6\uC778\uC2E4 \uC774\uC0C1",
        room: "\uD504\uB77C\uC774\uBE57 \uB8F8",
      };
    }
    return {
      seat1: "1\uC778\uC11D (\uD640/\uBC14)",
      seat2: "2\uC778\uC11D (\uCEE4\uD50C/\uCE5C\uAD6C)",
      seat4: "4\uC778\uC11D (\uAE30\uBCF8)",
      seat6: "6\uC778 \uC774\uC0C1 (\uB2E8\uCCB4\uC11D)",
      room: "\uD504\uB77C\uC774\uBE57 \uB8F8",
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
        window.alert("\uB85C\uADF8\uC778 \uC0C1\uD0DC\uB97C \uD655\uC778\uD574 \uC8FC\uC138\uC694.");
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
        const { data: store, error } = await supabase
          .from("places")
          .update({
            owner_id: userData.user.id,
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
            `\uC11C\uBC84 \uC800\uC7A5\uC744 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4.${
              error?.message ? ` (${error.message})` : ""
            }`
          );
          return;
        }

        try {
          await persistDetails(String(store.id));
        } catch (detailError) {
          console.error(detailError);
          window.alert("\uC218\uC6A9\uB7C9/\uBA54\uB274 \uC800\uC7A5\uC744 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4.");
          return;
        }

        window.alert("\uD83C\uDF89 \uC0AC\uC7A5\uB2D8, \uC900\uBE44\uAC00 \uC644\uB8CC\uB418\uC5C8\uC2B5\uB2C8\uB2E4!");
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
          `\uC11C\uBC84 \uC800\uC7A5\uC744 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4.${
            error?.message ? ` (${error.message})` : ""
          }`
        );
        return;
      }

      try {
        await persistDetails(String(store.id));
      } catch (detailError) {
        console.error(detailError);
        window.alert("\uC218\uC6A9\uB7C9/\uBA54\uB274 \uC800\uC7A5\uC744 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4.");
        return;
      }

      window.alert("\uD83C\uDF89 \uC0AC\uC7A5\uB2D8, \uC900\uBE44\uAC00 \uC644\uB8CC\uB418\uC5C8\uC2B5\uB2C8\uB2E4!");
      if (typeof window !== "undefined") {
        window.localStorage.setItem("rendezvous_last_store", String(store.id));
      }
      router.push(`/stores/${store.id}`);
      return;
    } catch {
      window.alert("\uC11C\uBC84 \uC800\uC7A5\uC744 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4.");
    }
  }

  const canGoNext = storeName.trim().length > 0 || step !== 1;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{"\uC628\uBCF4\uB529"}</h1>
        <p className="text-sm text-slate-500">
          {"\uAC00\uAC8C \uC815\uBCF4\uB97C \uC785\uB825\uD558\uC5EC \uB9E4\uC7A5 \uCEE8\uC194\uC744 \uC2DC\uC791\uD574 \uBCF4\uC138\uC694."}
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
            <label className="text-sm font-medium">{"\uAC00\uAC8C \uC774\uB984"}</label>
            <div className="relative">
              <Input
                className="h-12 text-lg"
                value={storeName}
                onChange={(event) => {
                  setStoreName(event.target.value);
                  setSelectedPlace(null);
                }}
                placeholder="\uC548\uC554\uB3D9 \uD14C\uC2A4\uD2B8 \uD3EC\uCC28"
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
                        {place.address ?? "\uC8FC\uC18C \uC815\uBCF4 \uC5C6\uC74C"}
                      </span>
                    </button>
                  ))}
                </div>
              ) : null}
              {showResults && searchResults.length === 0 && !isSearching ? (
                <div className="absolute z-10 mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500 shadow-lg">
                  {"\uAC80\uC0C9 \uACB0\uACFC\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4. \uC0C8\uB85C \uC785\uB825\uD574 \uC8FC\uC138\uC694."}
                </div>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
              {autoFilled ? "\uD83D\uDCCD \uAC80\uC0C9\uB41C \uC8FC\uC18C\uB97C \uBD88\uB7EC\uC654\uC2B5\uB2C8\uB2E4." : null}
              {selectedPlace ? (
                <button
                  type="button"
                  className="text-slate-500 underline"
                  onClick={clearSelection}
                >
                  {"\uC0C8\uB85C \uC785\uB825\uD558\uAE30"}
                </button>
              ) : null}
              {isSearching ? "\uAC80\uC0C9 \uC911..." : null}
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">{"\uC5C5\uC885 \uC120\uD0DD"}</label>
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
            <label className="text-sm font-medium">{"\uC704\uCE58"}</label>
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
            {"\uC6B0\uB9AC \uAC00\uAC8C \uAC04\uD310 \uBA54\uB274 3\uAC1C\uB9CC \uC54C\uB824\uC8FC\uC138\uC694!"}
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
          {"\uC774\uC804"}
        </Button>
        {step < 3 ? (
          <Button onClick={() => setStep((prev) => Math.min(3, prev + 1))} disabled={!canGoNext}>
            {"\uB2E4\uC74C"}
          </Button>
        ) : (
          <Button onClick={handleComplete}>
            {"\uC644\uB8CC"}
          </Button>
        )}
      </div>
    </div>
  );
}
