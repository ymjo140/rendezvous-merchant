import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = String(body?.name ?? "").trim();
    const address = body?.location ?? body?.address ?? null;
    const category = body?.category ?? null;
    const mainCategory = body?.main_category ?? null;

    if (!name) {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }

    if (!process.env.SUPABASE_SERVICE_KEY) {
      return NextResponse.json(
        { error: "SUPABASE_SERVICE_KEY missing" },
        { status: 500 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("places")
      .insert({
        name,
        address,
        category,
        main_category: mainCategory,
      })
      .select("id")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ id: data?.id ?? null });
  } catch {
    return NextResponse.json({ error: "invalid payload" }, { status: 400 });
  }
}