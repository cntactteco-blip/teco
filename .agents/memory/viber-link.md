---
name: Viber link format for Moldova
description: Correct deep-link format for Viber chat on mobile/desktop
---
## Rule
Viber deep links must use digits only — no `+`, no `%2B`: `viber://chat?number=${phone.replace(/\D/g, "")}`

**Why:** Both `%2B` (URL-encoded +) and literal `+` cause "Solicitare indisponibilă / Pagina solicitată nu este disponibilă" in Viber on iOS. The correct format is the raw international number without any + prefix (e.g. `viber://chat?number=37367200463`).

**How to apply:** Always strip non-digits first, then pass as-is. Phone stored in store is already international digits (e.g. "37367200463"). Never prepend + or %2B.
