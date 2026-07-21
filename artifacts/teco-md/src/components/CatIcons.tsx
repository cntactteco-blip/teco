// Iconițe custom pentru categorii — desenate ca produsele reale
// Stil: linie subțire (stroke), fără fill, viewBox 0 0 24 24

type IconProps = { className?: string };

/** Cameră WiFi — corp bullet horizontal, lentilă, antene WiFi */
export function IconCameraWifi({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"
      strokeLinecap="round" strokeLinejoin="round" className={className}>
      {/* Corp cameră */}
      <rect x="1" y="9" width="14" height="8" rx="2" />
      {/* Lentilă exterior + interior */}
      <circle cx="5.5" cy="13" r="2.5" />
      <circle cx="5.5" cy="13" r="1" />
      {/* Suport / braț montare */}
      <path d="M15 10.5 L18 7.5 L20 7.5" />
      <path d="M15 15.5 L18 18.5 L20 18.5" />
      <line x1="20" y1="7.5" x2="20" y2="18.5" />
      {/* Semnale WiFi */}
      <path d="M21.5 10 a3 3 0 0 1 0 4" />
      <path d="M22.5 8 a5 5 0 0 1 0 8" strokeWidth="1.2" />
    </svg>
  );
}

/** Cameră 4G — bullet cu antene celulare */
export function IconCamera4G({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"
      strokeLinecap="round" strokeLinejoin="round" className={className}>
      {/* Corp cameră */}
      <rect x="1" y="9" width="14" height="8" rx="2" />
      {/* Lentilă */}
      <circle cx="5.5" cy="13" r="2.5" />
      <circle cx="5.5" cy="13" r="1" />
      {/* Braț montare */}
      <path d="M15 10.5 L18 8 L20 8 L20 18 L18 18 L15 15.5" />
      {/* Bare semnal 4G */}
      <line x1="21" y1="18" x2="21" y2="15" />
      <line x1="22.5" y1="18" x2="22.5" y2="13" />
      <line x1="24" y1="18" x2="24" y2="11" strokeWidth="1.4" />
      {/* Punct semnal */}
      <circle cx="24" cy="9.5" r="0.8" fill="currentColor" stroke="none" />
    </svg>
  );
}

/** Cameră PoE — bullet cu conector RJ45 */
export function IconCameraPoE({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"
      strokeLinecap="round" strokeLinejoin="round" className={className}>
      {/* Corp cameră */}
      <rect x="3" y="9" width="14" height="8" rx="2" />
      {/* Lentilă */}
      <circle cx="7.5" cy="13" r="2.5" />
      <circle cx="7.5" cy="13" r="1" />
      {/* Suport sus */}
      <path d="M10 9 L10 6 L14 6" />
      {/* Conector RJ45 la spate */}
      <rect x="17" y="11" width="5" height="4" rx="0.8" />
      {/* Pini RJ45 */}
      <line x1="18.2" y1="11" x2="18.2" y2="9.5" />
      <line x1="19.5" y1="11" x2="19.5" y2="9.5" />
      <line x1="20.8" y1="11" x2="20.8" y2="9.5" />
      {/* Cablu */}
      <path d="M22 13 L23.5 13" />
    </svg>
  );
}

/** Kit Complet — NVR box + 2 camere deasupra */
export function IconKit({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"
      strokeLinecap="round" strokeLinejoin="round" className={className}>
      {/* NVR box */}
      <rect x="2" y="15" width="20" height="7" rx="1.5" />
      {/* LED NVR */}
      <circle cx="5" cy="18.5" r="0.8" fill="currentColor" stroke="none" />
      {/* Sloturi HDD */}
      <line x1="8" y1="16.5" x2="8" y2="20.5" />
      <line x1="12" y1="16.5" x2="12" y2="20.5" />
      {/* Cameră stânga */}
      <rect x="2" y="8" width="7" height="5" rx="1.2" />
      <circle cx="4.5" cy="10.5" r="1.3" />
      {/* Cameră dreapta */}
      <rect x="15" y="8" width="7" height="5" rx="1.2" />
      <circle cx="19.5" cy="10.5" r="1.3" />
      {/* Fire de la camere la NVR */}
      <line x1="5.5" y1="13" x2="7" y2="15" />
      <line x1="18.5" y1="13" x2="17" y2="15" />
    </svg>
  );
}

/** NVR-uri — recorder cu sloturi HDD și porturi față */
export function IconNVR({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"
      strokeLinecap="round" strokeLinejoin="round" className={className}>
      {/* Carcasă NVR */}
      <rect x="1" y="7" width="22" height="10" rx="1.5" />
      {/* Panou față — butoane/porturi stânga */}
      <circle cx="4" cy="12" r="1.2" />
      <line x1="3" y1="9.5" x2="3" y2="10.5" />
      {/* Sloturi HDD — 3 sloturi principale */}
      <rect x="7" y="9" width="5" height="6" rx="0.8" />
      <rect x="13.5" y="9" width="5" height="6" rx="0.8" />
      {/* Disc în slot */}
      <circle cx="9.5" cy="12" r="1.5" />
      <circle cx="16" cy="12" r="1.5" />
      {/* Cablu alimentare spate */}
      <line x1="23" y1="11" x2="23" y2="13" />
    </svg>
  );
}

/** Sisteme Alarmă — detector PIR + val de mișcare */
export function IconAlarma({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"
      strokeLinecap="round" strokeLinejoin="round" className={className}>
      {/* Corp detector PIR — dreptunghi rotunjit cu capac dom */}
      <rect x="6" y="12" width="12" height="9" rx="1.5" />
      {/* Domul PIR deasupra */}
      <path d="M7 12 Q12 5 17 12" />
      {/* Ochi PIR */}
      <ellipse cx="12" cy="15" rx="2.5" ry="1.5" />
      {/* Picioare montare */}
      <line x1="9" y1="21" x2="9" y2="23" />
      <line x1="15" y1="21" x2="15" y2="23" />
      {/* Val de detecție mișcare stânga */}
      <path d="M4 10 Q2 13 4 16" strokeWidth="1.3" />
      <path d="M2.5 8.5 Q0 13 2.5 17.5" strokeWidth="1" />
      {/* Val dreapta */}
      <path d="M20 10 Q22 13 20 16" strokeWidth="1.3" />
      <path d="M21.5 8.5 Q24 13 21.5 17.5" strokeWidth="1" />
    </svg>
  );
}

/** Stocare Date — hard disk intern cu platane */
export function IconHDD({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"
      strokeLinecap="round" strokeLinejoin="round" className={className}>
      {/* Carcasă HDD */}
      <rect x="2" y="5" width="20" height="14" rx="2" />
      {/* Platou principal — cerc mare */}
      <circle cx="12" cy="12" r="5" />
      {/* Fus central */}
      <circle cx="12" cy="12" r="1.5" />
      {/* Capul de citire */}
      <line x1="15.5" y1="8.5" x2="13" y2="11.5" strokeWidth="1.8" />
      <circle cx="15.5" cy="8.5" r="0.7" fill="currentColor" stroke="none" />
      {/* Șurub colț */}
      <circle cx="4.5" cy="7.5" r="0.8" />
      <circle cx="19.5" cy="7.5" r="0.8" />
      <circle cx="4.5" cy="16.5" r="0.8" />
      <circle cx="19.5" cy="16.5" r="0.8" />
    </svg>
  );
}

/** Interfoane — panou interfon cu lentilă, difuzor, buton */
export function IconInterfon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"
      strokeLinecap="round" strokeLinejoin="round" className={className}>
      {/* Corp panou interfon */}
      <rect x="6" y="2" width="12" height="20" rx="2" />
      {/* Camera / lentilă sus */}
      <circle cx="12" cy="6.5" r="2" />
      <circle cx="12" cy="6.5" r="0.8" />
      {/* Difuzor — linii orizontale */}
      <line x1="9" y1="11" x2="15" y2="11" />
      <line x1="9" y1="13" x2="15" y2="13" />
      <line x1="9" y1="15" x2="15" y2="15" />
      {/* Buton apel */}
      <circle cx="12" cy="19" r="1.8" />
    </svg>
  );
}

/** Selectează iconița corectă după slug-ul categoriei */
export function CatSvgIcon({ slug, className }: { slug: string; className?: string }) {
  const s = slug.toLowerCase();
  if (s.includes("wifi") || (s.includes("camer") && !s.includes("4g") && !s.includes("poe")))
    return <IconCameraWifi className={className} />;
  if (s.includes("4g") || s.includes("lte"))
    return <IconCamera4G className={className} />;
  if (s.includes("poe") || s.includes("bulevar") || s.includes("exterior"))
    return <IconCameraPoE className={className} />;
  if (s.includes("kit") || s.includes("bundle") || s.includes("complet") || s.includes("set"))
    return <IconKit className={className} />;
  if (s.includes("nvr") || s.includes("recorder") || s.includes("dvr"))
    return <IconNVR className={className} />;
  if (s.includes("alarm") || s.includes("securit") || s.includes("pir"))
    return <IconAlarma className={className} />;
  if (s.includes("stocare") || s.includes("hdd") || s.includes("storage"))
    return <IconHDD className={className} />;
  if (s.includes("interfon") || s.includes("intercom") || s.includes("videofon") || s.includes("sonerie"))
    return <IconInterfon className={className} />;
  // fallback: cameră WiFi
  return <IconCameraWifi className={className} />;
}
