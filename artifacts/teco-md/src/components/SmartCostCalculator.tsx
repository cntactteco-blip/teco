import React, { useState, useMemo, useEffect } from "react";
import { Check, ShoppingCart, ChevronRight, Wifi, Cable, Camera, X } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { useToast } from "@/hooks/use-toast";
import { useStore, storeActions, type StoreProduct } from "@/lib/store";
import { useLang } from "@/contexts/LangContext";

// ── Stable components (defined at module scope to avoid keyboard dismiss) ──────

function StepBadge({ n, active, done }: { n: number; active: boolean; done: boolean }) {
  return (
    <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-black shrink-0 transition-all ${done ? "bg-[#FF4F00] text-white" : active ? "bg-[#FF4F00] text-white shadow-[0_0_12px_rgba(255,79,0,0.45)]" : "bg-zinc-800 text-zinc-500"}`}>
      {done ? <Check className="w-3.5 h-3.5" /> : n}
    </span>
  );
}

function SectionCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-zinc-900 border border-zinc-800 rounded-2xl p-5 ${className}`}>
      {children}
    </div>
  );
}

interface CameraCardProps {
  product: StoreProduct;
  selected: boolean;
  onSelect: () => void;
}
function CameraCard({ product, selected, onSelect }: CameraCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex items-center gap-3 w-full text-left p-3 rounded-xl border transition-all active:scale-[0.98] ${selected ? "border-[#FF4F00] bg-[#FF4F00]/10" : "border-zinc-700 bg-zinc-800 hover:border-zinc-600"}`}
    >
      <div className="w-14 h-14 rounded-lg bg-zinc-700 overflow-hidden shrink-0">
        <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] text-zinc-500 font-medium mb-0.5">{product.brand}</p>
        <p className="text-sm font-bold text-white leading-snug line-clamp-2">{product.name}</p>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-[#FF4F00] font-black text-base">{product.price.toLocaleString()}</p>
        <p className="text-[10px] text-zinc-500">MDL</p>
      </div>
    </button>
  );
}

// ── Camera count options ─────────────────────────────────────────────────────

const COUNT_OPTIONS = [
  { value: 2,   label: "2 camere",   hint: "Apartament / birou mic" },
  { value: 4,   label: "4 camere",   hint: "Casă standard", top: true },
  { value: 6,   label: "6 camere",   hint: "Casă mare / afacere mică" },
  { value: 8,   label: "8 camere",   hint: "Depozit / magazin" },
  { value: 16,  label: "16+ camere", hint: "Complex industrial" },
];

// ── Main component ────────────────────────────────────────────────────────────

export default function SmartCostCalculator() {
  const { lang } = useLang();
  const ro = lang === "ro";

  const allProducts = useStore((s) => s.products);
  const settings = useStore((s) => s.settings);
  const addItem = useCart((s) => s.addItem);
  const openCart = useCart((s) => s.openCart);
  const { toast } = useToast();

  const [cameraCount, setCameraCount] = useState<number | null>(null);
  const [connType, setConnType] = useState<"wifi" | "poe" | null>(null);
  const [selectedCamera, setSelectedCamera] = useState<StoreProduct | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [formError, setFormError] = useState("");

  const reset = () => {
    setCameraCount(null); setConnType(null); setSelectedCamera(null);
    setDone(false); setName(""); setPhone(""); setFormError("");
  };

  // Filter cameras from catalog
  const filteredCameras = useMemo(() => {
    const cameras = allProducts.filter((p) => {
      const cat = (p.category ?? "").toLowerCase();
      const isCamera = cat.includes("camer") || cat === "camere" || cat === "camera";
      if (!isCamera) return false;
      if (!connType) return true;
      const haystack = `${p.name} ${p.specs ?? ""} ${p.description ?? ""}`.toLowerCase();
      if (connType === "wifi") return haystack.includes("wifi") || haystack.includes("wi-fi") || haystack.includes("wireless");
      if (connType === "poe") return !haystack.includes("wifi") && !haystack.includes("wi-fi") && !haystack.includes("wireless");
      return true;
    });

    // If no cameras found after filter, show all cameras (graceful fallback)
    if (cameras.length === 0) {
      return allProducts.filter((p) => {
        const cat = (p.category ?? "").toLowerCase();
        return cat.includes("camer") || cat === "camere" || cat === "camera";
      });
    }
    return cameras;
  }, [allProducts, connType]);

  // NVR recommendation
  const recommendedNvr = useMemo(() => {
    if (!cameraCount) return null;
    const nvrs = allProducts.filter((p) => {
      const cat = (p.category ?? "").toLowerCase();
      return cat.includes("nvr") || cat.includes("dvr") || cat.includes("inregistr");
    });
    if (nvrs.length === 0) return null;
    // Find smallest NVR that fits camera count
    const sorted = nvrs
      .map((p) => {
        const m = `${p.name} ${p.specs ?? ""}`.match(/(\d+)\s*(?:canale|channels|ch)/i);
        return { p, channels: m ? parseInt(m[1]) : 4 };
      })
      .filter((x) => x.channels >= cameraCount)
      .sort((a, b) => a.channels - b.channels || a.p.price - b.p.price);
    return sorted[0]?.p ?? nvrs[0];
  }, [allProducts, cameraCount]);

  const totalEstimate = useMemo(() => {
    if (!cameraCount || !selectedCamera) return null;
    const equipCost = selectedCamera.price * cameraCount + (recommendedNvr?.price ?? 0);
    const installCost = 650 * cameraCount;
    return { equipCost, installCost, total: equipCost + installCost };
  }, [cameraCount, selectedCamera, recommendedNvr]);

  const handleSubmit = async () => {
    if (!phone.trim()) { setFormError(ro ? "Introduceți numărul de telefon" : "Введите номер телефона"); return; }
    setFormError("");
    setSubmitting(true);
    try {
      await storeActions.addLead({
        name: name.trim() || (ro ? "Client" : "Клиент"),
        phone: phone.trim(),
        source: ro ? "Calculator Sistem" : "Калькулятор системы",
        notes: `${cameraCount} camere, ${connType === "wifi" ? "WiFi" : "PoE"}, model: ${selectedCamera?.name ?? "?"}, total: ~${totalEstimate?.total?.toLocaleString() ?? "?"} MDL`,
      });
      setDone(true);
    } catch {
      setFormError(ro ? "Eroare. Încearcă din nou." : "Ошибка. Попробуйте снова.");
    } finally {
      setSubmitting(false);
    }
  };

  const step1done = cameraCount !== null;
  const step2done = connType !== null;
  const step3done = selectedCamera !== null;
  const bannerImage = settings.moduleA?.bannerImage;

  return (
    <section className="w-full bg-zinc-950 py-14 px-4">
      {bannerImage && (
        <div className="max-w-[640px] mx-auto mb-8 rounded-2xl overflow-hidden shadow-sm">
          <img src={bannerImage} alt="Banner" className="w-full max-h-48 object-cover" />
        </div>
      )}

      <div className="max-w-[640px] mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <p className="text-[#FF4F00] text-xs font-black uppercase tracking-[0.2em] mb-3">
            {ro ? "Calculator Gratuit" : "Бесплатный калькулятор"}
          </p>
          <h2 className="text-white font-black text-3xl md:text-4xl mb-3 tracking-tight">
            {ro ? <>Construiește-ți<br /><span className="text-[#FF4F00]">sistemul perfect</span></> : <>Создай<br /><span className="text-[#FF4F00]">идеальную систему</span></>}
          </h2>
          <p className="text-zinc-400 text-sm max-w-sm mx-auto">
            {ro
              ? "Alege numărul de camere și tipul — îți recomandăm NVR-ul potrivit și calculăm totul."
              : "Выберите количество и тип камер — подберём NVR и рассчитаем всё."}
          </p>
        </div>

        {!done ? (
          <div className="flex flex-col gap-4">
            {/* ── Step 1: Camera count ── */}
            <SectionCard>
              <div className="flex items-center gap-3 mb-4">
                <StepBadge n={1} active={!step1done} done={step1done} />
                <span className="font-black text-white text-base">{ro ? "Câte camere?" : "Сколько камер?"}</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {COUNT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => { setCameraCount(opt.value); setSelectedCamera(null); }}
                    className={`relative rounded-xl border p-3.5 text-left transition-all active:scale-95 ${cameraCount === opt.value ? "border-[#FF4F00] bg-[#FF4F00]/10" : "border-zinc-700 bg-zinc-800 hover:border-zinc-600"}`}
                  >
                    {opt.top && (
                      <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-[#FF4F00] text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">TOP</span>
                    )}
                    <p className={`font-black text-sm mb-0.5 ${cameraCount === opt.value ? "text-[#FF4F00]" : "text-white"}`}>{opt.label}</p>
                    <p className="text-[11px] text-zinc-500 leading-tight">{opt.hint}</p>
                  </button>
                ))}
              </div>
            </SectionCard>

            {/* ── Step 2: Connection type ── */}
            <SectionCard className={step1done ? "" : "opacity-40 pointer-events-none"}>
              <div className="flex items-center gap-3 mb-4">
                <StepBadge n={2} active={step1done && !step2done} done={step2done} />
                <span className="font-black text-white text-base">{ro ? "Tipul camerelor" : "Тип подключения"}</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => { setConnType("wifi"); setSelectedCamera(null); }}
                  className={`flex flex-col gap-2 p-4 rounded-xl border transition-all active:scale-95 ${connType === "wifi" ? "border-[#FF4F00] bg-[#FF4F00]/10" : "border-zinc-700 bg-zinc-800 hover:border-zinc-600"}`}
                >
                  <div className="flex items-center justify-between">
                    <Wifi className={`w-5 h-5 ${connType === "wifi" ? "text-[#FF4F00]" : "text-zinc-400"}`} />
                    {connType === "wifi" && <Check className="w-4 h-4 text-[#FF4F00]" />}
                  </div>
                  <p className={`font-black text-sm ${connType === "wifi" ? "text-[#FF4F00]" : "text-white"}`}>WiFi</p>
                  <p className="text-[11px] text-zinc-500 leading-snug">{ro ? "Fără cabluri, instalare ușoară" : "Без кабелей, простой монтаж"}</p>
                </button>
                <button
                  type="button"
                  onClick={() => { setConnType("poe"); setSelectedCamera(null); }}
                  className={`flex flex-col gap-2 p-4 rounded-xl border transition-all active:scale-95 ${connType === "poe" ? "border-[#FF4F00] bg-[#FF4F00]/10" : "border-zinc-700 bg-zinc-800 hover:border-zinc-600"}`}
                >
                  <div className="flex items-center justify-between">
                    <Cable className={`w-5 h-5 ${connType === "poe" ? "text-[#FF4F00]" : "text-zinc-400"}`} />
                    {connType === "poe" && <Check className="w-4 h-4 text-[#FF4F00]" />}
                  </div>
                  <p className={`font-black text-sm ${connType === "poe" ? "text-[#FF4F00]" : "text-white"}`}>PoE (cablu)</p>
                  <p className="text-[11px] text-zinc-500 leading-snug">{ro ? "Mai stabile, recomandate" : "Надёжнее, рекомендуемые"}</p>
                </button>
              </div>
            </SectionCard>

            {/* ── Step 3: Camera model from catalog ── */}
            <SectionCard className={step2done ? "" : "opacity-40 pointer-events-none"}>
              <div className="flex items-center gap-3 mb-4">
                <StepBadge n={3} active={step2done && !step3done} done={step3done} />
                <span className="font-black text-white text-base">{ro ? "Modelul camerei" : "Модель камеры"}</span>
                <span className="ml-auto text-[11px] text-zinc-500">{filteredCameras.length} {ro ? "modele" : "модели"}</span>
              </div>

              {filteredCameras.length === 0 ? (
                <div className="text-center py-8 text-zinc-500 text-sm">
                  <Camera className="w-10 h-10 mx-auto mb-3 text-zinc-700" />
                  {ro ? "Nu sunt camere în catalog pentru acest filtru." : "Нет камер в каталоге для этого фильтра."}
                </div>
              ) : (
                <div className="flex flex-col gap-2 max-h-[360px] overflow-y-auto pr-0.5 scrollbar-thin">
                  {filteredCameras.map((p) => (
                    <CameraCard
                      key={p.id}
                      product={p}
                      selected={selectedCamera?.id === p.id}
                      onSelect={() => setSelectedCamera(selectedCamera?.id === p.id ? null : p)}
                    />
                  ))}
                </div>
              )}
            </SectionCard>

            {/* ── Result preview + Contact ── */}
            {step3done && totalEstimate && (
              <div className="bg-gradient-to-br from-[#FF4F00]/20 to-zinc-900 border border-[#FF4F00]/30 rounded-2xl p-5">
                <p className="text-[#FF4F00] text-xs font-black uppercase tracking-widest mb-3">
                  {ro ? "Estimare sistem" : "Оценка системы"}
                </p>

                {/* Summary line */}
                <div className="flex flex-col gap-1.5 mb-4 text-sm">
                  <div className="flex justify-between text-zinc-300">
                    <span>📷 {cameraCount}× {selectedCamera!.name.slice(0, 30)}{selectedCamera!.name.length > 30 ? "…" : ""}</span>
                    <span className="font-mono">{(selectedCamera!.price * cameraCount!).toLocaleString()} MDL</span>
                  </div>
                  {recommendedNvr && (
                    <div className="flex justify-between text-zinc-300">
                      <span>🖥 NVR: {recommendedNvr.name.slice(0, 28)}{recommendedNvr.name.length > 28 ? "…" : ""}</span>
                      <span className="font-mono">{recommendedNvr.price.toLocaleString()} MDL</span>
                    </div>
                  )}
                  <div className="flex justify-between text-zinc-300">
                    <span>🔧 {ro ? "Instalare" : "Монтаж"}</span>
                    <span className="font-mono">{totalEstimate.installCost.toLocaleString()} MDL</span>
                  </div>
                  <div className="border-t border-zinc-700 pt-2 flex justify-between items-center">
                    <span className="font-black text-white">{ro ? "Total estimat" : "Итого"}</span>
                    <span className="font-black text-2xl text-[#FF4F00]">~{totalEstimate.total.toLocaleString()} MDL</span>
                  </div>
                </div>

                {/* Add camera to cart */}
                <button
                  type="button"
                  onClick={() => {
                    if (!selectedCamera) return;
                    for (let i = 0; i < (cameraCount ?? 1); i++) addItem(selectedCamera as any);
                    if (recommendedNvr) addItem(recommendedNvr as any);
                    toast({ title: ro ? "Adăugat în coș!" : "Добавлено в корзину!", description: `${cameraCount}× ${selectedCamera!.name.slice(0, 40)}${recommendedNvr ? ` + NVR` : ""}` });
                    setTimeout(() => openCart(), 300);
                  }}
                  className="w-full bg-[#FF4F00] text-white font-black py-3.5 rounded-xl flex items-center justify-center gap-2 mb-4 shadow-[0_4px_20px_rgba(255,79,0,0.35)] active:scale-[0.98] transition-all hover:opacity-90"
                >
                  <ShoppingCart className="w-4 h-4" />
                  {ro ? "Adaugă sistemul în coș" : "Добавить систему в корзину"}
                </button>

                <div className="relative flex items-center gap-3 mb-4">
                  <div className="flex-1 h-px bg-zinc-700" />
                  <span className="text-xs text-zinc-500">{ro ? "sau primește ofertă personalizată" : "или получи персональное предложение"}</span>
                  <div className="flex-1 h-px bg-zinc-700" />
                </div>

                {/* Contact form */}
                <div className="flex flex-col gap-3">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={ro ? "Prenume și Nume (opțional)" : "Имя и Фамилия (необязательно)"}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white text-sm placeholder:text-zinc-500 focus:outline-none focus:border-[#FF4F00] transition-colors"
                  />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+373 __ ___ ___"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white text-sm placeholder:text-zinc-500 focus:outline-none focus:border-[#FF4F00] transition-colors"
                  />
                  {formError && <p className="text-red-400 text-xs">{formError}</p>}
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="w-full bg-zinc-700 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all hover:bg-zinc-600 disabled:opacity-50"
                  >
                    {submitting
                      ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      : <><ChevronRight className="w-4 h-4" /> {ro ? "Solicită ofertă detaliată" : "Запросить детальное предложение"}</>
                    }
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* ── Done state ── */
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-400" />
            </div>
            <h3 className="font-black text-white text-xl mb-2">
              {ro ? "Cerere trimisă!" : "Запрос отправлен!"}
            </h3>
            <p className="text-zinc-400 text-sm mb-6">
              {ro
                ? "Echipa noastră te contactează în 30 de minute cu oferta personalizată."
                : "Наша команда свяжется с вами в течение 30 минут с персональным предложением."}
            </p>
            <div className="grid grid-cols-2 gap-3 mb-6">
              <a
                href={`https://wa.me/${(settings.general?.adminPhone || "37367200463").replace(/\D/g, "")}?text=${encodeURIComponent(ro ? `Bună! Am configurat un sistem TECO.MD: ${cameraCount} camere ${connType?.toUpperCase()}, model ${selectedCamera?.name}. Total estimat ~${totalEstimate?.total?.toLocaleString()} MDL. Telefon: ${phone}` : `Здравствуйте! Я настроил систему TECO.MD: ${cameraCount} камер ${connType?.toUpperCase()}, модель ${selectedCamera?.name}. Оценка ~${totalEstimate?.total?.toLocaleString()} MDL. Тел: ${phone}`)}`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 bg-[#25D366] text-white font-bold py-3 rounded-xl hover:opacity-90 active:scale-95 transition-all text-sm"
              >
                📱 WhatsApp
              </a>
              <a
                href={`viber://chat?number=${(settings.general?.adminPhone || "37367200463").replace(/\D/g, "")}`}
                className="flex items-center justify-center gap-2 bg-[#7360F2] text-white font-bold py-3 rounded-xl hover:opacity-90 active:scale-95 transition-all text-sm"
              >
                💬 Viber
              </a>
            </div>
            <button
              type="button"
              onClick={reset}
              className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors flex items-center gap-1.5 mx-auto"
            >
              <X className="w-3.5 h-3.5" />
              {ro ? "Calculează din nou" : "Пересчитать"}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
