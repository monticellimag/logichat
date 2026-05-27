/**
 * SIMULATORE DI WEBHOOK PER TESTING DI SICUREZZA
 * Esegui questo script in locale per verificare che il webhook rifiuti
 * click da utenti non autorizzati e accetti correttamente quelli dei 2 Preposti.
 * 
 * Per eseguire:
 * npx ts-node scripts/simulate_webhook.ts
 */

const WEBHOOK_URL = "http://localhost:3000/api/telegram/webhook";

// Esempio ID di disposizione (sostituiscilo con uno reale dal tuo Supabase se necessario)
const MOCK_DISPOSIZIONE_ID = "00000000-0000-0000-0000-000000000000";

async function simulateWebhookClick(chatId: number, isAuthorizedExpected: boolean) {
  const payload = {
    update_id: 987654321,
    callback_query: {
      id: "mock_query_123",
      from: {
        id: chatId,
        is_bot: false,
        first_name: `User-${chatId}`,
        username: `user_${chatId}`,
      },
      message: {
        message_id: 1122,
        chat: {
          id: chatId,
          type: "private",
        },
        date: Math.floor(Date.now() / 1000),
        text: "Nuova disposizione da LOG1...",
      },
      data: `approve_disp_${MOCK_DISPOSIZIONE_ID}`,
    },
  };

  console.log(`\nTesting webhook con Chat ID: ${chatId} (Atteso: ${isAuthorizedExpected ? "AUTORIZZATO" : "BLOCCATO"})`);

  try {
    const res = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const status = res.status;
    console.log(`HTTP Status: ${status}`);

    if (status === 200) {
      console.log("✅ RISULTATO: Richiesta elaborata con successo (200 OK)");
      if (!isAuthorizedExpected) {
        console.error("❌ ERRORE DI SICUREZZA: L'utente non autorizzato è stato accettato!");
      }
    } else if (status === 403) {
      console.log("🛡️ RISULTATO: Richiesta bloccata correttamente (403 Forbidden)");
      if (isAuthorizedExpected) {
        console.error("❌ ERRORE: L'utente autorizzato è stato erroneamente bloccato!");
      }
    } else {
      console.log(`⚠️ RISULTATO: Status inatteso: ${status}. Assicurati che il server Next.js sia avviato in locale su http://localhost:3000`);
    }
  } catch (err: any) {
    console.error("❌ Errore durante la connessione al server in locale:", err.message);
    console.log("👉 Per favore, avvia prima il server Next.js con 'npm run dev' per eseguire questo test di sicurezza.");
  }
}

async function runTests() {
  console.log("=== LOGICHAT WEBHOOK SECURITY AUDIT SIMULATOR ===");

  // Legge i chat_id configurati in locale (o usa dei default se non definiti)
  const preposto1 = process.env.PREPOSTO_1_CHAT_ID ? Number(process.env.PREPOSTO_1_CHAT_ID) : 123456789;
  const preposto2 = process.env.PREPOSTO_2_CHAT_ID ? Number(process.env.PREPOSTO_2_CHAT_ID) : 987654321;
  const hackerChatId = 999999999; // ID inventato non autorizzato

  // 1. Testa un Preposto autorizzato
  await simulateWebhookClick(preposto1, true);

  // 2. Testa l'altro Preposto autorizzato
  await simulateWebhookClick(preposto2, true);

  // 3. Testa un utente sconosciuto (Hacker)
  await simulateWebhookClick(hackerChatId, false);
}

runTests();
