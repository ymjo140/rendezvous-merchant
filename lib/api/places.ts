import { supabase } from "@/lib/supabase/client";

export type Place = {
  id: number;
  name: string;
  address: string | null;
  category: string | null;
  main_category: string | null;
  lat?: number | null;
  lng?: number | null;
};

export async function searchPlaces(query: string): Promise<Place[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const hasEnv =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  if (!hasEnv) return [];

  const { data, error } = await supabase
    .from("places")
    .select("id, name, address, category, main_category, lat, lng")
    .ilike("name", `%${trimmed}%`)
    .limit(10);

  if (error || !data) return [];
  return data as Place[];
}
