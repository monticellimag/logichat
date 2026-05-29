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

/**
 * PATCH /api/disposizioni/[id]
 * Aggiorna lo stato di archiviazione o altri campi di una disposizione
 */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: "ID mancante" }, { status: 400 });
    }

    const body = await request.json();
    const { archiviato } = body;

    if (typeof archiviato !== "boolean") {
      return NextResponse.json({ error: "Campo 'archiviato' non valido o mancante" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("disposizioni")
      .update({ archiviato })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

