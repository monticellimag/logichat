/**
 * set_webhook.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Registra il webhook del bot Telegram con l'URL corretto.
 *
 * UTILIZZO:
 *   node scripts/set_webhook.js                              ← usa TUNNEL_URL da .env.local
 *   node scripts/set_webhook.js https://xxxxxx.lhr.life      ← override diretto via CLI
 *   node scripts/set_webhook.js https://1234.ngrok.io        ← supporta ngrok/localtunnel/etc.
 */

const fs = require('fs');
const path = require('path');

// ─── 1. Leggi .env.local ─────────────────────────────────────────────────────
const envPath = path.resolve(process.cwd(), '.env.local');
const env = {};

try {
  if (fs.existsSync(envPath)) {
    fs.readFileSync(envPath, 'utf8')
      .split('\n')
      .forEach((line) => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) return;
        const [key, ...rest] = trimmed.split('=');
        env[key.trim()] = rest.join('=').split('#')[0].trim();
      });
  }
} catch (err) {
  console.error('❌ Errore lettura .env.local:', err.message);
  process.exit(1);
}

const botToken = env['TELEGRAM_BOT_TOKEN'];
if (!botToken) {
  console.error('❌ TELEGRAM_BOT_TOKEN non trovato in .env.local');
  process.exit(1);
}

// ─── 2. Ricava l'URL del tunnel ───────────────────────────────────────────────
let tunnelBase = process.argv[2] || env['TUNNEL_URL'] || '';

if (!tunnelBase) {
  console.error('❌ URL tunnel non trovato.');
  console.error('   Passa l\'URL via CLI:  node scripts/set_webhook.js https://xxxx.lhr.life');
  console.error('   Oppure aggiungi      TUNNEL_URL=https://xxxx.lhr.life  in .env.local');
  process.exit(1);
}

// Rimuovi trailing slash e appendi il path del webhook se mancante
tunnelBase = tunnelBase.replace(/\/$/, '');
const webhookUrl = tunnelBase.endsWith('/api/telegram/webhook')
  ? tunnelBase
  : `${tunnelBase}/api/telegram/webhook`;

// ─── 3. Cancella il vecchio webhook (deleteWebhook) ──────────────────────────
async function run() {
  const base = `https://api.telegram.org/bot${botToken}`;

  console.log('\n════════════════════════════════════════════════════════');
  console.log('  🌐 LOGICHAT — TELEGRAM WEBHOOK MANAGER');
  console.log('════════════════════════════════════════════════════════\n');

  // 3a. Elimina il webhook precedente (drop_pending_updates: false = consegna i messaggi in coda)
  console.log('🗑️  Rimozione webhook precedente...');
  const deleteRes = await fetch(`${base}/deleteWebhook?drop_pending_updates=false`).then((r) => r.json());
  if (deleteRes.ok) {
    console.log('   ✅ Webhook precedente rimosso.\n');
  } else {
    console.warn('   ⚠️  Impossibile rimuovere il webhook:', deleteRes.description);
  }

  // 3b. Registra il nuovo webhook
  console.log(`🔗 Registrazione nuovo webhook:\n   ${webhookUrl}\n`);
  const setRes = await fetch(`${base}/setWebhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url: webhookUrl,
      allowed_updates: ['message', 'channel_post', 'callback_query'],
    }),
  }).then((r) => r.json());

  if (!setRes.ok) {
    console.error('❌ Errore durante la registrazione del webhook:', setRes.description);
    process.exit(1);
  }

  console.log('✅ Webhook registrato con successo!\n');

  // 3c. Verifica lo stato finale
  const info = await fetch(`${base}/getWebhookInfo`).then((r) => r.json());
  const result = info.result || {};
  console.log('═══════════ STATO WEBHOOK ATTUALE ════════════');
  console.log(`  URL:                  ${result.url}`);
  console.log(`  Messaggi in coda:     ${result.pending_update_count ?? 0}`);
  console.log(`  Ultimo errore:        ${result.last_error_message || 'Nessuno ✅'}`);
  console.log('═══════════════════════════════════════════════\n');

  if (result.pending_update_count > 0) {
    console.log(`⚡ Telegram recapiterà ora ${result.pending_update_count} messaggi pendenti...`);
  }
}

run().catch((err) => {
  console.error('❌ Errore inatteso:', err.message);
  process.exit(1);
});
