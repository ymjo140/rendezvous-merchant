"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMenus } from "@/lib/hooks/useMenus";

export function MenuManagementPage({ storeId }: { storeId?: string }) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const {
    data: menus = [],
    createMenu,
    deleteMenu,
    isLoading,
  } = useMenus(storeId);

  if (!storeId || storeId === "undefined" || storeId === "null") {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-600">
        {"\uAC00\uAC8C \uC815\uBCF4\uB97C \uBD88\uB7EC\uC62C \uC218 \uC5C6\uC2B5\uB2C8\uB2E4. \uB9E4\uC7A5\uC744 \uC120\uD0DD\uD574 \uC8FC\uC138\uC694."}
      </div>
    );
  }

  const handleAdd = async () => {
    if (!name.trim()) {
      window.alert("\uBA54\uB274 \uC774\uB984\uC744 \uC785\uB825\uD574 \uC8FC\uC138\uC694.");
      return;
    }
    await createMenu.mutateAsync({
      store_id: storeId,
      name: name.trim(),
      price: price ? Number(price) : null,
    });
    setName("");
    setPrice("");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{"\uBA54\uB274 \uAD00\uB9AC"}</h1>
        <p className="text-sm text-slate-500">
          {"\uB300\uD45C \uBA54\uB274\uC640 \uAC00\uACA9\uC744 \uB4F1\uB85D\uD558\uC138\uC694."}
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="grid gap-3 md:grid-cols-[2fr_1fr_auto]">
          <Input
            placeholder="\uBA54\uB274 \uC774\uB984"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          <Input
            placeholder="\uAC00\uACA9"
            value={price}
            onChange={(event) => setPrice(event.target.value)}
          />
          <Button onClick={handleAdd} disabled={createMenu.isPending}>
            {"\uCD94\uAC00"}
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {isLoading ? (
          <div className="text-sm text-slate-500">{"\uB85C\uB529 \uC911..."}</div>
        ) : menus.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
            {"\uB4F1\uB85D\uB41C \uBA54\uB274\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4."}
          </div>
        ) : (
          menus.map((menu) => (
            <div
              key={menu.id}
              className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-5 py-4"
            >
              <div>
                <div className="text-sm font-semibold text-slate-900">{menu.name}</div>
                <div className="text-xs text-slate-500">
                  {menu.price ? `${menu.price.toLocaleString()}\uC6D0` : "\uAC00\uACA9 \uBBF8\uC785\uB825"}
                </div>
              </div>
              <Button
                variant="secondary"
                onClick={() => deleteMenu.mutate(menu.id)}
              >
                {"\uC0AD\uC81C"}
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
