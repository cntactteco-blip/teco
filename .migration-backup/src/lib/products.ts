export type ProductCategory = "wifi" | "poe" | "4g" | "nvr" | "kituri" | "alarme";

export interface Product {
  id: number;
  name: string;
  model: string;
  brand: string;
  price: number;
  oldPrice: number | null;
  specs: string;
  badge: string | null;
  category: ProductCategory;
  imageType: "indoor" | "outdoor-bullet" | "outdoor-dome" | "ptz" | "battery" | "nvr" | "kit" | "alarm" | "color";
  icon: string;
  description?: string;
}

// USD × 18 MDL = retail MDL price (MSRP from pricelist)
export const products: Product[] = [
  // ─── CAMERE WIFI ───────────────────────────────────────────────
  {
    id: 1, model: "Tapo C100", brand: "TP-Link Tapo",
    name: "Cameră Wireless Interior 1080P",
    price: 450, oldPrice: 520,
    specs: "1080P | WiFi 2.4GHz | IR 12m | Detecție Persoane",
    badge: "PROMO", category: "wifi", imageType: "indoor", icon: "Camera",
    description: "Cameră simplă și accesibilă pentru interior. Detecție mișcare, notificări push, stocare MicroSD.",
  },
  {
    id: 2, model: "Tapo C210", brand: "TP-Link Tapo",
    name: "Cameră Pan/Tilt 2K Interior WiFi",
    price: 540, oldPrice: null,
    specs: "2K 2304×1296 | Pan 360° | IR 9m | 2-Way Audio",
    badge: null, category: "wifi", imageType: "ptz", icon: "Camera",
    description: "Cameră rotativă 360° pentru supravegherea completă a camerei. Urmărire automată mișcare.",
  },
  {
    id: 3, model: "Tapo C310", brand: "TP-Link Tapo",
    name: "Cameră Exterior 2K WiFi IP66",
    price: 810, oldPrice: null,
    specs: "2K | WiFi | IR 30m | IP66 | Detecție AI",
    badge: null, category: "wifi", imageType: "outdoor-bullet", icon: "Camera",
    description: "Protecție IP66 pentru exterior. Vedere nocturnă 30m, detecție inteligentă persoane/vehicule.",
  },
  {
    id: 4, model: "Tapo C320WS", brand: "TP-Link Tapo",
    name: "Cameră Exterior 2K Color Night Vision",
    price: 840, oldPrice: null,
    specs: "2K QHD | Color Night Vision | WiFi | IP66 | IR 30m",
    badge: "COLOR NV", category: "wifi", imageType: "color", icon: "Camera",
    description: "Viziune nocturnă color fără infraroșu clasic. Imagine colorată chiar și pe timp de noapte.",
  },
  {
    id: 5, model: "Uho-S2E-M4", brand: "Uniarch",
    name: "Cameră Interior 4MP WiFi 2× Zoom",
    price: 940, oldPrice: null,
    specs: "4MP | Ultra 265 | WiFi | Zoom 2× | IR 10m | MicroSD",
    badge: null, category: "wifi", imageType: "indoor", icon: "Camera",
    description: "Cameră inteligentă indoor cu zoom 2× și taler flexibil 360°. Detecție umană și urmărire.",
  },
  {
    id: 6, model: "Uho-B2D-M5F3D", brand: "Uniarch",
    name: "Cameră Exterior 5MP WiFi Dual-Light",
    price: 1080, oldPrice: null,
    specs: "5MP | Dual-Light IR+White | WiFi | IP67 | DC12V",
    badge: null, category: "wifi", imageType: "outdoor-bullet", icon: "Camera",
    description: "Dual-Light: IR infraroșu 20m + lumină albă 10m. Detecție persoane, vehicule și audio.",
  },
  {
    id: 7, model: "Reolink Argus Eco", brand: "Reolink",
    name: "Cameră Wireless Acumulator 3MP IP65",
    price: 1510, oldPrice: 1650,
    specs: "3MP | Acumulator 5200mAh | WiFi | PIR | IP65 | MicroSD",
    badge: "PROMO", category: "wifi", imageType: "battery", icon: "Camera",
    description: "Fără cabluri — se montează oriunde! Acumulator 5200mAh, compatibil panou solar Reolink.",
  },
  {
    id: 8, model: "Argus B340", brand: "Reolink",
    name: "Cameră 5MP Color NV Acumulator WiFi",
    price: 2230, oldPrice: null,
    specs: "5MP 2K+ | Color Night Vision | WiFi 5GHz | IP66 | PIR",
    badge: "COLOR NV", category: "wifi", imageType: "battery", icon: "Camera",
    description: "5MP cu viziune nocturnă color și iluminare LED 6500K. WiFi dual-band, IP66.",
  },

  // ─── CAMERE POE (WIRED) ─────────────────────────────────────────
  {
    id: 9, model: "VIGI C440I(2.8mm)", brand: "TP-Link VIGI",
    name: "Cameră Turret 4MP PoE Detecție AI",
    price: 1030, oldPrice: null,
    specs: "4MP | PoE | AI Smart Detection | IR 30m | ONVIF",
    badge: null, category: "poe", imageType: "outdoor-dome", icon: "Camera",
    description: "Cameră business 4MP cu detecție AI: persoană/vehicul, tripwire, intruziune. PoE, ONVIF.",
  },
  {
    id: 10, model: "VIGI C240(2.8mm)", brand: "TP-Link VIGI",
    name: "Cameră Dome 4MP Full-Color PoE",
    price: 1300, oldPrice: null,
    specs: "4MP | Full-Color 24/7 | PoE | IR+White | IK10 | IP67",
    badge: "COLOR 24/7", category: "poe", imageType: "color", icon: "Camera",
    description: "Imagine color completă zi și noapte. IK10 rezistent la vandalism, IP67 impermeabilă.",
  },
  {
    id: 11, model: "VIGI C340(2.8mm)", brand: "TP-Link VIGI",
    name: "Cameră Bullet Exterior 4MP Full-Color PoE",
    price: 1300, oldPrice: null,
    specs: "4MP | Full-Color | PoE | IP66 | Active Defense | MicroSD",
    badge: null, category: "poe", imageType: "outdoor-bullet", icon: "Camera",
    description: "Bullet exterior cu apărare activă (alarmă sonoră + lumină). Full-Color, stocare locală.",
  },
  {
    id: 12, model: "TC-C34XN I3/E/Y/2.8mm", brand: "Tiandy",
    name: "Cameră Dome 4MP S+265 PoE",
    price: 990, oldPrice: null,
    specs: "4MP | S+265 | PoE | IR 30m | IP66 | -35°C~65°C",
    badge: null, category: "poe", imageType: "outdoor-dome", icon: "Camera",
    description: "Cameră robustă pentru condiții extreme (-35°C). S+265 reduce spațiul HDD cu 80%.",
  },
  {
    id: 13, model: "TC-C34KS I3/E/Y/C/SD/2.8mm", brand: "Tiandy",
    name: "Cameră 4MP Color Night Vision IK10 PoE",
    price: 1530, oldPrice: null,
    specs: "4MP | Color 0.002Lux | PoE | IP66+IK10 | MicroSD | S+265",
    badge: "COLOR NV", category: "poe", imageType: "color", icon: "Camera",
    description: "Viziune color la 0.002 Lux. IK10 anti-vandal, MicroSD, tripwire/perimeter analytics.",
  },
  {
    id: 14, model: "TC-C35PS I3/E/Y/M/H/2.8mm", brand: "Tiandy",
    name: "Cameră 5MP AI Pro PoE StarLight",
    price: 2800, oldPrice: 3100,
    specs: "5MP | AI Human/Vehicle | PoE | IP67 | -40°C~65°C | MicroSD",
    badge: "AI PRO", category: "poe", imageType: "outdoor-dome", icon: "Camera",
    description: "5MP cu AI avansat: clasificare om/vehicul, tripwire, perimetru. Rezistență militară -40°C.",
  },
  {
    id: 15, model: "IPC3614LB-SF28-A", brand: "Uniview",
    name: "Cameră IP 4MP Ultra 265 Easy Series",
    price: 1010, oldPrice: null,
    specs: "4MP | Ultra 265 | PoE | IR 30m | IP67 | 3-Axis",
    badge: null, category: "poe", imageType: "outdoor-dome", icon: "Camera",
    description: "Cameră IP profesională cu codec Ultra 265. Montaj flexibil 3-axis, IP67 waterproof.",
  },
  {
    id: 16, model: "IPC3612LB-AF28K-WL", brand: "Uniview",
    name: "Cameră 2MP ColorHunter Full-Color Night",
    price: 900, oldPrice: null,
    specs: "2MP | ColorHunter 0.005Lux | Ultra 265 | PoE | IP67",
    badge: "COLOR HUNTER", category: "poe", imageType: "color", icon: "Camera",
    description: "ColorHunter: imagine color chiar și la 0.005 Lux. Lumină albă integrată 30m.",
  },
  {
    id: 17, model: "IPC3614LE-ADF28K-G", brand: "Uniview",
    name: "Cameră 4MP EasyStar 0.003Lux PoE",
    price: 1800, oldPrice: null,
    specs: "4MP | EasyStar 0.003Lux | Ultra 265 | PoE | IP67 | MicroSD",
    badge: "LOW LIGHT", category: "poe", imageType: "outdoor-dome", icon: "Camera",
    description: "Vedere nocturnă superioară la 0.003 Lux. MicroSD slot integrat, microfon încorporat.",
  },

  // ─── CAMERE 4G / SOLAR ─────────────────────────────────────────
  {
    id: 18, model: "Reolink Go Plus", brand: "Reolink",
    name: "Cameră 4G LTE 4MP Acumulator Solar",
    price: 3690, oldPrice: null,
    specs: "4MP 2K | 4G LTE | Acumulator 7800mAh | PIR 120° | IP65",
    badge: "4G SOLAR", category: "4g", imageType: "battery", icon: "Camera",
    description: "Fără WiFi, fără curent! 4G LTE + acumulator 7800mAh, compatibil panou solar. Ideal teren/câmp.",
  },
  {
    id: 19, model: "Reolink Go Ultra", brand: "Reolink",
    name: "Cameră 4G LTE 4K 8MP Acumulator",
    price: 4230, oldPrice: null,
    specs: "4K 8MP | 4G LTE | Acumulator 7800mAh | PIR | IP65",
    badge: "4K", category: "4g", imageType: "battery", icon: "Camera",
    description: "Rezoluție 4K maximă fără cabluri. Ideal pentru terenuri agricole, șantiere, proprietăți izolate.",
  },
  {
    id: 20, model: "Reolink TrackMix LTE", brand: "Reolink",
    name: "Cameră 4G Dual-View Urmărire Automată",
    price: 6200, oldPrice: null,
    specs: "4MP 2K | 4G | Zoom Hibrid 6× | Dual View | Tracking Auto",
    badge: "DUAL VIEW", category: "4g", imageType: "ptz", icon: "Camera",
    description: "Vizualizare duală simultană și urmărire automată avansată. Zoom hibrid 6×, proiector LED 450lm.",
  },

  // ─── NVR-URI ────────────────────────────────────────────────────
  {
    id: 21, model: "NVR301-04LS2", brand: "Uniview",
    name: "NVR 4 Canale Ultra 265 1× HDD",
    price: 1700, oldPrice: null,
    specs: "4CH | Ultra 265 | 1× HDD (max 6TB) | HDMI | VGA | ONVIF",
    badge: null, category: "nvr", imageType: "nvr", icon: "Server",
    description: "NVR compact pentru 4 camere IP. Suportă rezoluție până la 8MP (4K). Plug & Play PoE.",
  },
  {
    id: 22, model: "NVR301-08LS2", brand: "Uniview",
    name: "NVR 8 Canale Ultra 265 1× HDD",
    price: 1930, oldPrice: null,
    specs: "8CH | Ultra 265 | 1× HDD (max 6TB) | HDMI | VGA | ONVIF",
    badge: null, category: "nvr", imageType: "nvr", icon: "Server",
    description: "NVR pentru 8 camere IP. Înregistrare continuă, Motion Detection, acces remote.",
  },
  {
    id: 23, model: "NVR301-16S3", brand: "Uniview",
    name: "NVR 16 Canale Ultra 265 2× HDD",
    price: 2740, oldPrice: null,
    specs: "16CH | Ultra 265 | 2× HDD (max 12TB) | 4K Output | HDMI",
    badge: "POPULAR", category: "nvr", imageType: "nvr", icon: "Server",
    description: "NVR 16 canale cu ieșire 4K. Suportă 2 HDD-uri pentru stocare extinsă până la 12TB.",
  },
  {
    id: 24, model: "NVR302-16B-IQ", brand: "Uniview",
    name: "NVR 16 Canale AI Smart Detection",
    price: 4150, oldPrice: null,
    specs: "16CH | AI SMD | Ultra 265 | 2× HDD | 4K | HDMI | IP SAN",
    badge: "AI SMART", category: "nvr", imageType: "nvr", icon: "Server",
    description: "NVR cu AI integrat: Smart Motion Detection, clasificare om/vehicul, analiză inteligentă.",
  },

  // ─── KITURI COMPLETE ───────────────────────────────────────────
  {
    id: 25, model: "Kit Teco 4 Cam PoE", brand: "Teco.md",
    name: "Kit Complet 4 Camere PoE + NVR + HDD",
    price: 6800, oldPrice: null,
    specs: "4× Camera 4MP | NVR 8CH | HDD 1TB | Cabluri incluse | Instalare",
    badge: "KIT COMPLET", category: "kituri", imageType: "kit", icon: "Camera",
    description: "Kit gata de instalat: 4 camere PoE exterior + NVR 8 canale + HDD 1TB preinstalat.",
  },
  {
    id: 26, model: "Kit Teco Pro-Solar", brand: "Teco.md",
    name: "Kit Complet Pro-Solar 4G 4 Camere",
    price: 8900, oldPrice: null,
    specs: "4× Camera 5MP | Solar Panel | 4G | NVR Cloud | Fără Cabluri",
    badge: "BEST SELLER", category: "kituri", imageType: "kit", icon: "Camera",
    description: "Sistemul complet fără cabluri și fără internet local. Energie solară, transmisie 4G.",
  },

  // ─── SISTEME ALARMA ─────────────────────────────────────────────
  {
    id: 27, model: "Ajax StarterKit", brand: "Ajax Systems",
    name: "Sistem Alarma Wireless Ajax Starter",
    price: 5200, oldPrice: null,
    specs: "Hub | MotionProtect | DoorProtect | SpaceControl | LAN+WiFi",
    badge: null, category: "alarme", imageType: "alarm", icon: "Shield",
    description: "Cel mai popular kit Ajax. Control prin app, alertă GSM/LAN, compatibil cu camere CCTV.",
  },
];

export type { Product as ProductType };
export default products;
