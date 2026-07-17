"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { useMenus, type MenuRow } from "@/lib/hooks/useMenus";
import { useStoreId } from "@/components/layout/Layout";

const categoryOptions = [
  { value: "MAIN", label: "메인" },
  { value: "SIDE", label: "사이드" },
  { value: "DRINK", label: "음료" },
];

const placeholderImages = [
  "https://images.unsplash.com/photo-1529042410759-befb1204b468?auto=format&fit=crop&w=640&q=80",
  "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=640&q=80",
  "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=640&q=80",
];

function formatPrice(value?: number | null) {
  if (!value) return "가격 미입력";
  return `${value.toLocaleString()}원`;
}

export function MenuManagementPage({ storeId }: { storeId?: string }) {
  const contextStoreId = useStoreId();
  const resolvedStoreId =
    storeId && storeId !== "undefined" && storeId !== "null"
      ? storeId
      : contextStoreId ?? undefined;
  const {
    data: menus = [],
    createMenu,
    updateMenu,
    deleteMenu,
    isLoading,
  } = useMenus(resolvedStoreId);

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

  if (!resolvedStoreId) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-600">
        {"가게 정보를 불러올 수 없습니다. 매장을 선택해 주세요."}
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
      window.alert("메뉴 이름을 입력해 주세요.");
      return;
    }
    const payload = {
      store_id: resolvedStoreId,
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
          <h1 className="text-2xl font-semibold">{"메뉴 관리"}</h1>
          <p className="text-sm text-slate-500">
            {"메뉴 정보를 등록하고 추천 메뉴를 가려보세요."}
          </p>
        </div>
        <Button onClick={openCreate}>{"+ 메뉴 추가"}</Button>
      </div>

      <Tabs
        tabs={categoryOptions.map((item) => item.label)}
        active={activeCategoryLabel}
        onChange={setActiveCategoryLabel}
      />

      {isLoading ? (
        <div className="text-sm text-slate-500">{"로딩 중..."}</div>
      ) : filteredMenus.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
          {"이 카테고리에 메뉴가 없습니다."}
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
                    {"사진 없음"}
                  </div>
                )}
                {menu.is_recommended ? (
                  <Badge className="absolute left-3 top-3 bg-amber-400 text-slate-900">
                    {"추천"}
                  </Badge>
                ) : null}
              </div>
              <div className="space-y-2 p-4">
                <div className="text-sm font-semibold text-slate-900">{menu.name}</div>
                <div className="text-xs text-slate-500">{formatPrice(menu.price)}</div>
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={() => openEdit(menu)}>
                    {"수정"}
                  </Button>
                  <Button
                    variant="ghost"
                    className="text-rose-600 hover:bg-rose-50"
                    onClick={() => deleteMenu.mutate(menu.id)}
                  >
                    {"삭제"}
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
            {editingMenu ? "메뉴 수정" : "메뉴 추가"}
          </div>
          <div className="grid gap-3 text-sm">
            <div className="space-y-1">
              <label className="text-xs text-slate-500">{"메뉴 이름"}</label>
              <Input value={name} onChange={(event) => setName(event.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-500">{"가격"}</label>
              <Input
                type="number"
                value={price}
                onChange={(event) => setPrice(event.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-500">{"카테고리"}</label>
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
              <label className="text-xs text-slate-500">{"이미지 URL"}</label>
              <Input
                value={imageUrl}
                onChange={(event) => setImageUrl(event.target.value)}
                placeholder="https://"
              />
              <Button variant="secondary" onClick={handleRandomImage}>
                {"더미 이미지 추가"}
              </Button>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={isRecommended}
                onChange={(event) => setIsRecommended(event.target.checked)}
              />
              {"추천 메뉴로 표시"}
            </label>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setDialogOpen(false)}>
              {"취소"}
            </Button>
            <Button onClick={handleSave}>
              {editingMenu ? "저장" : "추가"}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
