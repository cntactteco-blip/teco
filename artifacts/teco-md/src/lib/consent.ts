// ─── Consent Manager — Legea nr. 133/2011 Moldova + GDPR ──────────────────
// Gestionează consimțământul utilizatorului pentru prelucrarea datelor personale
// și pentru cookie-uri non-esențiale (analytics, marketing).

export type ConsentChoice = {
  version: number;
  timestamp: string;
  essential: true;        // întotdeauna true — cookie-uri tehnice
  analytics: boolean;     // Google Analytics, session tracking
  marketing: boolean;     // Facebook Pixel, remarketing
};

const STORAGE_KEY = "teco_cookie_consent";
const CONSENT_VERSION = 1;

/** Citește consimțământul salvat (sau null dacă nu a ales încă) */
export function getConsent(): ConsentChoice | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ConsentChoice;
    if (parsed.version !== CONSENT_VERSION) return null;
    return parsed;
  } catch { return null; }
}

/** Salvează consimțământul și notifică subscriberii */
export function saveConsent(choice: Omit<ConsentChoice, "version" | "timestamp" | "essential">): void {
  const consent: ConsentChoice = {
    version: CONSENT_VERSION,
    timestamp: new Date().toISOString(),
    essential: true,
    analytics: choice.analytics,
    marketing: choice.marketing,
  };
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(consent)); } catch {}
  // Notifică toți subscriberii
  window.dispatchEvent(new CustomEvent("teco_consent_updated", { detail: consent }));
}

/** Accept toate categoriile */
export function acceptAll(): void {
  saveConsent({ analytics: true, marketing: true });
}

/** Respinge toate cookie-urile non-esențiale */
export function acceptEssentialOnly(): void {
  saveConsent({ analytics: false, marketing: false });
}

/** Verifică dacă analytics e permis */
export function isAnalyticsAllowed(): boolean {
  return getConsent()?.analytics === true;
}

/** Verifică dacă marketing e permis */
export function isMarketingAllowed(): boolean {
  return getConsent()?.marketing === true;
}

/** A ales utilizatorul deja? */
export function hasConsented(): boolean {
  return getConsent() !== null;
}
