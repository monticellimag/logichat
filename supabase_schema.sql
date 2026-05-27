-- ====================================================================
-- LOGICHAT - DATABASE SCHEMA SQL
-- Esegui questo script nel SQL Editor della tua dashboard Supabase
-- ====================================================================

-- 1. Tabella Disposizioni (Fase 1)
CREATE TABLE IF NOT EXISTS disposizioni (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    codice TEXT UNIQUE NOT NULL,
    descrizione TEXT NOT NULL,
    stato TEXT NOT NULL DEFAULT 'in_attesa', -- 'in_attesa', 'approvato', 'rifiutato'
    approvato_da TEXT,                       -- Identificativo o nome del Preposto
    decisione_data TIMESTAMP WITH TIME ZONE
);

-- 2. Tabella Foto Magazzino (Fase 2)
CREATE TABLE IF NOT EXISTS foto_magazzino (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    descrizione TEXT NOT NULL,
    telegram_file_id TEXT NOT NULL,          -- file_id permanente ospitato su Telegram
    stato TEXT NOT NULL DEFAULT 'in_attesa', -- 'in_attesa', 'approvato', 'rifiutato'
    decisione_da TEXT,                       -- Identificativo o nome del Preposto
    decisione_data TIMESTAMP WITH TIME ZONE,
    disposizione_id UUID REFERENCES disposizioni(id) ON DELETE SET NULL
);

-- Abilitazione delle query pubbliche e indici di performance
CREATE INDEX IF NOT EXISTS idx_disposizioni_stato ON disposizioni(stato);
CREATE INDEX IF NOT EXISTS idx_foto_magazzino_stato ON foto_magazzino(stato);
CREATE INDEX IF NOT EXISTS idx_foto_magazzino_disposizione ON foto_magazzino(disposizione_id);

-- Abilita l'accesso senza filtri RLS (puoi definire le RLS in base alle politiche aziendali)
ALTER TABLE disposizioni DISABLE ROW LEVEL SECURITY;
ALTER TABLE foto_magazzino DISABLE ROW LEVEL SECURITY;
