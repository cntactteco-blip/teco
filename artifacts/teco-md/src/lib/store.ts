import { useSyncExternalStore, useMemo, useRef } from "react";
import { supabase } from "./supabase";
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
  { id: "wifi",   slug: "wifi",   label: "Camere WiFi",     labelRu: "WiFi Камеры",       image: "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=500&q=80&auto=format&fit=crop" },
  { id: "poe",    slug: "poe",    label: "Camere PoE",      labelRu: "PoE Камеры",        image: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=500&q=80&auto=format&fit=crop" },
  { id: "4g",     slug: "4g",     label: "Camere 4G",       labelRu: "4G Камеры",         image: "https://images.unsplash.com/photo-1616763355548-1b606f439f86?w=500&q=80&auto=format&fit=crop" },
  { id: "nvr",    slug: "nvr",    label: "NVR-uri",         labelRu: "NVR Регистраторы",  image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500&q=80&auto=format&fit=crop" },
  { id: "kituri", slug: "kituri", label: "Kituri Complete", labelRu: "Комплекты",         image: "https://images.unsplash.com/photo-1558002038-1055907df827?w=500&q=80&auto=format&fit=crop" },
  { id: "alarme", slug: "alarme", label: "Sisteme Alarmă",  labelRu: "Системы Охраны",   image: "https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=500&q=80&auto=format&fit=crop" },
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

const _cachedSettings = (() => {
  try {
    const raw = localStorage.getItem("teco_settings_cache");
    if (!raw) return null;
    return JSON.parse(raw) as ModuleSettings;
  } catch { return null; }
})();

let state: StoreState = {
  products: seedProducts.map((p) => ({
    ...p,
    imageUrl: IMAGE_SEED[(p as { imageType: string }).imageType] ?? "",
    inStock: true,
    description: p.description ?? "",
  })) as StoreProduct[],
  leads: [],
  orders: [],
  blogPosts: DEFAULT_BLOG_POSTS,
  settings: _cachedSettings ?? DEFAULT_SETTINGS,
  userReviews: (() => {
    try { return JSON.parse(localStorage.getItem("teco_user_reviews") ?? "{}"); } catch { return {}; }
  })(),
  loaded: false,
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

// ─── Seed produse în Supabase (prima rulare) ─────────────────────────
async function seedProductsIfEmpty() {
  const { count } = await supabase
    .from("products")
    .select("*", { count: "exact", head: true });

  if ((count ?? 0) > 0) return;

  const rows = seedProducts.map((p) => ({
    id: p.id,
    name: p.name,
    model: p.model,
    brand: p.brand,
    price: p.price,
    old_price: p.oldPrice,
    specs: p.specs,
    badge: p.badge,
    category: p.category,
    image_url: IMAGE_SEED[p.imageType] ?? IMAGE_SEED["indoor"],
    images: [],
    description: p.description ?? "",
    long_description: null,
    tech_specs: null,
    in_stock: true,
    icon: p.icon,
  }));

  await supabase.from("products").insert(rows);
}

// ─── Seed blog posts în Supabase (prima rulare) ──────────────
async function seedBlogPostsIfEmpty() {
  const { count } = await supabase
    .from("blog_posts")
    .select("*", { count: "exact", head: true });

  if ((count ?? 0) > 0) return;

  const rows = DEFAULT_BLOG_POSTS.map((p) => storeBlogPostToDb(p));
  await supabase.from("blog_posts").insert(rows);
}

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

// ─── Inițializare — încarcă totul din Supabase ──────────────────────
export async function initStore() {
  // Run everything in parallel: seed checks + data fetches together
  const [
    ,
    ,
    { data: prods },
    { data: leads },
    { data: orders },
    { data: blogRows },
    { data: settingsRows },
  ] = await Promise.all([
    seedProductsIfEmpty(),
    seedBlogPostsIfEmpty(),
    supabase.from("products").select("*").order("id"),
    supabase.from("leads").select("*").order("timestamp", { ascending: false }),
    supabase.from("orders").select("*").order("timestamp", { ascending: false }),
    supabase.from("blog_posts").select("*").order("published_at", { ascending: false }),
    supabase.from("settings").select("*").eq("id", 1),
  ]);

  // If DB had no products yet (first ever run), re-fetch after seed inserted them
  let finalProds = prods ?? [];
  if (finalProds.length === 0) {
    const { data: reseeded } = await supabase.from("products").select("*").order("id");
    finalProds = reseeded ?? [];
  }

  const rawSettings =
    settingsRows && settingsRows.length > 0 && settingsRows[0].data
      ? settingsRows[0].data
      : null;

  const mergedSettings = mergeSettings(rawSettings);
  try { localStorage.setItem("teco_settings_cache", JSON.stringify(mergedSettings)); } catch {}

  setState({
    products: finalProds.map(dbProductToStore),
    leads: (leads ?? []).map(dbLeadToStore),
    orders: (orders ?? []).map(dbOrderToStore),
    blogPosts: (blogRows ?? []).map(dbBlogPostToStore),
    settings: mergedSettings,
    loaded: true,
  });
}

// ─── Salvare settings în Supabase ───────────────────────────────────
async function saveSettings(s: ModuleSettings) {
  try { localStorage.setItem("teco_settings_cache", JSON.stringify(s)); } catch {}
  await supabase.from("settings").upsert({ id: 1, data: s });
}

// ─── Actions ────────────────────────────────────────────────────────
export const storeActions = {
  // Products
  async addProduct(p: Omit<StoreProduct, "id">) {
    const id = Math.max(0, ...state.products.map((x) => x.id)) + 1;
    const newProduct: StoreProduct = { ...p, id };
    const { error } = await supabase.from("products").insert(storeProductToDb(newProduct));
    if (error) { console.error("addProduct error:", error); return; }
    setState((s) => ({ ...s, products: [...s.products, newProduct] }));
  },

  async updateProduct(id: number, patch: Partial<StoreProduct>) {
    const existing = state.products.find((p) => p.id === id);
    if (!existing) return;
    const updated = { ...existing, ...patch };
    const { error } = await supabase
      .from("products")
      .update(storeProductToDb(updated))
      .eq("id", id);
    if (error) { console.error("updateProduct error:", error); return; }
    setState((s) => ({
      ...s,
      products: s.products.map((p) => (p.id === id ? updated : p)),
    }));
  },

  async deleteProduct(id: number) {
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) { console.error("deleteProduct error:", error); return; }
    setState((s) => ({ ...s, products: s.products.filter((p) => p.id !== id) }));
  },

  async duplicateProduct(id: number) {
    const original = state.products.find((p) => p.id === id);
    if (!original) return;
    const newId = Math.max(0, ...state.products.map((x) => x.id)) + 1;
    const copy: StoreProduct = { ...original, id: newId, name: `${original.name} (copie)` };
    const { error } = await supabase.from("products").insert(storeProductToDb(copy));
    if (error) { console.error("duplicateProduct error:", error); return; }
    setState((s) => ({ ...s, products: [...s.products, copy] }));
  },

  async bulkDeleteProducts(ids: number[]) {
    const { error } = await supabase.from("products").delete().in("id", ids);
    if (error) { console.error("bulkDeleteProducts error:", error); return; }
    setState((s) => ({ ...s, products: s.products.filter((p) => !ids.includes(p.id)) }));
  },

  // Leads
  async addLead(lead: Omit<Lead, "id" | "timestamp" | "status">) {
    const newLead: Lead = {
      ...lead,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      status: "new",
    };
    const { error } = await supabase.from("leads").insert({
      id: newLead.id,
      name: newLead.name,
      phone: newLead.phone,
      source: newLead.source,
      timestamp: newLead.timestamp,
      status: newLead.status,
      notes: newLead.notes ?? null,
      selections: newLead.selections ?? null,
    });
    if (error) { console.error("addLead error:", error); return newLead; }
    setState((s) => ({ ...s, leads: [newLead, ...s.leads] }));
    return newLead;
  },

  async updateLeadStatus(id: string, status: Lead["status"]) {
    await supabase.from("leads").update({ status }).eq("id", id);
    setState((s) => ({
      ...s,
      leads: s.leads.map((l) => (l.id === id ? { ...l, status } : l)),
    }));
  },

  async updateLeadNotes(id: string, notes: string) {
    await supabase.from("leads").update({ notes }).eq("id", id);
    setState((s) => ({
      ...s,
      leads: s.leads.map((l) => (l.id === id ? { ...l, notes } : l)),
    }));
  },

  async deleteLead(id: string) {
    await supabase.from("leads").delete().eq("id", id);
    setState((s) => ({ ...s, leads: s.leads.filter((l) => l.id !== id) }));
  },

  // Orders
  async addOrder(order: Omit<Order, "id" | "timestamp" | "status">) {
    const newOrder: Order = {
      ...order,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      status: "new",
    };
    const { error } = await supabase.from("orders").insert({
      id: newOrder.id,
      customer: newOrder.customer,
      items: newOrder.items,
      total: newOrder.total,
      timestamp: newOrder.timestamp,
      status: newOrder.status,
    });
    if (error) { console.error("addOrder error:", error); return newOrder; }
    setState((s) => ({ ...s, orders: [newOrder, ...s.orders] }));
    return newOrder;
  },

  async updateOrderStatus(id: string, status: Order["status"]) {
    await supabase.from("orders").update({ status }).eq("id", id);
    setState((s) => ({
      ...s,
      orders: s.orders.map((o) => (o.id === id ? { ...o, status } : o)),
    }));
  },

  async deleteOrder(id: string) {
    await supabase.from("orders").delete().eq("id", id);
    setState((s) => ({ ...s, orders: s.orders.filter((o) => o.id !== id) }));
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
    const { error } = await supabase.from("blog_posts").insert({
      id: newPost.id,
      slug: newPost.slug,
      title: newPost.title,
      title_ru: newPost.titleRu,
      description: newPost.description,
      description_ru: newPost.descriptionRu,
      content: newPost.content,
      content_ru: newPost.contentRu,
      image_url: newPost.imageUrl,
      category: newPost.category,
      category_ru: newPost.categoryRu,
      published_at: newPost.publishedAt,
      updated_at: newPost.updatedAt,
      author: newPost.author,
      meta_title: newPost.metaTitle,
      meta_title_ru: newPost.metaTitleRu,
      meta_description: newPost.metaDescription,
      meta_description_ru: newPost.metaDescriptionRu,
      keywords: newPost.keywords,
      keywords_ru: newPost.keywordsRu,
      published: newPost.published,
    });
    if (error) { console.error("addBlogPost error:", error); }
    setState((s) => ({ ...s, blogPosts: [newPost, ...s.blogPosts] }));
    return newPost;
  },

  async updateBlogPost(id: string, patch: Partial<BlogPost>) {
    const existing = state.blogPosts.find((p) => p.id === id);
    if (!existing) return;
    const updated = { ...existing, ...patch, updatedAt: new Date().toISOString() };
    const { error } = await supabase.from("blog_posts").update({
      slug: updated.slug,
      title: updated.title,
      title_ru: updated.titleRu,
      description: updated.description,
      description_ru: updated.descriptionRu,
      content: updated.content,
      content_ru: updated.contentRu,
      image_url: updated.imageUrl,
      category: updated.category,
      category_ru: updated.categoryRu,
      updated_at: updated.updatedAt,
      author: updated.author,
      meta_title: updated.metaTitle,
      meta_title_ru: updated.metaTitleRu,
      meta_description: updated.metaDescription,
      meta_description_ru: updated.metaDescriptionRu,
      keywords: updated.keywords,
      keywords_ru: updated.keywordsRu,
      published: updated.published,
    }).eq("id", id);
    if (error) { console.error("updateBlogPost error:", error); return; }
    setState((s) => ({
      ...s,
      blogPosts: s.blogPosts.map((p) => (p.id === id ? updated : p)),
    }));
  },

  async deleteBlogPost(id: string) {
    const { error } = await supabase.from("blog_posts").delete().eq("id", id);
    if (error) { console.error("deleteBlogPost error:", error); return; }
    setState((s) => ({ ...s, blogPosts: s.blogPosts.filter((p) => p.id !== id) }));
  },

  async resetToDefaults() {
    await supabase.from("products").delete().neq("id", 0);
    await supabase.from("leads").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase.from("orders").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase.from("settings").delete().eq("id", 1);
    await initStore();
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
