# 📘 Manuale Operativo di Logichat

> **Sistema Integrato di Smistamento Disposizioni Operative e Monitoraggio Attività**  
> *Versione: 1.1 — Maggio 2026*

Benvenuto nel manuale d'uso ufficiale di **Logichat**! Questo manuale descrive in modo semplice e dettagliato come utilizzare le varie interfacce e i flussi di lavoro integrati con il Bot Telegram per gestire e archiviare le disposizioni di carico, scarico e le urgenze del magazzino.

---

## 👥 1. Ruoli del Sistema

Il sistema si compone di tre ruoli operativi principali:
1. **LOG 1 (Ufficio Traffico / Amministrazione):** Crea le disposizioni giornaliere, assegna le tipologie e monitora lo stato di avanzamento.
2. **Preposto (Responsabile / Approvatore):** Riceve le notifiche su Telegram in tempo reale, approva o rifiuta le richieste ed esegue l'audit del flusso storico.
3. **Magazzinieri (Operativi):** Ricevono le disposizioni approvate su canali Telegram dedicati, eseguono il lavoro e caricano le foto di riscontro inserendo il codice pratica.

---

## 🖥️ 2. Guida all'Uso della Dashboard LOG1

La dashboard amministrativa di LOG1 è raggiungibile all'indirizzo `/log1`.

### ➡️ Invio di una Nuova Disposizione
1. **Codice:** Inserisci un identificativo univoco (es. `LOG1-2026-005` o la targa del camion).
2. **Tipologia Flusso:** Scegli la categoria appropriata dal menu a tendina:
   * `🔵 Carico Camion`: Per le normali operazioni di carico.
   * `🟢 Scarico Camion`: Per le normali operazioni di scarico.
   * `🚨 PRIORITÀ (Urgenza)`: Per camion prioritari o urgenze assolute.
3. **Istruzione:** Inserisci la nota testuale operativa per i magazzinieri (es. *«Caricare 22 pedane di materiale A sul lato sinistro, posizionare con cura»*).
4. **Allegato (Opzionale):** Clicca sull'area di caricamento per allegare una foto, un documento PDF o una distinta di carico (limite: 10MB).
5. **Invia:** Clicca su **"Invia al Preposto ➔"**. La disposizione verrà registrata in stato `⏳ In Attesa` e i Preposti riceveranno subito una notifica su Telegram.

### ⏳ Gestione delle Schede "In Corso"
Le schede visualizzate in questo pannello rappresentano le lavorazioni di oggi.
* **Badge Colorati:** Ogni scheda mostra un indicatore colorato del flusso (*Carico*, *Scarico*, o il badge rosso lampeggiante `🚨 PRIORITÀ` per attirare subito l'attenzione visiva).
* **Annullamento:** Se una disposizione è ancora `In Attesa`, puoi cliccare su **"Annulla"** per eliminarla ed evitare che il preposto possa approvarla.
* **Archiviazione Manuale:** Quando una lavorazione di oggi è stata completata o vuoi rimuoverla dallo schermo principale, clicca sul pulsante **"📁 Archivia"**. La scheda si sposterà all'istante nel tab **"Archivio Storico"**.

### 🗄️ Consultazione dell'Archivio Storico
Selezionando il tab **"Archivio Storico"**, avrai accesso a tutte le pratiche dei giorni scorsi o archiviate manualmente.
* **Ricerca Istantanea:** Digita codici o parole chiave nella barra di ricerca.
* **Filtri Avanzati:** Filtra all'istante l'archivio per tipologia (*Solo Carichi*, *Solo Scarichi*, *Solo Priorità*) e per esito (*Solo Approvate*, *Solo Rifiutate*, *Solo In Attesa*).

---

## 🤖 3. Guida per i Preposti (Telegram & Control Room)

I Preposti gestiscono il flusso operativo direttamente dal proprio smartphone o PC tramite Telegram.

### 📱 Approvazione / Rifiuto su Telegram
Quando LOG1 inserisce una disposizione, il Bot invia un messaggio privato a ciascun Preposto:
* Il messaggio include il codice, il flusso, la descrizione e l'allegato visualizzato come **Foto** o **Documento**.
* Sotto il messaggio sono presenti due bottoni interattivi: **`✅ APPROVA`** e **`❌ RIFIUTA`**.
* Cliccando su **`✅ APPROVA`**, lo stato su Supabase si aggiorna e il Bot provvede allo smistamento automatico:
  * **Carico / Scarico:** Messaggio inoltrato sul canale Telegram **Disposizioni Generali**.
  * **Priorità:** Messaggio inoltrato sul canale Telegram **Priorità**.
  * **Inoltro File:** Se la disposizione ha un allegato, questo viene inviato nativamente insieme alle istruzioni sul canale dei magazzinieri.
* Cliccando su **`❌ RIFIUTA`**, la pratica viene segnata come rifiutata e non viene inviata ai magazzinieri.

### 🕵️‍♂️ Control Room del Preposto
Raggiungibile all'indirizzo `/preposto`.
* Mostra statistiche riassuntive (Disposizioni totali, approvate, foto caricate e approvate).
* Include due tab principali: **"Disposizioni"** (per vedere l'esito e chi ha gestito la pratica) e **"Foto Magazzino"** (per monitorare le immagini caricate dagli operai).

---

## 📦 4. Guida per il Magazzino (Magazzinieri)

I magazzinieri lavorano prevalentemente su due interfacce: i **Canali Telegram** e la **Pagina Magazzino** dell'app.

### 📥 Ricezione delle Istruzioni
I magazzinieri vedono arrivare sul proprio canale Telegram di riferimento (Generale o Priorità) i messaggi formattati con il codice pratica (es. `LOG1-2026-005`), le istruzioni operative e gli eventuali file PDF/immagini allegati da LOG1.

### 📷 Caricamento Foto di Riscontro
1. Fai una o più foto al camion o alla merce lavorata.
2. Invia le foto al **Bot Telegram** di Logichat.
3. **CRITICO:** Scrivi nel commento (didascalia) della foto **esattamente il codice della disposizione** (es. `LOG1-2026-005`). 
4. Il Bot assocerà in automatico la foto alla disposizione corretta e la renderà visibile nel sistema per il controllo qualità.

### 🖥️ Consultazione Pagina Magazzino (`/magazzino`)
Utilizzata sui tablet o computer del magazzino:
* **Colonna Disposizioni:** Elenca le istruzioni approvate del giorno in corso. Sotto ogni card compare una nota di promemoria con il codice da usare su Telegram.
* **Archiviazione:** Quando un carico o scarico è concluso, il magazziniere può cliccare su **"📁 Archivia Disposizione"** per rimuoverlo dalla lista attiva di oggi.
* **Colonna Foto:** Mostra in tempo reale una galleria con tutte le foto caricate dai magazzinieri su Telegram, divise per stato (*Approvate*, *In Attesa*). Cliccando su una foto si apre una comoda anteprima ingrandita.
