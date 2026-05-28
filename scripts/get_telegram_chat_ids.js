const fs = require('fs');
const path = require('path');

console.log("====================================================");
console.log("🔍 TELEGRAM CHAT ID RETRIEVER FOR LOGICHAT");
console.log("====================================================");

// Semplice parser per .env.local per evitare dipendenze esterne (es. dotenv)
let botToken = '';
try {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('TELEGRAM_BOT_TOKEN=')) {
        botToken = trimmed.split('TELEGRAM_BOT_TOKEN=')[1].split('#')[0].trim();
      }
    }
  }
} catch (err) {
  console.error("❌ Errore durante la lettura di .env.local:", err.message);
}

if (!botToken) {
  console.error("❌ ERRORE: TELEGRAM_BOT_TOKEN non trovato nel file .env.local!");
  console.log("Per favore, assicurati che .env.local esista e contenga il token del bot.");
  process.exit(1);
}

const url = `https://api.telegram.org/bot${botToken}/getUpdates`;
console.log(`Chiamata alle API di Telegram in corso...\n`);

fetch(url)
  .then((res) => {
    if (!res.ok) {
      throw new Error(`Errore HTTP: ${res.status} - ${res.statusText}`);
    }
    return res.json();
  })
  .then((data) => {
    if (!data.ok) {
      throw new Error(`Telegram API Error: ${JSON.stringify(data)}`);
    }

    const updates = data.result || [];
    if (updates.length === 0) {
      console.log("⚠️ NESSUN MESSAGGIO RILEVATO NELLE API.");
      console.log("👉 Per favore segui questa procedura:");
      console.log("1. Apri Telegram e vai nei due canali.");
      console.log("2. Aggiungi il tuo Bot come AMMINISTRATORE in entrambi i canali.");
      console.log("3. Assicurati che abbia il permesso di 'Pubblicare messaggi' (Post Messages).");
      console.log("4. Invia un messaggio di prova qualsiasi in ciascun canale.");
      console.log("5. Esegui nuovamente questo script.");
      console.log("\nNota: Se hai già impostato un Webhook attivo, getUpdates non restituirà dati.");
      console.log(`Puoi anche provare ad accedere direttamente a questo URL dal tuo browser per vedere i dati raw:`);
      console.log(`👉 https://api.telegram.org/bot${botToken}/getUpdates`);
      return;
    }

    console.log(`Trovati ${updates.length} eventi recenti. Analisi dei canali e gruppi:\n`);

    const detectedChats = new Map();

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
  })
  .catch((err) => {
    console.error("\n❌ Errore durante il recupero dei dati:", err.message);
  });
