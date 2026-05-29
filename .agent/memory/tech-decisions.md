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
