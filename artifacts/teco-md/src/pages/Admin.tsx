import { useState, useMemo, useRef, useCallback } from "react";
import {
  LayoutDashboard, Package, ShoppingBag, Users, Settings, LogOut,
  ShieldCheck, Eye, EyeOff, Plus, Edit2, Trash2, X, Save, Search,
  RefreshCw, Trash, TrendingUp, Phone, MessageCircle, ChevronDown,
  ChevronRight, BarChart3, Megaphone, Clock, Tag, Zap, CheckCircle2,
  AlertCircle, Circle, SlidersHorizontal, Star, Copy, Download,
  Globe, Truck, Lock, Building2, ArrowUp, ArrowDown, Instagram,
  Facebook, ArrowUpDown, CheckSquare, Square, Upload, Video,
  Bot, Sparkles, Wand2, Loader2, BrainCircuit, FileText, Wrench,
} from "lucide-react";
import translations from "@/lib/translations";
import {
  useStore, storeActions, initStore,
  type StoreProduct, type Lead, type Order, type ModuleSettings, type CategoryDef, type GalleryItem, type BlogPost,
  getState, DEFAULT_CATEGORIES,
} from "@/lib/store";
import { ImportModal } from "@/components/ImportModal";
import { SEO } from "@/components/SEO";

const ADMIN_PIN_FALLBACK = "teco2025";
const brands = ["TAPO", "REOLINK", "UNIARCH", "DAHUA", "UNIVIEW", "TIANDY"] as const;
type Tab = "dashboard" | "products" | "orders" | "leads" | "blog" | "settings" | "ai" | "import";

// ─── Helpers ────────────────────────────────────────────────────────
const fmt     = (n: number) => n.toLocaleString("ro-MD");
const fmtMDL  = (n: number) => fmt(n) + " MDL";
const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString("ro-MD", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

function exportCSV(filename: string, headers: string[], rows: (string | number)[][][]) {
  const escape = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  const lines = [
    headers.map(escape).join(","),
    ...rows.map((row) => row.map(([v]) => escape(v)).join(",")),
  ];
  const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

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
function PinGate({ onAuth, effectivePin }: { onAuth: () => void; effectivePin: string }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const [show, setShow] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === effectivePin) { sessionStorage.setItem("teco_admin", "1"); onAuth(); }
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
  name: "", model: "", brand: brands[0], category: "wifi",
  price: "", oldPrice: "", specs: "", badge: "",
  imageUrl: "", description: "", longDescription: "", techSpecs: "", inStock: true,
};

async function compressImage(file: File, maxPx = 1200, quality = 0.82): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxPx / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = e.target!.result as string;
    };
    reader.readAsDataURL(file);
  });
}

function ImageSlot({
  url, label, isPrimary = false, uploading,
  onFile, onRemove, onUrlChange,
}: {
  url: string; label: string; isPrimary?: boolean; uploading?: boolean;
  onFile: (f: File) => void; onRemove?: () => void; onUrlChange: (u: string) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">{label}</p>
      <div
        className={`relative rounded-xl overflow-hidden border-2 border-dashed ${url ? "border-zinc-700" : "border-zinc-700 hover:border-zinc-500"} bg-zinc-800 transition-colors`}
        style={{ aspectRatio: "4/3" }}
      >
        {url ? (
          <>
            <img src={url} alt="" className="w-full h-full object-cover" />
            {onRemove && (
              <button onClick={onRemove} className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors">
                <X className="w-3.5 h-3.5 text-white" />
              </button>
            )}
          </>
        ) : uploading ? (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-5 h-5 border-2 border-[#FF4F00] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <button onClick={() => fileRef.current?.click()} className="w-full h-full flex flex-col items-center justify-center gap-1 text-zinc-600 hover:text-zinc-400 transition-colors">
            <Plus className="w-6 h-6" />
            <span className="text-[10px]">Adaugă foto</span>
          </button>
        )}
      </div>
      <div className="flex gap-1">
        <button type="button" onClick={() => fileRef.current?.click()} className="flex-1 text-[10px] bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-lg px-2 py-1 transition-colors">
          {url ? "Schimbă" : "Upload"}
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) { onFile(f); e.target.value = ""; } }} />
      </div>
      <input type="text" placeholder="sau URL imagine..." value={url}
        onChange={(e) => onUrlChange(e.target.value)}
        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1 text-xs text-zinc-300 focus:outline-none focus:border-zinc-600 placeholder:text-zinc-600" />
    </div>
  );
}

// ─── MediaUploadSlot — imagine sau video scurt de pe telefon ──────────────────
async function toBase64(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target!.result as string);
    reader.readAsDataURL(file);
  });
}

function MediaUploadSlot({
  value, label, onChange, acceptVideo = true,
}: {
  value: string; label: string; onChange: (url: string) => void; acceptVideo?: boolean;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [sizeWarn, setSizeWarn] = useState("");

  const isVideo = value
    ? value.startsWith("data:video") || /\.(mp4|webm|mov|avi|mkv)(\?|$)/i.test(value)
    : false;

  const handleFile = async (file: File) => {
    setSizeWarn("");
    const isVid = file.type.startsWith("video/");
    const mb = file.size / 1024 / 1024;

    if (mb > 20) {
      setSizeWarn(`Fișierul este prea mare (${mb.toFixed(1)} MB). Maxim 20 MB.`);
      return;
    }
    if (isVid && mb > 10) {
      setSizeWarn(`Video mare (${mb.toFixed(1)} MB) — poate dura câteva secunde la salvat.`);
    }

    setUploading(true);
    try {
      const result = isVid ? await toBase64(file) : await compressImage(file, 1600, 0.82);
      onChange(result);
    } finally {
      setUploading(false);
    }
  };

  const accept = acceptVideo ? "image/*,video/*" : "image/*";

  return (
    <div className="flex flex-col gap-2">
      <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">{label}</p>

      <div
        className={`relative rounded-xl overflow-hidden border-2 border-dashed ${value ? "border-zinc-600" : "border-zinc-700 hover:border-zinc-500"} bg-zinc-800 transition-colors cursor-pointer`}
        style={{ aspectRatio: "16/9" }}
        onClick={() => !value && !uploading && fileRef.current?.click()}
      >
        {value ? (
          <>
            {isVideo ? (
              <video src={value} autoPlay muted loop playsInline className="w-full h-full object-cover" />
            ) : (
              <img src={value} alt="" className="w-full h-full object-cover" />
            )}
            <div className="absolute top-2 left-2 bg-black/70 text-white text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
              {isVideo ? <><Video className="w-2.5 h-2.5" /> VIDEO</> : <><Upload className="w-2.5 h-2.5" /> IMAGINE</>}
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); onChange(""); setSizeWarn(""); }}
              className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
            >
              <X className="w-3.5 h-3.5 text-white" />
            </button>
          </>
        ) : uploading ? (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-zinc-500">
            <div className="w-6 h-6 border-2 border-[#FF4F00] border-t-transparent rounded-full animate-spin" />
            <span className="text-[10px]">Se procesează...</span>
          </div>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-zinc-600 hover:text-zinc-400 transition-colors pointer-events-none">
            <Upload className="w-8 h-8" />
            <span className="text-sm font-semibold">Apasă pentru a adăuga</span>
            <span className="text-[11px] text-zinc-600">
              {acceptVideo ? "📷 Imagine sau 🎬 Video scurt" : "📷 Imagine"} — de pe telefon sau calculator
            </span>
          </div>
        )}
      </div>

      <div className="flex gap-2 items-center">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-1.5 bg-[#FF4F00] hover:bg-[#E64600] disabled:opacity-50 text-white text-xs font-bold px-3 py-2 rounded-lg transition-colors"
        >
          <Upload className="w-3.5 h-3.5" />
          {value ? "Schimbă fișierul" : "Upload de pe telefon"}
        </button>
        {value && (
          <button
            type="button"
            onClick={() => { onChange(""); setSizeWarn(""); }}
            className="text-xs bg-zinc-700 hover:bg-zinc-600 text-zinc-300 px-3 py-2 rounded-lg transition-colors"
          >
            Șterge
          </button>
        )}
        <input
          ref={fileRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) { handleFile(f); e.target.value = ""; } }}
        />
      </div>

      <input
        type="text"
        placeholder="sau introdu URL direct (https://...)..."
        value={value.startsWith("data:") ? "" : value}
        onChange={(e) => { setSizeWarn(""); onChange(e.target.value); }}
        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-300 text-xs placeholder-zinc-600 focus:outline-none focus:border-[#FF4F00]"
      />

      {sizeWarn && (
        <p className="text-amber-400 text-[11px] flex items-center gap-1.5">
          <AlertCircle className="w-3 h-3 flex-shrink-0" /> {sizeWarn}
        </p>
      )}
    </div>
  );
}

function ProductField({ label, field, type = "text", placeholder = "", form, set }: {
  label: string; field: keyof ProductFormData; type?: string; placeholder?: string;
  form: ProductFormData; set: (k: keyof ProductFormData, v: string | boolean) => void;
}) {
  return (
    <div>
      <label className="block text-[11px] font-semibold text-zinc-400 mb-1 uppercase tracking-wider">{label}</label>
      <input type={type} placeholder={placeholder} value={form[field] as string}
        onChange={(e) => set(field, e.target.value)}
        className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-[#FF4F00] transition-colors placeholder:text-zinc-600" />
    </div>
  );
}

function ProductModal({ product, onClose, categories }: { product: StoreProduct | null; onClose: () => void; categories: CategoryDef[] }) {
  const [descGen, setDescGen] = useState(false);
  const [form, setForm] = useState<ProductFormData>(
    product
      ? { name: product.name, model: product.model, brand: product.brand, category: product.category,
          price: String(product.price), oldPrice: product.oldPrice ? String(product.oldPrice) : "",
          specs: product.specs, badge: product.badge ?? "", imageUrl: product.imageUrl,
          description: product.description, longDescription: product.longDescription ?? "",
          techSpecs: product.techSpecs ?? "", inStock: product.inStock }
      : { ...EMPTY_FORM, category: categories[0]?.slug ?? "wifi" }
  );
  const [extraImages, setExtraImages] = useState<string[]>(
    product?.images && product.images.length > 1 ? product.images.slice(1) : []
  );
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);

  const set = (key: keyof ProductFormData, val: string | boolean) =>
    setForm((f) => ({ ...f, [key]: val }));

  const handleFile = async (file: File, target: "primary" | number) => {
    setUploadingIdx(target === "primary" ? -1 : target);
    const compressed = await compressImage(file);
    if (target === "primary") {
      set("imageUrl", compressed);
    } else {
      setExtraImages((prev) => { const n = [...prev]; n[target] = compressed; return n; });
    }
    setUploadingIdx(null);
  };

  const addSlot  = () => setExtraImages((prev) => [...prev, ""]);
  const removeSlot = (i: number) => setExtraImages((prev) => prev.filter((_, j) => j !== i));

  const genDescription = useCallback(async () => {
    if (!form.name || !form.price || descGen) return;
    setDescGen(true);
    try {
      const res = await fetch((import.meta.env.VITE_API_URL || "") + "/api/ai/description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name, specs: form.specs, brand: form.brand, price: parseFloat(form.price) || 0, category: form.category }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      if (data.description) set("description", data.description);
    } catch {}
    finally { setDescGen(false); }
  }, [form.name, form.price, form.specs, form.brand, form.category, descGen]);

  const handleSave = () => {
    if (!form.name || !form.price) return;
    const allImages = [form.imageUrl, ...extraImages].filter(Boolean);
    const data: Omit<StoreProduct, "id"> = {
      name: form.name, model: form.model, brand: form.brand, category: form.category,
      price: parseFloat(form.price) || 0,
      oldPrice: form.oldPrice ? parseFloat(form.oldPrice) : null,
      specs: form.specs, badge: form.badge || null,
      imageUrl: form.imageUrl || allImages[0] || "",
      images: allImages,
      description: form.description, longDescription: form.longDescription || undefined,
      techSpecs: form.techSpecs || undefined, inStock: form.inStock, icon: "indoor",
    };
    if (product) storeActions.updateProduct(product.id, data);
    else storeActions.addProduct(data);
    onClose();
  };

  const totalImgs = [form.imageUrl, ...extraImages].filter(Boolean).length;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/80 p-4 overflow-y-auto">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-3xl my-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <h2 className="font-bold text-lg">{product ? "Editează Produs" : "Adaugă Produs Nou"}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-xl hover:bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Images */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="font-semibold text-sm flex items-center gap-2">
                Imagini Produs
                <span className="text-zinc-500 text-xs font-normal">({totalImgs} adăugate)</span>
              </p>
              {extraImages.length < 7 && (
                <button type="button" onClick={addSlot} className="text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1">
                  <Plus className="w-3 h-3" /> Slot Imagine
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <ImageSlot label="Imagine principală ★" isPrimary url={form.imageUrl}
                uploading={uploadingIdx === -1}
                onFile={(f) => handleFile(f, "primary")}
                onRemove={form.imageUrl ? () => set("imageUrl", "") : undefined}
                onUrlChange={(u) => set("imageUrl", u)} />
              {extraImages.map((img, i) => (
                <ImageSlot key={i} label={`Foto ${i + 2}`} url={img}
                  uploading={uploadingIdx === i}
                  onFile={(f) => handleFile(f, i)}
                  onRemove={() => removeSlot(i)}
                  onUrlChange={(u) => { setExtraImages((p) => { const n = [...p]; n[i] = u; return n; }); }} />
              ))}
            </div>
          </div>

          {/* Basic Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <ProductField label="Nume Produs *" field="name" placeholder="ex: Cameră IP Exterior 4MP" form={form} set={set} />
            </div>
            <ProductField label="Model" field="model" placeholder="ex: C310" form={form} set={set} />
            <div>
              <label className="block text-[11px] font-semibold text-zinc-400 mb-1 uppercase tracking-wider">Brand</label>
              <select value={form.brand} onChange={(e) => set("brand", e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-[#FF4F00]">
                {brands.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-zinc-400 mb-1 uppercase tracking-wider">Categorie</label>
              <select value={form.category} onChange={(e) => set("category", e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-[#FF4F00]">
                {categories.map((c) => <option key={c.id} value={c.slug}>{c.label}</option>)}
              </select>
            </div>
            <ProductField label="Preț (MDL) *" field="price" type="number" placeholder="0" form={form} set={set} />
            <ProductField label="Preț Vechi (MDL)" field="oldPrice" type="number" placeholder="opțional" form={form} set={set} />
            <ProductField label="Specificații scurte" field="specs" placeholder="ex: 4MP · WiFi · IR 30m" form={form} set={set} />
            <ProductField label="Badge promo" field="badge" placeholder="ex: NOU, -20%, TOP" form={form} set={set} />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Descriere scurtă</label>
              <button type="button" onClick={genDescription} disabled={descGen || !form.name || !form.price}
                className="flex items-center gap-1 text-[11px] text-[#FF4F00] hover:opacity-80 disabled:opacity-40 transition-opacity font-semibold">
                {descGen ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
                {descGen ? "Se generează..." : "✨ Generează AI"}
              </button>
            </div>
            <textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={2}
              placeholder="Descriere afișată în listing-ul produselor..."
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-[#FF4F00] resize-none" />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-zinc-400 mb-1 uppercase tracking-wider">Descriere lungă (pagina produsului)</label>
            <textarea value={form.longDescription} onChange={(e) => set("longDescription", e.target.value)} rows={4}
              placeholder="Descriere detaliată — avantaje, caracteristici, cazuri de utilizare..."
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-[#FF4F00] resize-none" />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-zinc-400 mb-1 uppercase tracking-wider">Specificații tehnice (tabel)</label>
            <textarea value={form.techSpecs} onChange={(e) => set("techSpecs", e.target.value)} rows={4}
              placeholder={"Rezoluție: 4MP\nSenzor: 1/3\" CMOS\nLentilă: 2.8mm\nIR: 30m"}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-[#FF4F00] resize-none font-mono" />
            <p className="text-zinc-600 text-xs mt-1">Un spec pe linie, format: <span className="font-mono">Cheie: Valoare</span></p>
          </div>

          <div className="flex items-center gap-3">
            <button type="button" onClick={() => set("inStock", !form.inStock)}
              className={`w-12 h-6 rounded-full transition-colors relative ${form.inStock ? "bg-[#FF4F00]" : "bg-zinc-700"}`}>
              <span className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${form.inStock ? "translate-x-6" : "translate-x-0.5"}`} />
            </button>
            <span className="text-sm font-semibold">{form.inStock ? "În stoc" : "Lipsă stoc"}</span>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-zinc-800 flex gap-3 justify-end">
          <button onClick={onClose} className="px-5 py-2.5 bg-zinc-800 text-white rounded-xl font-semibold hover:bg-zinc-700 transition-colors">Anulează</button>
          <button onClick={handleSave} disabled={!form.name || !form.price}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#FF4F00] text-white rounded-xl font-bold hover:opacity-90 disabled:opacity-40 transition-all">
            <Save className="w-4 h-4" /> {product ? "Salvează" : "Adaugă Produs"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── KPI Card ────────────────────────────────────────────────────────
function KpiCard({ title, value, sub, icon: Icon, accent }: {
  title: string; value: string; sub?: string; icon: React.ElementType; accent?: string;
}) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
      <div className="flex items-start justify-between mb-3">
        <p className="text-zinc-500 text-xs font-semibold uppercase tracking-wider">{title}</p>
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${accent ?? "bg-[#FF4F00]/10"}`}>
          <Icon className={`w-4 h-4 ${accent ? "text-white" : "text-[#FF4F00]"}`} />
        </div>
      </div>
      <p className="font-black text-2xl text-white leading-none">{value}</p>
      {sub && <p className="text-zinc-500 text-xs mt-1.5">{sub}</p>}
    </div>
  );
}

// ─── DASHBOARD TAB ───────────────────────────────────────────────────
function DashboardTab({ products, leads, orders }: { products: StoreProduct[]; leads: Lead[]; orders: Order[] }) {
  const revenue = orders.reduce((s, o) => s + o.total, 0);
  const newOrders = orders.filter((o) => o.status === "new").length;
  const newLeads = leads.filter((l) => l.status === "new").length;
  const conversion = leads.length ? Math.round((orders.length / leads.length) * 100) : 0;
  const inStock = products.filter((p) => p.inStock).length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-black text-xl">Dashboard</h2>
        <p className="text-zinc-500 text-xs mt-0.5">Rezumat activitate magazin</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Venituri Total" value={fmtMDL(revenue)} sub={`${orders.length} comenzi`} icon={TrendingUp} />
        <KpiCard title="Comenzi Noi" value={String(newOrders)} sub="Necesită atenție" icon={ShoppingBag} accent={newOrders ? "bg-amber-500" : undefined} />
        <KpiCard title="Lead-uri Noi" value={String(newLeads)} sub={`Din ${leads.length} total`} icon={Users} accent={newLeads ? "bg-blue-600" : undefined} />
        <KpiCard title="Rate Conversie" value={`${conversion}%`} sub="leads → comenzi" icon={BarChart3} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
          <h3 className="font-bold mb-4 flex items-center gap-2 text-sm"><ShoppingBag className="w-4 h-4 text-[#FF4F00]" /> Status Comenzi</h3>
          <div className="space-y-3">
            {(["new", "confirmed", "delivered"] as const).map((s) => {
              const count = orders.filter((o) => o.status === s).length;
              const pct = orders.length ? Math.round((count / orders.length) * 100) : 0;
              const cfg = ORDER_CFG[s];
              return (
                <div key={s}>
                  <div className="flex justify-between mb-1">
                    <StatusBadge cfg={cfg} />
                    <span className="text-zinc-400 text-xs font-semibold">{count}</span>
                  </div>
                  <div className="bg-zinc-800 rounded-full h-1.5"><div className={`h-full rounded-full ${cfg.dot}`} style={{ width: `${pct}%` }} /></div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
          <h3 className="font-bold mb-4 flex items-center gap-2 text-sm"><Users className="w-4 h-4 text-[#FF4F00]" /> Pipeline Lead-uri</h3>
          <div className="space-y-3">
            {(["new", "contacted", "converted"] as const).map((s) => {
              const count = leads.filter((l) => l.status === s).length;
              const pct = leads.length ? Math.round((count / leads.length) * 100) : 0;
              const cfg = LEAD_CFG[s];
              return (
                <div key={s}>
                  <div className="flex justify-between mb-1">
                    <StatusBadge cfg={cfg} />
                    <span className="text-zinc-400 text-xs font-semibold">{count}</span>
                  </div>
                  <div className="bg-zinc-800 rounded-full h-1.5"><div className={`h-full rounded-full ${cfg.dot}`} style={{ width: `${pct}%` }} /></div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-center">
          <p className="text-zinc-500 text-[10px] uppercase tracking-wider mb-1">Total Produse</p>
          <p className="font-black text-2xl text-white">{products.length}</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-center">
          <p className="text-zinc-500 text-[10px] uppercase tracking-wider mb-1">În Stoc</p>
          <p className="font-black text-2xl text-green-400">{inStock}</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-center">
          <p className="text-zinc-500 text-[10px] uppercase tracking-wider mb-1">Lipsă Stoc</p>
          <p className="font-black text-2xl text-red-400">{products.length - inStock}</p>
        </div>
      </div>
    </div>
  );
}

// ─── PRODUCTS TAB ────────────────────────────────────────────────────
function ProductsTab({ products, categories }: { products: StoreProduct[]; categories: CategoryDef[] }) {
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [sortBy, setSortBy] = useState<"default" | "price_asc" | "price_desc" | "name" | "stock">("default");
  const [editProduct, setEditProduct] = useState<StoreProduct | null | "new">(null);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);

  const filtered = useMemo(() => {
    let list = products.filter((p) =>
      (!search || p.name.toLowerCase().includes(search.toLowerCase()) || p.brand.toLowerCase().includes(search.toLowerCase()) || p.model.toLowerCase().includes(search.toLowerCase())) &&
      (!catFilter || p.category === catFilter)
    );
    if (sortBy === "price_asc")  list = [...list].sort((a, b) => a.price - b.price);
    if (sortBy === "price_desc") list = [...list].sort((a, b) => b.price - a.price);
    if (sortBy === "name")       list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    if (sortBy === "stock")      list = [...list].sort((a, b) => (b.inStock ? 1 : 0) - (a.inStock ? 1 : 0));
    return list;
  }, [products, search, catFilter, sortBy]);

  const allSelected = filtered.length > 0 && filtered.every((p) => selected.has(p.id));
  const toggleAll = () => {
    if (allSelected) {
      setSelected((s) => { const n = new Set(s); filtered.forEach((p) => n.delete(p.id)); return n; });
    } else {
      setSelected((s) => { const n = new Set(s); filtered.forEach((p) => n.add(p.id)); return n; });
    }
  };
  const toggleOne = (id: number) => setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const handleExport = () => {
    exportCSV("produse-teco.csv",
      ["ID", "Nume", "Model", "Brand", "Categorie", "Pret", "Pret Vechi", "Stoc", "Badge"],
      products.map((p) => [
        [p.id], [p.name], [p.model], [p.brand], [p.category],
        [p.price], [p.oldPrice ?? ""], [p.inStock ? "Da" : "Nu"], [p.badge ?? ""],
      ])
    );
  };

  const handleBulkDelete = () => {
    storeActions.bulkDeleteProducts([...selected]);
    setSelected(new Set());
    setConfirmBulkDelete(false);
  };

  return (
    <div>
      {showImport && <ImportModal onClose={() => setShowImport(false)} />}
      {editProduct !== null && (
        <ProductModal product={editProduct === "new" ? null : editProduct} onClose={() => setEditProduct(null)} categories={categories} />
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
      {confirmBulkDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-sm text-center">
            <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <Trash className="w-6 h-6 text-red-400" />
            </div>
            <h3 className="font-bold text-lg mb-1">Ștergi {selected.size} produse?</h3>
            <p className="text-zinc-400 text-sm mb-6">Această acțiune este ireversibilă.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmBulkDelete(false)} className="flex-1 bg-zinc-800 text-white font-semibold py-2.5 rounded-xl hover:bg-zinc-700">Anulează</button>
              <button onClick={handleBulkDelete} className="flex-1 bg-red-600 text-white font-bold py-2.5 rounded-xl hover:bg-red-700">Șterge {selected.size}</button>
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
          <button onClick={handleExport}
            className="flex items-center gap-1.5 bg-zinc-800 text-zinc-400 hover:text-white px-3 py-2 rounded-xl text-xs font-semibold transition-colors">
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
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

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="mb-4 bg-[#FF4F00]/10 border border-[#FF4F00]/30 rounded-xl px-4 py-3 flex items-center gap-3">
          <CheckSquare className="w-4 h-4 text-[#FF4F00]" />
          <span className="text-sm font-semibold text-white">{selected.size} produse selectate</span>
          <div className="ml-auto flex gap-2">
            <button onClick={() => setSelected(new Set())} className="text-xs text-zinc-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-zinc-800 transition-colors">
              Deselectează
            </button>
            <button onClick={() => setConfirmBulkDelete(true)} className="flex items-center gap-1.5 text-xs bg-red-600/20 text-red-400 hover:bg-red-600/30 px-3 py-1.5 rounded-lg font-semibold transition-colors">
              <Trash2 className="w-3.5 h-3.5" /> Șterge {selected.size}
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input type="text" placeholder="Caută după nume, brand, model..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-zinc-600 placeholder:text-zinc-600" />
          {search && <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"><X className="w-4 h-4" /></button>}
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar flex-wrap">
          {["", ...categories.map((c) => c.slug)].map((slug) => {
            const label = slug ? (categories.find((c) => c.slug === slug)?.label ?? slug) : "Toate";
            return (
              <button key={slug} onClick={() => setCatFilter(slug)}
                className={`flex-shrink-0 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${catFilter === slug ? "bg-[#FF4F00] text-white" : "bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white"}`}>
                {label}
              </button>
            );
          })}
        </div>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)}
          className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-zinc-300 focus:outline-none flex-shrink-0">
          <option value="default">Sortare: Default</option>
          <option value="price_asc">Preț ↑</option>
          <option value="price_desc">Preț ↓</option>
          <option value="name">Nume A-Z</option>
          <option value="stock">Stoc întâi</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="px-4 py-3 w-10">
                  <button onClick={toggleAll} className="text-zinc-500 hover:text-white transition-colors">
                    {allSelected ? <CheckSquare className="w-4 h-4 text-[#FF4F00]" /> : <Square className="w-4 h-4" />}
                  </button>
                </th>
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
                <tr><td colSpan={8} className="py-12 text-center text-zinc-600 text-sm">Niciun produs găsit</td></tr>
              ) : filtered.map((p) => (
                <tr key={p.id} className={`border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors ${selected.has(p.id) ? "bg-[#FF4F00]/5" : ""}`}>
                  <td className="px-4 py-3">
                    <button onClick={() => toggleOne(p.id)} className="text-zinc-500 hover:text-white transition-colors">
                      {selected.has(p.id) ? <CheckSquare className="w-4 h-4 text-[#FF4F00]" /> : <Square className="w-4 h-4" />}
                    </button>
                  </td>
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
                    <span className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-1 rounded-full">
                      {categories.find((c) => c.slug === p.category)?.label ?? p.category}
                    </span>
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
                      <button onClick={() => storeActions.duplicateProduct(p.id)} className="p-1.5 rounded-lg hover:bg-zinc-700 text-zinc-500 hover:text-zinc-200 transition-colors" title="Duplică">
                        <Copy className="w-3.5 h-3.5" />
                      </button>
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
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const filtered = useMemo(() =>
    orders.filter((o) =>
      (statusFilter === "all" || o.status === statusFilter) &&
      (!search || o.customer.name.toLowerCase().includes(search.toLowerCase()) || o.customer.phone.includes(search))
    ), [orders, statusFilter, search]);

  const revenue = filtered.reduce((s, o) => s + o.total, 0);

  const waMsg = (o: Order) => {
    const ref = o.id.slice(0, 8).toUpperCase();
    const lines = o.items.map((i) => `  • ${i.qty}× ${i.name}`).join("\n");
    return encodeURIComponent(`Bună ziua ${o.customer.name}! Confirmăm comanda dvs #${ref} plasată pe TECO.MD.\n\nProduse:\n${lines}\n\nTotal: ${fmtMDL(o.total)}\n\nVă vom contacta în scurt timp pentru detalii livrare. Mulțumim!`);
  };

  const handleExport = () => {
    exportCSV("comenzi-teco.csv",
      ["ID", "Data", "Client", "Telefon", "Email", "Adresa", "Produse", "Total", "Status"],
      orders.map((o) => [
        [o.id.slice(0, 8).toUpperCase()],
        [fmtDate(o.timestamp)],
        [o.customer.name],
        [o.customer.phone],
        [o.customer.email],
        [o.customer.address],
        [o.items.map((i) => `${i.qty}x ${i.name}`).join("; ")],
        [o.total],
        [ORDER_CFG[o.status]?.label ?? o.status],
      ])
    );
  };

  return (
    <div>
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-sm text-center">
            <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <Trash className="w-6 h-6 text-red-400" />
            </div>
            <h3 className="font-bold text-lg mb-1">Ștergi comanda?</h3>
            <p className="text-zinc-400 text-sm mb-6">Această acțiune este ireversibilă.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 bg-zinc-800 text-white font-semibold py-2.5 rounded-xl hover:bg-zinc-700">Anulează</button>
              <button onClick={() => { storeActions.deleteOrder(confirmDelete); setConfirmDelete(null); }} className="flex-1 bg-red-600 text-white font-bold py-2.5 rounded-xl hover:bg-red-700">Șterge</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
        <div className="flex-1">
          <h2 className="font-black text-xl">Comenzi</h2>
          <p className="text-zinc-500 text-xs mt-0.5">{filtered.length} comenzi · {fmtMDL(revenue)} total</p>
        </div>
        <button onClick={handleExport}
          className="flex items-center gap-1.5 bg-zinc-800 text-zinc-400 hover:text-white px-3 py-2 rounded-xl text-xs font-semibold transition-colors self-start">
          <Download className="w-3.5 h-3.5" /> Export CSV
        </button>
      </div>

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
                    <select value={o.status} onChange={(e) => storeActions.updateOrderStatus(o.id, e.target.value as any)}
                      className="bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-zinc-600">
                      <option value="new">Nouă</option>
                      <option value="confirmed">Confirmată</option>
                      <option value="delivered">Livrată</option>
                    </select>
                    {adminPhone && (
                      <a href={`https://wa.me/${o.customer.phone.replace(/\D/g, "")}?text=${waMsg(o)}`} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1 bg-[#25D366]/15 text-[#25D366] hover:bg-[#25D366]/25 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors">
                        <Phone className="w-3 h-3" /> WhatsApp client
                      </a>
                    )}
                    <button onClick={() => setConfirmDelete(o.id)}
                      className="p-1.5 rounded-lg hover:bg-red-900/30 text-zinc-600 hover:text-red-400 transition-colors" title="Șterge comandă">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
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

  const handleExport = () => {
    exportCSV("leads-teco.csv",
      ["Data", "Nume", "Telefon", "Sursa", "Status", "Note"],
      leads.map((l) => [
        [fmtDate(l.timestamp)], [l.name], [l.phone], [l.source],
        [LEAD_CFG[l.status]?.label ?? l.status], [l.notes ?? ""],
      ])
    );
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
        <div className="flex-1">
          <h2 className="font-black text-xl">Lead-uri CRM</h2>
          <p className="text-zinc-500 text-xs mt-0.5">{filtered.length} din {leads.length} lead-uri</p>
        </div>
        <button onClick={handleExport}
          className="flex items-center gap-1.5 bg-zinc-800 text-zinc-400 hover:text-white px-3 py-2 rounded-xl text-xs font-semibold transition-colors self-start">
          <Download className="w-3.5 h-3.5" /> Export CSV
        </button>
      </div>

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

      {filtered.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl py-14 text-center text-zinc-600">
          <Users className="w-10 h-10 mx-auto mb-3 opacity-20" />
          <p className="text-sm">Niciun lead {statusFilter !== "all" ? "cu acest status" : "primit încă"}.</p>
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
                    <select value={l.status} onChange={(e) => storeActions.updateLeadStatus(l.id, e.target.value as any)}
                      className="bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-zinc-600">
                      <option value="new">Nou</option>
                      <option value="contacted">Contactat</option>
                      <option value="converted">Convertit</option>
                    </select>
                    {adminPhone && (
                      <a href={`https://wa.me/${l.phone.replace(/\D/g, "")}?text=${waText}`} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1 bg-[#25D366]/15 text-[#25D366] hover:bg-[#25D366]/25 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors">
                        <Phone className="w-3 h-3" /> WhatsApp
                      </a>
                    )}
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

// ─── SETTINGS SECTION WRAPPER ─────────────────────────────────────────
function SettingsSection({ icon: Icon, title, description, children }: {
  icon: React.ElementType; title: string; description?: string; children: React.ReactNode;
}) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
      <h3 className="font-bold mb-0.5 flex items-center gap-2">
        <Icon className="w-4 h-4 text-[#FF4F00]" /> {title}
      </h3>
      {description && <p className="text-zinc-500 text-xs mb-4">{description}</p>}
      {!description && <div className="mb-4" />}
      {children}
    </div>
  );
}

// ─── GALLERY SECTION (extracted to respect React hooks rules) ──────────────
function GallerySection({ settings }: { settings: ModuleSettings }) {
  const gallery: GalleryItem[] = settings.gallery ?? [];
  const [showAddForm, setShowAddForm] = useState(false);
  const [newImg, setNewImg] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newLoc, setNewLoc] = useState("");

  const inputCls = "w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#FF4F00] transition-colors";
  const labelCls = "block text-[11px] font-semibold text-zinc-400 mb-1 uppercase tracking-wider";

  const handleAdd = () => {
    if (!newImg) return;
    const item: GalleryItem = {
      id: `gal_${Date.now()}`,
      imageUrl: newImg,
      title: newTitle.trim() || undefined,
      location: newLoc.trim() || undefined,
    };
    storeActions.updateGallery([...gallery, item]);
    setNewImg(""); setNewTitle(""); setNewLoc(""); setShowAddForm(false);
  };

  const handleDelete = (id: string) => {
    storeActions.updateGallery(gallery.filter((g) => g.id !== id));
  };

  return (
    <SettingsSection icon={Star} title="Galerie Instalări — Portofoliu Homepage"
      description="Fotografii din instalările realizate. Apar pe homepage în secțiunea Portofoliu.">
      {gallery.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 mb-5">
          {gallery.map((item) => (
            <div key={item.id} className="relative group rounded-lg overflow-hidden aspect-square bg-zinc-800">
              <img src={item.imageUrl} alt={item.title ?? ""} className="w-full h-full object-cover" />
              {item.title && (
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-1.5 py-1">
                  <p className="text-white text-[9px] font-semibold truncate">{item.title}</p>
                  {item.location && <p className="text-zinc-300 text-[8px] truncate">{item.location}</p>}
                </div>
              )}
              <button
                onClick={() => handleDelete(item.id)}
                className="absolute top-1 right-1 w-5 h-5 bg-red-600/80 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
              >
                <X className="w-3 h-3 text-white" />
              </button>
            </div>
          ))}
        </div>
      )}

      {!showAddForm ? (
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors w-full justify-center"
        >
          <Plus className="w-4 h-4" /> Adaugă Fotografie Instalare
        </button>
      ) : (
        <div className="bg-zinc-800/60 rounded-xl p-4 space-y-4 border border-zinc-700">
          <MediaUploadSlot
            label="Fotografie instalare (de pe telefon sau calculator)"
            value={newImg}
            onChange={setNewImg}
            acceptVideo={false}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Titlu (opțional)</label>
              <input type="text" value={newTitle} onChange={(e) => setNewTitle(e.target.value)}
                placeholder="ex: Cameră exterior casă Cricova" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Locație (opțional)</label>
              <input type="text" value={newLoc} onChange={(e) => setNewLoc(e.target.value)}
                placeholder="ex: Chișinău, str. Decebal" className={inputCls} />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleAdd} disabled={!newImg}
              className="flex items-center gap-2 bg-[#FF4F00] hover:bg-[#E64600] disabled:opacity-40 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors">
              <Plus className="w-4 h-4" /> Adaugă în Galerie
            </button>
            <button onClick={() => { setShowAddForm(false); setNewImg(""); setNewTitle(""); setNewLoc(""); }}
              className="px-4 py-2 rounded-lg text-sm bg-zinc-700 hover:bg-zinc-600 text-zinc-300 transition-colors">
              Anulează
            </button>
          </div>
        </div>
      )}
      {gallery.length > 0 && (
        <p className="text-zinc-600 text-[11px] mt-3 text-center">
          {gallery.length} fotografi{gallery.length === 1 ? "e" : "i"} în galerie
        </p>
      )}
    </SettingsSection>
  );
}

// ─── BLOG TAB ────────────────────────────────────────────────────────
function BlogTab({ posts }: { posts: BlogPost[] }) {
  const blogFileRef = useRef<HTMLInputElement>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    slug: "", title: "", titleRu: "", description: "", descriptionRu: "",
    content: "", contentRu: "", imageUrl: "", category: "Ghiduri", categoryRu: "Руководства",
    metaTitle: "", metaTitleRu: "", metaDescription: "", metaDescriptionRu: "",
    keywords: "", keywordsRu: "", published: true,
  });
  const [search, setSearch] = useState("");
  const [blogImageUploading, setBlogImageUploading] = useState(false);
  const [showAiPanel, setShowAiPanel]   = useState(false);
  const [aiTopic,     setAiTopic]       = useState("");
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiError,     setAiError]       = useState("");

  const generateBlogPost = async () => {
    if (!aiTopic.trim()) return;
    setAiGenerating(true);
    setAiError("");
    try {
      const res  = await fetch((import.meta.env.VITE_API_URL || "") + "/api/ai/blog-post", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ topic: aiTopic.trim() }) });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error ?? "Eroare server");
      setForm({
        slug: data.slug ?? "", title: data.title ?? "", titleRu: data.titleRu ?? "",
        description: data.description ?? "", descriptionRu: data.descriptionRu ?? "",
        content: data.content ?? "", contentRu: data.contentRu ?? "",
        imageUrl: `https://picsum.photos/seed/${encodeURIComponent(data.slug ?? aiTopic)}/1200/630`, category: data.category ?? "Ghiduri", categoryRu: data.categoryRu ?? "Руководства",
        metaTitle: data.metaTitle ?? "", metaTitleRu: data.metaTitleRu ?? "",
        metaDescription: data.metaDescription ?? "", metaDescriptionRu: data.metaDescriptionRu ?? "",
        keywords: data.keywords ?? "", keywordsRu: data.keywordsRu ?? "",
        published: false,
      });
      setEditing(null);
      setShowForm(true);
      setShowAiPanel(false);
      setAiTopic("");
    } catch (e: unknown) {
      setAiError(e instanceof Error ? e.message : String(e));
    } finally {
      setAiGenerating(false);
    }
  };

  const handleBlogImage = async (file: File) => {
    setBlogImageUploading(true);
    try {
      const compressed = await compressImage(file, 1200, 0.85);
      setForm((prev) => ({ ...prev, imageUrl: compressed }));
    } catch {
      alert("Eroare la procesarea imaginii");
    } finally {
      setBlogImageUploading(false);
    }
  };

  const filtered = posts.filter((p) =>
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    p.slug.toLowerCase().includes(search.toLowerCase())
  );

  const handleEdit = (post: BlogPost) => {
    setForm({
      slug: post.slug, title: post.title, titleRu: post.titleRu || "",
      description: post.description, descriptionRu: post.descriptionRu || "",
      content: post.content, contentRu: post.contentRu || "",
      imageUrl: post.imageUrl || "", category: post.category || "Ghiduri",
      categoryRu: post.categoryRu || "Руководства",
      metaTitle: post.metaTitle || "", metaTitleRu: post.metaTitleRu || "",
      metaDescription: post.metaDescription || "", metaDescriptionRu: post.metaDescriptionRu || "",
      keywords: post.keywords || "", keywordsRu: post.keywordsRu || "",
      published: post.published,
    });
    setEditing(post.id);
    setShowForm(true);
  };

  const handleSave = () => {
    if (!form.title.trim() || !form.slug.trim()) {
      alert("Titlul şi slug-ul sunt obligatorii");
      return;
    }
    const slug = form.slug.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9\-]/g, "");
    if (editing) {
      storeActions.updateBlogPost(editing, { ...form, slug });
    } else {
      storeActions.addBlogPost({ ...form, slug });
    }
    setShowForm(false);
    setEditing(null);
    setForm({
      slug: "", title: "", titleRu: "", description: "", descriptionRu: "",
      content: "", contentRu: "", imageUrl: "", category: "Ghiduri", categoryRu: "Руководства",
      metaTitle: "", metaTitleRu: "", metaDescription: "", metaDescriptionRu: "",
      keywords: "", keywordsRu: "", published: true,
    });
  };

  const handleDelete = (id: string) => {
    if (!window.confirm("Ştergi acest articol?")) return;
    storeActions.deleteBlogPost(id);
  };

  const handleNew = () => {
    setEditing(null);
    setForm({
      slug: "", title: "", titleRu: "", description: "", descriptionRu: "",
      content: "", contentRu: "", imageUrl: "", category: "Ghiduri", categoryRu: "Руководства",
      metaTitle: "", metaTitleRu: "", metaDescription: "", metaDescriptionRu: "",
      keywords: "", keywordsRu: "", published: true,
    });
    setShowForm(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-[#FF4F00]/10 rounded-lg flex items-center justify-center">
            <Megaphone className="w-4.5 h-4.5 text-[#FF4F00]" />
          </div>
          <div>
            <h2 className="font-bold text-white">Blog</h2>
            <p className="text-zinc-500 text-xs">{posts.length} articole · {posts.filter((p) => p.published).length} publicate</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowAiPanel((v) => !v)}
            className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white font-bold px-4 py-2 rounded-xl text-sm transition-all border border-zinc-700">
            <Wand2 className="w-4 h-4 text-[#FF4F00]" /> Generează AI
          </button>
          <button onClick={handleNew} className="flex items-center gap-2 bg-[#FF4F00] text-white font-bold px-4 py-2 rounded-xl text-sm hover:opacity-90 transition-all">
            <Plus className="w-4 h-4" /> Articol nou
          </button>
        </div>
      </div>

      {/* ── AI Blog Generator Panel ── */}
      {showAiPanel && (
        <div className="bg-gradient-to-r from-zinc-900 to-zinc-900 border border-[#FF4F00]/30 rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-[#FF4F00]" />
            <p className="text-sm font-bold text-white">Generator AI articol SEO</p>
            <span className="text-[10px] text-zinc-500 ml-auto">Gemini 2.5 Flash · ~600+ cuvinte · RO + RU</span>
          </div>
          <div className="flex gap-2">
            <input
              value={aiTopic}
              onChange={(e) => setAiTopic(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && generateBlogPost()}
              placeholder="ex: cum să alegi camera de supraveghere pentru casă în Moldova"
              className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#FF4F00]"
            />
            <button
              onClick={generateBlogPost}
              disabled={!aiTopic.trim() || aiGenerating}
              className="px-4 py-2.5 bg-[#FF4F00] text-white rounded-xl text-sm font-bold hover:opacity-90 disabled:opacity-40 flex items-center gap-2 flex-shrink-0"
            >
              {aiGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {aiGenerating ? "Generez..." : "Generează"}
            </button>
          </div>
          {aiError && <p className="text-red-400 text-xs">{aiError}</p>}
          {aiGenerating && (
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <div className="w-3 h-3 border border-[#FF4F00] border-t-transparent rounded-full animate-spin" />
              Gemini scrie articolul (titlu, conținut, SEO complet RO+RU)...
            </div>
          )}
          <p className="text-[10px] text-zinc-600">Articolul generat va fi salvat ca Ciornă — poți edita înainte de publicare.</p>
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Caută articol..."
          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#FF4F00]"
        />
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-500 text-xs uppercase">
                <th className="text-left px-4 py-3 font-semibold">Titlu</th>
                <th className="text-left px-4 py-3 font-semibold">Categorie</th>
                <th className="text-left px-4 py-3 font-semibold">Status</th>
                <th className="text-left px-4 py-3 font-semibold">Data</th>
                <th className="text-right px-4 py-3 font-semibold">Acţiuni</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((post) => (
                <tr key={post.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-white">{post.title}</div>
                    <div className="text-xs text-zinc-500">/{post.slug}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs bg-zinc-800 px-2 py-1 rounded-full text-zinc-300">{post.category}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${post.published ? "bg-green-500/15 text-green-400" : "bg-amber-500/15 text-amber-400"}`}>
                      {post.published ? "Publicat" : "Ciornă"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-zinc-400 text-xs">
                    {new Date(post.publishedAt).toLocaleDateString("ro-RO")}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center gap-2 justify-end">
                      <button onClick={() => handleEdit(post)} className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-all">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(post.id)} className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-all">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-zinc-900 border-b border-zinc-800 px-6 py-4 flex items-center justify-between z-10">
              <h3 className="font-bold text-white">{editing ? "Editează Articol" : "Articol Nou"}</h3>
              <button onClick={() => setShowForm(false)} className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-semibold text-zinc-400 uppercase mb-1.5 block">Slug URL *</label>
                  <input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:border-[#FF4F00] focus:outline-none" placeholder="cum-sa-alegi-camera" />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-zinc-400 uppercase mb-1.5 block">Categorie</label>
                  <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:border-[#FF4F00] focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="text-[11px] font-semibold text-zinc-400 uppercase mb-1.5 block">Titlu RO *</label>
                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:border-[#FF4F00] focus:outline-none" />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-zinc-400 uppercase mb-1.5 block">Titlu RU</label>
                <input value={form.titleRu} onChange={(e) => setForm({ ...form, titleRu: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:border-[#FF4F00] focus:outline-none" />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-zinc-400 uppercase mb-1.5 block">Descriere RO</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:border-[#FF4F00] focus:outline-none resize-none" />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-zinc-400 uppercase mb-1.5 block">Descriere RU</label>
                <textarea value={form.descriptionRu} onChange={(e) => setForm({ ...form, descriptionRu: e.target.value })} rows={2} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:border-[#FF4F00] focus:outline-none resize-none" />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-zinc-400 uppercase mb-1.5 block">Conţinut RO (Markdown)</label>
                <textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={8} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:border-[#FF4F00] focus:outline-none font-mono" placeholder="## Titlu&#10;Paragraf...&#10;| Col1 | Col2 |&#10;|------|------|&#10;| A    | B    |" />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-zinc-400 uppercase mb-1.5 block">Conţinut RU (Markdown)</label>
                <textarea value={form.contentRu} onChange={(e) => setForm({ ...form, contentRu: e.target.value })} rows={8} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:border-[#FF4F00] focus:outline-none font-mono" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-semibold text-zinc-400 uppercase mb-1.5 block">Meta Title RO</label>
                  <input value={form.metaTitle} onChange={(e) => setForm({ ...form, metaTitle: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:border-[#FF4F00] focus:outline-none" />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-zinc-400 uppercase mb-1.5 block">Meta Title RU</label>
                  <input value={form.metaTitleRu} onChange={(e) => setForm({ ...form, metaTitleRu: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:border-[#FF4F00] focus:outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-semibold text-zinc-400 uppercase mb-1.5 block">Meta Desc RO</label>
                  <textarea value={form.metaDescription} onChange={(e) => setForm({ ...form, metaDescription: e.target.value })} rows={2} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:border-[#FF4F00] focus:outline-none resize-none" />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-zinc-400 uppercase mb-1.5 block">Meta Desc RU</label>
                  <textarea value={form.metaDescriptionRu} onChange={(e) => setForm({ ...form, metaDescriptionRu: e.target.value })} rows={2} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:border-[#FF4F00] focus:outline-none resize-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-semibold text-zinc-400 uppercase mb-1.5 block">Keywords RO</label>
                  <input value={form.keywords} onChange={(e) => setForm({ ...form, keywords: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:border-[#FF4F00] focus:outline-none" placeholder="cuvinte, cheie, separate, prin, virgula" />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-zinc-400 uppercase mb-1.5 block">Keywords RU</label>
                  <input value={form.keywordsRu} onChange={(e) => setForm({ ...form, keywordsRu: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:border-[#FF4F00] focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="text-[11px] font-semibold text-zinc-400 uppercase mb-1.5 block">Imagine Articol</label>
                <div className="flex gap-3">
                  <div className="relative w-32 h-24 rounded-lg overflow-hidden border-2 border-dashed border-zinc-700 bg-zinc-800 flex-shrink-0">
                    {form.imageUrl ? (
                      <>
                        <img src={form.imageUrl} alt="" className="w-full h-full object-cover" />
                        <button onClick={() => setForm({ ...form, imageUrl: "" })} className="absolute top-1 right-1 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors">
                          <X className="w-3 h-3 text-white" />
                        </button>
                      </>
                    ) : blogImageUploading ? (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="w-5 h-5 border-2 border-[#FF4F00] border-t-transparent rounded-full animate-spin" />
                      </div>
                    ) : (
                      <button onClick={() => blogFileRef.current?.click()} className="w-full h-full flex flex-col items-center justify-center gap-1 text-zinc-600 hover:text-zinc-400 transition-colors">
                        <Upload className="w-5 h-5" />
                        <span className="text-[9px]">Upload</span>
                      </button>
                    )}
                    <input ref={blogFileRef} type="file" accept="image/*" className="hidden"
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) { handleBlogImage(f); e.target.value = ""; } }} />
                  </div>
                  <div className="flex-1 flex flex-col gap-2">
                    <button onClick={() => blogFileRef.current?.click()} className="text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-lg px-3 py-2 transition-colors text-left">
                      {form.imageUrl ? "Schimbă imaginea" : "Alege din galerie"}
                    </button>
                    <p className="text-zinc-600 text-[10px]">Selectează o imagine din galeria telefonului sau calculator. Se va comprima automat.</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" id="pub" checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} className="w-4 h-4 accent-[#FF4F00]" />
                <label htmlFor="pub" className="text-sm text-white">Publicat (vizibil pe site)</label>
              </div>
            </div>
            <div className="sticky bottom-0 bg-zinc-900 border-t border-zinc-800 px-6 py-4 flex items-center gap-3">
              <button onClick={handleSave} className="flex-1 bg-[#FF4F00] text-white font-bold py-2.5 rounded-xl hover:opacity-90 transition-all">
                {editing ? "Salvează Modificările" : "Publică Articol"}
              </button>
              <button onClick={() => setShowForm(false)} className="px-4 py-2.5 rounded-xl text-sm font-semibold text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all">
                Anulează
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── SETTINGS TAB ──────────────────────────────────────────────────────
function SettingsTab({ settings, products }: { settings: ModuleSettings; products: StoreProduct[] }) {
  const categories = settings.categories ?? DEFAULT_CATEGORIES;

  // --- Category manager state ---
  const [catEditId, setCatEditId] = useState<string | null>(null);
  const [catEditLabel, setCatEditLabel] = useState("");
  const [catEditLabelRu, setCatEditLabelRu] = useState("");
  const [catEditSlug, setCatEditSlug] = useState("");
  const [catEditImage, setCatEditImage] = useState("");
  const [catNewLabel, setCatNewLabel] = useState("");
  const [catNewLabelRu, setCatNewLabelRu] = useState("");
  const [catNewSlug, setCatNewSlug] = useState("");
  const [catNewImage, setCatNewImage] = useState("");
  const [showAddCat, setShowAddCat] = useState(false);

  const moveCat = (idx: number, dir: -1 | 1) => {
    const arr = [...categories];
    const target = idx + dir;
    if (target < 0 || target >= arr.length) return;
    [arr[idx], arr[target]] = [arr[target], arr[idx]];
    storeActions.updateCategories(arr);
  };

  const deleteCat = (id: string) => {
    const used = products.some((p) => p.category === id);
    if (used && !window.confirm(`Categoria "${id}" este folosită de produse. Ești sigur că vrei să o ștergi?`)) return;
    storeActions.updateCategories(categories.filter((c) => c.id !== id));
  };

  const saveEditCat = (id: string) => {
    storeActions.updateCategories(categories.map((c) =>
      c.id === id ? { ...c, label: catEditLabel, labelRu: catEditLabelRu || c.labelRu, slug: catEditSlug || c.slug, image: catEditImage || c.image } : c
    ));
    setCatEditId(null);
  };

  const addCat = () => {
    if (!catNewLabel.trim()) return;
    const slug = catNewSlug.trim() || catNewLabel.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    const id = slug + "-" + Date.now().toString(36);
    storeActions.updateCategories([...categories, { id, slug, label: catNewLabel.trim(), labelRu: catNewLabelRu.trim() || undefined, image: catNewImage || undefined }]);
    setCatNewLabel(""); setCatNewLabelRu(""); setCatNewSlug(""); setCatNewImage(""); setShowAddCat(false);
  };

  // --- PIN change state ---
  const [pinCurrent, setPinCurrent] = useState("");
  const [pinNew, setPinNew] = useState("");
  const [pinConfirm, setPinConfirm] = useState("");
  const [pinError, setPinError] = useState("");
  const [pinSuccess, setPinSuccess] = useState(false);
  const effectivePin = settings.general?.adminPin || ADMIN_PIN_FALLBACK;

  const handlePinChange = () => {
    setPinError(""); setPinSuccess(false);
    if (pinCurrent !== effectivePin) { setPinError("PIN-ul curent este incorect."); return; }
    if (pinNew.length < 4) { setPinError("PIN-ul nou trebuie să aibă cel puțin 4 caractere."); return; }
    if (pinNew !== pinConfirm) { setPinError("Confirmarea nu coincide."); return; }
    storeActions.updateGeneral({ adminPin: pinNew });
    setPinCurrent(""); setPinNew(""); setPinConfirm("");
    setPinSuccess(true);
    setTimeout(() => setPinSuccess(false), 3000);
  };

  const inputCls = "w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#FF4F00] transition-colors";
  const labelCls = "block text-[11px] font-semibold text-zinc-400 mb-1 uppercase tracking-wider";

  return (
    <div className="space-y-6 max-w-2xl">
      <h2 className="font-black text-xl">Setări</h2>

      {/* ── 1. Magazin info ── */}
      <SettingsSection icon={Building2} title="Informații Magazin"
        description="Date de contact și prezentare afișate pe site.">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className={labelCls}>Numele Magazinului</label>
            <input type="text" value={settings.storeInfo?.name ?? ""} placeholder="ex: TECO.MD"
              onChange={(e) => storeActions.updateStoreInfo({ name: e.target.value })}
              className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Adresă</label>
            <input type="text" value={settings.storeInfo?.address ?? ""} placeholder="ex: Str. Mihai Eminescu 12"
              onChange={(e) => storeActions.updateStoreInfo({ address: e.target.value })}
              className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Oraș</label>
            <input type="text" value={settings.storeInfo?.city ?? ""} placeholder="ex: Chișinău, Moldova"
              onChange={(e) => storeActions.updateStoreInfo({ city: e.target.value })}
              className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Email contact</label>
            <input type="email" value={settings.storeInfo?.email ?? ""} placeholder="ex: info@teco.md"
              onChange={(e) => storeActions.updateStoreInfo({ email: e.target.value })}
              className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Telefon 2 (fix/birou)</label>
            <input type="tel" value={settings.storeInfo?.phone2 ?? ""} placeholder="ex: +373 22 123456"
              onChange={(e) => storeActions.updateStoreInfo({ phone2: e.target.value })}
              className={inputCls} />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>Program de lucru</label>
            <input type="text" value={settings.storeInfo?.workingHours ?? ""} placeholder="ex: Lun–Vin 9:00–18:00, Sâm 10:00–15:00"
              onChange={(e) => storeActions.updateStoreInfo({ workingHours: e.target.value })}
              className={inputCls} />
          </div>
        </div>
      </SettingsSection>

      {/* ── 2. Anunț Banner ── */}
      <SettingsSection icon={Megaphone} title="Anunț Banner"
        description="Textul afișat în bara de sus a magazinului. Lasă gol pentru mesajele automate.">
        <label className={labelCls}>Text Anunț</label>
        <input type="text" placeholder="ex: Reduceri de Vară — 20% la toate camerele!"
          value={settings.general?.announcementText ?? ""}
          onChange={(e) => storeActions.updateGeneral({ announcementText: e.target.value })}
          className={inputCls} />
        <p className="text-zinc-600 text-xs mt-2">Dacă câmpul este gol, se afișează mesajele implicite rotate automat.</p>
      </SettingsSection>

      {/* ── 3. Contact & Notificări ── */}
      <SettingsSection icon={Phone} title="Notificări WhatsApp & Viber"
        description="Numărul tău de contact pentru lead-uri și confirmări comenzi.">
        <label className={labelCls}>Număr principal (cu prefix, fără +)</label>
        <input type="tel" placeholder="ex: 37369123456"
          value={settings.general?.adminPhone ?? ""}
          onChange={(e) => storeActions.updateGeneral({ adminPhone: e.target.value.replace(/\D/g, "") })}
          className={inputCls + " font-mono"} />
        {settings.general?.adminPhone ? (
          <p className="text-[#10B981] text-xs mt-2 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" /> Activ — wa.me/{settings.general.adminPhone}
          </p>
        ) : (
          <p className="text-zinc-600 text-xs mt-2">Completează pentru a activa notificările instant.</p>
        )}
      </SettingsSection>

      {/* ── 4. Prețuri Servicii ── */}
      <SettingsSection icon={Wrench} title="Prețuri Servicii"
        description="Prețurile afișate pe pagina /servicii pentru fiecare tip de serviciu.">
        <div className="space-y-4">
          <div>
            <label className={labelCls}>Montaj Camere (text preț)</label>
            <input
              type="text"
              placeholder="ex: 750 MDL / cameră"
              value={settings.servicePrices?.montaj ?? ""}
              onChange={(e) => storeActions.updateServicePrices({ montaj: e.target.value })}
              className={inputCls}
            />
            <p className="text-zinc-600 text-xs mt-1">Afișat ca preț principal pe cardul „Montaj Camere"</p>
          </div>
          <div>
            <label className={labelCls}>Diagnosticare & Depanare (text preț)</label>
            <input
              type="text"
              placeholder="ex: de la 350 MDL / vizită"
              value={settings.servicePrices?.diagnosticare ?? ""}
              onChange={(e) => storeActions.updateServicePrices({ diagnosticare: e.target.value })}
              className={inputCls}
            />
            <p className="text-zinc-600 text-xs mt-1">Afișat pe cardul „Diagnosticare & Depanare"</p>
          </div>
          <div>
            <label className={labelCls}>Reparații Echipamente (text preț)</label>
            <input
              type="text"
              placeholder="ex: de la 400 MDL"
              value={settings.servicePrices?.reparatii ?? ""}
              onChange={(e) => storeActions.updateServicePrices({ reparatii: e.target.value })}
              className={inputCls}
            />
            <p className="text-zinc-600 text-xs mt-1">Afișat pe cardul „Reparații Echipamente"</p>
          </div>
        </div>
        <div className="mt-3 p-3 bg-zinc-800/50 rounded-lg border border-zinc-700 text-xs text-zinc-400">
          💡 Modificările se salvează automat și apar imediat pe pagina <span className="text-[#FF4F00]">/servicii</span>
        </div>
      </SettingsSection>

      {/* ── 5. Livrare ── */}
      <SettingsSection icon={Truck} title="Setări Livrare"
        description="Configurează pragul de livrare gratuită și costul livrării.">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Livrare Gratuită peste (MDL)</label>
            <input type="number" min="0" placeholder="5000"
              value={settings.delivery?.freeThreshold ?? 5000}
              onChange={(e) => storeActions.updateDelivery({ freeThreshold: Number(e.target.value) })}
              className={inputCls + " font-mono"} />
          </div>
          <div>
            <label className={labelCls}>Cost Livrare (MDL)</label>
            <input type="number" min="0" placeholder="150"
              value={settings.delivery?.price ?? 150}
              onChange={(e) => storeActions.updateDelivery({ price: Number(e.target.value) })}
              className={inputCls + " font-mono"} />
          </div>
        </div>
        <p className="text-zinc-600 text-xs mt-3">
          Comenzile peste <span className="text-zinc-400">{fmt(settings.delivery?.freeThreshold ?? 5000)} MDL</span> beneficiază de livrare gratuită.
        </p>
      </SettingsSection>

      {/* ── 5. Social Media ── */}
      <SettingsSection icon={Globe} title="Social Media & Recenzii"
        description="Linkuri afișate în footer și pagina de contact.">
        <div className="space-y-3">
          {[
            { key: "facebook" as const, label: "Facebook", placeholder: "https://facebook.com/tecomd" },
            { key: "instagram" as const, label: "Instagram", placeholder: "https://instagram.com/tecomd" },
            { key: "tiktok" as const, label: "TikTok", placeholder: "https://tiktok.com/@tecomd" },
            { key: "googleReviews" as const, label: "Link Google Reviews", placeholder: "https://g.page/tecomd/review" },
          ].map(({ key, label, placeholder }) => (
            <div key={key}>
              <label className={labelCls}>{label}</label>
              <input type="url" placeholder={placeholder}
                value={settings.social?.[key] ?? ""}
                onChange={(e) => storeActions.updateSocial({ [key]: e.target.value })}
                className={inputCls} />
            </div>
          ))}
        </div>
      </SettingsSection>

      {/* ── 6. Categorii ── */}
      <SettingsSection icon={Tag} title="Categorii Produse"
        description="Adaugă, editează, reordonează sau șterge categorii. Modificările se reflectă imediat în filtrul de pe site.">
        <div className="space-y-2 mb-4">
          {categories.map((cat, idx) => (
            <div key={cat.id} className="bg-zinc-800 rounded-xl p-3">
              {catEditId === cat.id ? (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Denumire RO</p>
                      <input value={catEditLabel} onChange={(e) => setCatEditLabel(e.target.value)} placeholder="ex: Camere WiFi"
                        className="w-full bg-zinc-700 border border-zinc-600 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-[#FF4F00]" />
                    </div>
                    <div>
                      <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Denumire RU</p>
                      <input value={catEditLabelRu} onChange={(e) => setCatEditLabelRu(e.target.value)} placeholder="ex: WiFi Камеры"
                        className="w-full bg-zinc-700 border border-zinc-600 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-[#FF4F00]" />
                    </div>
                  </div>
                  <div className="flex gap-2 items-center">
                    <input value={catEditSlug} onChange={(e) => setCatEditSlug(e.target.value)} placeholder="slug (url)"
                      className="flex-1 bg-zinc-700 border border-zinc-600 rounded-lg px-3 py-1.5 text-sm text-zinc-400 font-mono focus:outline-none focus:border-[#FF4F00]" />
                    <button onClick={() => saveEditCat(cat.id)} className="bg-[#FF4F00] text-white px-4 py-1.5 rounded-lg text-xs font-bold hover:opacity-90 whitespace-nowrap">Salvează</button>
                    <button onClick={() => setCatEditId(null)} className="bg-zinc-700 text-zinc-400 px-2 py-1.5 rounded-lg text-xs hover:bg-zinc-600">✕</button>
                  </div>
                  <MediaUploadSlot
                    label="Imagine categorie (afișată pe homepage)"
                    value={catEditImage}
                    onChange={setCatEditImage}
                    acceptVideo={false}
                  />
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="flex flex-col gap-0.5 mr-1">
                    <button onClick={() => moveCat(idx, -1)} disabled={idx === 0} className="text-zinc-600 hover:text-zinc-300 disabled:opacity-20 disabled:cursor-not-allowed transition-colors">
                      <ArrowUp className="w-3 h-3" />
                    </button>
                    <button onClick={() => moveCat(idx, 1)} disabled={idx === categories.length - 1} className="text-zinc-600 hover:text-zinc-300 disabled:opacity-20 disabled:cursor-not-allowed transition-colors">
                      <ArrowDown className="w-3 h-3" />
                    </button>
                  </div>
                  {cat.image && (
                    <img src={cat.image} alt={cat.label} className="w-10 h-10 rounded-lg object-cover flex-shrink-0 border border-zinc-600" />
                  )}
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-semibold text-white">{cat.label}</span>
                    <span className="text-zinc-600 text-xs font-mono ml-2">/{cat.slug}</span>
                  </div>
                  <span className="text-[10px] text-zinc-600 bg-zinc-700 px-1.5 py-0.5 rounded">
                    {products.filter((p) => p.category === cat.slug).length} prod.
                  </span>
                  <button onClick={() => { setCatEditId(cat.id); setCatEditLabel(cat.label); setCatEditLabelRu(cat.labelRu ?? ""); setCatEditSlug(cat.slug); setCatEditImage(cat.image ?? ""); }}
                    className="p-1.5 rounded-lg hover:bg-zinc-700 text-zinc-500 hover:text-white transition-colors">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => deleteCat(cat.id)}
                    className="p-1.5 rounded-lg hover:bg-red-900/30 text-zinc-600 hover:text-red-400 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {showAddCat ? (
          <div className="bg-zinc-800 rounded-xl p-3 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Denumire RO *</p>
                <input autoFocus value={catNewLabel} onChange={(e) => setCatNewLabel(e.target.value)} placeholder="ex: Drone"
                  className="w-full bg-zinc-700 border border-zinc-600 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-[#FF4F00]"
                  onKeyDown={(e) => { if (e.key === "Enter") addCat(); if (e.key === "Escape") setShowAddCat(false); }} />
              </div>
              <div>
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Denumire RU</p>
                <input value={catNewLabelRu} onChange={(e) => setCatNewLabelRu(e.target.value)} placeholder="ex: Дроны"
                  className="w-full bg-zinc-700 border border-zinc-600 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-[#FF4F00]" />
              </div>
            </div>
            <div className="flex gap-2 items-center">
              <input value={catNewSlug} onChange={(e) => setCatNewSlug(e.target.value)} placeholder="slug (opțional)"
                className="flex-1 bg-zinc-700 border border-zinc-600 rounded-lg px-3 py-1.5 text-sm text-zinc-400 font-mono focus:outline-none focus:border-[#FF4F00]" />
              <button onClick={addCat} className="bg-[#FF4F00] text-white px-4 py-1.5 rounded-lg text-xs font-bold hover:opacity-90 whitespace-nowrap">Adaugă</button>
              <button onClick={() => { setShowAddCat(false); setCatNewLabel(""); setCatNewLabelRu(""); setCatNewSlug(""); setCatNewImage(""); }}
                className="bg-zinc-700 text-zinc-400 px-2 py-1.5 rounded-lg text-xs hover:bg-zinc-600">✕</button>
            </div>
            <MediaUploadSlot
              label="Imagine categorie (opțional)"
              value={catNewImage}
              onChange={setCatNewImage}
              acceptVideo={false}
            />
          </div>
        ) : (
          <button onClick={() => setShowAddCat(true)}
            className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors w-full justify-center">
            <Plus className="w-4 h-4" /> Adaugă Categorie Nouă
          </button>
        )}
      </SettingsSection>

      {/* ── 7. Hero ── */}
      <SettingsSection icon={Star} title="Hero — Media & Produs Promovat"
        description="Imagine sau video scurt afișat în secțiunea principală a homepage-ului.">
        <div className="mb-4">
          <MediaUploadSlot
            label="Media Hero (imagine sau video scurt)"
            value={settings.hero?.bannerMedia ?? ""}
            onChange={(url) => storeActions.updateHero({ bannerMedia: url, bannerMediaType: url.startsWith("data:video") || /\.(mp4|webm|mov)(\?|$)/i.test(url) ? "video" : "image" })}
            acceptVideo={true}
          />
        </div>
        <label className={labelCls}>Produse în Hero Slider</label>
        <p className="text-zinc-500 text-xs mb-2">Produsele selectate apar în slider în ordinea de mai jos. Apasă săgețile pentru a schimba ordinea.</p>
        
        {/* Produse selectate - cu ordine */}
        {(settings.hero?.heroProducts ?? []).length > 0 && (
          <div className="mb-3 space-y-1">
            <p className="text-zinc-400 text-xs font-semibold uppercase tracking-wide mb-2">Ordinea în slider:</p>
            {(settings.hero?.heroProducts ?? []).map((id, idx) => {
              const p = products.find(x => x.id === id);
              if (!p) return null;
              const heroProds = settings.hero?.heroProducts ?? [];
              return (
                <div key={id} className="flex items-center gap-2 bg-[#FF4F00]/20 border border-[#FF4F00] rounded-xl p-2">
                  <span className="text-[#FF4F00] font-black text-sm w-5 text-center">{idx + 1}</span>
                  <img src={p.imageUrl} alt={p.name} className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold text-xs truncate">{p.brand} — {p.name}</p>
                    <p className="text-[#FF4F00] font-mono text-[10px]">{fmt(p.price)} MDL</p>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <button disabled={idx === 0} onClick={() => {
                      const arr = [...heroProds];
                      [arr[idx-1], arr[idx]] = [arr[idx], arr[idx-1]];
                      storeActions.updateHero({ heroProducts: arr });
                    }} className="text-zinc-400 hover:text-white disabled:opacity-20 text-xs leading-none">▲</button>
                    <button disabled={idx === heroProds.length - 1} onClick={() => {
                      const arr = [...heroProds];
                      [arr[idx+1], arr[idx]] = [arr[idx], arr[idx+1]];
                      storeActions.updateHero({ heroProducts: arr });
                    }} className="text-zinc-400 hover:text-white disabled:opacity-20 text-xs leading-none">▼</button>
                  </div>
                  <button onClick={() => {
                    storeActions.updateHero({ heroProducts: heroProds.filter(x => x !== id) });
                  }} className="text-zinc-500 hover:text-red-400 text-xs ml-1">✕</button>
                </div>
              );
            })}
          </div>
        )}

        {/* Toate produsele - pentru adaugare */}
        <p className="text-zinc-400 text-xs font-semibold uppercase tracking-wide mb-2">Adaugă produse:</p>
        <div className="space-y-1 max-h-56 overflow-y-auto pr-1">
          {products.filter(p => !(settings.hero?.heroProducts ?? []).includes(p.id)).map((p) => (
            <div key={p.id}
              onClick={() => {
                const current = settings.hero?.heroProducts ?? [];
                storeActions.updateHero({ heroProducts: [...current, p.id] });
              }}
              className="flex items-center gap-3 p-2 rounded-xl cursor-pointer bg-zinc-800 border border-zinc-700 hover:border-[#FF4F00] transition-all">
              <img src={p.imageUrl} alt={p.name} className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-white text-xs truncate">{p.brand} — {p.name}</p>
                <p className="text-[#FF4F00] font-mono text-[10px]">{fmt(p.price)} MDL</p>
              </div>
              <span className="text-zinc-500 text-xs">+ Adaugă</span>
            </div>
          ))}
        </div>
        {(settings.hero?.heroProducts ?? []).length > 0 && (
          <button onClick={() => storeActions.updateHero({ heroProducts: [] })}
            className="mt-2 text-xs text-zinc-500 hover:text-red-400 transition-colors">
            Resetează tot
          </button>
        )}
      </SettingsSection>

      {/* ── 8. Module A ── */}
      <SettingsSection icon={Zap} title="Modulul A — Calculator Costuri"
        description="Imagine banner și produsul recomandat afișat după completarea calculatorului.">
        <div className="mb-4">
          <MediaUploadSlot
            label="Banner imagine (opțional)"
            value={settings.moduleA?.bannerImage ?? ""}
            onChange={(url) => storeActions.updateModuleA({ bannerImage: url })}
            acceptVideo={false}
          />
        </div>
        <label className={labelCls}>Produs recomandat după calculator</label>
        <select value={settings.moduleA.productId ?? ""}
          onChange={(e) => storeActions.updateModuleA(e.target.value ? Number(e.target.value) : null)}
          className={inputCls}>
          <option value="">— Niciun produs —</option>
          {products.map((p) => <option key={p.id} value={p.id}>{p.brand} — {p.name} ({fmt(p.price)} MDL)</option>)}
        </select>
      </SettingsSection>

      {/* ── 9. Module B ── */}
      <SettingsSection icon={SlidersHorizontal} title="Modulul B — ColorHunter Slider"
        description="Imaginile pentru sliderul comparativ zi/noapte. Încarcă direct de pe telefon.">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-5">
          <MediaUploadSlot
            label="Imagine IR / Noapte (stânga)"
            value={settings.moduleB.imageLeft}
            onChange={(url) => storeActions.updateModuleB({ imageLeft: url })}
            acceptVideo={false}
          />
          <MediaUploadSlot
            label="Imagine Color / Zi (dreapta)"
            value={settings.moduleB.imageRight}
            onChange={(url) => storeActions.updateModuleB({ imageRight: url })}
            acceptVideo={false}
          />
        </div>
        <label className={labelCls}>Produs ColorHunter</label>
        <select value={settings.moduleB.productId ?? ""}
          onChange={(e) => storeActions.updateModuleB({ productId: e.target.value ? Number(e.target.value) : null })}
          className={inputCls}>
          <option value="">— Niciun produs —</option>
          {products.map((p) => <option key={p.id} value={p.id}>{p.brand} — {p.name} ({fmt(p.price)} MDL)</option>)}
        </select>
      </SettingsSection>

      {/* ── 10. Galerie Instalări ── */}
      <GallerySection settings={settings} />

      {/* ── 11. Module C — Comparator Branduri ── */}
      <SettingsSection icon={BarChart3} title="Modulul C — Comparator Branduri"
        description="Clienții apasă pe un brand și văd cum arată imaginea acelei camere noaptea. Încarcă screenshot-uri sau clipuri reale din aplicația camerelor tale.">

        {/* Instruction card */}
        <div className="bg-blue-950/40 border border-blue-800/40 rounded-xl p-4 mb-5 text-sm">
          <p className="text-blue-300 font-bold mb-2">📸 Ce să încarci pentru fiecare brand:</p>
          <ul className="space-y-1.5 text-blue-200/80 text-xs">
            <li>• <strong className="text-blue-100">Screenshot din aplicație</strong> — deschide Dahua/IMOU/Reolink pe telefon, fă o captură de ecran cu imaginea camerei noaptea sau cu detecția activă (caseta verde cu "Persoană")</li>
            <li>• <strong className="text-blue-100">Video scurt (5–15 sec)</strong> — înregistrează ecranul telefonului cât timp camera detectează ceva, sau exportă un clip din NVR</li>
            <li>• <strong className="text-blue-100">Poză reală de la instalare</strong> — orice imagine care arată calitatea imaginii acelui brand</li>
          </ul>
          <p className="text-blue-300/60 text-xs mt-2">Dacă nu încarci nimic, se folosesc imagini demo. Poți lăsa branduri fără poză — vor rămâne cu imaginea implicită.</p>
        </div>

        <div className="space-y-4">
          {brands.map((b) => (
            <div key={b} className="bg-zinc-800/50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <p className="text-sm font-bold text-white">{b}</p>
                {settings.moduleComparatorImages?.[b] && (
                  <span className="text-[10px] bg-green-600/20 text-green-400 border border-green-600/30 px-2 py-0.5 rounded-full font-bold">✓ Poză proprie</span>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Produs afișat pe card</label>
                  <select value={settings.moduleC[b] ?? ""}
                    onChange={(e) => storeActions.updateModuleC(b, e.target.value ? Number(e.target.value) : null)}
                    className="w-full bg-zinc-700 border border-zinc-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#FF4F00]">
                    <option value="">— Niciun produs —</option>
                    {products.map((p) => <option key={p.id} value={p.id}>{p.name} ({fmt(p.price)} MDL)</option>)}
                  </select>
                </div>
                <MediaUploadSlot
                  label="Screenshot sau clip real (noaptea / cu detecție)"
                  value={settings.moduleComparatorImages?.[b] ?? ""}
                  onChange={(url) => storeActions.updateComparatorImage(b, url)}
                  acceptVideo={true}
                />
              </div>
            </div>
          ))}
        </div>
      </SettingsSection>

      {/* ── 11b. Module D — AI Tripwire ── */}
      <SettingsSection icon={Zap} title="Modulul D — AI Tripwire & Analytics"
        description="Secțiunea care demonstrează detecția AI în timp real — arată clienților cum camera prinde o persoană care traversează o linie virtuală.">

        <div className="bg-blue-950/40 border border-blue-800/40 rounded-xl p-4 mb-5 text-sm">
          <p className="text-blue-300 font-bold mb-2">🎥 Ce să încarci aici:</p>
          <ul className="space-y-1.5 text-blue-200/80 text-xs">
            <li>• <strong className="text-blue-100">Imagine fundal</strong> — un screenshot dintr-un NVR/DVR real, dintr-o parcare sau curte supravegheată de tine. Poate fi și o poză de la un client (cu acordul lui).</li>
            <li>• <strong className="text-blue-100">Poza produsului</strong> — fotografia NVR-ului sau kit-ului AI pe care vrei să-l vinzi prin această secțiune.</li>
          </ul>
          <p className="text-blue-300/60 text-xs mt-2">Animația cu detecția persoanei se suprapune automat peste imaginea ta.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-5">
          <MediaUploadSlot
            label="Fundal feed cameră (parcare, curte, hol)"
            value={settings.moduleTripwire?.bgImage ?? ""}
            onChange={(url) => storeActions.updateTripwire({ bgImage: url })}
            acceptVideo={false}
          />
          <MediaUploadSlot
            label="Poza produsului NVR / Kit AI"
            value={settings.moduleTripwire?.cardImage ?? ""}
            onChange={(url) => storeActions.updateTripwire({ cardImage: url })}
            acceptVideo={false}
          />
        </div>
        <label className={labelCls}>Produs de vânzare în această secțiune</label>
        <select value={settings.moduleTripwire?.productId ?? ""}
          onChange={(e) => storeActions.updateTripwire({ productId: e.target.value ? Number(e.target.value) : null })}
          className={inputCls}>
          <option value="">— Implicit (Dahua NVR WizSense 8CH) —</option>
          {products.map((p) => <option key={p.id} value={p.id}>{p.brand} — {p.name} ({fmt(p.price)} MDL)</option>)}
        </select>
      </SettingsSection>

      {/* ── 12. Securitate ── */}
      <SettingsSection icon={Lock} title="Securitate — Schimbare PIN Admin"
        description="Schimbă codul PIN de acces la panoul de administrare.">
        <div className="space-y-3 max-w-sm">
          <div>
            <label className={labelCls}>PIN Curent</label>
            <input type="password" value={pinCurrent} onChange={(e) => { setPinCurrent(e.target.value); setPinError(""); }}
              placeholder="••••••" className={inputCls + " font-mono tracking-widest"} />
          </div>
          <div>
            <label className={labelCls}>PIN Nou (minim 4 caractere)</label>
            <input type="password" value={pinNew} onChange={(e) => { setPinNew(e.target.value); setPinError(""); }}
              placeholder="••••••" className={inputCls + " font-mono tracking-widest"} />
          </div>
          <div>
            <label className={labelCls}>Confirmare PIN Nou</label>
            <input type="password" value={pinConfirm} onChange={(e) => { setPinConfirm(e.target.value); setPinError(""); }}
              placeholder="••••••" className={inputCls + " font-mono tracking-widest"} />
          </div>
          {pinError && <p className="text-red-400 text-xs flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5" />{pinError}</p>}
          {pinSuccess && <p className="text-green-400 text-xs flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5" />PIN schimbat cu succes!</p>}
          <button onClick={handlePinChange}
            className="flex items-center gap-2 bg-[#FF4F00] text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:opacity-90 transition-all w-full justify-center">
            <Lock className="w-3.5 h-3.5" /> Schimbă PIN-ul
          </button>
        </div>
      </SettingsSection>

      {/* ── 12. Texte Homepage ── */}
      <SettingsSection icon={FileText} title="Texte Homepage" description="Modifică textele afișate pe pagina principală (RO și RU).">
        {(["ro","ru"] as const).map(lng => (
          <div key={lng} className="mb-6">
            <h4 className="font-semibold text-zinc-300 mb-3 uppercase text-xs tracking-widest">{lng.toUpperCase()}</h4>
            <div className="grid grid-cols-1 gap-3">
              {[
                { key: "hero.badge", label: "Badge (ex: Moldova #1)" },
                { key: "hero.title1", label: "Titlu linia 1" },
                { key: "hero.title2", label: "Titlu linia 2 (portocaliu)" },
                { key: "hero.subtitle", label: "Subtitlu" },
                { key: "hero.stat_installs", label: "Stat: Instalări" },
                { key: "hero.stat_rating", label: "Stat: Rating" },
                { key: "hero.stat_delivery", label: "Stat: Livrare" },
                { key: "hero.cta_buy", label: "Buton Cumpără" },
                { key: "hero.cta_consult", label: "Buton Consultanță" },
                { key: "hero.trust1", label: "Trust 1" },
                { key: "hero.trust2", label: "Trust 2" },
                { key: "hero.trust3", label: "Trust 3" },
                { key: "hero.ticker", label: "Ticker tape (bandă rulantă)" },
              ].map(({ key, label }) => (
                <div key={key}>
                  <label className="block text-[11px] font-semibold text-zinc-400 mb-1 uppercase tracking-wider">{label}</label>
                  <input
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    value={(settings.homeText?.[lng] as Record<string,string> | undefined)?.[key] ?? (translations[lng] as Record<string,string>)?.[key] ?? (translations.ro as Record<string,string>)?.[key] ?? ""}
                    placeholder={(translations[lng] as Record<string,string>)?.[key] ?? (translations.ro as Record<string,string>)?.[key] ?? key}
                    onChange={e => {
                      const prev = settings.homeText?.[lng] ?? {};
                      storeActions.updateSettings({
                        homeText: {
                          ro: settings.homeText?.ro ?? {},
                          ru: settings.homeText?.ru ?? {},
                          [lng]: { ...prev, [key]: e.target.value },
                        }
                      });
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </SettingsSection>

      {/* ── 13. Pagini statice ── */}
      <SettingsSection icon={FileText} title="Pagini Statice" description="Editează conținutul paginilor Termeni, Confidențialitate și Garanții.">
        {[
          { key: "termeni", label: "Termeni și Condiții" },
          { key: "confidentialitate", label: "Politica de Confidențialitate" },
          { key: "garantii", label: "Garanții și Retur" },
        ].map(({ key, label }) => (
          <div key={key} className="mb-6">
            <label className="block text-[11px] font-semibold text-zinc-400 mb-1 uppercase tracking-wider">{label}</label>
            <textarea
              rows={8}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-y"
              value={(settings.staticPages as Record<string,string> | undefined)?.[key] ?? ""}
              placeholder={"Scrie conținutul pentru " + label + "..."}
              onChange={e => storeActions.updateSettings({
                staticPages: { ...(settings.staticPages ?? {}), [key]: e.target.value }
              })}
            />
          </div>
        ))}
      </SettingsSection>

      {/* ── 14. Danger zone ── */}
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

// ─── AI TOOLS TAB ────────────────────────────────────────────────────
interface LeadAnalysis {
  score: number;
  potential: string;
  estimatedBudget: string;
  recommendation: string;
  whatsappMessage: string;
}

interface BusinessInsights {
  summary: string;
  insights: { title: string; description: string; action: string }[];
  topOpportunity: string;
}




function ImportTab() {
  const [file, setFile] = useState<File | null>(null);
  const [step, setStep] = useState("upload");
  const [logs, setLogs] = useState<string[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [progress, setProgress] = useState(0);
  const [checkedAll, setCheckedAll] = useState(true);
  const [unchecked, setUnchecked] = useState<number[]>([]);
  const [imported, setImported] = useState(0);
  const [usdRate, setUsdRate] = useState("17.8");

  const API = import.meta.env.VITE_API_URL || "";
  const SUPA_URL = import.meta.env.VITE_SUPABASE_URL || "";
  const SUPA_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "";

  const addLog = (msg: string) => setLogs(p => [...p, msg]);

  const handleFile = (f: File) => setFile(f);

  const analyze = async () => {
    if (!file) return;
    setStep("analyze"); setLogs([]); setProgress(10);
    addLog("Citesc " + file.name + "...");
    try {
      const reader = new FileReader();
      const csvData = await new Promise<string>((res, rej) => {
        reader.onload = (e) => {
          try {
            const XLSX = (window as any).XLSX;
            const wb = XLSX.read(e.target!.result, { type: "array" });
            let csv = "";
            wb.SheetNames.forEach((n: string) => {
              const d = XLSX.utils.sheet_to_csv(wb.Sheets[n], { blankrows: false });
              if (d.trim().length > 50) csv += "\n=== " + n + " ===\n" + d.split("\n").slice(0,150).join("\n");
            });
            // Curatam caracterele problematice si limitam dimensiunea
        const cleanCsv = csv
          .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, " ")
          .replace(/[\u200B-\u200D\uFEFF]/g, "")
          .slice(0, 14000);
        res(cleanCsv);
          } catch(e: any) { rej(e); }
        };
        reader.readAsArrayBuffer(file);
      });
      addLog("Date: " + csvData.length + " chars");
      addLog("Preview: " + csvData.slice(0, 200));
      setProgress(40);
      const r = await fetch(API + "/api/ai/import-products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csvData, usdRate, markup: "0", fileName: file.name }),
      });
      setProgress(80);
      const text = await r.text();
      const match = text.match(/\[[\s\S]*\]/);
      let prods = [];
      try { prods = JSON.parse(match ? match[0] : text); } catch(e) { addLog("Eroare JSON: " + text.slice(0,100)); }
      if (!Array.isArray(prods)) { addLog("Raspuns invalid: " + JSON.stringify(prods).slice(0,100)); prods = []; }
      addLog("Produse: " + prods.length);
      setProducts(prods);
      setCheckedAll(true);
      setUnchecked([]);
      setProgress(100);
      setTimeout(() => setStep("preview"), 300);
    } catch(e: any) { addLog("Eroare: " + e.message); }
  };

  const doImport = async () => {
    const toImport = products.filter((_, i) => checkedAll ? !unchecked.includes(i) : false);
    setStep("importing"); setLogs([]); let ok = 0;
    for (let i = 0; i < toImport.length; i++) {
      const p = toImport[i];
      setProgress(Math.round(i / toImport.length * 100));
      try {
        await fetch(SUPA_URL + "/rest/v1/products", {
          method: "POST",
          headers: { "Content-Type": "application/json", "apikey": SUPA_KEY, "Authorization": "Bearer " + SUPA_KEY, "Prefer": "return=minimal" },
          body: JSON.stringify({ name: p.name||p.model||"Produs", model: p.model||"", brand: p.brand||"", price: Math.round(p.price||0), old_price: p.oldPrice?Math.round(p.oldPrice):null, specs: p.specs||"", description: p.description||"", category: p.category||"wifi", image_url: p.imageUrl||"", images: p.imageUrl?[p.imageUrl]:[], in_stock: true, icon: "camera", long_description: "", tech_specs: p.specs||"", badge: null }),
        });
        ok++; addLog("✅ " + (p.name||p.model));
      } catch(e: any) { addLog("❌ " + e.message); }
      await new Promise(r => setTimeout(r, 80));
    }
    setImported(ok); setProgress(100); setStep("done");
    await initStore();
  };

  return (
    <div className="p-4 max-w-4xl mx-auto space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <Package className="w-5 h-5 text-[#FF4F00]" />
        <h2 className="font-black text-xl">Import Produse XLS</h2>
      </div>
      {step === "upload" && (
        <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
          <label className="flex flex-col items-center justify-center border-2 border-dashed border-zinc-700 rounded-xl p-8 cursor-pointer hover:border-[#FF4F00] transition-colors" onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); }}>
            <Package className="w-10 h-10 text-zinc-600 mb-2" />
            <p className="font-semibold text-zinc-300 mb-1">Trage XLS/CSV aici sau click</p>
            <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }} />
          </label>
          {file && (
            <div className="mt-4 space-y-3">
              <p className="text-sm text-zinc-300">📁 {file.name}</p>
              <div>
                <p className="text-xs text-zinc-500 mb-1">Curs USD/MDL</p>
                <input type="number" value={usdRate} onChange={e => setUsdRate(e.target.value)} step="0.1" className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white w-32" />
              </div>
              <button onClick={analyze} className="w-full bg-[#FF4F00] text-white font-bold py-3 rounded-xl hover:bg-orange-600">🤖 Analizeaza cu AI</button>
            </div>
          )}
        </div>
      )}
      {(step === "analyze" || step === "importing") && (
        <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800 space-y-3">
          <p className="font-semibold">{step === "analyze" ? "🤖 Analiza AI..." : "📦 Import..."}</p>
          <div className="h-2 bg-zinc-800 rounded-full"><div className="h-2 bg-[#FF4F00] rounded-full" style={{ width: progress + "%" }} /></div>
          <div className="bg-zinc-950 rounded-lg p-3 font-mono text-xs text-zinc-400 max-h-40 overflow-y-auto">{logs.map((l, i) => <div key={i}>{l}</div>)}</div>
        </div>
      )}
      {step === "preview" && (
        <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800 space-y-4">
          <div className="flex items-center justify-between">
            <p className="font-black text-xl">{products.length} produse găsite</p>
            <div className="flex gap-2">
              <button onClick={() => setStep("upload")} className="px-4 py-2 rounded-xl border border-zinc-700 text-sm text-white hover:bg-zinc-800">← Înapoi</button>
              <button onClick={doImport} className="px-6 py-2 rounded-xl bg-[#FF4F00] text-white font-bold text-sm">Importă toate →</button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr className="border-b border-zinc-800"><th className="text-left p-2 text-zinc-400">Model</th><th className="text-left p-2 text-zinc-400">Denumire</th><th className="text-left p-2 text-zinc-400">Preț MDL</th><th className="text-left p-2 text-zinc-400">Categorie</th></tr></thead>
              <tbody>{products.slice(0, 50).map((p, i) => <tr key={i} className="border-b border-zinc-800/50"><td className="p-2 font-mono text-zinc-300">{p.model||"—"}</td><td className="p-2 text-zinc-200 max-w-xs truncate">{p.name||"—"}</td><td className="p-2 font-bold text-green-400">{p.price ? Math.round(p.price) + " MDL" : "—"}</td><td className="p-2 text-zinc-400">{p.category||"—"}</td></tr>)}</tbody>
            </table>
          </div>
        </div>
      )}
      {step === "done" && (
        <div className="bg-zinc-900 rounded-2xl p-8 border border-zinc-800 text-center">
          <p className="text-4xl mb-2">✅</p>
          <p className="text-xl font-black text-white">{imported} produse importate!</p>
          <button onClick={() => { setStep("upload"); setFile(null); setProducts([]); setLogs([]); setProgress(0); }} className="mt-4 px-6 py-2 rounded-xl bg-[#FF4F00] text-white font-bold">Import nou</button>
        </div>
      )}
    </div>
  );
}


function AdminAITab({ leads, products, orders }: { leads: Lead[]; products: StoreProduct[]; orders: Order[] }) {
  const [activeSection, setActiveSection] = useState<"leads" | "description" | "insights" | "sitemap">("leads");

  const [selectedLeadId, setSelectedLeadId] = useState<string>("");
  const [leadAnalysis, setLeadAnalysis] = useState<LeadAnalysis | null>(null);
  const [leadLoading, setLeadLoading] = useState(false);
  const [leadError, setLeadError] = useState("");

  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [generatedDesc, setGeneratedDesc] = useState("");
  const [descLoading, setDescLoading] = useState(false);
  const [descError, setDescError] = useState("");
  const [descCopied, setDescCopied] = useState(false);

  const [insights, setInsights] = useState<BusinessInsights | null>(null);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [insightsError, setInsightsError] = useState("");

  const analyzeLead = useCallback(async () => {
    const lead = leads.find((l) => l.id === selectedLeadId);
    if (!lead) return;
    setLeadLoading(true); setLeadError(""); setLeadAnalysis(null);
    try {
      const res = await fetch((import.meta.env.VITE_API_URL || "") + "/api/ai/lead-analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lead }),
      });
      if (!res.ok) throw new Error(await res.text());
      setLeadAnalysis(await res.json());
    } catch (e) {
      setLeadError(String(e));
    } finally {
      setLeadLoading(false);
    }
  }, [selectedLeadId, leads]);

  const generateDescription = useCallback(async () => {
    const prod = products.find((p) => String(p.id) === selectedProductId);
    if (!prod) return;
    setDescLoading(true); setDescError(""); setGeneratedDesc("");
    try {
      const res = await fetch((import.meta.env.VITE_API_URL || "") + "/api/ai/description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: prod.name, specs: prod.specs, brand: prod.brand, price: prod.price, category: prod.category }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setGeneratedDesc(data.description ?? "");
    } catch (e) {
      setDescError(String(e));
    } finally {
      setDescLoading(false);
    }
  }, [selectedProductId, products]);

  const loadInsights = useCallback(async () => {
    setInsightsLoading(true); setInsightsError(""); setInsights(null);
    try {
      const res = await fetch((import.meta.env.VITE_API_URL || "") + "/api/ai/business-insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orders, leads, products }),
      });
      if (!res.ok) throw new Error(await res.text());
      setInsights(await res.json());
    } catch (e) {
      setInsightsError(String(e));
    } finally {
      setInsightsLoading(false);
    }
  }, [orders, leads, products]);

  const copyDesc = () => {
    navigator.clipboard.writeText(generatedDesc);
    setDescCopied(true);
    setTimeout(() => setDescCopied(false), 2000);
  };

  const copyWA = (msg: string) => navigator.clipboard.writeText(msg);

  const scoreColor = (s: number) =>
    s >= 8 ? "text-green-400" : s >= 5 ? "text-amber-400" : "text-red-400";

  const [sitemapCopied, setSitemapCopied] = useState(false);

  const generateSitemapXml = useCallback(() => {
    const BASE = "https://teco.md";
    const now = new Date().toISOString().split("T")[0];
    const staticUrls = [
      { loc: `${BASE}/`, prio: "1.0", freq: "weekly" },
      { loc: `${BASE}/produse`, prio: "0.9", freq: "daily" },
      { loc: `${BASE}/servicii`, prio: "0.8", freq: "monthly" },
      { loc: `${BASE}/blog`, prio: "0.7", freq: "weekly" },
    ];
    const productUrls = products.map((p) => ({
      loc: `${BASE}/product/${p.id}`, prio: "0.8", freq: "weekly",
    }));
    const allUrls = [...staticUrls, ...productUrls];
    const urlTags = allUrls.map(({ loc, prio, freq }) =>
      `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${now}</lastmod>\n    <changefreq>${freq}</changefreq>\n    <priority>${prio}</priority>\n    <xhtml:link rel="alternate" hreflang="ro" href="${loc}"/>\n    <xhtml:link rel="alternate" hreflang="ru" href="${loc}"/>\n  </url>`
    ).join("\n");
    return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n        xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urlTags}\n</urlset>`;
  }, [products]);

  const downloadSitemap = useCallback(() => {
    const xml = generateSitemapXml();
    const blob = new Blob([xml], { type: "application/xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "sitemap.xml"; a.click();
    URL.revokeObjectURL(url);
  }, [generateSitemapXml]);

  const copySitemap = useCallback(async () => {
    await navigator.clipboard.writeText(generateSitemapXml());
    setSitemapCopied(true);
    setTimeout(() => setSitemapCopied(false), 2000);
  }, [generateSitemapXml]);

  const sections = [
    { key: "leads" as const,       label: "Analiză Lead-uri",     icon: Users       },
    { key: "description" as const, label: "Descrieri Produse",    icon: Wand2       },
    { key: "insights" as const,    label: "Insights Business",    icon: Sparkles    },
    { key: "sitemap" as const,     label: "Sitemap SEO",          icon: Globe       },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF4F00] to-orange-500 flex items-center justify-center">
          <Bot className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="font-black text-lg">AI Tools</h2>
          <p className="text-zinc-500 text-xs">Powered by Gemini 2.5 Flash · Teco.md</p>
        </div>
      </div>

      {/* Section picker */}
      <div className="flex gap-2 flex-wrap">
        {sections.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setActiveSection(key)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all ${activeSection === key ? "bg-[#FF4F00] text-white" : "bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800"}`}>
            <Icon className="w-3.5 h-3.5" /> {label}
          </button>
        ))}
      </div>

      {/* ── Lead Analyzer ── */}
      {activeSection === "leads" && (
        <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-5 space-y-4">
          <div>
            <p className="text-sm font-semibold mb-3">Selectează un lead pentru analiză AI:</p>
            <div className="flex gap-2">
              <select value={selectedLeadId} onChange={(e) => { setSelectedLeadId(e.target.value); setLeadAnalysis(null); }}
                className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#FF4F00]">
                <option value="">— Alege lead —</option>
                {leads.map((l) => (
                  <option key={l.id} value={l.id}>{l.name} · {l.phone} {l.notes ? `· ${l.notes.slice(0, 30)}` : ""}</option>
                ))}
              </select>
              <button onClick={analyzeLead} disabled={!selectedLeadId || leadLoading}
                className="px-4 py-2 bg-[#FF4F00] text-white rounded-xl text-sm font-bold hover:opacity-90 disabled:opacity-40 flex items-center gap-2">
                {leadLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                Analizează
              </button>
            </div>
            {leadError && <p className="text-red-400 text-xs mt-2">{leadError}</p>}
          </div>

          {leadAnalysis && (
            <div className="space-y-3 pt-2 border-t border-zinc-800">
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-zinc-800 rounded-xl p-3 text-center">
                  <p className={`text-2xl font-black ${scoreColor(leadAnalysis.score)}`}>{leadAnalysis.score}<span className="text-sm text-zinc-500">/10</span></p>
                  <p className="text-[11px] text-zinc-500 mt-0.5">Scor</p>
                </div>
                <div className="bg-zinc-800 rounded-xl p-3 text-center">
                  <p className="text-sm font-bold text-white capitalize">{leadAnalysis.potential}</p>
                  <p className="text-[11px] text-zinc-500 mt-0.5">Potențial</p>
                </div>
                <div className="bg-zinc-800 rounded-xl p-3 text-center">
                  <p className="text-sm font-bold text-amber-400">{leadAnalysis.estimatedBudget}</p>
                  <p className="text-[11px] text-zinc-500 mt-0.5">Buget est.</p>
                </div>
              </div>

              <div className="bg-zinc-800 rounded-xl p-3">
                <p className="text-[11px] text-zinc-500 mb-1 font-semibold uppercase tracking-wide">Recomandare</p>
                <p className="text-sm text-white">{leadAnalysis.recommendation}</p>
              </div>

              <div className="bg-zinc-800 rounded-xl p-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[11px] text-zinc-500 font-semibold uppercase tracking-wide">Mesaj WhatsApp</p>
                  <button onClick={() => copyWA(leadAnalysis.whatsappMessage)}
                    className="text-[11px] text-[#FF4F00] hover:opacity-80 flex items-center gap-1">
                    <Copy className="w-3 h-3" /> Copiază
                  </button>
                </div>
                <p className="text-sm text-green-400 whitespace-pre-wrap">{leadAnalysis.whatsappMessage}</p>
              </div>
            </div>
          )}

          {!leadAnalysis && !leadLoading && leads.length === 0 && (
            <p className="text-zinc-600 text-sm text-center py-4">Nu există lead-uri încă. Clienții se vor adăuga când contactează prin TecoBot sau formular.</p>
          )}
        </div>
      )}

      {/* ── Description Generator ── */}
      {activeSection === "description" && (
        <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-5 space-y-4">
          <p className="text-sm font-semibold">Generează descriere SEO pentru un produs:</p>
          <div className="flex gap-2">
            <select value={selectedProductId} onChange={(e) => { setSelectedProductId(e.target.value); setGeneratedDesc(""); }}
              className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#FF4F00]">
              <option value="">— Alege produs —</option>
              {products.map((p) => (
                <option key={p.id} value={String(p.id)}>{p.name} · {p.price} MDL</option>
              ))}
            </select>
            <button onClick={generateDescription} disabled={!selectedProductId || descLoading}
              className="px-4 py-2 bg-[#FF4F00] text-white rounded-xl text-sm font-bold hover:opacity-90 disabled:opacity-40 flex items-center gap-2">
              {descLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
              Generează
            </button>
          </div>
          {descError && <p className="text-red-400 text-xs">{descError}</p>}

          {generatedDesc && (
            <div className="bg-zinc-800 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-[11px] text-zinc-500 font-semibold uppercase tracking-wide">Descriere generată</p>
                <button onClick={copyDesc}
                  className="text-[11px] text-[#FF4F00] hover:opacity-80 flex items-center gap-1">
                  <Copy className="w-3 h-3" /> {descCopied ? "Copiat!" : "Copiază"}
                </button>
              </div>
              <p className="text-sm text-white leading-relaxed">{generatedDesc}</p>
            </div>
          )}
        </div>
      )}

      {/* ── Business Insights ── */}
      {activeSection === "insights" && (
        <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">Analiză inteligentă a magazinului tău:</p>
            <button onClick={loadInsights} disabled={insightsLoading}
              className="px-4 py-2 bg-[#FF4F00] text-white rounded-xl text-sm font-bold hover:opacity-90 disabled:opacity-40 flex items-center gap-2">
              {insightsLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {insights ? "Reîmprospătează" : "Analizează"}
            </button>
          </div>
          {insightsError && <p className="text-red-400 text-xs">{insightsError}</p>}

          {insights && (
            <div className="space-y-3 pt-2 border-t border-zinc-800">
              <div className="bg-zinc-800 rounded-xl p-3">
                <p className="text-[11px] text-zinc-500 mb-1 font-semibold uppercase tracking-wide">Rezumat</p>
                <p className="text-sm text-white">{insights.summary}</p>
              </div>

              <div className="space-y-2">
                {insights.insights?.map((item, i) => (
                  <div key={i} className="bg-zinc-800 rounded-xl p-3">
                    <div className="flex items-start gap-2">
                      <div className="w-5 h-5 rounded-full bg-[#FF4F00]/20 text-[#FF4F00] flex items-center justify-center flex-shrink-0 text-[11px] font-black mt-0.5">{i + 1}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-white">{item.title}</p>
                        <p className="text-xs text-zinc-400 mt-0.5">{item.description}</p>
                        <p className="text-xs text-[#FF4F00] mt-1 font-semibold">→ {item.action}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-gradient-to-r from-[#FF4F00]/10 to-orange-500/5 border border-[#FF4F00]/20 rounded-xl p-3">
                <p className="text-[11px] text-[#FF4F00] mb-1 font-semibold uppercase tracking-wide flex items-center gap-1">
                  <Zap className="w-3 h-3" /> Cea mai mare oportunitate
                </p>
                <p className="text-sm text-white">{insights.topOpportunity}</p>
              </div>
            </div>
          )}

          {!insights && !insightsLoading && (
            <div className="text-center py-8 text-zinc-600">
              <BrainCircuit className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Apasă "Analizează" pentru a obține recomandări AI personalizate bazate pe datele magazinului tău.</p>
            </div>
          )}
        </div>
      )}

      {/* ── Sitemap SEO ── */}
      {activeSection === "sitemap" && (
        <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-5 space-y-4">
          <div>
            <p className="text-sm font-semibold mb-1">Sitemap.xml dinamic — {products.length} produse</p>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Generează un sitemap.xml actualizat cu toate produsele tale. Descarcă-l și înlocuiește <code className="text-zinc-300 bg-zinc-800 px-1 rounded">public/sitemap.xml</code> în proiect, apoi redeploy pe Cloudflare.
              Google va indexa automat produsele noi în 1–3 zile.
            </p>
          </div>

          <div className="bg-zinc-800 rounded-xl p-3 font-mono text-xs text-zinc-400 max-h-48 overflow-y-auto whitespace-pre-wrap leading-relaxed">
            {generateSitemapXml().slice(0, 800)}
            <span className="text-zinc-600">... ({products.length + 4} URL-uri totale)</span>
          </div>

          <div className="flex gap-2 flex-wrap">
            <button onClick={downloadSitemap}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#FF4F00] text-white rounded-xl text-sm font-bold hover:opacity-90 transition-opacity">
              <Download className="w-4 h-4" /> Descarcă sitemap.xml
            </button>
            <button onClick={copySitemap}
              className="flex items-center gap-2 px-4 py-2.5 bg-zinc-800 text-white rounded-xl text-sm font-semibold hover:bg-zinc-700 transition-colors">
              <Copy className="w-4 h-4" /> {sitemapCopied ? "Copiat!" : "Copiază XML"}
            </button>
          </div>

          <div className="bg-zinc-800/50 rounded-xl p-3 space-y-2">
            <p className="text-[11px] text-zinc-500 font-semibold uppercase tracking-wide">Pași de actualizare SEO</p>
            {[
              "Descarcă sitemap.xml de mai sus",
              "Înlocuiește artifacts/teco-md/public/sitemap.xml cu fișierul descărcat",
              "Redeploy pe Cloudflare Pages (sau push pe GitHub dacă e conectat)",
              "În Google Search Console → Sitemaps → Trimite https://teco.md/sitemap.xml",
            ].map((step, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-[#FF4F00]/20 text-[#FF4F00] flex items-center justify-center flex-shrink-0 text-[10px] font-black mt-0.5">{i + 1}</span>
                <p className="text-xs text-zinc-400">{step}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── MAIN ADMIN ──────────────────────────────────────────────────────
const NAV: { key: Tab; label: string; icon: React.ElementType }[] = [
  { key: "dashboard", label: "Dashboard",  icon: LayoutDashboard },
  { key: "products",  label: "Produse",    icon: Package         },
  { key: "orders",    label: "Comenzi",    icon: ShoppingBag     },
  { key: "leads",     label: "Lead-uri",   icon: Users           },
  { key: "blog",      label: "Blog",       icon: Megaphone       },
  { key: "ai",        label: "AI Tools",   icon: BrainCircuit    },
  { key: "import",    label: "Import XLS",  icon: Package         },
  { key: "settings",  label: "Setări",     icon: Settings        },
];

export default function Admin() {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem("teco_admin") === "1");
  const [tab, setTab] = useState<Tab>("dashboard");

  const products = useStore((s) => s.products);
  const leads    = useStore((s) => s.leads);
  const orders   = useStore((s) => s.orders);
  const blogPosts = useStore((s) => s.blogPosts);
  const settings = useStore((s) => s.settings);

  const effectivePin = settings.general?.adminPin || ADMIN_PIN_FALLBACK;

  if (!authed) return <PinGate onAuth={() => setAuthed(true)} effectivePin={effectivePin} />;

  const logout = () => { sessionStorage.removeItem("teco_admin"); setAuthed(false); };

  const badgeCount: Partial<Record<Tab, number>> = {
    orders: orders.filter((o) => o.status === "new").length || undefined,
    leads:  leads.filter((l) => l.status === "new").length || undefined,
  };

  const categories = settings.categories ?? DEFAULT_CATEGORIES;

  return (
    <>
      <SEO title="Admin Panel" noIndex />
      <div className="min-h-screen bg-zinc-950 text-white flex">
        {/* ─── Sidebar (desktop) ─── */}
        <aside className="hidden lg:flex flex-col w-60 flex-shrink-0 border-r border-zinc-800 sticky top-0 h-screen">
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

        <main className="flex-1 px-4 lg:px-6 py-6 overflow-auto">
          {tab === "dashboard" && <DashboardTab products={products} leads={leads} orders={orders} />}
          {tab === "products"  && <ProductsTab products={products} categories={categories} />}
          {tab === "orders"    && <OrdersTab orders={orders} adminPhone={settings.general?.adminPhone ?? ""} />}
          {tab === "leads"     && <LeadsTab leads={leads} adminPhone={settings.general?.adminPhone ?? ""} />}
          {tab === "blog"      && <BlogTab posts={blogPosts} />}
          {tab === "ai"        && <AdminAITab leads={leads} products={products} orders={orders} />}
          {tab === "settings"  && <SettingsTab settings={settings} products={products} />}
          {tab === "import"    && <ImportTab />}
        </main>
      </div>
    </div>
    </>
  );
}
