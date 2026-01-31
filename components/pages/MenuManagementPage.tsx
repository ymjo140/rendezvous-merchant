"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { useMenus, type MenuRow } from "@/lib/hooks/useMenus";

const categoryOptions = [
  { value: "MAIN", label: "\uBA54\uC778" },
  { value: "SIDE", label: "\uC0AC\uC774\uB4DC" },
  { value: "DRINK", label: "\uC74C\uB8CC" },
];

const placeholderImages = [
  "https://images.unsplash.com/photo-1529042410759-befb1204b468?auto=format&fit=crop&w=640&q=80",
  "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=640&q=80",
  "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=640&q=80",
];

function formatPrice(value?: number | null) {
  if (!value) return "\uAC00\uACA9 \uBBF8\uC785\uB825";
  return `${value.toLocaleString()}\uC6D0`;
}

export function MenuManagementPage({ storeId }: { storeId?: string }) {
  const {
    data: menus = [],
    createMenu,
    updateMenu,
    deleteMenu,
    isLoading,
  } = useMenus(storeId);

  const [activeCategoryLabel, setActiveCategoryLabel] = useState(
    categoryOptions[0]?.label ?? "MAIN"
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMenu, setEditingMenu] = useState<MenuRow | null>(null);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("MAIN");
  const [imageUrl, setImageUrl] = useState("");
  const [isRecommended, setIsRecommended] = useState(false);

  if (!storeId || storeId === "undefined" || storeId === "null") {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-600">
        {"\uAC00\uAC8C \uC815\uBCF4\uB97C \uBD88\uB7EC\uC62C \uC218 \uC5C6\uC2B5\uB2C8\uB2E4. \uB9E4\uC7A5\uC744 \uC120\uD0DD\uD574 \uC8FC\uC138\uC694."}
      </div>
    );
  }

  const activeCategoryValue =
    categoryOptions.find((item) => item.label === activeCategoryLabel)?.value ??
    "MAIN";

  const filteredMenus = useMemo(
    () =>
      menus.filter(
        (menu) => (menu.category ?? "MAIN") === activeCategoryValue
      ),
    [menus, activeCategoryValue]
  );

  const openCreate = () => {
    setEditingMenu(null);
    setName("");
    setPrice("");
    setCategory(activeCategoryValue);
    setImageUrl("");
    setIsRecommended(false);
    setDialogOpen(true);
  };

  const openEdit = (menu: MenuRow) => {
    setEditingMenu(menu);
    setName(menu.name ?? "");
    setPrice(menu.price ? String(menu.price) : "");
    setCategory((menu.category ?? "MAIN") as string);
    setImageUrl(menu.image_url ?? "");
    setIsRecommended(Boolean(menu.is_recommended));
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      window.alert("\uBA54\uB274 \uC774\uB984\uC744 \uC785\uB825\uD574 \uC8FC\uC138\uC694.");
      return;
    }
    const payload = {
      store_id: storeId,
      name: name.trim(),
      price: price ? Number(price) : null,
      category,
      image_url: imageUrl.trim() || null,
      is_recommended: isRecommended,
    };
    if (editingMenu) {
      await updateMenu.mutateAsync({ id: editingMenu.id, ...payload });
    } else {
      await createMenu.mutateAsync(payload);
    }
    setDialogOpen(false);
  };

  const handleRandomImage = () => {
    const next = placeholderImages[Math.floor(Math.random() * placeholderImages.length)];
    setImageUrl(next);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{"\uBA54\uB274 \uAD00\uB9AC"}</h1>
          <p className="text-sm text-slate-500">
            {"\uBA54\uB274 \uC815\uBCF4\uB97C \uB4F1\uB85D\uD558\uACE0 \uCD94\uCC9C \uBA54\uB274\uB97C \uAC00\uB824\uBCF4\uC138\uC694."}
          </p>
        </div>
        <Button onClick={openCreate}>{"+\u00A0\uBA54\uB274 \uCD94\uAC00"}</Button>
      </div>

      <Tabs
        tabs={categoryOptions.map((item) => item.label)}
        active={activeCategoryLabel}
        onChange={setActiveCategoryLabel}
      />

      {isLoading ? (
        <div className="text-sm text-slate-500">{"\uB85C\uB529 \uC911..."}</div>
      ) : filteredMenus.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
          {"\uC774 \uCE74\uD14C\uACE0\uB9AC\uC5D0 \uBA54\uB274\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4."}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredMenus.map((menu) => (
            <div
              key={menu.id}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
            >
              <div className="relative h-36 w-full bg-slate-100">
                {menu.image_url ? (
                  <img
                    src={menu.image_url}
                    alt={menu.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">
                    {"\uC0AC\uC9C4 \uC5C6\uC74C"}
                  </div>
                )}
                {menu.is_recommended ? (
                  <Badge className="absolute left-3 top-3 bg-amber-400 text-slate-900">
                    {"\uCD94\uCC9C"}
                  </Badge>
                ) : null}
              </div>
              <div className="space-y-2 p-4">
                <div className="text-sm font-semibold text-slate-900">{menu.name}</div>
                <div className="text-xs text-slate-500">{formatPrice(menu.price)}</div>
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={() => openEdit(menu)}>
                    {"\uC218\uC815"}
                  </Button>
                  <Button
                    variant="ghost"
                    className="text-rose-600 hover:bg-rose-50"
                    onClick={() => deleteMenu.mutate(menu.id)}
                  >
                    {"\uC0AD\uC81C"}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen}>
        <div className="space-y-4">
          <div className="text-lg font-semibold">
            {editingMenu ? "\uBA54\uB274 \uC218\uC815" : "\uBA54\uB274 \uCD94\uAC00"}
          </div>
          <div className="grid gap-3 text-sm">
            <div className="space-y-1">
              <label className="text-xs text-slate-500">{"\uBA54\uB274 \uC774\uB984"}</label>
              <Input value={name} onChange={(event) => setName(event.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-500">{"\uAC00\uACA9"}</label>
              <Input
                type="number"
                value={price}
                onChange={(event) => setPrice(event.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-500">{"\uCE74\uD14C\uACE0\uB9AC"}</label>
              <select
                className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
                value={category}
                onChange={(event) => setCategory(event.target.value)}
              >
                {categoryOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-500">{"\uC774\uBBF8\uC9C0 URL"}</label>
              <Input
                value={imageUrl}
                onChange={(event) => setImageUrl(event.target.value)}
                placeholder="https://"
              />
              <Button variant="secondary" onClick={handleRandomImage}>
                {"\uB354\uBBF8 \uC774\uBBF8\uC9C0 \uCD94\uAC00"}
              </Button>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={isRecommended}
                onChange={(event) => setIsRecommended(event.target.checked)}
              />
              {"\uCD94\uCC9C \uBA54\uB274\uB85C \uD45C\uC2DC"}
            </label>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setDialogOpen(false)}>
              {"\uCDE8\uC18C"}
            </Button>
            <Button onClick={handleSave}>
              {editingMenu ? "\uC800\uC7A5" : "\uCD94\uAC00"}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
