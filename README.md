# 🚀 Progetto Logichat

> Benvenuto nel progetto **Logichat**! Questo workspace è potenziato con l'**AG Kit**, un kit completo di agenti intelligenti, skill modulari e flussi di lavoro avanzati per supportare lo sviluppo dell'applicazione in ogni sua fase.

---

## 🤖 Struttura degli Agenti & AG Kit

L'**AG Kit** installato in questo workspace fornisce una suite completa di strumenti avanzati per la progettazione, lo sviluppo, il testing e l'ottimizzazione del progetto:

```plaintext
.agent/
├── ARCHITECTURE.md          # Architettura e documentazione dettagliata del kit
├── agents/                  # 20 Agenti Specializzati (Personas basate su ruoli)
├── skills/                  # 45 Skill / Moduli di conoscenza (caricamento condizionale)
├── workflows/               # 14 Comandi Slash ed esecuzioni guidate
├── rules/                   # Regole globali di comportamento (GEMINI.md)
├── memory/                  # Memoria persistente cross-sessione
└── scripts/                 # Script di validazione principali (checklist.py, verify_all.py)
```

### 🎯 Come interagire con gli agenti

Il sistema supporta la selezione automatica dell'agente più adatto in base alla tua richiesta:
1. **Frontend UI/UX**: L'agente `@frontend-specialist` si attiverà per compiti di design e sviluppo web.
2. **Backend & Database**: Gli agenti `@backend-specialist` e `@database-architect` gestiranno API, logica e database.
3. **Orchestratore**: Per coordinare più agenti o gestire task complessi, l'agente `@orchestrator` guiderà l'intero processo.

---

## 🛠️ Comandi Utili (Workflows)

Puoi avviare flussi di lavoro intelligenti raccomandando i seguenti comandi o chiedendo direttamente all'AI di eseguirli:

*   `/plan` - Pianificazione e suddivisione dei task complessi.
*   `/brainstorm` - Sessione di discovery con domande socratiche.
*   `/coordinate` - Coordinamento avanzato multi-agente per architetture complesse.
*   `/ui-ux-pro-max` - Progettazione UI avanzata con 50+ stili e palette harmonized.
*   `/verify` - Esecuzione automatica dei test e validazione del codice.

---

## 📈 Validazione del Codice e Qualità

Per garantire i più elevati standard di qualità, sicurezza e performance, puoi eseguire gli script di master validation contenuti nel kit:

```bash
# Validazione rapida durante lo sviluppo (Security, Lint, Schema, Tests, UX, SEO)
python .agent/scripts/checklist.py .

# Verifica completa prima del deploy (Lighthouse, Playwright, Bundle Analysis, Mobile Audit)
python .agent/scripts/verify_all.py . --url http://localhost:3000
```

---

*Logichat è pronto per essere sviluppato con il massimo della qualità e dell'efficienza. Buon coding!* 🚀
