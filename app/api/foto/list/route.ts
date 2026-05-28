import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

/**
 * GET /api/foto/list
 * Restituisce tutte le foto_magazzino con le informazioni della disposizione collegata (se presente).
 * Query params opzionali:
 *   ?stato=approvato|in_attesa|rifiutato  (default: tutti)
 *   ?limit=N  (default: 50)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const stato = searchParams.get("stato");
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    let query = supabaseAdmin
      .from("foto_magazzino")
      .select("*, disposizioni(id, codice, descrizione, stato)")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (stato) {
      query = query.eq("stato", stato);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
