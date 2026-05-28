const fs = require('fs');
const path = require('path');

console.log("====================================================");
console.log("📨 TELEGRAM DIRECT MESSAGE TEST");
console.log("====================================================");

// Semplice parser per .env.local
let botToken = '';
let prepostoId = '';

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
      if (trimmed.startsWith('PREPOSTO_2_CHAT_ID=')) {
        prepostoId = trimmed.split('PREPOSTO_2_CHAT_ID=')[1].split('#')[0].trim();
      }
    }
  }
} catch (err) {
  console.error("❌ Errore durante la lettura di .env.local:", err.message);
}

if (!botToken || !prepostoId) {
  console.error("❌ ERRORE: TELEGRAM_BOT_TOKEN o PREPOSTO_2_CHAT_ID non trovati nel file .env.local!");
  process.exit(1);
}

const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
const body = {
  chat_id: prepostoId,
  text: `🔔 *TEST DI INVIO DIRETTO*\nCiao! Se ricevi questo messaggio, la comunicazione privata tra te ed il bot con username associato al tuo token è attiva e funziona correttamente!`,
  parse_mode: 'Markdown'
};

console.log(`Invio messaggio di prova a Chat ID: ${prepostoId} ...`);

fetch(url, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body)
})
  .then((res) => {
    return res.json().then(data => ({ status: res.status, data }));
  })
  .then(({ status, data }) => {
    if (data.ok) {
      console.log("\n✅ MESSAGGIO INVIATO CON SUCCESSO!");
      console.log(`Destinatario: ${data.result.chat.first_name} (@${data.result.chat.username || 'nessuno'})`);
      console.log(`Bot: ${data.result.from.first_name} (@${data.result.from.username})`);
    } else {
      console.error(`\n❌ ERRORE DA TELEGRAM (Status ${status}):`);
      console.error(JSON.stringify(data, null, 2));
      console.log("\n💡 Suggerimento:");
      if (data.description.includes("bot was blocked")) {
        console.log("Hai bloccato il bot. Sbloccalo su Telegram!");
      } else if (data.description.includes("chat not found")) {
        console.log("Non hai ancora cliccato su 'AVVIA' nella chat privata di QUESTO bot specifico.");
        console.log(`Assicurati di cercare su Telegram il bot con username: @logi1chatbot ed avviarlo.`);
      }
    }
  })
  .catch((err) => {
    console.error("\n❌ Errore durante la chiamata:", err.message);
  });
