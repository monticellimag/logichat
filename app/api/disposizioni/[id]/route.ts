import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

/**
 * DELETE /api/disposizioni/[id]
 * Annulla una disposizione eliminandola o cambiandone lo stato
 */
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: "ID mancante" }, { status: 400 });
    }

    // Per semplicità e pulizia, eliminiamo direttamente la disposizione "in_attesa"
    const { error } = await supabaseAdmin
      .from("disposizioni")
      .delete()
      .eq("id", id)
      .eq("stato", "in_attesa"); // Assicuriamoci di poter cancellare solo quelle in attesa

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
