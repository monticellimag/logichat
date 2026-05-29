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
    let codice = "";
    let descrizione = "";
    let tipologia = "generica";
    let allegatoFile: File | null = null;
    let allegatoUrl: string | null = null;
    let allegatoName: string | null = null;

    const contentType = request.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      codice = formData.get("codice") as string || "";
      descrizione = formData.get("descrizione") as string || "";
      tipologia = formData.get("tipologia") as string || "generica";
      const file = formData.get("allegato") as File | null;
      if (file && file.size > 0) {
        allegatoFile = file;
        allegatoName = file.name;
      }
    } else {
      const body = await request.json();
      codice = body.codice || "";
      descrizione = body.descrizione || "";
      tipologia = body.tipologia || "generica";
    }

    if (!codice || !descrizione) {
      return NextResponse.json({ error: "Codice e descrizione sono obbligatori" }, { status: 400 });
    }

    // 1. Se c'è un file allegato, caricalo in Supabase Storage
    if (allegatoFile) {
      const fileExt = allegatoName?.split(".").pop() || "bin";
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
      const filePath = `disposizioni/${fileName}`;

      // Converti File in ArrayBuffer e quindi in Buffer per l'upload
      const fileBuffer = Buffer.from(await allegatoFile.arrayBuffer());

      const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
        .from("allegati")
        .upload(filePath, fileBuffer, {
          contentType: allegatoFile.type,
          upsert: true
        });

      if (uploadError) {
        console.error("Errore caricamento storage:", uploadError.message);
        return NextResponse.json({ error: `Errore caricamento allegato: ${uploadError.message}` }, { status: 500 });
      }

      // Ricava l'URL pubblico
      const { data: publicUrlData } = supabaseAdmin.storage
        .from("allegati")
        .getPublicUrl(filePath);

      allegatoUrl = publicUrlData.publicUrl;
    }

    // 2. Salva la disposizione su Supabase in stato 'in_attesa'
    const { data: disposizione, error } = await supabaseAdmin
      .from("disposizioni")
      .insert([{ 
        codice, 
        descrizione, 
        stato: "in_attesa",
        allegato_url: allegatoUrl,
        allegato_name: allegatoName,
        tipologia: tipologia
      }])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 3. Prepara la tastiera inline con i pulsanti Approva / Rifiuta
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

    const tipologiaLabels: Record<string, string> = {
      carico: "🔵 CARICO",
      scarico: "🟢 SCARICO",
      priorita: "🚨 PRIORITÀ",
      generica: "📦 GENERICA"
    };
    const flowLabel = tipologiaLabels[tipologia] || tipologiaLabels.generica;

    let messageText = `📦 *Nuova disposizione da LOG1* [${flowLabel}]
    
*Codice:* \`${codice}\`
*Descrizione:* ${descrizione}`;

    if (allegatoUrl) {
      messageText += `\n📎 *Allegato:* [${allegatoName || "Visualizza file"}](${allegatoUrl})`;
    }

    messageText += `\n\nStato attuale: ⏳ In attesa di approvazione.`;

    // 4. Notifica entrambi i Preposti via Telegram
    const notificationPromises = prepostiChatIds.map(async (chatId) => {
      try {
        if (allegatoUrl) {
          const fileLower = (allegatoName || "").toLowerCase();
          const isImage = fileLower.endsWith(".png") || fileLower.endsWith(".jpg") || fileLower.endsWith(".jpeg") || fileLower.endsWith(".gif") || fileLower.endsWith(".webp");
          
          if (isImage) {
            return await telegramClient.sendPhoto(chatId, allegatoUrl, messageText, inlineKeyboard);
          } else {
            return await telegramClient.sendDocument(chatId, allegatoUrl, messageText, inlineKeyboard);
          }
        } else {
          return await telegramClient.sendMessage(chatId, messageText, inlineKeyboard);
        }
      } catch (err) {
        console.error(`Errore nell'invio della notifica al Preposto (${chatId}):`, err);
        return null;
      }
    });

    await Promise.all(notificationPromises);

    return NextResponse.json({ success: true, disposizione });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
