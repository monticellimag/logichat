import * as dotenv from "dotenv";
import * as path from "path";

// Carica le variabili da .env.local
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

async function getChatIds() {
  console.log("====================================================");
  console.log("🔍 TELEGRAM CHAT ID RETRIEVER FOR LOGICHAT");
  console.log("====================================================");

  if (!TELEGRAM_BOT_TOKEN) {
    console.error("❌ ERRORE: TELEGRAM_BOT_TOKEN non trovato nel file .env.local!");
    console.log("Per favore, assicurati che .env.local contenga il token del bot.");
    return;
  }

  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getUpdates`;
  console.log(`Chiamata alle API di Telegram in corso...\n`);

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Errore HTTP: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();
    if (!data.ok) {
      throw new Error(`Telegram API Error: ${JSON.stringify(data)}`);
    }

    const updates = data.result || [];
    if (updates.length === 0) {
      console.log("⚠️ NESSUN MESSAGGIO RILEVATO NELLE API.");
      console.log("👉 Per favore segui questa procedura:");
      console.log("1. Aggiungi il Bot come AMMINISTRATORE nei due canali.");
      console.log("2. Scrivi un messaggio qualsiasi in ciascun canale.");
      console.log("3. Se i canali sono nuovi, riprova ad eseguire questo script.");
      console.log("\nNota: Telegram cancella la cache degli updates dopo 24 ore o dopo aver impostato un webhook.");
      console.log(`Puoi anche provare ad accedere direttamente a questo URL dal tuo browser per vedere i dati raw:`);
      console.log(`👉 https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getUpdates`);
      return;
    }

    console.log(`Trovati ${updates.length} eventi recenti. Analisi dei canali e gruppi:\n`);

    const detectedChats = new Map<string, { id: number; title?: string; username?: string; type: string }>();

    for (const update of updates) {
      // Caso A: Messaggio da un canale (channel_post)
      if (update.channel_post && update.channel_post.chat) {
        const chat = update.channel_post.chat;
        detectedChats.set(String(chat.id), {
          id: chat.id,
          title: chat.title,
          username: chat.username,
          type: chat.type,
        });
      }
      // Caso B: Messaggio da un gruppo o supergruppo (message)
      else if (update.message && update.message.chat) {
        const chat = update.message.chat;
        if (chat.type === "group" || chat.type === "supergroup") {
          detectedChats.set(String(chat.id), {
            id: chat.id,
            title: chat.title,
            username: chat.username,
            type: chat.type,
          });
        }
      }
      // Caso C: Query da bottoni (callback_query)
      else if (update.callback_query && update.callback_query.message && update.callback_query.message.chat) {
        const chat = update.callback_query.message.chat;
        if (chat.type === "group" || chat.type === "supergroup") {
          detectedChats.set(String(chat.id), {
            id: chat.id,
            title: chat.title,
            username: chat.username,
            type: chat.type,
          });
        }
      }
    }

    if (detectedChats.size === 0) {
      console.log("⚠️ Nessun canale o gruppo rilevato negli eventi recenti.");
      console.log("Assicurati di aver inviato un messaggio di prova dopo aver aggiunto il bot come amministratore.");
      return;
    }

    console.log("🎯 --- CANALI / GRUPPI RILEVATI ---");
    detectedChats.forEach((chat) => {
      console.log(`\n• Nome/Titolo:  \x1b[36m${chat.title || "Privato/Nessuno"}\x1b[0m`);
      console.log(`  Tipo:         ${chat.type.toUpperCase()}`);
      console.log(`  Username:     ${chat.username ? `@${chat.username}` : "Nessuno (Canale Privato)"}`);
      console.log(`  \x1b[32m👉 CHAT_ID:   ${chat.id}\x1b[0m`);
      console.log("-----------------------------------------");
    });

    console.log("\n💡 Copia il valore di '👉 CHAT_ID' (incluso il segno meno '-')");
    console.log("e incollalo nelle rispettive variabili d'ambiente in .env.local!");

  } catch (err: any) {
    console.error("\n❌ Errore durante il recupero dei dati:", err.message);
  }
}

getChatIds();
