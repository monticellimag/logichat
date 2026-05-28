/**
 * start_tunnel.js — LOGICHAT TUNNEL MANAGER DEFINITIVO
 * ─────────────────────────────────────────────────────────────────────────────
 * Avvia un tunnel SSH su localhost.run e registra AUTOMATICAMENTE il webhook
 * di Telegram ogni volta che l'URL cambia.
 *
 * UTILIZZO:
 *   node scripts/start_tunnel.js          ← usa localhost.run (no account)
 *
 * PER UN URL FISSO (consigliato per produzione):
 *   Registrati gratis su https://ngrok.com, ottieni il token e aggiungilo in
 *   .env.local: NGROK_AUTHTOKEN=il_tuo_token — poi usa: npm run tunnel:ngrok
 *
 * Il tunnel si riavvia automaticamente se cade, e riregistra sempre il webhook.
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// ─── Leggi .env.local ────────────────────────────────────────────────────────
const envPath = path.resolve(process.cwd(), '.env.local');
const env = {};
try {
  if (fs.existsSync(envPath)) {
    fs.readFileSync(envPath, 'utf8').split('\n').forEach((line) => {
      const t = line.trim();
      if (!t || t.startsWith('#')) return;
      const [k, ...v] = t.split('=');
      env[k.trim()] = v.join('=').split('#')[0].trim();
    });
  }
} catch (e) { /* ignora */ }

const BOT_TOKEN = env['TELEGRAM_BOT_TOKEN'];
if (!BOT_TOKEN) { console.error('❌ TELEGRAM_BOT_TOKEN mancante in .env.local'); process.exit(1); }

// ─── Helpers ─────────────────────────────────────────────────────────────────
function saveUrl(url) {
  try {
    let c = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
    c = c.match(/^TUNNEL_URL=/m)
      ? c.replace(/^TUNNEL_URL=.*/m, `TUNNEL_URL=${url}`)
      : c.trimEnd() + `\n\n# URL Tunnel (aggiornato automaticamente)\nTUNNEL_URL=${url}\n`;
    fs.writeFileSync(envPath, c, 'utf8');
  } catch (e) { /* ignora */ }
}

async function registerWebhook(tunnelUrl) {
  const webhookUrl = `${tunnelUrl}/api/telegram/webhook`;
  const base = `https://api.telegram.org/bot${BOT_TOKEN}`;
  console.log(`\n🔗 Registrazione webhook: ${webhookUrl}\n`);

  try {
    await fetch(`${base}/deleteWebhook?drop_pending_updates=false`).then(r => r.json());
    const r = await fetch(`${base}/setWebhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: webhookUrl,
        allowed_updates: ['message', 'channel_post', 'callback_query'],
      }),
    }).then(r => r.json());

    if (!r.ok) { console.error('❌ Webhook error:', r.description); return; }

    const info = await fetch(`${base}/getWebhookInfo`).then(r => r.json());
    const res = info.result || {};
    console.log('══════════════════════════════════════════════');
    console.log(`  ✅ Webhook: ${res.url}`);
    console.log(`  📬 Coda:    ${res.pending_update_count ?? 0} messaggi`);
    console.log(`  🔴 Errori:  ${res.last_error_message || 'Nessuno'}`);
    console.log('══════════════════════════════════════════════\n');
    console.log('🟢 SISTEMA PRONTO — Puoi postare foto nel gruppo Magazzino!\n');

    saveUrl(tunnelUrl);
    if ((res.pending_update_count ?? 0) > 0) {
      console.log(`⚡ Telegram recapiterà ${res.pending_update_count} messaggi pendenti...\n`);
    }
  } catch (e) {
    console.error('❌ Errore registrazione webhook:', e.message);
  }
}

// ─── Avvia il tunnel SSH con auto-restart ────────────────────────────────────
const URL_PATTERN = /https:\/\/([a-z0-9]+)\.lhr\.life/;
let restartCount = 0;
let currentUrl = null;

function startTunnel() {
  restartCount++;
  if (restartCount > 1) {
    console.log(`\n♻️  Riavvio tunnel (tentativo ${restartCount})...\n`);
  }

  const proc = spawn(
    'ssh',
    ['-o', 'StrictHostKeyChecking=no',
     '-o', 'ServerAliveInterval=30',  // heartbeat ogni 30s per evitare disconnessioni
     '-o', 'ServerAliveCountMax=3',
     '-R', '80:localhost:3000',
     'nokey@localhost.run'],
    { stdio: ['ignore', 'pipe', 'pipe'] }
  );

  let webhookSet = false;

  function onData(data) {
    const text = data.toString();
    // Stampa solo le righe informative (non il QR)
    text.split('\n').forEach(line => {
      const l = line.trim();
      if (l && !l.match(/^\s*$/)) process.stdout.write(l + '\n');
    });

    const match = text.match(URL_PATTERN);
    if (match) {
      const newUrl = `https://${match[1]}.lhr.life`;
      if (newUrl !== currentUrl) {
        currentUrl = newUrl;
        webhookSet = false; // reset per registrare il nuovo URL
      }
    }

    if (!webhookSet && currentUrl) {
      webhookSet = true;
      setTimeout(() => registerWebhook(currentUrl).catch(console.error), 2000);
    }
  }

  proc.stdout.on('data', onData);
  proc.stderr.on('data', onData);

  proc.on('close', (code) => {
    console.log(`\n⚠️  Tunnel chiuso (code: ${code}). Riavvio in 3 secondi...\n`);
    currentUrl = null;
    setTimeout(startTunnel, 3000); // auto-restart
  });

  proc.on('error', (e) => {
    console.error('❌ Errore SSH:', e.message);
    setTimeout(startTunnel, 5000);
  });

  process.on('SIGINT', () => {
    console.log('\n🛑 Arresto tunnel manuale.');
    proc.kill();
    process.exit(0);
  });
}

// ─── Main ────────────────────────────────────────────────────────────────────
console.log('\n════════════════════════════════════════════════════════');
console.log('  🚀 LOGICHAT — TUNNEL MANAGER con AUTO-RESTART');
console.log('════════════════════════════════════════════════════════');
console.log('  Ogni cambio URL → webhook ri-registrato in automatico');
console.log('  Tunnel cade → riavvio automatico in 3 secondi');
console.log('════════════════════════════════════════════════════════\n');

startTunnel();
