# 🧠 Brainstorming: Architettura Logichat & Alternativa OneDrive (Step 3)

## 📋 Contesto & Analisi dell'Architettura
Il flusso delineato nel file di architettura SVG è estremamente chiaro e ben strutturato in due fasi:
1. **Fase 1 (Disposizioni LOG1)**: L'app invia la disposizione -> salvataggio su Supabase -> notifica Telegram al Preposto con bottoni inline (Approva/Rifiuta) -> callback al webhook dell'App Next.js che aggiorna lo stato su Supabase e notifica il magazzino.
2. **Fase 2 (Caricamento Foto Magazziniere)**: Il magazziniere carica foto + testo -> salvataggio temporaneo -> notifica Telegram al Preposto con anteprima foto e bottoni inline -> se approvato, salvataggio definitivo su cloud storage.

### ⚠️ Il Blocco di Step 3 (OneDrive & Azure API)
Poiché **non puoi registrare l'app su Azure** per utilizzare le OneDrive API, non è possibile procedere con il piano originale Microsoft OneDrive. Di seguito sono presentate 3 soluzioni alternative di livello premium per superare questo blocco.

---

## 🛠️ Nuove Opzioni di Sostituzione per OneDrive (Step 3)
*Aggiornate considerando il limite di 1GB della versione free di Supabase Storage, che risulta insufficiente per carichi industriali.*

### Opzione A: Google Drive API tramite Service Account (15 GB Gratuiti)
Se le foto devono essere facilmente consultabili in una struttura a cartelle condivisa (analoga a OneDrive), **Google Drive** rappresenta l'alternativa migliore. Ogni account Google personale o aziendale standard offre ben **15 GB di spazio gratuito** (15 volte superiore a Supabase!).

*   **Funzionamento**: Si crea un progetto su Google Cloud Console (gratuito), si abilita l'API di Google Drive e si crea un **Service Account** (generando una chiave JSON). Successivamente si crea una cartella su Google Drive e la si condivide con l'email del Service Account. L'app Next.js userà la chiave JSON per caricare le foto direttamente nella cartella in modo programmatico.
*   ✅ **Pros:**
    *   **15 GB Gratuiti**: Spazio capiente e pronto all'uso.
    *   **Cartella condivisa reale**: Chiunque nel team (preposto, magazzinieri, amministratori) può accedere a Google Drive da browser o smartphone, visualizzando i file organizzati per cartella o data.
    *   **Nessun blocco IT**: A differenza di Azure Active Directory, la creazione di un progetto su Google Cloud Console non richiede permessi da parte dell'amministratore del tenant aziendale di Microsoft.
*   ❌ **Cons:**
    *   Richiede una configurazione iniziale su Google Cloud Console per scaricare le credenziali JSON del Service Account.
    *   Richiede l'installazione della libreria `googleapis`.
*   📊 **Effort**: **Medium** (2 ore di configurazione e sviluppo)

---

### Opzione B: Telegram Bot API come Storage Illimitato (Infiniti GB Gratuiti)
Una soluzione estremamente intelligente, agile e a **costo zero con spazio illimitato**.

*   **Funzionamento**: Invece di salvare i file su un cloud storage, le foto vengono gestite interamente da Telegram. Quando il magazziniere carica una foto, l'app Next.js (o il bot stesso) la invia ad un canale privato o ad una chat Telegram di archivio. Telegram restituisce un identificativo unico (`file_id`). L'app Next.js salva semplicemente questo `file_id` nel database Supabase. Quando l'applicazione o il Preposto devono visualizzare la foto, l'app Next.js genera dinamicamente l'URL della foto interrogando le API di Telegram (`getFile`), oppure la inoltra direttamente tramite Bot.
*   ✅ **Pros:**
    *   **Spazio illimitato e gratuito**: Telegram non pone limiti al numero di file salvati né alla loro durata, con dimensioni fino a 2 GB per singolo file.
    *   **Nessun cloud di terze parti da configurare**: Non serve configurare Azure, Google Cloud o Cloudflare.
    *   **Semplicità di sviluppo**: Si riduce tutto a chiamate HTTP verso le Telegram Bot API.
*   ❌ **Cons:**
    *   I file rimangono ospitati sui server di Telegram. Non avrai una cartella classica in stile Esplora Risorse (come su OneDrive o Google Drive) per vederli tutti insieme ordinati, a meno che non si consulti la cronologia della chat di archivio del bot.
*   📊 **Effort**: **Low** (1 ora di sviluppo)

---

### Opzione C: Cloudflare R2 (10 GB Gratuiti, banda illimitata)
**Cloudflare R2** è la soluzione cloud object storage professionale per eccellenza (alternativa di livello enterprise ad AWS S3).

*   **Funzionamento**: Si crea un account gratuito su Cloudflare e si abilita un bucket R2. Cloudflare offre **10 GB al mese gratuiti** di storage e soprattutto ha **zero costi di banda (egress fees)**, il che significa che mostrare le foto nell'app o su Telegram non costerà mai nulla. L'integrazione è identica a quella di AWS S3 (si usa l'SDK standard `@aws-sdk/client-s3`).
*   ✅ **Pros:**
    *   **10 GB Gratuiti**: Spazio abbondante e scalabile.
    *   **Object Storage Professionale**: È una soluzione scalabile all'infinito e adatta ad applicazioni di produzione reali.
    *   **Zero costi di banda**: Nessuna sorpresa in fattura per i download delle foto.
*   ❌ **Cons:**
    *   Come per Supabase Storage, non c'è un'interfaccia utente a cartelle accessibile direttamente da utenti non tecnici (come Google Drive).
*   📊 **Effort**: **Medium** (1.5 ore di sviluppo)

---

## 💡 Nuova Raccomandazione

Se l'obiettivo è avere una **cartella visibile, ordinata e accessibile a tutto il team** (sostituto perfetto di OneDrive), la raccomandazione è l'**Opzione A (Google Drive con Service Account - 15 GB gratuiti)**.

Se invece l'obiettivo principale è la **semplicità assoluta di sviluppo, il costo zero e l'assenza di limiti di spazio**, l'**Opzione B (Telegram Bot API come Storage - Infiniti GB)** è un'idea geniale che si sposa perfettamente con lo spirito del progetto "Logichat".

---

## 🚀 I 4 Passaggi per Partire Questa Settimana

### 🟢 Step 1: Creazione del Progetto Next.js
Inizializzazione del progetto Next.js (App Router, Tailwind CSS, TypeScript) con la struttura delle cartelle premium da te indicata.

### 🟢 Step 2: Creazione del Bot Telegram su @BotFather
Ecco la guida rapida e dettagliata per creare il bot in 2 minuti:
1. Apri Telegram e cerca **`@BotFather`** (assicurati che abbia la spunta blu di verifica).
2. Clicca su **Avvia** (o digita `/start`).
3. Digita `/newbot` per creare un nuovo bot.
4. **Scegli un nome** per il tuo bot (es. `Logichat Disposizioni Bot`).
5. **Scegli uno username** unico che deve terminare obbligatoriamente con `bot` (es. `logichat_approvazioni_bot`).
6. **Copia il Token API**: BotFather ti fornirà una stringa simile a `123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ`. Salvala con cura: sarà la nostra chiave `TELEGRAM_BOT_TOKEN`.
7. Digita `/setuserpic` se desideri caricare un'immagine profilo per il bot, e `/setdescription` per impostare il testo di benvenuto.

### 🟢 Step 3: Scelta dell'alternativa a OneDrive
*Da definire insieme sulla base delle opzioni presentate sopra (raccomandata: **Opzione A**).*

### 🟢 Step 4: Configurazione Supabase & Tabelle
Creeremo le tabelle su Supabase per gestire il flusso delle disposizioni e delle approvazioni. Ecco lo schema relazionale proposto:

#### Tabella `disposizioni`
*   `id`: `uuid` (Chiave Primaria)
*   `created_at`: `timestamp`
*   `codice`: `text` (es. "LOG1-2026-001")
*   `descrizione`: `text`
*   `stato`: `text` (valori: `in_attesa`, `approvato`, `rifiutato`)
*   `preposto_chat_id`: `text` (il chat_id Telegram del preposto che ha ricevuto la notifica)
*   `decisione_data`: `timestamp` (quando il preposto ha cliccato sul bot)

#### Tabella `foto_magazzino`
*   `id`: `uuid` (Chiave Primaria)
*   `created_at`: `timestamp`
*   `descrizione`: `text`
*   `foto_url`: `text` (URL puntante a Supabase Storage o altro cloud scelto)
*   `stato`: `text` (valori: `in_attesa`, `approvato`, `rifiutato`)
*   `disposizione_id`: `uuid` (Chiave Esterna collegata a `disposizioni`, per legare la foto a una disposizione specifica)
