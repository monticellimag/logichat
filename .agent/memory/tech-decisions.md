---
type: project
created: 2026-05-29
updated: 2026-05-29
---

# Technical Decisions & Roadmap

## LOG1 Dashboard Access Protection
- **Decision:** Prevent unauthorized writes and access to the `/log1` dashboard on the public Vercel URL.
- **Chosen Option:** **Option A (Shared Password / PIN Access Key)**.
- **Details:** 
  - Store a strong administrative key (e.g. `LOG1-2026-SECURE`) in `.env.local` on Vercel.
  - Implement a clean, dark login screen at `/log1` if the cookie/LocalStorage token is missing.
  - Validate this key on the server-side Next.js API endpoints to reject unauthorized requests.
  - Sincronizzare la memorizzazione della sessione tramite LocalStorage o cookie cifrato.
- **Timing:** Planned for a future implementation phase.

## LOG1 Auto-Forward to Telegram Groups
- **Decision:** Allow forwarding information automatically to Telegram groups without Preposto manual approval.
- **Chosen Option:** **Option A (Auto-Inoltro Diretto)**.
- **Details:** 
  - Save dispositions directly in `'approvato'` state in Supabase.
  - Automatically record `approvato_da` as `"Suki & Harman"`.
  - Instantly forward message text and media/allegati to the target Telegram channels without interactive buttons.
- **Timing:** Planned for a future implementation phase.

