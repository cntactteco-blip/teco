import { useSyncExternalStore } from "react";
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

export interface ModuleSettings {
  general: { adminPhone: string; announcementText: string };
  hero: { productId: number | null };
  moduleA: { productId: number | null };
  moduleB: { productId: number | null; imageLeft: string; imageRight: string };
  moduleC: {
    TAPO: number | null; REOLINK: number | null; UNIARCH: number | null;
    DAHUA: number | null; UNIVIEW: number | null; TIANDY: number | null;
  };
}

export interface StoreState {
  products: StoreProduct[];
  leads: Lead[];
  orders: Order[];
  settings: ModuleSettings;
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

const DEFAULT_SETTINGS: ModuleSettings = {
  general: { adminPhone: "37367200463", announcementText: "" },
  hero: { productId: 3 },
  moduleA: { productId: 25 },
  moduleB: {
    productId: 16,
    imageLeft:  "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=960&q=85&auto=format&fit=crop",
    imageRight: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=960&q=85&auto=format&fit=crop",
  },
  moduleC: { TAPO: 3, REOLINK: 7, UNIARCH: 5, DAHUA: null, UNIVIEW: 16, TIANDY: 12 },
};

// ─── Store singleton ────────────────────────────────────────────────
let state: StoreState = {
  products: [],
  leads: [],
  orders: [],
  settings: DEFAULT_SETTINGS,
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
  return useSyncExternalStore(subscribe, () => selector(state), () => selector(state));
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

// ─── Inițializare — încarcă totul din Supabase ──────────────────────
export async function initStore() {
  await seedProductsIfEmpty();

  const [{ data: prods }, { data: leads }, { data: orders }, { data: settingsRows }] =
    await Promise.all([
      supabase.from("products").select("*").order("id"),
      supabase.from("leads").select("*").order("timestamp", { ascending: false }),
      supabase.from("orders").select("*").order("timestamp", { ascending: false }),
      supabase.from("settings").select("*").eq("id", 1),
    ]);

  const settings =
    settingsRows && settingsRows.length > 0 && settingsRows[0].data
      ? (settingsRows[0].data as ModuleSettings)
      : DEFAULT_SETTINGS;

  setState({
    products: (prods ?? []).map(dbProductToStore),
    leads: (leads ?? []).map(dbLeadToStore),
    orders: (orders ?? []).map(dbOrderToStore),
    settings,
    loaded: true,
  });
}

// ─── Salvare settings în Supabase ───────────────────────────────────
async function saveSettings(s: ModuleSettings) {
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

  async updateHero(productId: number | null) {
    const newSettings = { ...state.settings, hero: { productId } };
    setState((s) => ({ ...s, settings: newSettings }));
    await saveSettings(newSettings);
  },

  async updateModuleA(productId: number | null) {
    const newSettings = { ...state.settings, moduleA: { productId } };
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

  async resetToDefaults() {
    await supabase.from("products").delete().neq("id", 0);
    await supabase.from("leads").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase.from("orders").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase.from("settings").delete().eq("id", 1);
    await initStore();
  },
};
