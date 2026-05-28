const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

console.log("====================================================");
console.log("🧹 DATABASE CLEANER FOR LOGICHAT");
console.log("====================================================");

// Semplice parser per .env.local per ricavare URL e Service Key
let supabaseUrl = '';
let serviceRoleKey = '';

try {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) {
        supabaseUrl = trimmed.split('NEXT_PUBLIC_SUPABASE_URL=')[1].split('#')[0].trim();
      }
      if (trimmed.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) {
        serviceRoleKey = trimmed.split('SUPABASE_SERVICE_ROLE_KEY=')[1].split('#')[0].trim();
      }
    }
  }
} catch (err) {
  console.error("❌ Errore durante la lettura di .env.local:", err.message);
}

if (!supabaseUrl || !serviceRoleKey) {
  console.error("❌ ERRORE: Credenziali Supabase mancanti in .env.local!");
  process.exit(1);
}

// Inizializza il client Supabase con la service role key per aggirare le policy RLS
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  }
});

async function cleanDatabase() {
  console.log("Connessione a Supabase in corso...");
  console.log("Rimozione di tutti i record di test precedenti...\n");

  try {
    // 1. Elimina foto_magazzino (dobbiamo farlo per primo per via della Foreign Key)
    const { error: errorFoto } = await supabase
      .from('foto_magazzino')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Rimuove tutti i record
    
    if (errorFoto) {
      throw new Error(`Errore pulizia foto_magazzino: ${errorFoto.message}`);
    }
    console.log("✅ Tabella 'foto_magazzino' svuotata con successo.");

    // 2. Elimina disposizioni
    const { error: errorDisp } = await supabase
      .from('disposizioni')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Rimuove tutti i record
    
    if (errorDisp) {
      throw new Error(`Errore pulizia disposizioni: ${errorDisp.message}`);
    }
    console.log("✅ Tabella 'disposizioni' svuotata con successo.");

    console.log("\n🎉 IL DATABASE È ORA COMPLETAMENTE PULITO E PRONTO PER I NUOVI TEST REALI!");

  } catch (err) {
    console.error("\n❌ Errore durante la pulizia del database:", err.message);
  }
}

cleanDatabase();
