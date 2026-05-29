const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

console.log("====================================================");
console.log("🔄 MIGRATING PREPOSTO NAME IN DATABASE");
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

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  }
});

async function migrate() {
  try {
    console.log("Connessione a Supabase...");
    
    // 1. Aggiorna disposizioni
    const { data: dispData, error: dispError } = await supabase
      .from('disposizioni')
      .update({ approvato_da: 'Suki & Harman' })
      .eq('approvato_da', 'Preposto 2')
      .select();

    if (dispError) throw dispError;
    console.log(`✅ Aggiornate ${dispData.length} disposizioni da 'Preposto 2' a 'Suki & Harman'.`);

    // 2. Aggiorna foto_magazzino
    const { data: fotoData, error: fotoError } = await supabase
      .from('foto_magazzino')
      .update({ decisione_da: 'Suki & Harman' })
      .eq('decisione_da', 'Preposto 2')
      .select();

    if (fotoError) throw fotoError;
    console.log(`✅ Aggiornate ${fotoData.length} foto da 'Preposto 2' a 'Suki & Harman'.`);

    console.log("\n🎉 MIGRAZIONE COMPLETATA CON SUCCESSO!");
  } catch (err) {
    console.error("❌ Errore durante la migrazione:", err.message);
  }
}

migrate();
