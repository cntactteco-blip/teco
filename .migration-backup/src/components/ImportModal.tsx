import { useState, useCallback, useRef } from "react";
import * as XLSX from "xlsx";
import {
  X, Upload, RefreshCw, ChevronRight, Check, AlertCircle,
  FileSpreadsheet, Image as ImageIcon, ArrowRight,
} from "lucide-react";
import { storeActions, type StoreProduct } from "@/lib/store";

// ─── Types ───────────────────────────────────────────────────────────
type ColKey = "name" | "model" | "brand" | "category" | "price" | "oldPrice" | "specs" | "description" | "imageUrl";
type CurrencyMode = "auto" | "USD" | "EUR" | "MDL";
type Step = "upload" | "mapping" | "pricing" | "preview" | "done";
type ParsedRow = Record<string, string>;

interface ColMapping extends Record<ColKey, string> {
  priceCurrency: CurrencyMode;
}

// ─── Constants ───────────────────────────────────────────────────────
const COL_LABELS: Record<ColKey, string> = {
  name:        "Denumire Produs *",
  model:       "Model / Cod / SKU",
  brand:       "Brand / Producător",
  category:    "Categorie",
  price:       "Preț de achiziție *",
  oldPrice:    "Preț vechi (barat)",
  specs:       "Specificații tehnice",
  description: "Descriere",
  imageUrl:    "URL Imagine",
};

const COL_PATTERNS: Record<ColKey, string[]> = {
  name:        ["denumire", "name", "produs", "titlu", "title", "description-ro", "product name", "productname"],
  model:       ["model", "sku", "cod", "articol", "part", "reference", "ref", "code"],
  brand:       ["brand", "producator", "producător", "marca", "marcă", "manufacturer", "vendor"],
  category:    ["categorie", "category", "tip", "type", "group", "grupa"],
  price:       ["pret", "preț", "price", "cost", "usd", "eur", "mdl", "lei", "suma", "sumă"],
  oldPrice:    ["pret vechi", "old price", "pret initial", "pret anterior", "rrp", "msrp"],
  specs:       ["spec", "caracteristic", "parametr", "technical", "config", "features"],
  description: ["descriere", "description", "info", "detalii", "details", "text"],
  imageUrl:    ["imagine", "image", "foto", "photo", "url", "link", "picture", "img"],
};

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  wifi:   ["wifi", "wireless", "wi-fi", "fara fir", "fără fir", "ip camera"],
  poe:    ["poe", "power over ethernet", "lan", "cat5", "cat6"],
  "4g":   ["4g", "lte", "sim", "gsm", "cellular", "3g"],
  nvr:    ["nvr", "dvr", "recorder", "inregistrator", "înregistrator", "storage"],
  kituri: ["kit", "sistem", "set", "pachet", "bundle", "complete"],
  alarme: ["alarm", "senzor", "sensor", "detector", "motion", "pir", "smoke"],
};

// ─── Helpers ─────────────────────────────────────────────────────────
function autoDetectCol(headers: string[], field: ColKey): string {
  const patterns = COL_PATTERNS[field];
  // Exact match first, then includes
  const exact = headers.find((h) => patterns.some((p) => h.toLowerCase().trim() === p));
  if (exact) return exact;
  return headers.find((h) => patterns.some((p) => h.toLowerCase().includes(p))) ?? "";
}

function detectCategory(text: string): string {
  const lower = text.toLowerCase();
  for (const [cat, keys] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keys.some((k) => lower.includes(k))) return cat;
  }
  return "wifi";
}

function roundPrice(p: number): number {
  if (p <= 0) return 0;
  if (p < 100)  return Math.ceil(p / 5) * 5;
  if (p < 500)  return Math.ceil(p / 10) * 10;
  if (p < 2000) return Math.ceil(p / 50) * 50;
  return Math.ceil(p / 100) * 100;
}

function parseNum(raw: string): number {
  return parseFloat(raw.replace(/[^\d.,]/g, "").replace(",", ".")) || 0;
}

// ─── Component ───────────────────────────────────────────────────────
export function ImportModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<Step>("upload");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [embeddedImages, setEmbeddedImages] = useState<string[]>([]);
  const [fileName, setFileName] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [parseError, setParseError] = useState("");

  const [mapping, setMapping] = useState<ColMapping>({
    name: "", model: "", brand: "", category: "", price: "",
    oldPrice: "", specs: "", description: "", imageUrl: "",
    priceCurrency: "auto",
  });

  const [usdRate, setUsdRate] = useState("18.50");
  const [eurRate, setEurRate] = useState("20.00");
  const [markup, setMarkup] = useState("35");
  const [roundPrices, setRoundPrices] = useState(true);
  const [loadingRate, setLoadingRate] = useState(false);
  const [importedCount, setImportedCount] = useState(0);
  const [importing, setImporting] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);

  // ── Parse uploaded file ──────────────────────────────────────────
  const parseFile = useCallback((file: File) => {
    setFileName(file.name);
    setParseError("");
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: "array", cellStyles: false, dense: false });
        const ws = wb.Sheets[wb.SheetNames[0]];

        // Try to extract embedded images (SheetJS community edition)
        const imgs: string[] = [];
        if (ws["!images"]) {
          for (const img of ws["!images"] as any[]) {
            if (img?.data) {
              const mime = img.type === "jpeg" ? "image/jpeg" : `image/${img.type ?? "png"}`;
              imgs.push(`data:${mime};base64,${img.data}`);
            } else if (img?.Path) {
              // xlsx sometimes gives a path reference
              imgs.push(img.Path);
            }
          }
        }
        setEmbeddedImages(imgs);

        // Parse rows
        const jsonRaw = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1, defval: "", raw: false });
        if (jsonRaw.length < 2) { setParseError("Fișierul nu conține suficiente date (minim 2 rânduri: header + date)."); return; }

        // Find header row (first non-empty row)
        const hdrs = (jsonRaw[0] as any[]).map((h) => String(h ?? "").trim()).filter(Boolean);
        if (hdrs.length === 0) { setParseError("Nu am detectat coloane în primul rând."); return; }

        const allHeaders = (jsonRaw[0] as any[]).map((h) => String(h ?? "").trim());
        const dataRows = jsonRaw.slice(1)
          .filter((row) => (row as any[]).some((c) => c !== "" && c !== null && c !== undefined))
          .map((row) => {
            const obj: ParsedRow = {};
            allHeaders.forEach((h, i) => { obj[h] = String((row as any[])[i] ?? "").trim(); });
            return obj;
          });

        setHeaders(allHeaders.filter(Boolean));
        setRows(dataRows);

        // Auto-detect mapping
        const autoMap: ColMapping = {
          name:        autoDetectCol(allHeaders, "name"),
          model:       autoDetectCol(allHeaders, "model"),
          brand:       autoDetectCol(allHeaders, "brand"),
          category:    autoDetectCol(allHeaders, "category"),
          price:       autoDetectCol(allHeaders, "price"),
          oldPrice:    autoDetectCol(allHeaders, "oldPrice"),
          specs:       autoDetectCol(allHeaders, "specs"),
          description: autoDetectCol(allHeaders, "description"),
          imageUrl:    autoDetectCol(allHeaders, "imageUrl"),
          priceCurrency: "auto",
        };

        // Detect currency from price column name
        const pCol = autoMap.price.toLowerCase();
        if (pCol.includes("usd") || pCol.includes("$"))   autoMap.priceCurrency = "USD";
        else if (pCol.includes("eur") || pCol.includes("€")) autoMap.priceCurrency = "EUR";
        else if (pCol.includes("mdl") || pCol.includes("lei")) autoMap.priceCurrency = "MDL";

        setMapping(autoMap);
        setStep("mapping");
      } catch (err) {
        setParseError("Eroare la parsarea fișierului. Asigurați-vă că e un fișier Excel (.xlsx/.xls) sau CSV valid.");
      }
    };
    reader.readAsArrayBuffer(file);
  }, []);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) parseFile(file);
  };

  // ── Fetch live exchange rates ────────────────────────────────────
  const fetchRates = async () => {
    setLoadingRate(true);
    try {
      const res = await fetch("https://open.er-api.com/v6/latest/USD");
      if (!res.ok) throw new Error();
      const data = await res.json();
      if (data?.rates?.MDL) setUsdRate(data.rates.MDL.toFixed(4));
      if (data?.rates?.MDL && data?.rates?.EUR) {
        const eurMdl = data.rates.MDL / data.rates.EUR;
        setEurRate(eurMdl.toFixed(4));
      }
    } catch {
      // silently fail — user can type manually
    } finally {
      setLoadingRate(false);
    }
  };

  // ── Compute preview products ─────────────────────────────────────
  const computeProducts = useCallback((): Omit<StoreProduct, "id">[] => {
    const rate = mapping.priceCurrency === "EUR" ? parseFloat(eurRate) : parseFloat(usdRate);
    const mup  = 1 + (parseFloat(markup) || 0) / 100;

    return rows
      .map((row, idx) => {
        const rawName = mapping.name ? row[mapping.name] : "";
        if (!rawName) return null;

        const rawPrice    = parseNum(mapping.price ? row[mapping.price] : "0");
        const rawOldPrice = parseNum(mapping.oldPrice ? row[mapping.oldPrice] : "0");

        const currency = (() => {
          if (mapping.priceCurrency !== "auto") return mapping.priceCurrency;
          const pCol = mapping.price.toLowerCase();
          if (pCol.includes("usd") || pCol.includes("$"))    return "USD";
          if (pCol.includes("eur") || pCol.includes("€"))    return "EUR";
          return "MDL";
        })();

        let priceMDL = 0;
        let oldPriceMDL: number | null = null;

        if (currency === "MDL") {
          priceMDL    = roundPrices ? roundPrice(rawPrice * mup)    : rawPrice * mup;
          oldPriceMDL = rawOldPrice > 0 ? (roundPrices ? roundPrice(rawOldPrice) : rawOldPrice) : null;
        } else {
          priceMDL    = roundPrices ? roundPrice(rawPrice * rate * mup)    : rawPrice * rate * mup;
          oldPriceMDL = rawOldPrice > 0 ? (roundPrices ? roundPrice(rawOldPrice * rate) : rawOldPrice * rate) : null;
        }

        const specs   = mapping.specs       ? row[mapping.specs] : "";
        const imgUrl  = (mapping.imageUrl   ? row[mapping.imageUrl] : "") || embeddedImages[idx] || "";
        const catRaw  = mapping.category    ? row[mapping.category] : "";
        const cat     = catRaw || detectCategory(rawName + " " + specs);

        return {
          name:        rawName,
          model:       mapping.model       ? row[mapping.model]       : "",
          brand:       mapping.brand       ? row[mapping.brand]       : "Generic",
          category:    cat as any,
          price:       Math.round(priceMDL),
          oldPrice:    oldPriceMDL ? Math.round(oldPriceMDL) : null,
          specs,
          badge:       null,
          imageUrl:    imgUrl,
          images:      imgUrl ? [imgUrl] : [],
          description: mapping.description ? row[mapping.description] : rawName,
          inStock:     true,
          icon:        "Camera",
        } satisfies Omit<StoreProduct, "id">;
      })
      .filter(Boolean) as Omit<StoreProduct, "id">[];
  }, [rows, mapping, usdRate, eurRate, markup, roundPrices, embeddedImages]);

  // ── Import action ────────────────────────────────────────────────
  const doImport = () => {
    setImporting(true);
    const products = computeProducts();
    products.forEach((p) => storeActions.addProduct(p as any));
    setImportedCount(products.length);
    setImporting(false);
    setStep("done");
  };

  // ── Navigation helpers ───────────────────────────────────────────
  const steps: Step[] = ["upload", "mapping", "pricing", "preview"];
  const stepIdx = steps.indexOf(step);
  const go = (dir: 1 | -1) => setStep(steps[stepIdx + dir]);

  const stepLabels: Record<Step, string> = {
    upload:  "Fișier",
    mapping: "Coloane",
    pricing: "Prețuri",
    preview: "Previzualizare",
    done:    "Gata",
  };

  // ── Example calculation ──────────────────────────────────────────
  const examplePrice = (() => {
    if (!rows[0] || !mapping.price) return null;
    const raw = parseNum(rows[0][mapping.price]);
    const currency = mapping.priceCurrency !== "auto" ? mapping.priceCurrency :
      mapping.price.toLowerCase().includes("eur") ? "EUR" :
      mapping.price.toLowerCase().includes("mdl") ? "MDL" : "USD";
    const rate = currency === "EUR" ? parseFloat(eurRate) : parseFloat(usdRate);
    const mup  = 1 + (parseFloat(markup) || 0) / 100;
    const final = currency === "MDL" ? raw * mup : raw * rate * mup;
    return { raw, currency, final: roundPrices ? roundPrice(final) : Math.round(final) };
  })();

  // ─── Done screen ─────────────────────────────────────────────────
  if (step === "done") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 w-full max-w-sm text-center">
          <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-400" />
          </div>
          <h3 className="font-black text-xl mb-1">Import Complet!</h3>
          <p className="text-zinc-400 text-sm mb-1">
            <span className="text-white font-bold text-2xl">{importedCount}</span> produse adăugate în catalog.
          </p>
          {embeddedImages.length > 0 && (
            <p className="text-zinc-500 text-xs mb-5">{embeddedImages.length} imagini embedded extrase automat.</p>
          )}
          <button onClick={onClose} className="w-full bg-[#FF4F00] text-white font-bold py-3 rounded-xl hover:opacity-90 mt-4">
            Înapoi la Catalog
          </button>
        </div>
      </div>
    );
  }

  const previewProducts = step === "preview" ? computeProducts() : [];
  const totalCount = step === "preview" ? previewProducts.length : rows.length;

  // ─── Main modal ──────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-zinc-800 flex-shrink-0">
          <div className="w-9 h-9 bg-green-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
            <FileSpreadsheet className="w-5 h-5 text-green-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-white text-sm">Import Produse din Excel</h3>
            <p className="text-zinc-500 text-xs truncate">
              {step === "upload"  && "Suportă .xlsx · .xls · .csv"}
              {step === "mapping" && `"${fileName}" · ${rows.length} rânduri detectate`}
              {step === "pricing" && "Configurează cursul valutar și adaosul comercial"}
              {step === "preview" && `${totalCount} produse gata de import`}
            </p>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors flex-shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step indicator */}
        {step !== "upload" && (
          <div className="flex items-center gap-1 px-6 py-2.5 border-b border-zinc-800 bg-zinc-950/40 flex-shrink-0">
            {(["mapping", "pricing", "preview"] as Step[]).map((s, i) => {
              const stepsList: Step[] = ["mapping", "pricing", "preview"];
              const curr = stepsList.indexOf(step);
              const idx  = stepsList.indexOf(s);
              const done = idx < curr;
              const active = idx === curr;
              return (
                <div key={s} className="flex items-center">
                  <span className={`flex items-center gap-1.5 text-[11px] font-semibold ${active ? "text-[#FF4F00]" : done ? "text-green-400" : "text-zinc-600"}`}>
                    <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black ${active ? "bg-[#FF4F00] text-white" : done ? "bg-green-500 text-white" : "bg-zinc-800 text-zinc-600"}`}>
                      {done ? "✓" : i + 1}
                    </span>
                    {stepLabels[s]}
                  </span>
                  {i < 2 && <ChevronRight className="w-3 h-3 text-zinc-700 mx-2" />}
                </div>
              );
            })}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">

          {/* ── STEP 1: Upload ─────────────────────────────────── */}
          {step === "upload" && (
            <div className="space-y-4">
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all select-none ${isDragging ? "border-[#FF4F00] bg-[#FF4F00]/5 scale-[0.99]" : "border-zinc-700 hover:border-zinc-500 hover:bg-zinc-800/20"}`}
              >
                <div className="w-14 h-14 bg-zinc-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Upload className="w-7 h-7 text-zinc-400" />
                </div>
                <p className="font-bold text-white text-lg mb-1">Trage fișierul Excel aici</p>
                <p className="text-zinc-500 text-sm mb-5">sau apasă pentru a selecta de pe calculator</p>
                <div className="flex gap-2 justify-center flex-wrap">
                  {[".xlsx", ".xls", ".csv"].map((ext) => (
                    <span key={ext} className="text-xs bg-zinc-800 text-zinc-400 px-3 py-1 rounded-full font-mono">{ext}</span>
                  ))}
                </div>
              </div>
              <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) parseFile(f); }} />

              {parseError && (
                <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  {parseError}
                </div>
              )}

              <div className="bg-zinc-800/40 rounded-xl p-4 space-y-2 text-xs text-zinc-400">
                <p className="font-semibold text-zinc-200 text-sm mb-3">💡 Format recomandat pentru import optim</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                  <p>→ Coloana <span className="font-mono text-zinc-200">Denumire</span> sau <span className="font-mono text-zinc-200">Name</span></p>
                  <p>→ Coloana <span className="font-mono text-zinc-200">Pret USD</span> sau <span className="font-mono text-zinc-200">Pret MDL</span></p>
                  <p>→ Coloana <span className="font-mono text-zinc-200">Model</span> sau <span className="font-mono text-zinc-200">SKU</span></p>
                  <p>→ Coloana <span className="font-mono text-zinc-200">Brand</span> sau <span className="font-mono text-zinc-200">Marca</span></p>
                  <p>→ Coloana <span className="font-mono text-zinc-200">Specificatii</span> (opțional)</p>
                  <p>→ Coloana <span className="font-mono text-zinc-200">URL Imagine</span> (opțional)</p>
                </div>
                <p className="text-zinc-600 pt-1">Imaginile embedded din Excel sunt extrase automat dacă există.</p>
              </div>
            </div>
          )}

          {/* ── STEP 2: Column Mapping ──────────────────────────── */}
          {step === "mapping" && (
            <div className="space-y-5">
              {embeddedImages.length > 0 && (
                <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3 text-sm text-green-400">
                  <ImageIcon className="w-4 h-4 flex-shrink-0" />
                  {embeddedImages.length} imagini embedded detectate în fișier — vor fi extrase automat.
                </div>
              )}

              <p className="text-xs text-zinc-500">Mapează coloanele din fișierul tău cu câmpurile produsului. Câmpurile cu * sunt obligatorii.</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(Object.keys(COL_LABELS) as ColKey[]).map((field) => (
                  <div key={field}>
                    <label className="block text-[11px] font-semibold text-zinc-400 mb-1 uppercase tracking-wider">{COL_LABELS[field]}</label>
                    <select
                      value={mapping[field]}
                      onChange={(e) => setMapping((m) => ({ ...m, [field]: e.target.value }))}
                      className={`w-full bg-zinc-800 border rounded-lg px-3 py-2 text-white text-sm focus:outline-none transition-colors ${mapping[field] ? "border-zinc-600" : field === "name" || field === "price" ? "border-red-800/50" : "border-zinc-700"}`}
                    >
                      <option value="">— Nu mapez —</option>
                      {headers.map((h) => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>
                ))}
              </div>

              {/* Currency detect */}
              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 mb-2 uppercase tracking-wider">Monedă preț de achiziție</label>
                <div className="flex gap-2">
                  {(["auto", "USD", "EUR", "MDL"] as CurrencyMode[]).map((c) => (
                    <button key={c} onClick={() => setMapping((m) => ({ ...m, priceCurrency: c }))}
                      className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition-colors ${mapping.priceCurrency === c ? "bg-[#FF4F00] border-[#FF4F00] text-white" : "border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-white"}`}>
                      {c === "auto" ? "🔍 Auto" : c}
                    </button>
                  ))}
                </div>
              </div>

              {/* Preview first row */}
              {rows[0] && mapping.name && (
                <div className="bg-zinc-800/40 rounded-xl p-4">
                  <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-2">Previzualizare primul produs:</p>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs">
                    {mapping.name        && <><span className="text-zinc-500">Denumire</span><span className="text-white truncate">{rows[0][mapping.name]}</span></>}
                    {mapping.price       && <><span className="text-zinc-500">Preț</span><span className="text-white">{rows[0][mapping.price]} {mapping.priceCurrency !== "auto" ? mapping.priceCurrency : ""}</span></>}
                    {mapping.model       && <><span className="text-zinc-500">Model</span><span className="text-white">{rows[0][mapping.model]}</span></>}
                    {mapping.brand       && <><span className="text-zinc-500">Brand</span><span className="text-white">{rows[0][mapping.brand]}</span></>}
                    {mapping.imageUrl && rows[0][mapping.imageUrl] && (
                      <><span className="text-zinc-500">Imagine</span><span className="text-blue-400 truncate text-[10px]">{rows[0][mapping.imageUrl]}</span></>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── STEP 3: Pricing ────────────────────────────────── */}
          {step === "pricing" && (
            <div className="space-y-5">
              <div className="bg-zinc-800/40 rounded-xl px-4 py-3 flex items-center gap-3 text-sm text-zinc-400">
                <span className="font-mono text-xs bg-zinc-700 px-2 py-1 rounded">
                  Preț MDL = Preț achiziție × Curs × (1 + Adaos%)
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-400 mb-1 uppercase tracking-wider">Curs USD → MDL</label>
                  <div className="flex gap-2">
                    <input type="number" step="0.01" min="1" value={usdRate} onChange={(e) => setUsdRate(e.target.value)}
                      className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#FF4F00] font-mono" />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-400 mb-1 uppercase tracking-wider">Curs EUR → MDL</label>
                  <input type="number" step="0.01" min="1" value={eurRate} onChange={(e) => setEurRate(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#FF4F00] font-mono" />
                </div>
              </div>

              <button onClick={fetchRates} disabled={loadingRate}
                className="flex items-center gap-2 bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50">
                <RefreshCw className={`w-4 h-4 ${loadingRate ? "animate-spin" : ""}`} />
                {loadingRate ? "Se actualizează..." : "Curs live (BNM / open.er-api.com)"}
              </button>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 mb-1 uppercase tracking-wider">Adaos Comercial (%)</label>
                <input type="number" min="0" max="1000" step="1" value={markup} onChange={(e) => setMarkup(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#FF4F00] font-mono" />
                <p className="text-zinc-600 text-xs mt-1">Aplicat pe deasupra prețului de achiziție convertit.</p>
              </div>

              <div className="flex items-center gap-3">
                <button type="button" onClick={() => setRoundPrices(!roundPrices)}
                  className={`relative w-10 h-5 rounded-full transition-colors ${roundPrices ? "bg-[#FF4F00]" : "bg-zinc-700"}`}>
                  <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${roundPrices ? "translate-x-5" : ""}`} />
                </button>
                <span className="text-sm text-zinc-300">Rotunjire prețuri finale (recomandat)</span>
              </div>

              {/* Live example */}
              {examplePrice && (
                <div className="bg-zinc-800/40 rounded-xl p-4">
                  <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-3">Exemplu · {rows[0]?.[mapping.name] ?? "Produs 1"}</p>
                  <div className="flex items-center gap-2 text-sm flex-wrap">
                    <span className="font-mono text-zinc-300 bg-zinc-800 px-2 py-1 rounded">{examplePrice.raw} {examplePrice.currency}</span>
                    <ArrowRight className="w-3 h-3 text-zinc-600 flex-shrink-0" />
                    <span className="text-zinc-500 text-xs">× {examplePrice.currency !== "MDL" ? (examplePrice.currency === "EUR" ? eurRate : usdRate) : "1"}</span>
                    <ArrowRight className="w-3 h-3 text-zinc-600 flex-shrink-0" />
                    <span className="text-zinc-500 text-xs">× {(1 + (parseFloat(markup) || 0) / 100).toFixed(2)}</span>
                    <ArrowRight className="w-3 h-3 text-zinc-600 flex-shrink-0" />
                    <span className="font-mono font-black text-[#FF4F00] text-base">{examplePrice.final.toLocaleString("ro-MD")} MDL</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── STEP 4: Preview ─────────────────────────────────── */}
          {step === "preview" && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-zinc-400">{previewProducts.length} produse vor fi importate</p>
                {previewProducts.filter((p) => !p.imageUrl).length > 0 && (
                  <span className="text-xs text-amber-400 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {previewProducts.filter((p) => !p.imageUrl).length} fără imagine
                  </span>
                )}
              </div>

              <div className="space-y-2 mb-4">
                {previewProducts.slice(0, 8).map((p, i) => (
                  <div key={i} className="flex items-center gap-3 bg-zinc-800/50 rounded-xl p-3">
                    <div className="w-11 h-11 rounded-lg overflow-hidden bg-zinc-700 flex-shrink-0 flex items-center justify-center">
                      {p.imageUrl ? (
                        <img src={p.imageUrl} alt="" className="w-full h-full object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).parentElement!.innerHTML = '<span class="text-zinc-600 text-[10px]">N/A</span>'; }} />
                      ) : (
                        <ImageIcon className="w-4 h-4 text-zinc-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{p.name}</p>
                      <p className="text-xs text-zinc-500 flex items-center gap-1.5">
                        <span className="text-zinc-400">{p.brand}</span>
                        {p.model && <><span>·</span><span className="font-mono">{p.model}</span></>}
                        <span className="bg-zinc-700 text-zinc-400 px-1.5 py-0.5 rounded text-[9px]">{p.category}</span>
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-mono font-bold text-[#FF4F00] text-sm">{p.price.toLocaleString("ro-MD")} MDL</p>
                      {p.oldPrice && <p className="text-xs text-zinc-600 line-through">{p.oldPrice.toLocaleString("ro-MD")}</p>}
                    </div>
                  </div>
                ))}
                {previewProducts.length > 8 && (
                  <div className="text-center py-3 text-zinc-500 text-xs bg-zinc-800/30 rounded-xl">
                    + {previewProducts.length - 8} produse mai...
                  </div>
                )}
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-zinc-800/40 rounded-xl py-3">
                  <p className="font-black text-xl">{previewProducts.length}</p>
                  <p className="text-zinc-500 text-xs">Produse</p>
                </div>
                <div className="bg-zinc-800/40 rounded-xl py-3">
                  <p className="font-black text-xl text-green-400">{previewProducts.filter((p) => p.imageUrl).length}</p>
                  <p className="text-zinc-500 text-xs">Cu imagine</p>
                </div>
                <div className="bg-zinc-800/40 rounded-xl py-3">
                  <p className="font-black text-xl text-amber-400">{previewProducts.filter((p) => !p.imageUrl).length}</p>
                  <p className="text-zinc-500 text-xs">Fără imagine</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer nav */}
        {step !== "upload" && (
          <div className="flex gap-3 px-6 py-4 border-t border-zinc-800 flex-shrink-0">
            <button onClick={() => go(-1)}
              className="bg-zinc-800 text-white font-semibold py-2.5 px-5 rounded-xl hover:bg-zinc-700 transition-colors text-sm">
              ← Înapoi
            </button>
            <button
              onClick={() => step === "preview" ? doImport() : go(1)}
              disabled={importing || (step === "mapping" && !mapping.name)}
              className="flex-1 bg-[#FF4F00] text-white font-bold py-2.5 rounded-xl hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center justify-center gap-2">
              {importing && <RefreshCw className="w-4 h-4 animate-spin" />}
              {step === "preview"
                ? `Import ${totalCount} produse →`
                : step === "pricing" ? "Previzualizare →" : "Continuă →"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
