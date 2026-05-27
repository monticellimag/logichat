import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { telegramClient } from "@/lib/telegram";

const PREPOSTO_1_CHAT_ID = process.env.PREPOSTO_1_CHAT_ID;
const PREPOSTO_2_CHAT_ID = process.env.PREPOSTO_2_CHAT_ID;

const prepostiChatIds = [PREPOSTO_1_CHAT_ID, PREPOSTO_2_CHAT_ID].filter(Boolean) as string[];

/**
 * GET /api/disposizioni
 * Recupera tutte le disposizioni dal database
 */
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("disposizioni")
      .select("*, foto_magazzino(*)")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/disposizioni
 * Crea una nuova disposizione (LOG1) e notifica i 2 Preposti via Telegram
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { codice, descrizione } = body;

    if (!codice || !descrizione) {
      return NextResponse.json({ error: "Codice e descrizione sono obbligatori" }, { status: 400 });
    }

    // 1. Salva la disposizione su Supabase in stato 'in_attesa'
    const { data: disposizione, error } = await supabaseAdmin
      .from("disposizioni")
      .insert([{ codice, descrizione, stato: "in_attesa" }])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 2. Prepara la tastiera inline con i pulsanti Approva / Rifiuta
    const inlineKeyboard = {
      inline_keyboard: [
        [
          {
            text: "✅ APPROVA",
            callback_data: `approve_disp_${disposizione.id}`,
          },
          {
            text: "❌ RIFIUTA",
            callback_data: `reject_disp_${disposizione.id}`,
          },
        ],
      ],
    };

    const messageText = `📦 *Nuova disposizione da LOG1*
    
*Codice:* \`${codice}\`
*Descrizione:* ${descrizione}

Stato attuale: ⏳ In attesa di approvazione.`;

    // 3. Notifica entrambi i Preposti via Telegram
    const notificationPromises = prepostiChatIds.map((chatId) =>
      telegramClient.sendMessage(chatId, messageText, inlineKeyboard)
        .catch((err) => {
          console.error(`Errore nell'invio della notifica al Preposto (${chatId}):`, err);
          return null;
        })
    );

    await Promise.all(notificationPromises);

    return NextResponse.json({ success: true, disposizione });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
