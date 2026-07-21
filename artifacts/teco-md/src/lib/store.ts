import { useSyncExternalStore, useMemo, useRef } from "react";
import _snapshot from "./catalog-snapshot.json";
import { products as seedProducts } from "./products";

// ─── Types ─────────────────────────────────────────────────────────
export interface StoreProduct {
  id: number;
  name: string;
  model: string;
  brand: string;
  price: number;
  oldPrice: number | null;
  specs: string;
  badge: string | null;
  category: string;
  imageUrl: string;
  images?: string[];
  description: string;
  longDescription?: string;
  techSpecs?: string;
  inStock: boolean;
  icon: string;
}

export interface Lead {
  id: string;
  name: string;
  phone: string;
  source: string;
  timestamp: string;
  status: "new" | "contacted" | "converted";
  notes?: string;
  selections?: Record<string, string>;
}

export interface Order {
  id: string;
  customer: { name: string; phone: string; email: string; address: string; delivery: string };
  items: Array<{ id: number; name: string; price: number; qty: number }>;
  total: number;
  timestamp: string;
  status: "new" | "confirmed" | "delivered";
}

export interface CategoryDef {
  id: string;
  slug: string;
  label: string;
  labelRu?: string;
  image?: string;
  iconKey?: string; // cheie iconița din CatIcons (ex: "cctv-wifi", "nvr", "alarm")
}

export interface GalleryItem {
  id: string;
  imageUrl: string;
  title?: string;
  location?: string;
}

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  titleRu?: string;
  description: string;
  descriptionRu?: string;
  content: string;
  contentRu?: string;
  imageUrl?: string;
  category?: string;
  categoryRu?: string;
  publishedAt: string;
  updatedAt?: string;
  author?: string;
  metaTitle?: string;
  metaTitleRu?: string;
  metaDescription?: string;
  metaDescriptionRu?: string;
  keywords?: string;
  keywordsRu?: string;
  published: boolean;
  readingTime?: number;
}

export interface ModuleSettings {
  general: {
    adminPhone: string;
    announcementText: string;
    adminPin?: string;
  };
  staticPages?: Record<string, string>;
  homeText?: {
    ro: Record<string, string>;
    ru: Record<string, string>;
  };
  hero: {
    productId: number | null;
    heroProducts?: number[];
    bannerMedia?: string;
    bannerMediaType?: "image" | "video";
  };
  moduleA: {
    productId: number | null;
    bannerImage?: string;
  };
  moduleB: { productId: number | null; imageLeft: string; imageRight: string };
  moduleC: {
    TAPO: number | null; REOLINK: number | null; UNIARCH: number | null;
    DAHUA: number | null; UNIVIEW: number | null; TIANDY: number | null;
  };
  moduleComparatorImages?: {
    TAPO?: string; REOLINK?: string; UNIARCH?: string;
    DAHUA?: string; UNIVIEW?: string; TIANDY?: string;
  };
  moduleTripwire?: {
    bgImage?: string;
    cardImage?: string;
    productId?: number | null;
  };
  categories: CategoryDef[];
  storeInfo: {
    name: string;
    address: string;
    email: string;
    phone2: string;
    city: string;
    workingHours: string;
  };
  social: {
    facebook: string;
    instagram: string;
    tiktok: string;
    googleReviews: string;
  };
  delivery: {
    freeThreshold: number;
    price: number;
  };
  servicePrices?: {
    montaj?: string;
    diagnosticare?: string;
    reparatii?: string;
  };
  gallery?: GalleryItem[];
}

export interface UserReview {
  id: string;
  productId: number;
  name: string;
  rating: number;
  text: string;
  date: string;
  helpful: number;
}

export interface StoreState {
  products: StoreProduct[];
  leads: Lead[];
  orders: Order[];
  blogPosts: BlogPost[];
  settings: ModuleSettings;
  userReviews: Record<number, UserReview[]>;
  loaded: boolean;
}

// ─── Image seed map ─────────────────────────────────────────────────
const IMAGE_SEED: Record<string, string> = {
  indoor:           "https://images.unsplash.com/photo-1562813733-b31f71025d54?w=400&q=80&auto=format&fit=crop",
  "outdoor-bullet": "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=400&q=80&auto=format&fit=crop",
  "outdoor-dome":   "https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=400&q=80&auto=format&fit=crop",
  ptz:              "https://images.unsplash.com/photo-1616763355548-1b606f439f86?w=400&q=80&auto=format&fit=crop",
  battery:          "https://images.unsplash.com/photo-1625378760232-c44f6d1e74dd?w=400&q=80&auto=format&fit=crop",
  color:            "https://images.unsplash.com/photo-1510511459019-5dda7724fd87?w=400&q=80&auto=format&fit=crop",
  nvr:              "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=400&q=80&auto=format&fit=crop",
  kit:              "https://images.unsplash.com/photo-1558002038-1055907df827?w=400&q=80&auto=format&fit=crop",
  alarm:            "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80&auto=format&fit=crop",
};

export const DEFAULT_CATEGORIES: CategoryDef[] = [
  { id: "wifi",   slug: "wifi",   label: "Camere WiFi",     labelRu: "WiFi Камеры",       image: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=500&q=80&auto=format&fit=crop" },
  { id: "poe",    slug: "poe",    label: "Camere PoE",      labelRu: "PoE Камеры",        image: "https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=500&q=80&auto=format&fit=crop" },
  { id: "4g",     slug: "4g",     label: "Camere 4G",       labelRu: "4G Камеры",         image: "https://images.unsplash.com/photo-1625378760232-c44f6d1e74dd?w=500&q=80&auto=format&fit=crop" },
  { id: "nvr",    slug: "nvr",    label: "NVR-uri",         labelRu: "NVR Регистраторы",  image: "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=500&q=80&auto=format&fit=crop" },
  { id: "kituri", slug: "kituri", label: "Kituri Complete", labelRu: "Комплекты",         image: "https://images.unsplash.com/photo-1558002038-1055907df827?w=500&q=80&auto=format&fit=crop" },
  { id: "alarme", slug: "alarme", label: "Sisteme Alarmă",  labelRu: "Системы Охраны",   image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500&q=80&auto=format&fit=crop" },
];

const DEFAULT_SETTINGS: ModuleSettings = {
  general: { adminPhone: "37367200463", announcementText: "", adminPin: "" },
  hero: { productId: 116, heroProducts: [116] },
  moduleA: { productId: 25 },
  moduleB: {
    productId: 16,
    imageLeft:  "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=960&q=85&auto=format&fit=crop",
    imageRight: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=960&q=85&auto=format&fit=crop",
  },
  moduleC: { TAPO: 3, REOLINK: 7, UNIARCH: 5, DAHUA: null, UNIVIEW: 16, TIANDY: 12 },
  moduleComparatorImages: {},
  moduleTripwire: { bgImage: "", cardImage: "", productId: null },
  categories: DEFAULT_CATEGORIES,
  storeInfo: {
    name: "TECO.MD",
    address: "",
    email: "",
    phone2: "",
    city: "Chișinău, Moldova",
    workingHours: "Lun–Vin 9:00–18:00, Sâm 10:00–15:00",
  },
  social: { facebook: "", instagram: "", tiktok: "", googleReviews: "" },
  delivery: { freeThreshold: 5000, price: 150 },
  servicePrices: {
    montaj: "de la 750 MDL/cameră",
    diagnosticare: "de la 350 MDL/vizită",
    reparatii: "de la 400 MDL",
  },
  gallery: [],
};

// ─── Store singleton ────────────────────────────────────────────────
const DEFAULT_BLOG_POSTS: BlogPost[] = [
  {
    id: "blog-1",
    slug: "cum-sa-alegi-sistem-supraveghere-casa-2026",
    title: "Cum să alegi sistemul de supraveghere perfect pentru casa ta în 2026",
    titleRu: "Как выбрать перфектную систему видеонаблюдения для дома в 2026 году",
    description: "Ghid complet pentru alegerea camerelor de supraveghere. Încă într-un loc? Știi deja cum funcțează o cameră WiFi vs PoE? Încă într-un loc? Știi deja ce încapă pe un NVR? Iată tot ce trebuie să știi.",
    descriptionRu: "Полное руководство по выбору камер видеонаблюдения. Какой выбрать тип? Как обеспечить ночное видение? Ответы на все вопросы.",
    content: `## De ce ai nevoie de un sistem de supraveghere?

În 2026, securitatea într-o casă sau afacere încetează a fi un lux și devine o necesitate. 
### Camere WiFi — cea mai simplă soluție

Camerele WiFi sunt **ideale pentru utilizatori începători** și pentru cei care nu vor să treagă cabluri.
**Avantaje:**
- Instalare ușoară — nu necesită cabluri
- Acces de la distanță prin aplicație
- Ideal pentru apartamente și case mici

**Dezavantaje:**
- Depinde de rețeaua WiFi
- Bateria se termină mai repede

### Camere PoE — profesional și fiabil

PoE (Power over Ethernet) încarcă camera și transmite date **prin același cablu Ethernet**.

### Ce capacitate NVR ai nevoie?

| NVR canale | Camere suportate | Ideal pentru |
|------------|------------------|-------------|
| 4 canale   | 4 camere         | Casă/apartament |
| 8 canale   | 8 camere         | Casă mare/magazin |
| 16 canale  | 16 camere        | Clădire/afacere mare |
| 32 canale  | 32 camere        | Depozit/fabircă |

### Concluzie

Pentru o casă medie într-o familie, **4 camere + NVR 4 canale** este combinația perfectă.

**Iată ce ne recomandăm:**
- **Camere WiFi:** Tapo C420 (4K) și Reolink Argus 3 Pro
- **Camere PoE:** Uniarch IPC-B1E6 + NVR 4 canale
- **NVR:** Uniarch NVR 4/8/16 canale (recunoaște toate mărcile)

Vrei ajutor? Sună la +373 67 200 463 și un inginer te consiliază GRATUIT.
`,
    contentRu: `## Зачем нужна система видеонаблюдения?

В 2026 году безопасность дома или бизнеса перестает быть роскошью и становится необходимостью.

### WiFi-камеры — самое простое решение

WiFi-камеры идеальны для начинающих и тех, кто не хочет проводить кабели.

### PoE-камеры — профессионально и надежно

PoE (питание через единый кабель) заряжает камеру и передает данные одновременно.

### Заключение

Для среднего дома оптимально: **4 камеры + NVR на 4 канала**.

Звоните по номеру +373 67 200 463 для бесплатной консультации.
`,
    imageUrl: "https://images.unsplash.com/photo-1558002038-1055907df827?w=1200&q=80&auto=format&fit=crop",
    category: "Ghiduri",
    categoryRu: "Руководства",
    publishedAt: "2026-05-15T00:00:00Z",
    author: "Teco.md",
    metaTitle: "Cum să alegi sistemul de supraveghere perfect pentru casa ta în 2026 | Teco.md",
    metaTitleRu: "Как выбрать систему видеонаблюдения для дома 2026 | Teco.md",
    metaDescription: "Ghid complet 2026: cum alegi camere WiFi vs PoE, NVR vs DVR, cu sau fără fir. Recomandări de la inginerii Teco.md.",
    metaDescriptionRu: "Полное руководство 2026: как выбрать WiFi или PoE, NVR или DVR. Рекомендации от инженеров Teco.md.",
    keywords: "cum alegi camere supraveghere, ghid camere video, WiFi vs PoE, NVR vs DVR, sistem supraveghere casă 2026",
    keywordsRu: "как выбрать камеры видеонаблюдения, руководство, WiFi или PoE, NVR или DVR",
    published: true,
    readingTime: 5,
  },
  {
    id: "blog-2",
    slug: "montaj-camere-exterior-chisinau-2026",
    title: "Montaj camere supraveghere exterior în Chișinău și Moldova — Prețuri și Procedură",
    titleRu: "Монтаж уличных камер в Кишиневе и Молдове — Цены и Процедура",
    description: "Tot ce trebuie să știi despre montajul camerelor de supraveghere exterior în 2026. Cât costă, cât durează, ce documente ai nevoie. Ghid complet de la echipa Teco.md.",
    descriptionRu: "Всё, что нужно знать об установке уличных камер в 2026 году. Сколько стоит, сколько длится, какие документы. Полное руководство от команды Teco.md.",
    content: `## Cât costă montajul camerelor de supraveghere?

Prețurile în 2026 pentru montajul profesional al camerelor de supraveghere:

### Prețuri standard

| Serviciu | Preț (MDL) | Durata |
|----------|-------------|--------|
| Instalare 1 cameră | 500-800 | 2-3h |
| Instalare 4 camere + NVR | 2,500-3,500 | 1-2 zile |
| Instalare 8 camere + NVR | 5,000-7,000 | 2-3 zile |
| Cablare structurată (per m) | 25-40 | — |
| Configurare aplicație mobilă | Inclus | — |
| Garanție pe lucrare | 12 luni | — |

### Etapele montajului

1. **Consultație gratuită** — vizităm locația și propunem soluția optimă
2. **Proiectare** — planul de camere, unghiuri, cablare
3. **Montaj** — instalarea fizică și configurare
4. **Testare** — verificăm fiecare cameră, înregistrarea, aplicația
5. **Instruire** — învățăm clientul să folosească sistemul

### Oferim GRATUIT:

- **Livrare** la comenzi > 5,000 MDL
- **Instalare** la orice kit complet
- **Configurare** aplicație mobilă
- **Garanție** 12 luni pe lucrare

### Zone acoperite

Acoperim toată Moldova: Chișinău, Bălți, Orhei, Cahul, Soroca, Ungheni, Strășeni, și toate satele.

**Telefon:** +373 67 200 463
**WhatsApp:** +373 67 200 463
`,
    contentRu: `## Сколько стоит установка уличных камер?

Стоимость в 2026 году:

### Стандартные цены

| Услуга | Цена (лей) | Срок |
|---------|---------------|-------|
| Установка 1 камеры | 500-800 | 2-3 часа |
| Установка 4 камер + NVR | 2,500-3,500 | 1-2 дня |
| Установка 8 камер + NVR | 5,000-7,000 | 2-3 дня |

### Бесплатно:

- Доставка при заказах > 5,000 лей
- Установка любого комплектного набора
- Настройка мобильного приложения

**Телефон:** +373 67 200 463
**WhatsApp:** +373 67 200 463
`,
    imageUrl: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=1200&q=80&auto=format&fit=crop",
    category: "Montaj",
    categoryRu: "Монтаж",
    publishedAt: "2026-04-22T00:00:00Z",
    author: "Teco.md",
    metaTitle: "Montaj camere supraveghere exterior — Prețuri și Procedură 2026 | Teco.md",
    metaTitleRu: "Монтаж уличных камер — Цены и Процедура 2026 | Teco.md",
    metaDescription: "Prețuri montaj camere supraveghere în Moldova 2026. Cât costă, cât durează, ce acoperim. Chișinău, Bălți, Orhei și toată țara.",
    metaDescriptionRu: "Цены установки уличных камер в Молдове 2026. Сколько стоит, какие этапы. Кишинев, Бельцы, Орхей и вся страна.",
    keywords: "montaj camere supraveghere pret, montaj camere video Chisinau, instalare sisteme securitate Moldova, preturi montaj camere 2026",
    keywordsRu: "цена установки камер видеонаблюдения, монтаж в Кишиневе, системы безопасности Молдова",
    published: true,
    readingTime: 4,
  },
  {
    id: "blog-3",
    slug: "camere-4g-solar-fara-fir-moldova-2026",
    title: "Camere 4G cu panou solar — fără fir, fără curent, fără internet acasă",
    titleRu: "4G камеры с солнечной панелью — без проводов, без электроэнергии, без интернета дома",
    description: "Descoperă soluția revoluționară pentru locații izolate: camere 4G cu panou solar. Nu ai curent? Nu ai internet? Nu ai cabluri? Nu e problemă.",
    descriptionRu: "Откройте революционное решение для удаленных объектов: 4G-камеры с солнечной панелью. Нет электроэнергии? Нет интернета? Нет проводов? Нет проблемы.",
    content: `## Camere 4G Solar — cea mai bună soluție pentru locații izolate

🌞 **Panou solar** → 📱 **SIM 4G** → 📺 **Vizualizare de oriunde**

### Cum funcționează?

1. **Panou solar** încarcă bateria în timpul zilei
2. **Baterie Li-Ion** (6000-10000mAh) asigură funcționare 3-5 zile fără soare
3. **SIM 4G/LTE** transmite date pe rețeaua mobilă
4. **Vizualizare** de pe telefon, de oriunde în lume

### Prețuri în 2026

| Model | Preț (MDL) | Autonomie | Rezoluție |
|-------|-----------|-----------|-----------|
| Reolink Go Plus 4G | 3,490 | 3-5 zile | 1080p |
| Reolink Go Ranger PT | 5,490 | 3-5 zile | 4K |
| Reolink Go PT Ultra | 6,490 | 5-7 zile | 4K |

### Unde se pot folosi?

- 🏢 Terenuri agricole și livezi
- 🛣️ Santiere de construcții
- 🏠 Case de vacanță izolate
- 🛣️ Parcări și depozite
- 🛣️ Șantiere și garaje
- 🏠 Ferme și grajduri
- 🌳 Păduri și zone de vânătoare

### Avantaje

- **100% wireless** — fără cabluri
- **100% autonom** — fără curent
- **100% accesibil** — prin 4G
- **Detectare AI** — persoane, mașini, animale
- **Vizualizare nocturnă** — color night vision

**Sună la +373 67 200 463 pentru o consultație gratuită despre camere 4G solar.**
`,
    contentRu: `## 4G Solar камеры — лучшее решение для удаленных объектов

🌞 Солнечная панель → 📱 SIM 4G → 📺 Просмотр отовсюду

### Цены в 2026 году

| Модель | Цена (лей) | Автономия | Разрешение |
|---------|---------------|-----------|------------|
| Reolink Go Plus 4G | 3,490 | 3-5 дней | 1080p |
| Reolink Go Ranger PT | 5,490 | 3-5 дней | 4K |

### Где пользовать

- Сельскохозяйственные угодья
- Стройки
- Дачные дома
- Парковки и склады

**Звоните +373 67 200 463 для бесплатной консультации.**
`,
    imageUrl: "https://images.unsplash.com/photo-1625378760232-c44f6d1e74dd?w=1200&q=80&auto=format&fit=crop",
    category: "Produse",
    categoryRu: "Продукты",
    publishedAt: "2026-03-10T00:00:00Z",
    author: "Teco.md",
    metaTitle: "Camere 4G Solar — fără fir, fără curent, fără internet | Teco.md",
    metaTitleRu: "4G Solar камеры — без проводов, без электроэнергии | Teco.md",
    metaDescription: "Camere 4G cu panou solar pentru locații izolate în Moldova. Nu ai curent? Nu ai internet? Fără cabluri? 100% wireless. 2026.",
    metaDescriptionRu: "4G-камеры с солнечной панелью для удаленных объектов в Молдове. 100% безпроводные. 2026.",
    keywords: "camere 4G solar Moldova, camere fara fir, camere fara curent, camere supraveghere izolate, panou solar camera",
    keywordsRu: "4G камеры молдова, камеры без проводов, камеры без электроэнергии, солнечная панель",
    published: true,
    readingTime: 4,
  },
];

// Versiune cache settings — incrementează oricând DEFAULT_CATEGORIES se schimbă
// sau când vrei să forțezi invalidarea cache-ului corupt la toți utilizatorii.
const SETTINGS_CACHE_VERSION = 2;

// TTL cache: dacă e mai vechi de 3 minute, reîmprospătăm din D1 în background (SWR)
const PRODUCTS_CACHE_TTL_MS = 3 * 60 * 1000;

const _cachedSettings = (() => {
  try {
    const raw = localStorage.getItem("teco_settings_cache");
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ModuleSettings & { _v?: number };
    // Invalidează cache-ul dacă versiunea e veche sau lipsă (cache corupt cu DEFAULT)
    if (!parsed._v || parsed._v < SETTINGS_CACHE_VERSION) {
      localStorage.removeItem("teco_settings_cache");
      return null;
    }
    return parsed as ModuleSettings;
  } catch { return null; }
})();

const _cachedProducts = (() => {
  try {
    const raw = localStorage.getItem("teco_products_cache");
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoreProduct[];
    // Tratăm array-ul gol ca null → fallback pe snapshot
    return parsed && parsed.length > 0 ? parsed : null;
  } catch { return null; }
})();

// Timestamp-ul ultimului refresh produse din D1
const _productsCacheTs = (() => {
  try { return Number(localStorage.getItem("teco_products_cache_ts") ?? "0"); }
  catch { return 0; }
})();

const _seedProducts: StoreProduct[] = seedProducts.map((p) => ({
  ...p,
  imageUrl: IMAGE_SEED[(p as { imageType: string }).imageType] ?? "",
  inStock: true,
  description: p.description ?? "",
})) as StoreProduct[];

const _snapshotProducts: StoreProduct[] | null = (() => {
  try {
    const rows = (_snapshot as any).products;
    if (!rows || rows.length === 0) return null;
    return rows.map(dbProductToStore);
  } catch { return null; }
})();

const _snapshotSettings: ModuleSettings | null = (() => {
  try {
    const s = (_snapshot as any).settings;
    return s ? mergeSettings(s) : null;
  } catch { return null; }
})();

// Avem date reale din cache/snapshot → marcăm loaded:true imediat, fără să aşteptăm Supabase
const _hasPreloadedProducts = !!(_cachedProducts ?? _snapshotProducts);

let state: StoreState = {
  products: _cachedProducts ?? _snapshotProducts ?? _seedProducts,
  leads: [],
  orders: [],
  blogPosts: DEFAULT_BLOG_POSTS,
  settings: _cachedSettings ?? _snapshotSettings ?? DEFAULT_SETTINGS,
  userReviews: (() => {
    try { return JSON.parse(localStorage.getItem("teco_user_reviews") ?? "{}"); } catch { return {}; }
  })(),
  loaded: _hasPreloadedProducts,
};

const listeners = new Set<() => void>();

function notify() { listeners.forEach((l) => l()); }

function setState(patch: Partial<StoreState> | ((prev: StoreState) => StoreState)) {
  state = typeof patch === "function" ? patch(state) : { ...state, ...patch };
  notify();
}

export function getState(): StoreState { return state; }

export function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function useStore<T>(selector: (s: StoreState) => T): T {
  const sliceRef = useRef<T>(undefined as unknown as T);
  const state = useSyncExternalStore(subscribe, getState, getState);
  return useMemo(() => {
    const next = selector(state);
    sliceRef.current = next;
    return next;
  }, [state]);
}

// ─── DB helpers ─────────────────────────────────────────────────────
function dbProductToStore(row: any): StoreProduct {
  return {
    id: row.id,
    name: row.name,
    model: row.model,
    brand: row.brand,
    price: row.price,
    oldPrice: row.old_price,
    specs: row.specs,
    badge: row.badge,
    category: row.category,
    imageUrl: row.image_url,
    images: row.images,
    description: row.description ?? "",
    longDescription: row.long_description,
    techSpecs: row.tech_specs,
    inStock: row.in_stock,
    icon: row.icon,
  };
}

function storeProductToDb(p: StoreProduct) {
  return {
    id: p.id,
    name: p.name,
    model: p.model,
    brand: p.brand,
    price: p.price,
    old_price: p.oldPrice,
    specs: p.specs,
    badge: p.badge,
    category: p.category,
    image_url: p.imageUrl,
    images: p.images,
    description: p.description,
    long_description: p.longDescription,
    tech_specs: p.techSpecs,
    in_stock: p.inStock,
    icon: p.icon,
  };
}

function dbLeadToStore(row: any): Lead {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    source: row.source,
    timestamp: row.timestamp,
    status: row.status,
    notes: row.notes,
    selections: row.selections,
  };
}

function dbOrderToStore(row: any): Order {
  return {
    id: row.id,
    customer: row.customer,
    items: row.items,
    total: row.total,
    timestamp: row.timestamp,
    status: row.status,
  };
}

// Seed-ul este acum gestionat de api-server la startup (nu mai e nevoie în frontend)

function dbBlogPostToStore(row: any): BlogPost {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    titleRu: row.title_ru,
    description: row.description,
    descriptionRu: row.description_ru,
    content: row.content,
    contentRu: row.content_ru,
    imageUrl: row.image_url,
    category: row.category,
    categoryRu: row.category_ru,
    publishedAt: row.published_at,
    updatedAt: row.updated_at,
    author: row.author,
    metaTitle: row.meta_title,
    metaTitleRu: row.meta_title_ru,
    metaDescription: row.meta_description,
    metaDescriptionRu: row.meta_description_ru,
    keywords: row.keywords,
    keywordsRu: row.keywords_ru,
    published: row.published,
    readingTime: row.reading_time,
  };
}

function storeBlogPostToDb(p: BlogPost) {
  return {
    id: p.id,
    slug: p.slug,
    title: p.title,
    title_ru: p.titleRu,
    description: p.description,
    description_ru: p.descriptionRu,
    content: p.content,
    content_ru: p.contentRu,
    image_url: p.imageUrl,
    category: p.category,
    category_ru: p.categoryRu,
    published_at: p.publishedAt,
    updated_at: p.updatedAt,
    author: p.author,
    meta_title: p.metaTitle,
    meta_title_ru: p.metaTitleRu,
    meta_description: p.metaDescription,
    meta_description_ru: p.metaDescriptionRu,
    keywords: p.keywords,
    keywords_ru: p.keywordsRu,
    published: p.published,
    reading_time: p.readingTime,
  };
}

// ─── Merge settings with defaults (handles missing keys on load) ─────
function mergeSettings(loaded: any): ModuleSettings {
  return {
    ...DEFAULT_SETTINGS,
    ...loaded,
    general: { ...DEFAULT_SETTINGS.general, ...(loaded?.general ?? {}) },
    moduleB: { ...DEFAULT_SETTINGS.moduleB, ...(loaded?.moduleB ?? {}) },
    moduleC: { ...DEFAULT_SETTINGS.moduleC, ...(loaded?.moduleC ?? {}) },
    moduleComparatorImages: { ...DEFAULT_SETTINGS.moduleComparatorImages, ...(loaded?.moduleComparatorImages ?? {}) },
    moduleTripwire: { ...DEFAULT_SETTINGS.moduleTripwire, ...(loaded?.moduleTripwire ?? {}) },
    categories: loaded?.categories?.length ? loaded.categories : DEFAULT_SETTINGS.categories,
    storeInfo: { ...DEFAULT_SETTINGS.storeInfo, ...(loaded?.storeInfo ?? {}) },
    social: { ...DEFAULT_SETTINGS.social, ...(loaded?.social ?? {}) },
    delivery: { ...DEFAULT_SETTINGS.delivery, ...(loaded?.delivery ?? {}) },
    servicePrices: { ...DEFAULT_SETTINGS.servicePrices, ...(loaded?.servicePrices ?? {}) },
  };
}

// ─── Restaurare imagini base64 din localStorage după load din D1 ─────────────
// D1 stochează settings FĂRĂ base64 (prea mari); le restaurăm din cache local.
function restoreBase64FromCache(fromD1: ModuleSettings, cached: ModuleSettings): ModuleSettings {
  function merge(d1Val: unknown, cacheVal: unknown): unknown {
    if (typeof d1Val === "string" && typeof cacheVal === "string") {
      // Dacă D1 are '' (stripped) dar cache-ul are base64, restaurăm din cache
      return d1Val === "" && cacheVal.startsWith("data:") ? cacheVal : d1Val;
    }
    if (Array.isArray(d1Val) && Array.isArray(cacheVal)) {
      return d1Val.map((item, i) => merge(item, cacheVal[i] ?? item));
    }
    if (d1Val && cacheVal && typeof d1Val === "object" && typeof cacheVal === "object") {
      const out: Record<string, unknown> = { ...(d1Val as Record<string, unknown>) };
      for (const k of Object.keys(cacheVal as Record<string, unknown>)) {
        if (k in out) out[k] = merge(out[k], (cacheVal as Record<string, unknown>)[k]);
        else out[k] = (cacheVal as Record<string, unknown>)[k]; // câmp nou din cache
      }
      return out;
    }
    return d1Val;
  }
  return merge(fromD1, cached) as ModuleSettings;
}

// ─── Refresh produse + setări din D1 în background (SWR) ──────────────────────
// Apelat din initStore când cache-ul e vechi; actualizează starea fără să blocheze UI.
async function _backgroundRefreshFromD1(): Promise<void> {
  try {
    const [prodsRes, settingsRes] = await Promise.all([
      fetch(_API + "/api/products").then((r) => r.ok ? r.json() : null).catch(() => null),
      fetch(_API + "/api/settings").then((r) => r.ok ? r.json() : null).catch(() => null),
    ]);

    const products: any[] = prodsRes?.data ?? [];
    if (products.length > 0) {
      const mapped = products.map(dbProductToStore);
      cacheProducts(mapped);
      setState((s) => ({ ...s, products: mapped }));
    }

    if (settingsRes?.data) {
      const fromD1 = mergeSettings(settingsRes.data);
      // Restaurează imaginile base64 din localStorage sau snapshot (nu sunt în D1 — prea mari)
      // Fallback la state.settings curent (care vine din snapshot) dacă localStorage e gol
      const imageSource = _cachedSettings ?? state.settings;
      const merged = restoreBase64FromCache(fromD1, imageSource);
      try { localStorage.setItem("teco_settings_cache", JSON.stringify({ ...merged, _v: SETTINGS_CACHE_VERSION })); } catch {}
      setState((s) => ({ ...s, settings: merged }));
    }
  } catch { /* silent — nu blocăm pagina */ }
}

// ─── initStore — VIZITATORI: instant din snapshot/cache + SWR background ──────
// Afișează imediat din cache/snapshot, apoi reîmprospătează din D1 în background
// dacă cache-ul e mai vechi de PRODUCTS_CACHE_TTL_MS (3 min).
export function initStore(): void {
  // Datele sunt deja în state — mark loaded și gata.
  if (!state.loaded) {
    setState({ ...state, loaded: true });
  }
  // SWR: dacă cache-ul e stale (sau lipsă), reîmprospătăm D1 în background
  const cacheAge = Date.now() - _productsCacheTs;
  if (cacheAge > PRODUCTS_CACHE_TTL_MS) {
    _backgroundRefreshFromD1();
  }
}

// ─── refreshFromApiServer — NUMAI pentru Admin panel ────────────────────────
// Preia date fresh din api-server (SQLite local, niciodată offline).
// Nu apela din pagini publice — vizitatorii folosesc snapshot/localStorage.
export async function refreshFromApiServer(): Promise<void> {
  try {
    const [prodsRes, leadsRes, ordersRes, settingsRes, blogRes] = await Promise.all([
      fetch(_API + "/api/products").then((r) => r.ok ? r.json() : null).catch(() => null),
      fetch(_API + "/api/leads").then((r) => r.ok ? r.json() : null).catch(() => null),
      fetch(_API + "/api/orders").then((r) => r.ok ? r.json() : null).catch(() => null),
      fetch(_API + "/api/settings").then((r) => r.ok ? r.json() : null).catch(() => null),
      fetch(_API + "/api/blog-posts").then((r) => r.ok ? r.json() : null).catch(() => null),
    ]);

    const products: any[] = prodsRes?.data ?? null;
    const leads: any[] = leadsRes?.data ?? null;
    const orders: any[] = ordersRes?.data ?? null;
    const rawSettings = settingsRes?.data ?? null;
    const blogRows: any[] = blogRes?.data ?? null;

    // ── Settings: D1 este sursa de adevăr pentru config text ────────────────────
    // Imaginile base64 (>10KB) nu sunt în D1 (prea mari); le restaurăm din localStorage sau snapshot.
    let mergedSettings: ModuleSettings | null = null;
    if (rawSettings) {
      const fromD1 = mergeSettings(rawSettings);
      // Fallback la state.settings (snapshot) dacă localStorage e gol — păstrează imaginile
      const imageSource = _cachedSettings ?? state.settings;
      mergedSettings = restoreBase64FromCache(fromD1, imageSource);
      // Actualizăm localStorage cu setările complete (D1 text + imagini restaurate)
      try { localStorage.setItem("teco_settings_cache", JSON.stringify({ ...mergedSettings, _v: SETTINGS_CACHE_VERSION })); } catch {}
    }

    const mappedProducts = (products ?? []).map(dbProductToStore);
    if (mappedProducts.length > 0) {
      try { localStorage.setItem("teco_products_cache", JSON.stringify(mappedProducts)); } catch {}
    }

    // Dacă D1 e gol (prima rulare), seeds automat produsele din snapshot/localStorage
    if ((products ?? []).length === 0 && state.products.length > 0) {
      fetch(_API + "/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(state.products.map(storeProductToDb)),
      }).catch(() => {});
    }

    setState({
      products: mappedProducts.length > 0 ? mappedProducts : state.products,
      leads: (leads ?? []).map(dbLeadToStore),
      orders: (orders ?? []).map(dbOrderToStore),
      blogPosts: (blogRows ?? []).map(dbBlogPostToStore),
      settings: mergedSettings ?? state.settings,
      loaded: true,
    });
  } catch (e) {
    console.error("[store] refreshFromApiServer failed:", e);
    setState({ ...state, loaded: true });
  }
}

// Alias pentru compatibilitate cu Admin.tsx
export const refreshFromSupabase = refreshFromApiServer;

function cacheProducts(products: StoreProduct[]) {
  try {
    localStorage.setItem("teco_products_cache", JSON.stringify(products));
    localStorage.setItem("teco_products_cache_ts", String(Date.now()));
  } catch {}
}

// ─── URL api-server (VITE_API_URL sau same-origin) ──────────────────
const _API = typeof import.meta !== "undefined"
  ? ((import.meta as any).env?.VITE_API_URL ?? "")
  : "";

// ─── Strip base64 din settings înainte de D1 (D1 are limita ~1MB per row) ─────
// Imaginile base64 rămân în localStorage; D1 stochează doar configurația text.
function stripBase64ForD1(obj: unknown): unknown {
  if (typeof obj === "string") {
    // Elimină base64 mari (>10KB) — imagini category, module, comparator
    return (obj.startsWith("data:image") || obj.startsWith("data:application")) && obj.length > 10_000
      ? "" : obj;
  }
  if (Array.isArray(obj)) return obj.map(stripBase64ForD1);
  if (obj && typeof obj === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      out[k] = stripBase64ForD1(v);
    }
    return out;
  }
  return obj;
}

// ─── Salvare settings — localStorage imediat (complet) + D1 fără base64 ───────
async function saveSettings(s: ModuleSettings) {
  // 1. localStorage imediat — păstrează TOATE datele inclusiv imagini base64
  try { localStorage.setItem("teco_settings_cache", JSON.stringify({ ...s, _v: SETTINGS_CACHE_VERSION })); } catch {}
  // 2. D1 — FĂRĂ base64 (limita D1 ~1MB; imaginile rămân în localStorage)
  const d1Safe = stripBase64ForD1(s);
  fetch(_API + "/api/settings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(d1Safe),
  }).catch(() => {});
}

// ─── Sync produse la api-server (fire-and-forget) ───────────────────────────
function syncProduct(method: "POST" | "DELETE", product?: any, id?: number) {
  if (method === "DELETE" && id !== undefined) {
    fetch(_API + `/api/products/${id}`, { method: "DELETE" }).catch(() => {});
  } else if (product) {
    fetch(_API + "/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(storeProductToDb(product)),
    }).catch(() => {});
  }
}

// ─── Actions ────────────────────────────────────────────────────────
export const storeActions = {
  // Products — actualizare optimistă: state + cache instant, api-server în background
  async addProduct(p: Omit<StoreProduct, "id">) {
    const id = Math.max(0, ...state.products.map((x) => x.id)) + 1;
    const newProduct: StoreProduct = { ...p, id };
    setState((s) => { const products = [...s.products, newProduct]; cacheProducts(products); return { ...s, products }; });
    syncProduct("POST", newProduct);
  },

  async updateProduct(id: number, patch: Partial<StoreProduct>) {
    const existing = state.products.find((p) => p.id === id);
    if (!existing) return;
    const updated = { ...existing, ...patch };
    setState((s) => { const products = s.products.map((p) => (p.id === id ? updated : p)); cacheProducts(products); return { ...s, products }; });
    syncProduct("POST", updated);
  },

  async deleteProduct(id: number) {
    setState((s) => { const products = s.products.filter((p) => p.id !== id); cacheProducts(products); return { ...s, products }; });
    syncProduct("DELETE", undefined, id);
  },

  async duplicateProduct(id: number) {
    const original = state.products.find((p) => p.id === id);
    if (!original) return;
    const newId = Math.max(0, ...state.products.map((x) => x.id)) + 1;
    const copy: StoreProduct = { ...original, id: newId, name: `${original.name} (copie)` };
    setState((s) => { const products = [...s.products, copy]; cacheProducts(products); return { ...s, products }; });
    syncProduct("POST", copy);
  },

  async bulkDeleteProducts(ids: number[]) {
    setState((s) => { const products = s.products.filter((p) => !ids.includes(p.id)); cacheProducts(products); return { ...s, products }; });
    ids.forEach((id) => fetch(_API + `/api/products/${id}`, { method: "DELETE" }).catch(() => {}));
  },

  // Leads
  async addLead(lead: Omit<Lead, "id" | "timestamp" | "status">) {
    const newLead: Lead = {
      ...lead,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      status: "new",
    };
    setState((s) => ({ ...s, leads: [newLead, ...s.leads] }));
    fetch(_API + "/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: newLead.id, name: newLead.name, phone: newLead.phone, source: newLead.source, timestamp: newLead.timestamp, status: newLead.status, notes: newLead.notes ?? null, selections: newLead.selections ?? null }),
    }).catch(() => {});
    return newLead;
  },

  async updateLeadStatus(id: string, status: Lead["status"]) {
    setState((s) => ({ ...s, leads: s.leads.map((l) => (l.id === id ? { ...l, status } : l)) }));
    fetch(_API + `/api/leads/${id}/status`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) }).catch(() => {});
  },

  async updateLeadNotes(id: string, notes: string) {
    setState((s) => ({ ...s, leads: s.leads.map((l) => (l.id === id ? { ...l, notes } : l)) }));
    fetch(_API + `/api/leads/${id}/notes`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ notes }) }).catch(() => {});
  },

  async deleteLead(id: string) {
    setState((s) => ({ ...s, leads: s.leads.filter((l) => l.id !== id) }));
    fetch(_API + `/api/leads/${id}`, { method: "DELETE" }).catch(() => {});
  },

  // Orders
  async addOrder(order: Omit<Order, "id" | "timestamp" | "status">) {
    const newOrder: Order = {
      ...order,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      status: "new",
    };
    setState((s) => ({ ...s, orders: [newOrder, ...s.orders] }));
    fetch(_API + "/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: newOrder.id, customer: newOrder.customer, items: newOrder.items, total: newOrder.total, timestamp: newOrder.timestamp, status: newOrder.status }),
    }).catch(() => {});
    return newOrder;
  },

  async updateOrderStatus(id: string, status: Order["status"]) {
    setState((s) => ({ ...s, orders: s.orders.map((o) => (o.id === id ? { ...o, status } : o)) }));
    fetch(_API + `/api/orders/${id}/status`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) }).catch(() => {});
  },

  async deleteOrder(id: string) {
    setState((s) => ({ ...s, orders: s.orders.filter((o) => o.id !== id) }));
    fetch(_API + `/api/orders/${id}`, { method: "DELETE" }).catch(() => {});
  },

  // Settings
  async updateSettings(patch: Partial<ModuleSettings>) {
    const newSettings = { ...state.settings, ...patch };
    setState((s) => ({ ...s, settings: newSettings }));
    await saveSettings(newSettings);
  },

  async updateGeneral(patch: Partial<ModuleSettings["general"]>) {
    const newSettings = { ...state.settings, general: { ...state.settings.general, ...patch } };
    setState((s) => ({ ...s, settings: newSettings }));
    await saveSettings(newSettings);
  },

  async updateHero(patch: number | null | Partial<ModuleSettings["hero"]>) {
    const heroPatch = typeof patch === "object" && patch !== null ? patch : { productId: patch };
    const newSettings = { ...state.settings, hero: { ...state.settings.hero, ...heroPatch } };
    setState((s) => ({ ...s, settings: newSettings }));
    await saveSettings(newSettings);
  },

  async updateModuleA(patch: number | null | Partial<ModuleSettings["moduleA"]>) {
    const maPatch = typeof patch === "object" && patch !== null ? patch : { productId: patch };
    const newSettings = { ...state.settings, moduleA: { ...state.settings.moduleA, ...maPatch } };
    setState((s) => ({ ...s, settings: newSettings }));
    await saveSettings(newSettings);
  },

  async updateModuleB(patch: Partial<ModuleSettings["moduleB"]>) {
    const newSettings = { ...state.settings, moduleB: { ...state.settings.moduleB, ...patch } };
    setState((s) => ({ ...s, settings: newSettings }));
    await saveSettings(newSettings);
  },

  async updateModuleC(brand: keyof ModuleSettings["moduleC"], productId: number | null) {
    const newSettings = {
      ...state.settings,
      moduleC: { ...state.settings.moduleC, [brand]: productId },
    };
    setState((s) => ({ ...s, settings: newSettings }));
    await saveSettings(newSettings);
  },

  async updateComparatorImage(brand: string, url: string) {
    const newSettings = {
      ...state.settings,
      moduleComparatorImages: { ...(state.settings.moduleComparatorImages ?? {}), [brand]: url },
    };
    setState((s) => ({ ...s, settings: newSettings }));
    await saveSettings(newSettings);
  },

  async updateTripwire(patch: NonNullable<ModuleSettings["moduleTripwire"]>) {
    const newSettings = {
      ...state.settings,
      moduleTripwire: { ...(state.settings.moduleTripwire ?? {}), ...patch },
    };
    setState((s) => ({ ...s, settings: newSettings }));
    await saveSettings(newSettings);
  },

  async updateCategories(categories: CategoryDef[]) {
    const newSettings = { ...state.settings, categories };
    setState((s) => ({ ...s, settings: newSettings }));
    await saveSettings(newSettings);
  },

  async updateStoreInfo(patch: Partial<ModuleSettings["storeInfo"]>) {
    const newSettings = { ...state.settings, storeInfo: { ...state.settings.storeInfo, ...patch } };
    setState((s) => ({ ...s, settings: newSettings }));
    await saveSettings(newSettings);
  },

  async updateSocial(patch: Partial<ModuleSettings["social"]>) {
    const newSettings = { ...state.settings, social: { ...state.settings.social, ...patch } };
    setState((s) => ({ ...s, settings: newSettings }));
    await saveSettings(newSettings);
  },

  async updateServicePrices(patch: Partial<NonNullable<ModuleSettings["servicePrices"]>>) {
    const newSettings = { ...state.settings, servicePrices: { ...state.settings.servicePrices, ...patch } };
    setState((s) => ({ ...s, settings: newSettings }));
    await saveSettings(newSettings);
  },

  async updateDelivery(patch: Partial<ModuleSettings["delivery"]>) {
    const newSettings = { ...state.settings, delivery: { ...state.settings.delivery, ...patch } };
    setState((s) => ({ ...s, settings: newSettings }));
    await saveSettings(newSettings);
  },

  async updateGallery(items: GalleryItem[]) {
    const newSettings = { ...state.settings, gallery: items };
    setState((s) => ({ ...s, settings: newSettings }));
    await saveSettings(newSettings);
  },

  // Blog
  async addBlogPost(p: Omit<BlogPost, "id" | "publishedAt" | "updatedAt" | "readingTime">) {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const readingTime = Math.ceil((p.content?.split(/\s+/).length || 0) / 200);
    const newPost: BlogPost = { ...p, id, publishedAt: now, updatedAt: now, readingTime };
    setState((s) => ({ ...s, blogPosts: [newPost, ...s.blogPosts] }));
    fetch(_API + "/api/blog-posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(storeBlogPostToDb(newPost)),
    }).catch(() => {});
    return newPost;
  },

  async updateBlogPost(id: string, patch: Partial<BlogPost>) {
    const existing = state.blogPosts.find((p) => p.id === id);
    if (!existing) return;
    const updated = { ...existing, ...patch, updatedAt: new Date().toISOString() };
    setState((s) => ({ ...s, blogPosts: s.blogPosts.map((p) => (p.id === id ? updated : p)) }));
    fetch(_API + "/api/blog-posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(storeBlogPostToDb(updated)),
    }).catch(() => {});
  },

  async deleteBlogPost(id: string) {
    setState((s) => ({ ...s, blogPosts: s.blogPosts.filter((p) => p.id !== id) }));
    fetch(_API + `/api/blog-posts/${id}`, { method: "DELETE" }).catch(() => {});
  },

  async resetToDefaults() {
    // Șterge cacheul local și reîncarcă din api-server
    try { localStorage.removeItem("teco_settings_cache"); } catch {}
    try { localStorage.removeItem("teco_products_cache"); } catch {}
    await refreshFromApiServer();
  },

  addReview(productId: number, review: Omit<UserReview, "id" | "helpful">) {
    const newReview: UserReview = { ...review, id: crypto.randomUUID(), helpful: 0 };
    setState((s) => {
      const existing = s.userReviews[productId] ?? [];
      const updated = { ...s.userReviews, [productId]: [newReview, ...existing] };
      try { localStorage.setItem("teco_user_reviews", JSON.stringify(updated)); } catch {}
      return { ...s, userReviews: updated };
    });
  },

  markReviewHelpful(productId: number, reviewId: string) {
    setState((s) => {
      const existing = s.userReviews[productId] ?? [];
      const updated = { ...s.userReviews, [productId]: existing.map((r) => r.id === reviewId ? { ...r, helpful: r.helpful + 1 } : r) };
      try { localStorage.setItem("teco_user_reviews", JSON.stringify(updated)); } catch {}
      return { ...s, userReviews: updated };
    });
  },
};
