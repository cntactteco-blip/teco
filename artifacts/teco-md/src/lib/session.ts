// ─── Session Tracker ─────────────────────────────────────────────────
// Trackează sesiunea curentă a vizitatorului: pagini vizitate, sursă, geolocație.

export interface PageVisit {
  path: string;
  title: string;
  ts: number;
}

export interface SessionData {
  sessionId: string;
  startedAt: number;
  pages: PageVisit[];
  referrer: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  country: string;
  city: string;
  isp: string;
  deviceType: "mobile" | "tablet" | "desktop";
  browser: string;
}

let _session: SessionData | null = null;
let _initPromise: Promise<SessionData> | null = null;

function genId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

function getSessionId(): string {
  try {
    let id = sessionStorage.getItem("teco_sid");
    if (!id) { id = genId(); sessionStorage.setItem("teco_sid", id); }
    return id;
  } catch {
    return genId();
  }
}

function detectDevice(): "mobile" | "tablet" | "desktop" {
  const ua = navigator.userAgent;
  if (/tablet|ipad/i.test(ua)) return "tablet";
  if (/mobile|android|iphone|ipod/i.test(ua)) return "mobile";
  return "desktop";
}

function detectBrowser(): string {
  const ua = navigator.userAgent;
  if (/OPR\//.test(ua)) return "Opera";
  if (/Edge\/|Edg\//.test(ua)) return "Edge";
  if (/Chrome\//.test(ua)) return "Chrome";
  if (/Firefox\//.test(ua)) return "Firefox";
  if (/Safari\//.test(ua)) return "Safari";
  return "Other";
}

async function fetchGeo(): Promise<{ country: string; city: string; isp: string }> {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 4000);
    const res = await fetch("https://ip-api.com/json/?fields=country,city,isp", { signal: ctrl.signal });
    clearTimeout(timer);
    const d = await res.json() as { country?: string; city?: string; isp?: string };
    return { country: d.country || "", city: d.city || "", isp: d.isp || "" };
  } catch {
    return { country: "", city: "", isp: "" };
  }
}

/** Inițializează sesiunea (o singură dată) și returnează SessionData */
export async function initSession(): Promise<SessionData> {
  if (_session) return _session;
  if (_initPromise) return _initPromise;

  _initPromise = (async () => {
    const params = new URLSearchParams(window.location.search);
    const geo = await fetchGeo();

    _session = {
      sessionId: getSessionId(),
      startedAt: Date.now(),
      pages: [],
      referrer: document.referrer,
      utmSource: params.get("utm_source") || "",
      utmMedium: params.get("utm_medium") || "",
      utmCampaign: params.get("utm_campaign") || "",
      country: geo.country,
      city: geo.city,
      isp: geo.isp,
      deviceType: detectDevice(),
      browser: detectBrowser(),
    };

    return _session;
  })();

  return _initPromise;
}

/** Înregistrează o pagină vizitată */
export function trackPage(path: string, title?: string): void {
  if (!_session) return;
  // Evită duplicarea paginii curente consecutiv
  const last = _session.pages[_session.pages.length - 1];
  if (last?.path === path) return;
  _session.pages.push({ path, title: title || document.title || path, ts: Date.now() });
}

/** Returnează sesiunea curentă (sau null dacă nu e inițializată) */
export function getSession(): SessionData | null {
  return _session;
}

/** Returnează durata sesiunii în secunde */
export function sessionDuration(): number {
  if (!_session) return 0;
  return Math.round((Date.now() - _session.startedAt) / 1000);
}

/** Returnează sesiunea ca obiect simplu pentru trimitere la API */
export function getSessionPayload(): SessionData & { duration: number } {
  const s = _session ?? {
    sessionId: "",
    startedAt: Date.now(),
    pages: [],
    referrer: document.referrer,
    utmSource: "",
    utmMedium: "",
    utmCampaign: "",
    country: "",
    city: "",
    isp: "",
    deviceType: detectDevice(),
    browser: detectBrowser(),
  };
  return { ...s, duration: sessionDuration() };
}
