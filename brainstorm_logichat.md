# 🧠 Architettura Ufficiale & Specifiche Tecniche: Logichat

Questo documento descrive in dettaglio l'architettura tecnica definitiva, i flussi di dati e la struttura del database realizzati per l'applicazione **Logichat**. Il sistema integra un frontend moderno in Next.js, un database relazionale su Supabase e un Bot Telegram interattivo per la gestione operativa in tempo reale.

---

## 🏗️ 1. Flusso Globale dell'Applicazione

L'applicazione coordina la comunicazione tra l'amministrazione, i responsabili (Preposti) e gli operatori del magazzino tramite un flusso suddiviso in quattro macro-fasi:

```
[ LOG1 Form ] ────> (Salva su Supabase in 'in_attesa') ────> [ Notifica Telegram Preposti ]
                                                                     │
                                                                     ▼
[ Canali Magazzinieri ] <──── [ Smistamento Condizionale ] <──── [ Callback Approva/Rifiuta ]
```

### ➡️ Fase 1: Creazione della Disposizione (LOG1)
* **Raccolta dati:** Dalla dashboard `/log1`, l'operatore amministrativo compila il codice pratica, il testo dell'istruzione, seleziona la tipologia (`🔵 Carico`, `🟢 Scarico`, `🚨 Priorità`) e inserisce eventuali file allegati (Fatture, PDF, Foto).
* **Supabase Storage:** Se è presente un allegato, questo viene salvato nel bucket storage `allegati` di Supabase e ne viene ricavato un URL pubblico.
* **Database Insert:** Viene inserito un record nella tabella `disposizioni` in stato `in_attesa` registrando il flag `tipologia` (default `'generica'`) e `archiviato` (default `false`).
* **Richiesta di Approvazione:** L'API invia una notifica privata a ciascuno dei Preposti registrati via Telegram. La notifica contiene le istruzioni, l'allegato inviato nativamente (come **Foto** se immagine, altrimenti come **Documento**) ed i pulsanti di scelta rapida: **`✅ APPROVA`** e **`❌ RIFIUTA`**.

### ➡️ Fase 2: Gestione Webhook Telegram & Smistamento
* **Intercettazione Callback:** Quando un Preposto clicca su una scelta in Telegram, la richiesta viene inoltrata all'endpoint di webhook `/api/telegram/webhook/route.ts`.
* **Aggiornamento Stato:** Lo stato della disposizione viene modificato su Supabase in `approvato` o `rifiutato` registrando il nome del Preposto e la data della decisione.
* **Smistamento Intelligente per Tipologia:**
  * Se la disposizione è **Approvata**, il webhook verifica la categoria (`tipologia`):
    * **Carico / Scarico:** Il messaggio viene formattato e inviato al canale Telegram **Disposizioni Generali** (`TELEGRAM_DISPOSIZIONI_CHANNEL_ID`).
    * **Priorità:** Il messaggio viene contrassegnato con l'emoji `🚨` e inoltrato al canale Telegram **Priorità** (`TELEGRAM_PRIORITA_CHANNEL_ID`) per attirare l'attenzione immediata del magazzino.
* **Inoltro Allegati Operativi:** Insieme al messaggio testuale approvato, il webhook provvede ad estrarre l'eventuale allegato salvato su Supabase Storage e lo inoltra automaticamente sul canale Telegram dei magazzinieri.

### ➡️ Fase 3: Storage Foto Magazzino (Opzione B)
Per eliminare la dipendenza da cloud esterni complessi (come OneDrive o Azure API) e superare i limiti di storage, il sistema implementa la memorizzazione nativa tramite **Telegram Bot API**:
* **Caricamento Riscontro:** Quando il magazziniere completa la lavorazione, invia una foto di riscontro al Bot Telegram scrivendo come didascalia il codice della disposizione (es. `LOG1-2026-005`).
* **Salvataggio Identificativo:** Next.js intercetta la foto inviata tramite il webhook del Bot, estrae il codice didascalia, identifica la disposizione corrispondente su Supabase e salva la foto nella tabella `foto_magazzino` memorizzando l'ID univoco permanente fornito da Telegram: `telegram_file_id`.
* **Risoluzione Dinamica delle Foto:** Le immagini non occupano spazio sul database o su bucket esterni. Quando le dashboard devono renderizzare le foto caricate dai magazzinieri, interrogano l'endpoint dinamico `/api/foto?file_id=...` che scarica temporaneamente il file binario dai server sicuri di Telegram tramite il metodo `getFile` e lo serve in cache al browser client.

### ➡️ Fase 4: Archiviazione Manuale delle Schede
Per garantire una dashboard sempre pulita, gli utenti possono archiviare le schede manualmente:
* **Logica dei Tab (In Corso vs Archivio):**
  * **In Corso / Oggi:** Mostra solo le schede la cui data corrisponde a oggi E in cui il flag `archiviato` è uguale a `false`.
  * **Archivio Storico:** Include automaticamente tutte le schede create nei giorni passati OPPURE le schede di oggi contrassegnate manualmente come archiviate (`archiviato = true`).
* **Endpoint PATCH (`/api/disposizioni/[id]/route.ts`):** Riceve la richiesta `{ archiviato: true }` da LOG1 o dal Magazzino e aggiorna istantaneamente lo stato nel database Supabase, spostando la card all'interno della Control Room e disattivando la sua visualizzazione dal giorno in corso.

---

## 🗄️ 2. Struttura del Database (Supabase)

Il database è strutturato secondo due tabelle principali collegate tra loro in relazione `1:N` (Una disposizione può avere più foto di riscontro caricate dai magazzinieri).

### 📋 Tabella `disposizioni`
Gestisce le istruzioni operative inviate dall'ufficio logistica.

| Colonna | Tipo | Descrizione |
|---|---|---|
| `id` | `UUID` (PK) | Identificativo primario generato automaticamente (`gen_random_uuid()`). |
| `created_at` | `TIMESTAMPTZ` | Timestamp di creazione impostato sul tempo UTC del server. |
| `codice` | `TEXT` | Codice univoco identificativo della pratica (es. `LOG1-2026-001`). |
| `descrizione` | `TEXT` | Testo completo dell'istruzione operativa. |
| `stato` | `TEXT` | Stato di approvazione (`'in_attesa'`, `'approvato'`, `'rifiutato'`). Default: `'in_attesa'`. |
| `approvato_da` | `TEXT` | Nome o identificativo del Preposto che ha preso in carico la richiesta. |
| `decisione_data` | `TIMESTAMPTZ` | Data e ora in cui è stata registrata la decisione su Telegram. |
| `allegato_url` | `TEXT` | URL puntante al file salvato nel bucket storage di Supabase (se caricato). |
| `allegato_name` | `TEXT` | Nome originale del file caricato come allegato. |
| `tipologia` | `TEXT` | Tipologia del flusso di lavoro (`'carico'`, `'scarico'`, `'priorita'`). Default: `'generica'`. |
| `archiviato` | `BOOLEAN` | Stato di archiviazione manuale della disposizione. Default: `false`. |

### 📋 Tabella `foto_magazzino`
Gestisce i riscontri fotografici inviati dal magazzino tramite il Bot Telegram.

| Colonna | Tipo | Descrizione |
|---|---|---|
| `id` | `UUID` (PK) | Identificativo primario generato automaticamente. |
| `created_at` | `TIMESTAMPTZ` | Data e ora di ricezione dell'immagine da Telegram. |
| `descrizione` | `TEXT` | Commento testuale (didascalia) inserito dal magazziniere (es. codice disposizione). |
| `telegram_file_id` | `TEXT` | ID file permanente univoco memorizzato sui server di Telegram. |
| `stato` | `TEXT` | Stato di validazione della foto (`'in_attesa'`, `'approvato'`, `'rifiutato'`). Default: `'in_attesa'`. |
| `decisione_da` | `TEXT` | Nome del Preposto che ha validato lo stato della foto. |
| `decisione_data` | `TIMESTAMPTZ` | Data e ora di validazione della foto. |
| `disposizione_id` | `UUID` (FK) | Chiave esterna collegata a `disposizioni.id` con eliminazione `ON DELETE SET NULL`. |
