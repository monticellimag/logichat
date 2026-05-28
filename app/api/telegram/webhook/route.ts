import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { telegramClient } from "@/lib/telegram";

const PREPOSTO_1_CHAT_ID = process.env.PREPOSTO_1_CHAT_ID;
const PREPOSTO_2_CHAT_ID = process.env.PREPOSTO_2_CHAT_ID;
const TELEGRAM_DISPOSIZIONI_CHANNEL_ID = process.env.TELEGRAM_DISPOSIZIONI_CHANNEL_ID;
const TELEGRAM_ARCHIVE_CHANNEL_ID = process.env.TELEGRAM_ARCHIVE_CHANNEL_ID;

/**
 * Helper per identificare quale Preposto ha cliccato in base al chat_id
 */
function getPrepostoName(chatId: string) {
  if (chatId === PREPOSTO_1_CHAT_ID) return "Preposto 1";
  if (chatId === PREPOSTO_2_CHAT_ID) return "Preposto 2";
  return "Preposto Sconosciuto";
}

/**
 * POST /api/telegram/webhook
 * Riceve callback query e aggiornamenti in tempo reale da Telegram
 */
export async function POST(request: Request) {
  try {
    const payload = await request.json();

    // 1. GESTIONE DEI MESSAGGI CON FOTO (Magazziniere che posta direttamente nel canale/gruppo archivio)
    const messageObj = payload.message || payload.channel_post;
    if (messageObj && messageObj.photo && messageObj.photo.length > 0) {
      const chatId = String(messageObj.chat.id);

      const targetArchiveId = TELEGRAM_ARCHIVE_CHANNEL_ID || "";
      const isArchiveChat = 
        chatId === targetArchiveId || 
        chatId === `-100${targetArchiveId.replace("-", "")}` ||
        targetArchiveId === `-100${chatId.replace("-", "")}`;

      if (isArchiveChat) {
        const photoArray = messageObj.photo;
        const telegramFileId = photoArray[photoArray.length - 1].file_id;
        const caption = messageObj.caption || "";

        // 1.1 Cerca corrispondenza automatica con una disposizione su Supabase
        const { data: allDisposizioni } = await supabaseAdmin
          .from("disposizioni")
          .select("id, codice")
          .order("created_at", { ascending: false });

        let linkedDisposizioneId = null;
        let linkedCodice = "Generica/Nessuna";

        if (allDisposizioni) {
          for (const disp of allDisposizioni) {
            if (caption.toLowerCase().includes(disp.codice.toLowerCase())) {
              linkedDisposizioneId = disp.id;
              linkedCodice = disp.codice;
              break;
            }
          }
        }

        // 1.2 Guardia anti-duplicazione: ignora se la stessa foto è già stata ricevuta negli ultimi 10 minuti
        const twoHoursAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
        const { data: existing } = await supabaseAdmin
          .from("foto_magazzino")
          .select("id")
          .eq("telegram_file_id", telegramFileId)
          .gte("created_at", twoHoursAgo)
          .maybeSingle();

        if (existing) {
          console.log(`[WEBHOOK] Foto già registrata (ID: ${existing.id}), ignoro duplicato.`);
          return NextResponse.json({ ok: true, message: "Duplicate photo ignored" });
        }

        // 1.3 Salva nel database Supabase come in_attesa
        const { data: fotoRecord, error: dbError } = await supabaseAdmin
          .from("foto_magazzino")
          .insert([
            {
              descrizione: caption || "Foto caricata direttamente da Telegram",
              telegram_file_id: telegramFileId,
              stato: "in_attesa",
              disposizione_id: linkedDisposizioneId,
            },
          ])
          .select()
          .single();

        if (dbError) {
          console.error("Errore salvataggio foto da Telegram nel DB:", dbError.message);
          return NextResponse.json({ error: dbError.message }, { status: 500 });
        }


        // 1.3 Prepara i tasti di approvazione per i Preposti
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

        const notificationText = `📷 *Nuova foto caricata dal Magazzino su Telegram*

*Didascalia/Note:* ${caption || "Nessuna nota fornita"}
*Disposizione Collegata:* \`${linkedCodice}\`

Scegli come procedere:`;

        const prepostiChatIds = [PREPOSTO_1_CHAT_ID, PREPOSTO_2_CHAT_ID].filter(Boolean) as string[];
        console.log("DEBUG: PREPOSTI_CHAT_IDS =", prepostiChatIds);

        // 1.4 Invia l'anteprima foto + bottoni di approvazione ai Preposti
        const notificationPromises = prepostiChatIds.map((pChatId) =>
          telegramClient.sendPhoto(pChatId, telegramFileId, notificationText, inlineKeyboard)
            .catch((err) => {
              console.error(`Errore nell'invio dell'anteprima foto al Preposto (${pChatId}):`, err);
              return null;
            })
        );

        await Promise.all(notificationPromises);
        return NextResponse.json({ ok: true, message: "Photo parsed and forwarded to Preposti" });
      }
    }
    
    // Gestiamo solo le callback query (click sui pulsanti inline) per il resto del flusso
    if (!payload.callback_query) {
      return NextResponse.json({ ok: true }); // Ignora altri messaggi
    }

    const { id: callbackQueryId, from, message, data: callbackData } = payload.callback_query;
    const senderChatId = String(from.id);
    const messageId = message.message_id;
    const chatOfMessageId = message.chat.id;

    // 1. VERIFICA DI SICUREZZA: Solo i 2 Preposti autorizzati possono cliccare
    const isAuthorized =
      senderChatId === PREPOSTO_1_CHAT_ID || senderChatId === PREPOSTO_2_CHAT_ID;

    if (!isAuthorized) {
      // Rispondi a Telegram mostrando una notifica di blocco
      await telegramClient.answerCallbackQuery(
        callbackQueryId,
        "❌ Errore: Non sei autorizzato a compiere questa azione.",
        true // Mostra come alert popup
      );
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const prepostoName = getPrepostoName(senderChatId);

    // ==========================================
    // CASO A: Approvazione Disposizione
    // ==========================================
    if (callbackData.startsWith("approve_disp_") || callbackData.startsWith("reject_disp_")) {
      const isApproval = callbackData.startsWith("approve_disp_");
      const disposizioneId = callbackData.replace(
        isApproval ? "approve_disp_" : "reject_disp_",
        ""
      );

      const nuovoStato = isApproval ? "approvato" : "rifiutato";

      // 1. Aggiorna la disposizione su Supabase
      const { data: disposizione, error } = await supabaseAdmin
        .from("disposizioni")
        .update({
          stato: nuovoStato,
          approvato_da: prepostoName,
          decisione_data: new Date().toISOString(),
        })
        .eq("id", disposizioneId)
        .select()
        .single();

      if (error || !disposizione) {
        await telegramClient.answerCallbackQuery(callbackQueryId, "❌ Errore durante l'aggiornamento del DB.");
        return NextResponse.json({ error: error?.message || "Record not found" }, { status: 500 });
      }

      // 2. Se approvato, SMISTA la disposizione al canale delle Disposizioni
      if (isApproval && TELEGRAM_DISPOSIZIONI_CHANNEL_ID) {
        const operaiMessage = `📣 *NUOVA DISPOSIZIONE UFFICIALE*
        
*Codice:* \`${disposizione.codice}\`
*Indicazione:* ${disposizione.descrizione}

🟢 *Disposizione approvata dal Preposto. I magazzinieri possono procedere e caricare le foto relative.*`;

        await telegramClient.sendMessage(TELEGRAM_DISPOSIZIONI_CHANNEL_ID, operaiMessage).catch((err) => {
          console.error("Errore nell'inoltro della disposizione al canale:", err);
        });
      }

      // 3. Rispondi a Telegram confermando l'azione
      await telegramClient.answerCallbackQuery(
        callbackQueryId,
        `Disposizione ${isApproval ? "approvata" : "rifiutata"} con successo!`
      );

      // 4. Aggiorna il testo del messaggio del Preposto inline
      const finalEmoji = isApproval ? "✅" : "❌";
      const finalAction = isApproval ? "APPROVATA" : "RIFIUTATA";
      
      const updatedMessageText = `📦 *Disposizione da LOG1*
      
*Codice:* \`${disposizione.codice}\`
*Descrizione:* ${disposizione.descrizione}

Stato finale: ${finalEmoji} *${finalAction}* da *${prepostoName}* il ${new Date().toLocaleDateString("it-IT")} alle ${new Date().toLocaleTimeString("it-IT")}.`;

      await telegramClient.editMessageText(chatOfMessageId, messageId, updatedMessageText);
    }

    // ==========================================
    // CASO B: Approvazione Foto
    // ==========================================
    else if (callbackData.startsWith("approve_foto_") || callbackData.startsWith("reject_foto_")) {
      const isApproval = callbackData.startsWith("approve_foto_");
      const fotoId = callbackData.replace(
        isApproval ? "approve_foto_" : "reject_foto_",
        ""
      );

      const nuovoStato = isApproval ? "approvato" : "rifiutato";

      // 1. Aggiorna la foto su Supabase
      const { data: fotoRecord, error } = await supabaseAdmin
        .from("foto_magazzino")
        .update({
          stato: nuovoStato,
          decisione_da: prepostoName,
          decisione_data: new Date().toISOString(),
        })
        .eq("id", fotoId)
        .select()
        .single();

      if (error || !fotoRecord) {
        await telegramClient.answerCallbackQuery(callbackQueryId, "❌ Errore durante l'aggiornamento del DB.");
        return NextResponse.json({ error: error?.message || "Record not found" }, { status: 500 });
      }

      // 2. Rispondi a Telegram confermando l'azione
      await telegramClient.answerCallbackQuery(
        callbackQueryId,
        `Foto ${isApproval ? "approvata" : "rifiutata"}!`
      );

      // 3. Recupera la disposizione associata per valorizzare la didascalia aggiornata
      let codiceDisp = "Generica";
      if (fotoRecord.disposizione_id) {
        const { data: disp } = await supabaseAdmin
          .from("disposizioni")
          .select("codice")
          .eq("id", fotoRecord.disposizione_id)
          .single();
        if (disp) codiceDisp = disp.codice;
      }

      // 4. Aggiorna la didascalia (caption) della foto inline su Telegram
      const finalEmoji = isApproval ? "✅" : "❌";
      const finalAction = isApproval ? "APPROVATA" : "RIFIUTATA";

      const updatedCaption = `📷 *Foto Magazzino*

*Descrizione:* ${fotoRecord.descrizione}
*Codice Disposizione:* \`${codiceDisp}\`

Stato finale: ${finalEmoji} *${finalAction}* da *${prepostoName}* il ${new Date().toLocaleDateString("it-IT")}.`;

      // Chiamiamo il metodo editMessageCaption delle Telegram API direttamente via fetch
      const editCaptionUrl = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/editMessageCaption`;
      await fetch(editCaptionUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatOfMessageId,
          message_id: messageId,
          caption: updatedCaption,
          parse_mode: "Markdown",
        }),
      }).catch((err) => {
        console.error("Errore nell'aggiornamento della didascalia foto su Telegram:", err);
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("Errore generico nel webhook:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
