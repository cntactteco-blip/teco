import { useState, useMemo, useRef } from "react";
import {
  LayoutDashboard, Package, ShoppingBag, Users, Settings, LogOut,
  ShieldCheck, Eye, EyeOff, Plus, Edit2, Trash2, X, Save, Search,
  RefreshCw, Trash, TrendingUp, Phone, MessageCircle, ChevronDown,
  ChevronRight, BarChart3, Megaphone, Clock, Tag, Zap, CheckCircle2,
  AlertCircle, Circle, SlidersHorizontal, Star,
} from "lucide-react";
import {
  useStore, storeActions,
  type StoreProduct, type Lead, type Order, type ModuleSettings,
  getState,
} from "@/lib/store";
import { ImportModal } from "@/components/ImportModal";

const ADMIN_PIN = "teco2025";
const brands = ["TAPO", "REOLINK", "UNIARCH", "DAHUA", "UNIVIEW", "TIANDY"] as const;
const CATEGORIES = ["wifi", "poe", "4g", "nvr", "kituri", "alarme"] as const;
type Tab = "dashboard" | "products" | "orders" | "leads" | "settings";

// ─── Helpers ────────────────────────────────────────────────────────
const fmt    = (n: number) => n.toLocaleString("ro-MD");
const fmtMDL = (n: number) => fmt(n) + " MDL";
const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString("ro-MD", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

const ORDER_CFG = {
  new:       { label: "Nouă",       cls: "bg-amber-500/15 text-amber-400",  dot: "bg-amber-400"  },
  confirmed: { label: "Confirmată", cls: "bg-blue-500/15 text-blue-400",    dot: "bg-blue-400"   },
  delivered: { label: "Livrată",    cls: "bg-green-500/15 text-green-400",  dot: "bg-green-400"  },
} as const;

const LEAD_CFG = {
  new:       { label: "Nou",       cls: "bg-amber-500/15 text-amber-400",  dot: "bg-amber-400"  },
  contacted: { label: "Contactat", cls: "bg-blue-500/15 text-blue-400",    dot: "bg-blue-400"   },
  converted: { label: "Convertit", cls: "bg-green-500/15 text-green-400",  dot: "bg-green-400"  },
} as const;

function StatusBadge({ cfg }: { cfg: { label: string; cls: string; dot: string } }) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

// ─── PIN Gate ────────────────────────────────────────────────────────
function PinGate({ onAuth }: { onAuth: () => void }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const [show, setShow] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === ADMIN_PIN) { sessionStorage.setItem("teco_admin", "1"); onAuth(); }
    else { setError(true); setPin(""); }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-[#FF4F00]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-7 h-7 text-[#FF4F00]" />
          </div>
          <h1 className="font-black text-xl text-white">TECO.MD Admin</h1>
          <p className="text-zinc-500 text-sm mt-1">Panou de administrare securizat</p>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="relative">
            <input
              type={show ? "text" : "password"}
              placeholder="Cod PIN"
              value={pin}
              onChange={(e) => { setPin(e.target.value); setError(false); }}
              className={`w-full bg-zinc-800 border ${error ? "border-red-500" : "border-zinc-700"} rounded-xl px-4 py-3 text-white text-center tracking-widest text-lg focus:outline-none focus:border-[#FF4F00] transition-colors`}
              autoFocus
            />
            <button type="button" onClick={() => setShow(!show)} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500">
              {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {error && <p className="text-red-400 text-xs text-center">PIN incorect. Încearcă din nou.</p>}
          <button type="submit" className="w-full bg-[#FF4F00] text-white font-bold py-3 rounded-xl hover:opacity-90 active:scale-95 transition-all mt-2">
            Autentificare
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Product Modal ────────────────────────────────────────────────────
interface ProductFormData {
  name: string; model: string; brand: string; category: string;
  price: string; oldPrice: string; specs: string; badge: string;
  imageUrl: string; description: string; longDescription: string; techSpecs: string; inStock: boolean;
}
const EMPTY_FORM: ProductFormData = {
  name: "", model: "", brand: "", category: "wifi",
  price: "", oldPrice: "", specs: "", badge: "", imageUrl: "",
  description: "", longDescription: "", techSpecs: "", inStock: true,
};

// ─── Image utilities ─────────────────────────────────────────────────
async function compressImage(file: File, maxPx = 1200, quality = 0.82): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxPx / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width  = Math.round(img.width  * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = e.target!.result as string;
    };
    reader.readAsDataURL(file);
  });
}

// ─── ImageSlot ────────────────────────────────────────────────────────
function ImageSlot({
  url, label, isPrimary, uploading,
  onFile, onUrlChange, onRemove,
}: {
  url: string; label: string; isPrimary?: boolean; uploading?: boolean;
  onFile: (f: File) => void; onUrlChange: (u: string) => void; onRemove: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [showUrl, setShowUrl] = useState(!url && !isPrimary ? false : false);

  return (
    <div className="flex flex-col gap-1.5">
      {/* Preview / empty state */}
      <div
        className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-colors ${isPrimary && url ? "border-[#FF4F00]" : "border-zinc-700"} bg-zinc-800`}
        onClick={() => !url && !uploading && fileRef.current?.click()}
        style={{ cursor: url ? "default" : "pointer" }}
      >
        {uploading ? (
          <div className="w-full h-full flex items-center justify-center">
            <RefreshCw className="w-6 h-6 text-zinc-400 animate-spin" />
          </div>
        ) : url ? (
          <>
            <img src={url} alt={label} className="w-full h-full object-cover" />
            {/* Hover overlay */}
            <div className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 active:opacity-100 transition-opacity flex items-center justify-center gap-3">
              <button onClick={(e) => { e.stopPropagation(); fileRef.current?.click(); }}
                className="w-9 h-9 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center backdrop-blur-sm" title="Schimbă">
                <Edit2 className="w-4 h-4 text-white" />
              </button>
              <button onClick={(e) => { e.stopPropagation(); onRemove(); }}
                className="w-9 h-9 bg-red-500/40 hover:bg-red-500/60 rounded-lg flex items-center justify-center backdrop-blur-sm" title="Șterge">
                <Trash2 className="w-4 h-4 text-white" />
              </button>
            </div>
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-zinc-500">
            <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center">
              <Plus className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-semibold">{label}</span>
          </div>
        )}
        {isPrimary && url && (
          <span className="absolute top-1.5 left-1.5 bg-[#FF4F00] text-white text-[9px] font-black px-1.5 py-0.5 rounded-md leading-none">
            MAIN
          </span>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex gap-1">
        <button type="button" onClick={() => fileRef.current?.click()}
          className="flex-1 flex items-center justify-center gap-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700 rounded-lg py-1.5 text-[11px] font-semibold transition-colors">
          <span>📷</span> Galerie
        </button>
        <button type="button" onClick={() => setShowUrl((v) => !v)}
          className={`flex-1 flex items-center justify-center gap-1 border rounded-lg py-1.5 text-[11px] font-semibold transition-colors ${showUrl ? "bg-zinc-700 text-white border-zinc-600" : "bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white border-zinc-700"}`}>
          <span>🔗</span> URL
        </button>
        {url && (
          <button type="button" onClick={onRemove}
            className="w-8 flex items-center justify-center bg-zinc-800 hover:bg-red-900/40 text-zinc-500 hover:text-red-400 border border-zinc-700 rounded-lg transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* URL input */}
      {showUrl && (
        <input type="url" value={url.startsWith("data:") ? "" : url}
          onChange={(e) => onUrlChange(e.target.value)}
          placeholder="https://..."
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-white text-xs focus:outline-none focus:border-[#FF4F00] placeholder:text-zinc-600 font-mono" />
      )}

      {/* Hidden file input */}
      <input ref={fileRef} type="file" accept="image/*" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) { onFile(f); e.target.value = ""; } }} />
    </div>
  );
}

// ── Stable component outside ProductModal — prevents keyboard dismiss on mobile ──
function ProductField({ label, field, type = "text", placeholder = "", form, set }: {
  label: string; field: keyof ProductFormData; type?: string; placeholder?: string;
  form: ProductFormData; set: (k: keyof ProductFormData, v: string | boolean) => void;
}) {
  return (
    <div>
      <label className="block text-[11px] font-semibold text-zinc-400 mb-1 uppercase tracking-wider">{label}</label>
      <input
        type={type}
        value={form[field] as string}
        onChange={(e) => set(field, e.target.value)}
        placeholder={placeholder}
        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#FF4F00] transition-colors placeholder:text-zinc-600"
      />
    </div>
  );
}

function ProductModal({ product, onClose }: { product: StoreProduct | null; onClose: () => void }) {
  const [form, setForm] = useState<ProductFormData>(
    product ? {
      name: product.name, model: product.model, brand: product.brand,
      category: product.category, price: String(product.price),
      oldPrice: product.oldPrice ? String(product.oldPrice) : "",
      specs: product.specs, badge: product.badge ?? "",
      imageUrl: product.imageUrl, description: product.description,
      longDescription: product.longDescription ?? "",
      techSpecs: product.techSpecs ?? "",
      inStock: product.inStock,
    } : EMPTY_FORM
  );
  const [extraImages, setExtraImages] = useState<string[]>(
    product?.images ? product.images.slice(1).filter(Boolean) : []
  );
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null); // -1 = primary

  const set = (key: keyof ProductFormData, val: string | boolean) =>
    setForm((f) => ({ ...f, [key]: val }));

  const handleFile = async (file: File, target: "primary" | number) => {
    const idx = target === "primary" ? -1 : target;
    setUploadingIdx(idx);
    try {
      const compressed = await compressImage(file);
      if (target === "primary") set("imageUrl", compressed);
      else setExtraImages((prev) => prev.map((v, i) => (i === target ? compressed : v)));
    } finally {
      setUploadingIdx(null);
    }
  };

  const addSlot  = () => setExtraImages((prev) => [...prev, ""]);
  const removeSlot = (i: number) => setExtraImages((prev) => prev.filter((_, j) => j !== i));

  const handleSave = () => {
    if (!form.name || !form.price) return;
    const allImages = [form.imageUrl, ...extraImages].filter(Boolean);
    const p = {
      name: form.name, model: form.model, brand: form.brand,
      category: form.category as any,
      price: Number(form.price) || 0,
      oldPrice: form.oldPrice ? Number(form.oldPrice) : null,
      specs: form.specs, badge: form.badge || null,
      imageUrl: form.imageUrl, images: allImages,
      description: form.description,
      longDescription: form.longDescription || undefined,
      techSpecs: form.techSpecs || undefined,
      inStock: form.inStock, icon: "Camera",
    };
    if (product) storeActions.updateProduct(product.id, p);
    else storeActions.addProduct(p);
    onClose();
  };

  const totalImgs = [form.imageUrl, ...extraImages].filter(Boolean).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 flex-shrink-0">
          <h3 className="font-bold text-white">{product ? "Editează Produs" : "Produs Nou"}</h3>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-6 flex flex-col gap-4 overflow-y-auto">
          {/* Info fields */}
          <ProductField label="Nume Produs *" field="name" placeholder="ex: Cameră Turret 4MP PoE" form={form} set={set} />
          <div className="grid grid-cols-2 gap-3">
            <ProductField label="Model" field="model" placeholder="ex: VIGI C440I" form={form} set={set} />
            <ProductField label="Brand" field="brand" placeholder="ex: TP-Link VIGI" form={form} set={set} />
            <div>
              <label className="block text-[11px] font-semibold text-zinc-400 mb-1 uppercase tracking-wider">Categorie</label>
              <select value={form.category} onChange={(e) => set("category", e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#FF4F00]">
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <ProductField label="Badge" field="badge" placeholder="ex: PROMO" form={form} set={set} />
            <ProductField label="Preț MDL *" field="price" type="number" placeholder="1290" form={form} set={set} />
            <ProductField label="Preț Vechi MDL" field="oldPrice" type="number" placeholder="1490" form={form} set={set} />
          </div>
          <ProductField label="Specificații" field="specs" placeholder="4MP | PoE | IR 30m | AI" form={form} set={set} />

          {/* ── IMAGE MANAGER ─────────────────────────────────── */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                Imagini Produs {totalImgs > 0 && <span className="text-zinc-600">({totalImgs})</span>}
              </label>
              <span className="text-[10px] text-zinc-600">📷 Din galerie sau 🔗 URL</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {/* Primary image slot */}
              <ImageSlot
                url={form.imageUrl}
                label="Principală"
                isPrimary
                uploading={uploadingIdx === -1}
                onFile={(f) => handleFile(f, "primary")}
                onUrlChange={(u) => set("imageUrl", u)}
                onRemove={() => set("imageUrl", "")}
              />
              {/* Extra image slots */}
              {extraImages.map((url, i) => (
                <ImageSlot
                  key={i}
                  url={url}
                  label={`Imagine ${i + 2}`}
                  uploading={uploadingIdx === i}
                  onFile={(f) => handleFile(f, i)}
                  onUrlChange={(u) => setExtraImages((prev) => prev.map((v, j) => (j === i ? u : v)))}
                  onRemove={() => removeSlot(i)}
                />
              ))}
              {/* Add slot button */}
              {extraImages.length < 8 && (
                <button type="button" onClick={addSlot}
                  className="aspect-square rounded-xl border-2 border-dashed border-zinc-700 hover:border-zinc-500 flex flex-col items-center justify-center gap-1.5 text-zinc-500 hover:text-zinc-300 transition-colors">
                  <Plus className="w-5 h-5" />
                  <span className="text-[10px] font-semibold">Adaugă</span>
                </button>
              )}
            </div>
            <p className="text-[10px] text-zinc-600 mt-2">
              Imaginile din galerie sunt comprimate automat. Max 9 imagini per produs.
            </p>
          </div>

          {/* Short Description */}
          <div>
            <label className="block text-[11px] font-semibold text-zinc-400 mb-1 uppercase tracking-wider">Descriere Scurtă <span className="text-zinc-600 normal-case">(apare pe card)</span></label>
            <textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={2}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#FF4F00] transition-colors resize-none"
              placeholder="1-2 propoziții despre ce face produsul..." />
          </div>

          {/* Long Description */}
          <div>
            <label className="block text-[11px] font-semibold text-zinc-400 mb-1 uppercase tracking-wider">Descriere Completă <span className="text-zinc-600 normal-case">(pagina produsului)</span></label>
            <textarea value={form.longDescription} onChange={(e) => set("longDescription", e.target.value)} rows={5}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#FF4F00] transition-colors resize-none"
              placeholder="Descriere detaliată a produsului, beneficii principale, cazuri de utilizare..." />
          </div>

          {/* Tech Specs */}
          <div>
            <label className="block text-[11px] font-semibold text-zinc-400 mb-1 uppercase tracking-wider">Specificații Tehnice <span className="text-zinc-600 normal-case">(un câmp pe linie: Cheie: Valoare)</span></label>
            <textarea value={form.techSpecs} onChange={(e) => set("techSpecs", e.target.value)} rows={6}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#FF4F00] transition-colors resize-none font-mono"
              placeholder={"Rezoluție: 4MP 2560×1440\nCompresie: H.265+ / H.265\nIR: 30m Smart IR\nIP: IP66\nAlimentare: PoE 802.3af\nTemperatură: -35°C~65°C"} />
            <p className="text-[10px] text-zinc-600 mt-1">Fiecare rând = o linie în tabelul de specificații</p>
          </div>

          {/* In stock toggle */}
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => set("inStock", !form.inStock)}
              className={`relative w-11 h-6 rounded-full transition-colors ${form.inStock ? "bg-green-600" : "bg-zinc-600"}`}>
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.inStock ? "translate-x-5" : ""}`} />
            </button>
            <span className="text-sm text-zinc-300">{form.inStock ? "În stoc" : "Lipsă stoc"}</span>
          </div>
        </div>

        <div className="flex gap-3 px-6 py-4 border-t border-zinc-800 flex-shrink-0">
          <button onClick={onClose} className="flex-1 bg-zinc-800 text-white font-semibold py-2.5 rounded-xl hover:bg-zinc-700 transition-colors">
            Anulează
          </button>
          <button onClick={handleSave} disabled={!form.name || !form.price}
            className="flex-1 bg-[#FF4F00] text-white font-bold py-2.5 rounded-xl hover:opacity-90 active:scale-95 transition-all disabled:opacity-40 flex items-center justify-center gap-2">
            <Save className="w-4 h-4" /> Salvează
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────────
function KpiCard({ title, value, sub, icon: Icon, accent }: {
  title: string; value: string; sub?: string; icon: React.ElementType; accent: string;
}) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
      <div className="flex items-start justify-between mb-3">
        <p className="text-zinc-500 text-[11px] font-semibold uppercase tracking-wider">{title}</p>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${accent}`}><Icon className="w-4 h-4" /></div>
      </div>
      <p className="text-2xl font-black text-white leading-none mb-1">{value}</p>
      {sub && <p className="text-xs text-zinc-500">{sub}</p>}
    </div>
  );
}

// ─── DASHBOARD TAB ────────────────────────────────────────────────────
function DashboardTab({ products, leads, orders }: { products: StoreProduct[]; leads: Lead[]; orders: Order[] }) {
  const revenue = orders.reduce((s, o) => s + o.total, 0);
  const newOrders = orders.filter((o) => o.status === "new").length;
  const newLeads = leads.filter((l) => l.status === "new").length;
  const conversion = leads.length ? Math.round((orders.length / leads.length) * 100) : 0;
  const inStock = products.filter((p) => p.inStock).length;
  const outStock = products.length - inStock;

  const activity = [
    ...orders.slice(0, 6).map((o) => ({ type: "order" as const, id: o.id, title: o.customer.name, sub: fmtMDL(o.total), time: o.timestamp, status: o.status as string })),
    ...leads.slice(0, 6).map((l) => ({ type: "lead" as const, id: l.id, title: l.name, sub: l.phone, time: l.timestamp, status: l.status as string })),
  ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 10);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Venituri Totale" value={fmtMDL(revenue)} sub={`${orders.length} comenzi`} icon={TrendingUp} accent="bg-[#FF4F00]/15 text-[#FF4F00]" />
        <KpiCard title="Comenzi Noi" value={String(newOrders)} sub={`din ${orders.length} total`} icon={ShoppingBag} accent="bg-amber-500/15 text-amber-400" />
        <KpiCard title="Lead-uri Noi" value={String(newLeads)} sub={`din ${leads.length} total`} icon={Users} accent="bg-blue-500/15 text-blue-400" />
        <KpiCard title="Conversie" value={`${conversion}%`} sub="leads → comenzi" icon={BarChart3} accent="bg-green-500/15 text-green-400" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity feed */}
        <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between">
            <h3 className="font-bold text-sm">Activitate Recentă</h3>
            <span className="text-xs text-zinc-500">{activity.length} înregistrări</span>
          </div>
          {activity.length === 0 ? (
            <div className="py-14 text-center text-zinc-600 text-sm">
              <Clock className="w-10 h-10 mx-auto mb-3 opacity-20" />
              Nicio activitate încă.<br />
              <span className="text-xs">Comenzile și lead-urile vor apărea aici.</span>
            </div>
          ) : (
            <div className="divide-y divide-zinc-800/50">
              {activity.map((item) => {
                const isOrder = item.type === "order";
                const cfg = isOrder
                  ? ORDER_CFG[item.status as keyof typeof ORDER_CFG]
                  : LEAD_CFG[item.status as keyof typeof LEAD_CFG];
                return (
                  <div key={item.id} className="px-5 py-3.5 flex items-center gap-3 hover:bg-zinc-800/30 transition-colors">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${isOrder ? "bg-[#FF4F00]/15" : "bg-blue-500/15"}`}>
                      {isOrder ? <ShoppingBag className="w-4 h-4 text-[#FF4F00]" /> : <Users className="w-4 h-4 text-blue-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{item.title}</p>
                      <p className="text-xs text-zinc-500 font-mono truncate">{item.sub}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      {cfg && <StatusBadge cfg={cfg} />}
                      <p className="text-[10px] text-zinc-600 mt-0.5">{fmtDate(item.time)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right column stats */}
        <div className="flex flex-col gap-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
            <h3 className="font-bold text-sm mb-4 flex items-center gap-2"><Package className="w-4 h-4 text-zinc-400" /> Catalog</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-zinc-400">Total produse</span><span className="font-bold">{products.length}</span></div>
              <div className="flex justify-between"><span className="text-zinc-400 flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-400" />În stoc</span><span className="font-bold text-green-400">{inStock}</span></div>
              <div className="flex justify-between"><span className="text-zinc-400 flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-400" />Lipsă stoc</span><span className="font-bold text-red-400">{outStock}</span></div>
            </div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
            <h3 className="font-bold text-sm mb-4 flex items-center gap-2"><ShoppingBag className="w-4 h-4 text-zinc-400" /> Comenzi</h3>
            <div className="space-y-2.5">
              {(["new", "confirmed", "delivered"] as const).map((s) => {
                const count = orders.filter((o) => o.status === s).length;
                return (
                  <div key={s} className="flex items-center justify-between">
                    <StatusBadge cfg={ORDER_CFG[s]} />
                    <span className="font-bold text-sm">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
            <h3 className="font-bold text-sm mb-4 flex items-center gap-2"><Users className="w-4 h-4 text-zinc-400" /> Lead-uri CRM</h3>
            <div className="space-y-2.5">
              {(["new", "contacted", "converted"] as const).map((s) => {
                const count = leads.filter((l) => l.status === s).length;
                return (
                  <div key={s} className="flex items-center justify-between">
                    <StatusBadge cfg={LEAD_CFG[s]} />
                    <span className="font-bold text-sm">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── PRODUCTS TAB ─────────────────────────────────────────────────────
function ProductsTab({ products }: { products: StoreProduct[] }) {
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [editProduct, setEditProduct] = useState<StoreProduct | null | "new">(null);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [showImport, setShowImport] = useState(false);

  const filtered = useMemo(() =>
    products.filter((p) =>
      (!search || p.name.toLowerCase().includes(search.toLowerCase()) || p.brand.toLowerCase().includes(search.toLowerCase()) || p.model.toLowerCase().includes(search.toLowerCase())) &&
      (!catFilter || p.category === catFilter)
    ), [products, search, catFilter]);

  return (
    <div>
      {showImport && <ImportModal onClose={() => setShowImport(false)} />}
      {editProduct !== null && (
        <ProductModal product={editProduct === "new" ? null : editProduct} onClose={() => setEditProduct(null)} />
      )}
      {confirmDelete !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-sm text-center">
            <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <Trash className="w-6 h-6 text-red-400" />
            </div>
            <h3 className="font-bold text-lg mb-1">Ștergi produsul?</h3>
            <p className="text-zinc-400 text-sm mb-6">Această acțiune este ireversibilă.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 bg-zinc-800 text-white font-semibold py-2.5 rounded-xl hover:bg-zinc-700">Anulează</button>
              <button onClick={() => { storeActions.deleteProduct(confirmDelete); setConfirmDelete(null); }} className="flex-1 bg-red-600 text-white font-bold py-2.5 rounded-xl hover:bg-red-700">Șterge</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
        <div className="flex-1">
          <h2 className="font-black text-xl">Catalog Produse</h2>
          <p className="text-zinc-500 text-xs mt-0.5">{filtered.length} din {products.length} produse</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => { if (window.confirm("Resetezi catalogul? Toate modificările se pierd!")) storeActions.resetToDefaults(); }}
            className="flex items-center gap-1.5 bg-zinc-800 text-zinc-400 hover:text-white px-3 py-2 rounded-xl text-xs font-semibold transition-colors">
            <RefreshCw className="w-3.5 h-3.5" /> Reset
          </button>
          <button onClick={() => setShowImport(true)}
            className="flex items-center gap-2 bg-zinc-800 border border-zinc-700 text-zinc-200 hover:text-white hover:border-zinc-500 px-4 py-2 rounded-xl text-sm font-semibold transition-all">
            <SlidersHorizontal className="w-4 h-4 text-green-400" /> Import Excel
          </button>
          <button onClick={() => setEditProduct("new")}
            className="flex items-center gap-2 bg-[#FF4F00] text-white px-4 py-2 rounded-xl text-sm font-bold hover:opacity-90 active:scale-95 transition-all">
            <Plus className="w-4 h-4" /> Adaugă
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input type="text" placeholder="Caută după nume, brand, model..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-zinc-600 placeholder:text-zinc-600" />
          {search && <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"><X className="w-4 h-4" /></button>}
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {["", ...CATEGORIES].map((c) => (
            <button key={c} onClick={() => setCatFilter(c)}
              className={`flex-shrink-0 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${catFilter === c ? "bg-[#FF4F00] text-white" : "bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white"}`}>
              {c || "Toate"}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="text-left px-4 py-3 text-zinc-500 font-semibold text-[11px] uppercase tracking-wider w-10">ID</th>
                <th className="text-left px-4 py-3 text-zinc-500 font-semibold text-[11px] uppercase tracking-wider w-10">Img</th>
                <th className="text-left px-4 py-3 text-zinc-500 font-semibold text-[11px] uppercase tracking-wider">Produs</th>
                <th className="text-left px-4 py-3 text-zinc-500 font-semibold text-[11px] uppercase tracking-wider hidden md:table-cell">Categorie</th>
                <th className="text-right px-4 py-3 text-zinc-500 font-semibold text-[11px] uppercase tracking-wider">Preț</th>
                <th className="text-center px-4 py-3 text-zinc-500 font-semibold text-[11px] uppercase tracking-wider hidden sm:table-cell">Stoc</th>
                <th className="text-center px-4 py-3 text-zinc-500 font-semibold text-[11px] uppercase tracking-wider">Acțiuni</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="py-12 text-center text-zinc-600 text-sm">Niciun produs găsit</td></tr>
              ) : filtered.map((p) => (
                <tr key={p.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
                  <td className="px-4 py-3 text-zinc-600 font-mono text-xs">#{p.id}</td>
                  <td className="px-4 py-3">
                    <div className="w-9 h-9 rounded-lg overflow-hidden bg-zinc-800 flex-shrink-0">
                      <img src={p.imageUrl} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.opacity = "0.2"; }} />
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-white text-xs leading-tight truncate max-w-[180px]">{p.name}</p>
                    <p className="text-zinc-500 text-[10px] font-mono">{p.brand} · {p.model}</p>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-1 rounded-full">{p.category}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="font-mono font-bold text-[#FF4F00] text-sm">{fmt(p.price)}</span>
                    <span className="text-zinc-600 text-[10px]"> MDL</span>
                    {p.oldPrice && <p className="text-zinc-600 text-[10px] font-mono line-through">{fmt(p.oldPrice)}</p>}
                  </td>
                  <td className="px-4 py-3 text-center hidden sm:table-cell">
                    <button onClick={() => storeActions.updateProduct(p.id, { inStock: !p.inStock })}
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full transition-colors ${p.inStock ? "bg-green-500/10 text-green-400 hover:bg-green-500/20" : "bg-red-500/10 text-red-400 hover:bg-red-500/20"}`}>
                      {p.inStock ? "✓ Stoc" : "✕ Lipsă"}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => setEditProduct(p)} className="p-1.5 rounded-lg hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors" title="Editează">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setConfirmDelete(p.id)} className="p-1.5 rounded-lg hover:bg-red-900/30 text-zinc-400 hover:text-red-400 transition-colors" title="Șterge">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── ORDERS TAB ────────────────────────────────────────────────────────
function OrdersTab({ orders, adminPhone }: { orders: Order[]; adminPhone: string }) {
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() =>
    orders.filter((o) =>
      (statusFilter === "all" || o.status === statusFilter) &&
      (!search || o.customer.name.toLowerCase().includes(search.toLowerCase()) || o.customer.phone.includes(search))
    ), [orders, statusFilter, search]);

  const revenue = filtered.reduce((s, o) => s + o.total, 0);
  const avgOrder = filtered.length ? Math.round(revenue / filtered.length) : 0;

  const waMsg = (o: Order) => {
    const ref = o.id.slice(0, 8).toUpperCase();
    const lines = o.items.map((i) => `  • ${i.qty}× ${i.name}`).join("\n");
    return encodeURIComponent(`Bună ziua ${o.customer.name}! Confirmăm comanda dvs #${ref} plasată pe TECO.MD.\n\nProduse:\n${lines}\n\nTotal: ${fmtMDL(o.total)}\n\nVă vom contacta în scurt timp pentru detalii livrare. Mulțumim!`);
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
        <div className="flex-1">
          <h2 className="font-black text-xl">Comenzi</h2>
          <p className="text-zinc-500 text-xs mt-0.5">{filtered.length} comenzi · {fmtMDL(revenue)} total</p>
        </div>
      </div>

      {/* Revenue summary */}
      {orders.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-center">
            <p className="text-zinc-500 text-[10px] uppercase tracking-wider mb-1">Total venituri</p>
            <p className="font-black text-lg text-[#FF4F00]">{fmtMDL(orders.reduce((s, o) => s + o.total, 0))}</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-center">
            <p className="text-zinc-500 text-[10px] uppercase tracking-wider mb-1">Valoare medie</p>
            <p className="font-black text-lg text-white">{fmtMDL(orders.length ? Math.round(orders.reduce((s, o) => s + o.total, 0) / orders.length) : 0)}</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-center">
            <p className="text-zinc-500 text-[10px] uppercase tracking-wider mb-1">Comenzi noi</p>
            <p className="font-black text-lg text-amber-400">{orders.filter((o) => o.status === "new").length}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input type="text" placeholder="Caută după nume, telefon..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-zinc-600 placeholder:text-zinc-600" />
          {search && <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"><X className="w-4 h-4" /></button>}
        </div>
        <div className="flex gap-2">
          {[["all", "Toate"], ["new", "Noi"], ["confirmed", "Confirmate"], ["delivered", "Livrate"]].map(([v, l]) => (
            <button key={v} onClick={() => setStatusFilter(v)}
              className={`flex-shrink-0 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${statusFilter === v ? "bg-[#FF4F00] text-white" : "bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white"}`}>
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* Order list */}
      {filtered.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl py-14 text-center text-zinc-600">
          <ShoppingBag className="w-10 h-10 mx-auto mb-3 opacity-20" />
          <p className="text-sm">Nicio comandă {statusFilter !== "all" ? "cu acest status" : "plasată încă"}.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((o) => {
            const cfg = ORDER_CFG[o.status];
            const isExpanded = expandedId === o.id;
            return (
              <div key={o.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <p className="font-bold text-white">{o.customer.name}</p>
                        <StatusBadge cfg={cfg} />
                        <span className="text-zinc-600 text-[10px] font-mono">#{o.id.slice(0, 8).toUpperCase()}</span>
                      </div>
                      <p className="text-zinc-400 text-sm font-mono">{o.customer.phone}</p>
                      {o.customer.email && <p className="text-zinc-500 text-xs">{o.customer.email}</p>}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-mono font-black text-xl text-[#FF4F00]">{fmtMDL(o.total)}</p>
                      <p className="text-zinc-600 text-[10px] mt-0.5">{fmtDate(o.timestamp)}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-4 flex-wrap">
                    {/* Status change */}
                    <select value={o.status} onChange={(e) => storeActions.updateOrderStatus(o.id, e.target.value as any)}
                      className="bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-zinc-600">
                      <option value="new">Nouă</option>
                      <option value="confirmed">Confirmată</option>
                      <option value="delivered">Livrată</option>
                    </select>
                    {/* WhatsApp confirm */}
                    {adminPhone && (
                      <a href={`https://wa.me/${o.customer.phone.replace(/\D/g, "")}?text=${waMsg(o)}`} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1 bg-[#25D366]/15 text-[#25D366] hover:bg-[#25D366]/25 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors">
                        <Phone className="w-3 h-3" /> WhatsApp client
                      </a>
                    )}
                    <button onClick={() => setExpandedId(isExpanded ? null : o.id)}
                      className="flex items-center gap-1 text-zinc-500 hover:text-white text-xs font-semibold px-2 py-1.5 rounded-lg hover:bg-zinc-800 transition-colors ml-auto">
                      {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                      {isExpanded ? "Ascunde" : "Detalii"}
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-zinc-800 bg-zinc-950/50 p-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-zinc-500 text-[10px] uppercase tracking-wider mb-1">Adresă livrare</p>
                        <p className="text-sm text-white">{o.customer.address || "Ridicare din depozit"}</p>
                        <p className="text-xs text-zinc-400 mt-0.5">{o.customer.delivery}</p>
                      </div>
                    </div>
                    <p className="text-zinc-500 text-[10px] uppercase tracking-wider mb-2">Produse comandate</p>
                    <div className="space-y-1.5">
                      {o.items.map((item, i) => (
                        <div key={i} className="flex justify-between text-sm">
                          <span className="text-zinc-300">{item.qty}× {item.name}</span>
                          <span className="font-mono text-zinc-400">{fmtMDL(item.price * item.qty)}</span>
                        </div>
                      ))}
                      <div className="flex justify-between text-sm font-bold border-t border-zinc-800 pt-2 mt-2">
                        <span className="text-white">Total</span>
                        <span className="text-[#FF4F00] font-mono">{fmtMDL(o.total)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── LEADS TAB ─────────────────────────────────────────────────────────
function LeadsTab({ leads, adminPhone }: { leads: Lead[]; adminPhone: string }) {
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [noteEditing, setNoteEditing] = useState<string | null>(null);
  const [noteVal, setNoteVal] = useState("");

  const filtered = useMemo(() =>
    leads.filter((l) =>
      (statusFilter === "all" || l.status === statusFilter) &&
      (!search || l.name.toLowerCase().includes(search.toLowerCase()) || l.phone.includes(search))
    ), [leads, statusFilter, search]);

  const saveNote = (id: string) => {
    storeActions.updateLeadNotes(id, noteVal);
    setNoteEditing(null);
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
        <div className="flex-1">
          <h2 className="font-black text-xl">Lead-uri CRM</h2>
          <p className="text-zinc-500 text-xs mt-0.5">{filtered.length} din {leads.length} lead-uri</p>
        </div>
      </div>

      {/* Pipeline summary */}
      {leads.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-5">
          {(["new", "contacted", "converted"] as const).map((s) => {
            const count = leads.filter((l) => l.status === s).length;
            const pct = leads.length ? Math.round((count / leads.length) * 100) : 0;
            const cfg = LEAD_CFG[s];
            return (
              <div key={s} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                <StatusBadge cfg={cfg} />
                <p className="font-black text-2xl text-white mt-2">{count}</p>
                <div className="mt-2 bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                  <div className={`h-full rounded-full ${cfg.dot}`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input type="text" placeholder="Caută după nume, telefon..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-zinc-600 placeholder:text-zinc-600" />
          {search && <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"><X className="w-4 h-4" /></button>}
        </div>
        <div className="flex gap-2">
          {[["all", "Toate"], ["new", "Noi"], ["contacted", "Contactate"], ["converted", "Convertite"]].map(([v, l]) => (
            <button key={v} onClick={() => setStatusFilter(v)}
              className={`flex-shrink-0 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${statusFilter === v ? "bg-[#FF4F00] text-white" : "bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white"}`}>
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* Leads list */}
      {filtered.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl py-14 text-center text-zinc-600">
          <Users className="w-10 h-10 mx-auto mb-3 opacity-20" />
          <p className="text-sm">Niciun lead {statusFilter !== "all" ? "cu acest status" : "colectat încă"}.</p>
          <p className="text-xs mt-1">Lead-urile vin din Calculator și formularul de Contact.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((l) => {
            const cfg = LEAD_CFG[l.status] ?? LEAD_CFG.new;
            const isExpanded = expandedId === l.id;
            const waText = encodeURIComponent(`Bună ziua ${l.name}! Vă contactăm de la TECO.MD în legătură cu cererea dvs de consultanță pentru sisteme de supraveghere. Aveți câteva minute pentru a discuta?`);
            return (
              <div key={l.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center flex-shrink-0">
                      <Users className="w-5 h-5 text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <p className="font-bold text-white">{l.name}</p>
                        <StatusBadge cfg={cfg} />
                        <span className="text-[10px] bg-zinc-800 text-zinc-500 px-2 py-0.5 rounded-full">{l.source}</span>
                      </div>
                      <p className="text-[#FF4F00] font-mono text-sm">{l.phone}</p>
                    </div>
                    <p className="text-[10px] text-zinc-600 flex-shrink-0">{fmtDate(l.timestamp)}</p>
                  </div>

                  <div className="flex items-center gap-2 mt-3 flex-wrap">
                    {/* Status */}
                    <select value={l.status} onChange={(e) => storeActions.updateLeadStatus(l.id, e.target.value as any)}
                      className="bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-zinc-600">
                      <option value="new">Nou</option>
                      <option value="contacted">Contactat</option>
                      <option value="converted">Convertit</option>
                    </select>
                    {/* WhatsApp */}
                    {adminPhone && (
                      <a href={`https://wa.me/${l.phone.replace(/\D/g, "")}?text=${waText}`} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1 bg-[#25D366]/15 text-[#25D366] hover:bg-[#25D366]/25 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors">
                        <Phone className="w-3 h-3" /> WhatsApp
                      </a>
                    )}
                    {/* Viber */}
                    {adminPhone && (
                      <a href={`viber://chat?number=${l.phone.replace(/\D/g, "")}`}
                        className="flex items-center gap-1 bg-[#7360F2]/15 text-[#7360F2] hover:bg-[#7360F2]/25 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors">
                        <MessageCircle className="w-3 h-3" /> Viber
                      </a>
                    )}
                    <button onClick={() => storeActions.deleteLead(l.id)}
                      className="p-1.5 rounded-lg hover:bg-red-900/30 text-zinc-600 hover:text-red-400 transition-colors ml-auto" title="Șterge lead">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setExpandedId(isExpanded ? null : l.id)}
                      className="flex items-center gap-1 text-zinc-500 hover:text-white text-xs font-semibold px-2 py-1.5 rounded-lg hover:bg-zinc-800 transition-colors">
                      {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                      {isExpanded ? "Ascunde" : "Detalii"}
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-zinc-800 bg-zinc-950/50 p-4 space-y-3">
                    {l.selections && Object.keys(l.selections).length > 0 && (
                      <div>
                        <p className="text-zinc-500 text-[10px] uppercase tracking-wider mb-2">Selecții Calculator</p>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(l.selections).map(([k, v]) => v && (
                            <span key={k} className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-1 rounded-lg">{k}: <span className="text-white">{v}</span></span>
                          ))}
                        </div>
                      </div>
                    )}
                    <div>
                      <p className="text-zinc-500 text-[10px] uppercase tracking-wider mb-1">Note interne</p>
                      {noteEditing === l.id ? (
                        <div className="flex gap-2">
                          <input autoFocus type="text" value={noteVal} onChange={(e) => setNoteVal(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") saveNote(l.id); if (e.key === "Escape") setNoteEditing(null); }}
                            className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-[#FF4F00]" placeholder="Adaugă notă..." />
                          <button onClick={() => saveNote(l.id)} className="bg-[#FF4F00] text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:opacity-90">Salvează</button>
                          <button onClick={() => setNoteEditing(null)} className="bg-zinc-700 text-white px-3 py-1.5 rounded-lg text-xs hover:bg-zinc-600">✕</button>
                        </div>
                      ) : (
                        <button onClick={() => { setNoteEditing(l.id); setNoteVal(l.notes ?? ""); }}
                          className="text-xs text-zinc-500 hover:text-white transition-colors flex items-center gap-1">
                          <Edit2 className="w-3 h-3" />
                          {l.notes ? l.notes : "Adaugă notă internă..."}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── SETTINGS TAB ──────────────────────────────────────────────────────
function SettingsTab({ settings, products }: { settings: ModuleSettings; products: StoreProduct[] }) {
  return (
    <div className="space-y-6 max-w-2xl">
      <h2 className="font-black text-xl">Setări</h2>

      {/* Store appearance */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
        <h3 className="font-bold mb-1 flex items-center gap-2"><Megaphone className="w-4 h-4 text-[#FF4F00]" /> Anunț Banner</h3>
        <p className="text-zinc-500 text-xs mb-4">Textul afișat în bara de sus a magazinului. Lasă gol pentru mesajele automate.</p>
        <label className="block text-[11px] font-semibold text-zinc-400 mb-1 uppercase tracking-wider">Text Anunț</label>
        <input type="text" placeholder="ex: Reduceri de Vară — 20% la toate camerele!"
          value={settings.general?.announcementText ?? ""}
          onChange={(e) => storeActions.updateGeneral({ announcementText: e.target.value })}
          className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#FF4F00]" />
        <p className="text-zinc-600 text-xs mt-2">Dacă câmpul este gol, se afișează mesajele implicite rotate automat.</p>
      </div>

      {/* WhatsApp / Viber */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
        <h3 className="font-bold mb-1 flex items-center gap-2"><span className="text-base">📱</span> Notificări WhatsApp & Viber</h3>
        <p className="text-zinc-500 text-xs mb-4">Numărul tău de contact. Lead-urile și comenzile vor trimite automat mesaje pre-completate.</p>
        <label className="block text-[11px] font-semibold text-zinc-400 mb-1 uppercase tracking-wider">Număr (cu prefix, fără +)</label>
        <input type="tel" placeholder="ex: 37369123456"
          value={settings.general?.adminPhone ?? ""}
          onChange={(e) => storeActions.updateGeneral({ adminPhone: e.target.value.replace(/\D/g, "") })}
          className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#FF4F00] font-mono" />
        {settings.general?.adminPhone ? (
          <p className="text-[#10B981] text-xs mt-2 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" /> Activ — wa.me/{settings.general.adminPhone}
          </p>
        ) : (
          <p className="text-zinc-600 text-xs mt-2">Completează pentru a activa notificările instant.</p>
        )}
      </div>

      {/* Hero product */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
        <h3 className="font-bold mb-1 flex items-center gap-2"><Star className="w-4 h-4 text-[#FF4F00]" /> Hero — Produs Promovat pe Pagina Principală</h3>
        <p className="text-zinc-500 text-xs mb-4">Produsul afișat în cardul „Ofertă Limitată" din hero. Fotografia lui apare ca imagine principală — apasă pe poză pentru a ajunge la pagina produsului.</p>
        <select value={settings.hero?.productId ?? ""}
          onChange={(e) => storeActions.updateHero(e.target.value ? Number(e.target.value) : null)}
          className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#FF4F00]">
          <option value="">— Niciun produs (implicit) —</option>
          {products.map((p) => <option key={p.id} value={p.id}>{p.brand} — {p.name} ({fmt(p.price)} MDL)</option>)}
        </select>
        {settings.hero?.productId && (() => {
          const hp = products.find(p => p.id === settings.hero.productId);
          return hp ? (
            <div className="mt-3 flex items-center gap-3 bg-zinc-800 rounded-xl p-3">
              <img src={hp.imageUrl} alt={hp.name} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
              <div>
                <p className="text-white font-semibold text-sm">{hp.name}</p>
                <p className="text-[#FF4F00] font-mono text-xs">{fmt(hp.price)} MDL</p>
              </div>
              <CheckCircle2 className="w-4 h-4 text-emerald-400 ml-auto" />
            </div>
          ) : null;
        })()}
      </div>

      {/* Module A */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
        <h3 className="font-bold mb-1 flex items-center gap-2"><Zap className="w-4 h-4 text-[#FF4F00]" /> Modulul A — Calculator Costuri</h3>
        <p className="text-zinc-500 text-xs mb-4">Produsul recomandat afișat după completarea calculatorului.</p>
        <select value={settings.moduleA.productId ?? ""}
          onChange={(e) => storeActions.updateModuleA(e.target.value ? Number(e.target.value) : null)}
          className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#FF4F00]">
          <option value="">— Niciun produs —</option>
          {products.map((p) => <option key={p.id} value={p.id}>{p.brand} — {p.name} ({fmt(p.price)} MDL)</option>)}
        </select>
      </div>

      {/* Module B */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
        <h3 className="font-bold mb-1 flex items-center gap-2"><SlidersHorizontal className="w-4 h-4 text-[#FF4F00]" /> Modulul B — ColorHunter Slider</h3>
        <p className="text-zinc-500 text-xs mb-4">Imaginile și produsul afișat lângă sliderul comparativ zi/noapte.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-[11px] font-semibold text-zinc-400 mb-1 uppercase tracking-wider">URL Imagine IR (stânga)</label>
            <input type="text" value={settings.moduleB.imageLeft} onChange={(e) => storeActions.updateModuleB({ imageLeft: e.target.value })}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#FF4F00]" />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-zinc-400 mb-1 uppercase tracking-wider">URL Imagine Color (dreapta)</label>
            <input type="text" value={settings.moduleB.imageRight} onChange={(e) => storeActions.updateModuleB({ imageRight: e.target.value })}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#FF4F00]" />
          </div>
        </div>
        <label className="block text-[11px] font-semibold text-zinc-400 mb-1 uppercase tracking-wider">Produs ColorHunter</label>
        <select value={settings.moduleB.productId ?? ""}
          onChange={(e) => storeActions.updateModuleB({ productId: e.target.value ? Number(e.target.value) : null })}
          className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#FF4F00]">
          <option value="">— Niciun produs —</option>
          {products.map((p) => <option key={p.id} value={p.id}>{p.brand} — {p.name} ({fmt(p.price)} MDL)</option>)}
        </select>
      </div>

      {/* Module C */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
        <h3 className="font-bold mb-1 flex items-center gap-2"><BarChart3 className="w-4 h-4 text-[#FF4F00]" /> Modulul C — Comparator Branduri</h3>
        <p className="text-zinc-500 text-xs mb-4">Produsul afișat lângă simulatorul de imagine pentru fiecare brand.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {brands.map((b) => (
            <div key={b}>
              <label className="block text-[11px] font-semibold text-zinc-400 mb-1 uppercase tracking-wider">{b}</label>
              <select value={settings.moduleC[b] ?? ""}
                onChange={(e) => storeActions.updateModuleC(b, e.target.value ? Number(e.target.value) : null)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#FF4F00]">
                <option value="">— Niciun produs —</option>
                {products.map((p) => <option key={p.id} value={p.id}>{p.name} ({fmt(p.price)} MDL)</option>)}
              </select>
            </div>
          ))}
        </div>
      </div>

      {/* Danger zone */}
      <div className="bg-red-950/20 border border-red-900/40 rounded-2xl p-6">
        <h3 className="font-bold text-red-400 mb-1 flex items-center gap-2"><AlertCircle className="w-4 h-4" /> Zonă Periculoasă</h3>
        <p className="text-zinc-500 text-xs mb-4">Resetează catalogul de produse la valorile implicite. Lead-urile și comenzile NU se șterg.</p>
        <button onClick={() => { if (window.confirm("Ești sigur? Toate modificările aduse produselor se vor pierde!")) storeActions.resetToDefaults(); }}
          className="flex items-center gap-2 bg-red-600/20 text-red-400 border border-red-600/30 hover:bg-red-600/30 px-4 py-2 rounded-xl text-sm font-semibold transition-colors">
          <RefreshCw className="w-3.5 h-3.5" /> Reset Catalog la Produse Implicite
        </button>
      </div>
    </div>
  );
}

// ─── MAIN ADMIN ──────────────────────────────────────────────────────
const NAV: { key: Tab; label: string; icon: React.ElementType }[] = [
  { key: "dashboard", label: "Dashboard",  icon: LayoutDashboard },
  { key: "products",  label: "Produse",    icon: Package         },
  { key: "orders",    label: "Comenzi",    icon: ShoppingBag     },
  { key: "leads",     label: "Lead-uri",   icon: Users           },
  { key: "settings",  label: "Setări",     icon: Settings        },
];

export default function Admin() {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem("teco_admin") === "1");
  const [tab, setTab] = useState<Tab>("dashboard");

  const products = useStore((s) => s.products);
  const leads    = useStore((s) => s.leads);
  const orders   = useStore((s) => s.orders);
  const settings = useStore((s) => s.settings);

  if (!authed) return <PinGate onAuth={() => setAuthed(true)} />;

  const logout = () => { sessionStorage.removeItem("teco_admin"); setAuthed(false); };

  const badgeCount: Partial<Record<Tab, number>> = {
    orders: orders.filter((o) => o.status === "new").length || undefined,
    leads:  leads.filter((l) => l.status === "new").length || undefined,
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex">
      {/* ─── Sidebar (desktop) ─── */}
      <aside className="hidden lg:flex flex-col w-60 flex-shrink-0 border-r border-zinc-800 sticky top-0 h-screen">
        {/* Brand */}
        <div className="px-5 py-5 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-[#FF4F00] rounded-lg flex items-center justify-center">
              <ShieldCheck className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <p className="font-black text-sm leading-none">TECO<span className="text-[#FF4F00]">.</span>MD</p>
              <p className="text-zinc-500 text-[10px] mt-0.5">Panou Admin</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV.map(({ key, label, icon: Icon }) => {
            const count = badgeCount[key];
            return (
              <button key={key} onClick={() => setTab(key)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${tab === key ? "bg-[#FF4F00] text-white shadow-lg shadow-[#FF4F00]/20" : "text-zinc-400 hover:text-white hover:bg-zinc-800"}`}>
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1 text-left">{label}</span>
                {count ? (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${tab === key ? "bg-white/25 text-white" : "bg-amber-500/20 text-amber-400"}`}>{count}</span>
                ) : null}
              </button>
            );
          })}
        </nav>

        {/* Bottom links */}
        <div className="px-3 py-4 border-t border-zinc-800 space-y-1">
          <a href="/" target="_blank" rel="noreferrer"
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-zinc-500 hover:text-white hover:bg-zinc-800 transition-all">
            <Eye className="w-4 h-4" /> Vizualizează Magazin
          </a>
          <button onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-zinc-500 hover:text-red-400 hover:bg-red-900/20 transition-all">
            <LogOut className="w-4 h-4" /> Deconectare
          </button>
        </div>
      </aside>

      {/* ─── Main content ─── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar (mobile header + desktop breadcrumb) */}
        <header className="sticky top-0 z-10 bg-zinc-950/95 backdrop-blur border-b border-zinc-800 px-4 lg:px-6 py-3 flex items-center gap-3">
          <div className="lg:hidden flex items-center gap-2 mr-2">
            <div className="w-7 h-7 bg-[#FF4F00] rounded-lg flex items-center justify-center">
              <ShieldCheck className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-black text-sm">TECO<span className="text-[#FF4F00]">.</span>MD</span>
          </div>
          <h1 className="font-bold text-base hidden lg:block">
            {NAV.find((n) => n.key === tab)?.label}
          </h1>
          <div className="ml-auto flex items-center gap-2">
            <a href="/" target="_blank" rel="noreferrer"
              className="hidden sm:flex items-center gap-1.5 text-xs text-zinc-500 hover:text-white transition-colors bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-lg">
              <Eye className="w-3.5 h-3.5" /> Magazin
            </a>
            <button onClick={logout}
              className="text-xs text-zinc-500 hover:text-red-400 transition-colors bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
              <LogOut className="w-3.5 h-3.5" /> Ieșire
            </button>
          </div>
        </header>

        {/* Mobile tab bar */}
        <div className="lg:hidden flex gap-1 overflow-x-auto no-scrollbar px-4 py-3 border-b border-zinc-800 bg-zinc-950">
          {NAV.map(({ key, label, icon: Icon }) => {
            const count = badgeCount[key];
            return (
              <button key={key} onClick={() => setTab(key)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${tab === key ? "bg-[#FF4F00] text-white" : "bg-zinc-900 text-zinc-400 hover:text-white"}`}>
                <Icon className="w-3.5 h-3.5" />
                {label}
                {count ? <span className="bg-amber-500 text-white text-[9px] font-bold px-1 py-0.5 rounded-full">{count}</span> : null}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <main className="flex-1 px-4 lg:px-6 py-6 overflow-auto">
          {tab === "dashboard" && <DashboardTab products={products} leads={leads} orders={orders} />}
          {tab === "products"  && <ProductsTab products={products} />}
          {tab === "orders"    && <OrdersTab orders={orders} adminPhone={settings.general?.adminPhone ?? ""} />}
          {tab === "leads"     && <LeadsTab leads={leads} adminPhone={settings.general?.adminPhone ?? ""} />}
          {tab === "settings"  && <SettingsTab settings={settings} products={products} />}
        </main>
      </div>
    </div>
  );
}
