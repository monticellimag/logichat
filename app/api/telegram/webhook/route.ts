import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { telegramClient } from "@/lib/telegram";

const PREPOSTO_1_CHAT_ID = process.env.PREPOSTO_1_CHAT_ID;
const PREPOSTO_2_CHAT_ID = process.env.PREPOSTO_2_CHAT_ID;
const OPERAI_GROUP_CHAT_ID = process.env.OPERAI_GROUP_CHAT_ID;

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
    
    // Gestiamo solo le callback query (click sui pulsanti inline)
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

      // 2. Se approvato, SMISTA la disposizione al gruppo degli Operai
      if (isApproval && OPERAI_GROUP_CHAT_ID) {
        const operaiMessage = `📣 *NUOVA DISPOSIZIONE UFFICIALE*
        
*Codice:* \`${disposizione.codice}\`
*Indicazione:* ${disposizione.descrizione}

🟢 *Disposizione approvata dal Preposto. I magazzinieri possono procedere e caricare le foto relative.*`;

        await telegramClient.sendMessage(OPERAI_GROUP_CHAT_ID, operaiMessage).catch((err) => {
          console.error("Errore nell'inoltro della disposizione agli Operai:", err);
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
