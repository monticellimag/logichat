import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { telegramClient } from "@/lib/telegram";

const PREPOSTO_1_CHAT_ID = process.env.PREPOSTO_1_CHAT_ID;
const PREPOSTO_2_CHAT_ID = process.env.PREPOSTO_2_CHAT_ID;
const TELEGRAM_ARCHIVE_CHANNEL_ID = process.env.TELEGRAM_ARCHIVE_CHANNEL_ID;

const prepostiChatIds = [PREPOSTO_1_CHAT_ID, PREPOSTO_2_CHAT_ID].filter(Boolean) as string[];

/**
 * GET /api/foto?file_id=...
 * API Secure Proxy: Scarica l'immagine da Telegram e la invia direttamente al browser.
 * Consente al portale web di LOG1 di visualizzare le immagini in modo sicuro senza rivelare il token del bot.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get("file_id");

    if (!fileId) {
      return NextResponse.json({ error: "Parametro file_id mancante" }, { status: 400 });
    }

    // 1. Recupera l'URL di download provvisorio da Telegram
    const fileData = await telegramClient.getFile(fileId);
    
    // 2. Fetch dei byte dell'immagine dai server Telegram
    const imageResponse = await fetch(fileData.download_url);
    if (!imageResponse.ok) {
      throw new Error(`Impossibile scaricare l'immagine dai server Telegram: ${imageResponse.statusText}`);
    }

    const imageBuffer = await imageResponse.arrayBuffer();
    const contentType = imageResponse.headers.get("content-type") || "image/jpeg";

    // 3. Ritorna l'immagine con gli header corretti per il browser e il caching
    return new Response(imageBuffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable", // Cache permanente
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/foto
 * Riceve la foto e la descrizione dal magazziniere, la carica su Telegram per lo storage infinito,
 * salva il file_id permanente su Supabase e invia l'anteprima ai Preposti.
 */
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const descrizione = formData.get("descrizione") as string;
    const disposizioneId = formData.get("disposizione_id") as string;
    const file = formData.get("foto") as File | null;

    if (!descrizione || !file || !disposizioneId) {
      return NextResponse.json(
        { error: "Descrizione, foto e disposizione_id sono obbligatori" },
        { status: 400 }
      );
    }

    // 1. Recupera le informazioni della disposizione da Supabase per includerle nel messaggio
    const { data: disposizione, error: dispError } = await supabaseAdmin
      .from("disposizioni")
      .select("*")
      .eq("id", disposizioneId)
      .single();

    if (dispError || !disposizione) {
      return NextResponse.json(
        { error: `Disposizione non trovata: ${dispError?.message || "ID non valido"}` },
        { status: 404 }
      );
    }

    // 2. Converti il file in Buffer per l'invio alle Telegram API
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    if (!TELEGRAM_ARCHIVE_CHANNEL_ID) {
      throw new Error("TELEGRAM_ARCHIVE_CHANNEL_ID non configurato nelle variabili d'ambiente.");
    }

    // 3. Carica la foto sul canale privato di archivio di Telegram (Storage infinito)
    const caption = `📁 *Archivio Foto Magazzino*
*Descrizione:* ${descrizione}
*Codice Disposizione:* ${disposizione.codice}`;

    const archiveResponse = await telegramClient.sendPhoto(
      TELEGRAM_ARCHIVE_CHANNEL_ID,
      buffer,
      caption
    );

    // 4. Estrai il file_id permanente della foto (l'elemento più grande dell'array di foto)
    const photos = archiveResponse.result.photo;
    const telegramFileId = photos[photos.length - 1].file_id;

    // 5. Salva la foto nel database Supabase associandola al file_id di Telegram
    const { data: fotoRecord, error: dbError } = await supabaseAdmin
      .from("foto_magazzino")
      .insert([
        {
          descrizione,
          telegram_file_id: telegramFileId,
          stato: "in_attesa",
          disposizione_id: disposizioneId,
        },
      ])
      .select()
      .single();

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    // 6. Crea la tastiera inline per l'approvazione della foto da parte dei Preposti
    const inlineKeyboard = {
      inline_keyboard: [
        [
          {
            text: "✅ APPROVA FOTO",
            callback_data: `approve_foto_${fotoRecord.id}`,
          },
          {
            text: "❌ RIFIUTA FOTO",
            callback_data: `reject_foto_${fotoRecord.id}`,
          },
        ],
      ],
    };

    const notificationText = `📷 *Nuova foto caricata dal Magazzino*

*Descrizione:* ${descrizione}
*Codice Disposizione:* \`${disposizione.codice}\`

Scegli come procedere:`;

    // 7. Invia l'anteprima della foto (usando il file_id permanente) ai 2 Preposti
    const notificationPromises = prepostiChatIds.map((chatId) =>
      telegramClient.sendPhoto(chatId, telegramFileId, notificationText, inlineKeyboard)
        .catch((err) => {
          console.error(`Errore nell'invio dell'anteprima foto al Preposto (${chatId}):`, err);
          return null;
        })
    );

    await Promise.all(notificationPromises);

    return NextResponse.json({ success: true, foto: fotoRecord });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
