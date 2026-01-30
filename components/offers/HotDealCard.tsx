import { Badge } from "@/components/ui/badge";

const fallbackImages = {
  bar: "https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=1200&q=80",
  cafe: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=1200&q=80",
  dining: "https://images.unsplash.com/photo-1529042410759-befb1204b468?auto=format&fit=crop&w=1200&q=80",
  room: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80",
  default: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80",
};

function getFallbackImage(category?: string) {
  const value = (category ?? "").toLowerCase();
  if (value.includes("\uC220") || value.includes("\uD3EC\uCC28") || value.includes("\uBC14")) {
    return fallbackImages.bar;
  }
  if (value.includes("\uCE74\uD398") || value.includes("\uB514\uC800\uD2B8")) {
    return fallbackImages.cafe;
  }
  if (value.includes("\uC2A4\uD130\uB514") || value.includes("\uD30C\uD2F0") || value.includes("\uB8F8")) {
    return fallbackImages.room;
  }
  if (value.includes("\uC2DD\uB2F9") || value.includes("\uBC25") || value.includes("\uACF5\uAC04")) {
    return fallbackImages.dining;
  }
  return fallbackImages.default;
}

export function HotDealCard({
  title,
  benefit,
  timer,
  visibility,
  imageUrl,
  storeName,
  category,
}: {
  title: string;
  benefit: string;
  timer: string;
  visibility?: "public" | "private";
  imageUrl?: string;
  storeName: string;
  category?: string;
}) {
  const backgroundUrl = imageUrl ?? getFallbackImage(category);

  return (
    <div className="overflow-hidden rounded-2xl shadow-lg">
      <div className="relative aspect-[4/3] w-full">
        <img
          src={backgroundUrl}
          alt={storeName}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        <div className="absolute left-4 top-4 flex flex-wrap items-center gap-2">
          <Badge className="bg-amber-400 text-slate-900">
            {"\uD56B\uB51C"}
          </Badge>
          <Badge className="bg-rose-500 text-white">
            {"\uB9C8\uAC10\uC784\uBC15"}
          </Badge>
          {visibility === "private" ? (
            <Badge className="bg-slate-900 text-white">
              {"\uD83D\uDD12 \uC2DC\uD06C\uB9BF \uC624\uD37C"}
            </Badge>
          ) : null}
        </div>
        <div className="absolute right-4 top-4 text-xs font-semibold text-white">
          {timer}
        </div>
        <div className="absolute bottom-4 left-4 right-4 space-y-1 text-white">
          <div className="text-xs font-semibold text-white/80">{storeName}</div>
          <div className="text-xl font-semibold">{benefit}</div>
          <div className="text-sm text-white/80">{title}</div>
        </div>
      </div>
    </div>
  );
}
