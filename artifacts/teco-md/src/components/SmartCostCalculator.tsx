import React, { useState, useEffect, useMemo } from "react";
import { Home, Building, Briefcase, MapPin, Cable, Zap, Star, Wifi, HelpCircle, Check, Camera, ShoppingCart } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { useToast } from "@/hooks/use-toast";
import { useStore, storeActions, type StoreProduct } from "@/lib/store";

// ── Defined outside to keep stable identity across renders (prevents keyboard dismiss) ──
function OptionButton({ icon: Icon, label, isActive, onClick, testId }: {
  icon: React.ElementType; label: string; isActive: boolean;
  onClick: () => void; testId?: string;
}) {
  return (
    <button
      type="button"
      data-testid={testId}
      onClick={onClick}
      className={`rounded-xl border p-4 flex flex-col items-center gap-2 transition-all duration-200 active:scale-95 ${isActive ? "border-[#FF4F00] bg-orange-50 text-[#FF4F00]" : "border-zinc-200 bg-white hover:border-zinc-300"}`}
    >
      <Icon className={`w-6 h-6 ${isActive ? "text-[#FF4F00]" : "text-zinc-400"}`} />
      <span className="text-sm font-medium text-center">{label}</span>
    </button>
  );
}

// Camera card — light theme, defined at module scope
function CameraCard({ product, selected, onSelect }: { product: StoreProduct; selected: boolean; onSelect: () => void }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex items-center gap-3 w-full text-left p-3 rounded-xl border transition-all active:scale-[0.98] ${selected ? "border-[#FF4F00] bg-orange-50" : "border-zinc-200 bg-white hover:border-zinc-300"}`}
    >
      <div className="w-14 h-14 rounded-lg bg-zinc-100 overflow-hidden shrink-0">
        <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] text-zinc-400 font-medium mb-0.5">{product.brand}</p>
        <p className="text-sm font-bold text-zinc-800 leading-snug line-clamp-2">{product.name}</p>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-[#FF4F00] font-black text-base">{product.price.toLocaleString()}</p>
        <p className="text-[10px] text-zinc-400">MDL</p>
      </div>
    </button>
  );
}

export default function SmartCostCalculator() {
  const [step, setStep] = useState(1);
  const [selections, setSelections] = useState({ objective: "", cameras: "", storage: "", installation: "" });
  const [selectedCamera, setSelectedCamera] = useState<StoreProduct | null>(null);
  const [formData, setFormData] = useState({ name: "", phone: "" });
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingText, setLoadingText] = useState("Verificăm stocul disponibil...");

  const resetCalc = () => {
    setStep(1);
    setSelections({ objective: "", cameras: "", storage: "", installation: "" });
    setSelectedCamera(null);
    setFormData({ name: "", phone: "" });
  };

  const addItem = useCart((state) => state.addItem);
  const openCart = useCart((state) => state.openCart);
  const { toast } = useToast();

  const settings = useStore((s) => s.settings);
  const allProducts = useStore((s) => s.products);

  // Filter cameras from catalog based on installation type
  const filteredCameras = useMemo(() => {
    const isWifi = selections.installation === "Fără cablu (Wireless)";
    const cameras = allProducts.filter((p) => {
      const cat = (p.category ?? "").toLowerCase();
      const isCamera = cat.includes("camer") || cat === "camere" || cat === "camera";
      if (!isCamera) return false;
      const haystack = `${p.name} ${p.specs ?? ""} ${p.description ?? ""}`.toLowerCase();
      if (isWifi) return haystack.includes("wifi") || haystack.includes("wi-fi") || haystack.includes("wireless");
      // For cable installations, prefer PoE / wired, but fall back to all cameras
      return !haystack.includes("wifi") && !haystack.includes("wi-fi") && !haystack.includes("wireless");
    });
    if (cameras.length === 0) {
      return allProducts.filter((p) => {
        const cat = (p.category ?? "").toLowerCase();
        return cat.includes("camer") || cat === "camere" || cat === "camera";
      });
    }
    return cameras;
  }, [allProducts, selections.installation]);

  // NVR recommendation from catalog
  const recommendedNvr = useMemo(() => {
    const cameraCount = parseInt(selections.cameras) || 2;
    const nvrs = allProducts.filter((p) => {
      const cat = (p.category ?? "").toLowerCase();
      return cat.includes("nvr") || cat.includes("dvr") || cat.includes("inregistr");
    });
    if (nvrs.length === 0) return null;
    const sorted = nvrs
      .map((p) => {
        const m = `${p.name} ${p.specs ?? ""}`.match(/(\d+)\s*(?:canale|channels|ch)/i);
        return { p, channels: m ? parseInt(m[1]) : 4 };
      })
      .filter((x) => x.channels >= cameraCount)
      .sort((a, b) => a.channels - b.channels || a.p.price - b.p.price);
    return sorted[0]?.p ?? nvrs[0];
  }, [allProducts, selections.cameras]);

  const getCalculations = () => {
    const cameraCount = parseInt(selections.cameras) || 2;
    const camPrice = selectedCamera?.price ?? (filteredCameras[0]?.price ?? 1500);
    const nvrPrice = recommendedNvr?.price ?? 0;
    const installCostPerCam =
      selections.installation === "Premium (ascuns în pereți)" ? 900 :
      selections.installation === "Fără cablu (Wireless)" ? 400 : 650;
    const equipCost = camPrice * cameraCount + nvrPrice;
    const installCost = installCostPerCam * cameraCount;
    return { equipCost, installCost, total: equipCost + installCost, cameraCount };
  };

  useEffect(() => {
    if (step === 5) {
      const texts = ["Verificăm stocul disponibil...", "Calculăm costul manoperei...", "Generăm devizul personalizat..."];
      let ti = 0;
      const textInt = setInterval(() => { ti = (ti + 1) % texts.length; setLoadingText(texts[ti]); }, 800);
      setLoadingProgress(0);
      const progInt = setInterval(() => setLoadingProgress((p) => Math.min(p + 100 / (2500 / 50), 99)), 50);
      const t = setTimeout(() => {
        clearInterval(textInt); clearInterval(progInt);
        setLoadingProgress(100);
        // Auto-select first camera if none chosen
        setSelectedCamera((cur) => cur ?? filteredCameras[0] ?? null);
        setStep(6);
      }, 2500);
      return () => { clearTimeout(t); clearInterval(textInt); clearInterval(progInt); };
    }
    return undefined;
  }, [step, filteredCameras]);

  const handleSelect = (key: keyof typeof selections, value: string) => {
    setSelections((prev) => ({ ...prev, [key]: value }));
    if (key !== "installation") setTimeout(() => setStep((prev) => prev + 1), 300);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.phone.trim()) { alert("Introduceți numărul de telefon"); return; }
    const calc = getCalculations();
    storeActions.addLead({
      name: formData.name,
      phone: formData.phone,
      source: "Calculator Cost",
      notes: `${calc.cameraCount} camere, ${selections.installation}, model: ${selectedCamera?.name ?? "?"}, total ~${calc.total.toLocaleString()} MDL`,
    });
    setStep(7);
  };

  const calc = getCalculations();
  const bannerImage = settings.moduleA?.bannerImage;

  return (
    <section className="w-full bg-[#FAFAFA] border-y border-zinc-100 py-16 px-4 relative overflow-hidden">
      {bannerImage && (
        <div className="max-w-[640px] mx-auto mb-8 rounded-2xl overflow-hidden shadow-sm">
          <img src={bannerImage} alt="Banner" className="w-full max-h-48 object-cover" />
        </div>
      )}

      <div className="max-w-[640px] mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <p className="text-[#FF4F00] text-xs font-black uppercase tracking-[0.2em] mb-3">Calculator Gratuit</p>
          <h2 className="text-[#09090B] font-black text-3xl md:text-4xl mb-3 tracking-tight">
            Cât costă sistemul<br />
            <span className="text-[#FF4F00]">potrivit pentru tine?</span>
          </h2>
          <p className="text-zinc-500 text-sm max-w-sm mx-auto">
            Răspunde la 4 întrebări — îți calculăm un deviz personalizat cu produse reale din stocul nostru.
          </p>
        </div>

        {/* Progress bar */}
        {step <= 4 && (
          <div className="flex gap-1.5 mb-8">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`h-1 flex-1 rounded-full transition-all duration-500 ${step >= s ? "bg-[#FF4F00]" : "bg-zinc-200"}`}
              />
            ))}
          </div>
        )}

        <div className="animate-fade-in text-left">
          {/* ── Step 1: Objective ── */}
          {step === 1 && (
            <div>
              <h3 className="text-xl font-bold mb-6 text-center text-[#09090B]">Ce vrei să protejezi?</h3>
              <div className="grid grid-cols-2 gap-4">
                <OptionButton icon={Home} label="Casă / Vilă" isActive={selections.objective === "Casă / Vilă"} onClick={() => handleSelect("objective", "Casă / Vilă")} testId="calc-obj-casa" />
                <OptionButton icon={Building} label="Apartament" isActive={selections.objective === "Apartament"} onClick={() => handleSelect("objective", "Apartament")} testId="calc-obj-apartament" />
                <OptionButton icon={Briefcase} label="Spațiu Comercial / Depozit" isActive={selections.objective === "Spațiu Comercial / Depozit"} onClick={() => handleSelect("objective", "Spațiu Comercial / Depozit")} testId="calc-obj-comercial" />
                <OptionButton icon={MapPin} label="Curte / Teren" isActive={selections.objective === "Curte / Teren"} onClick={() => handleSelect("objective", "Curte / Teren")} testId="calc-obj-teren" />
              </div>
            </div>
          )}

          {/* ── Step 2: Camera count ── */}
          {step === 2 && (
            <div>
              <h3 className="text-xl font-bold mb-6 text-center text-[#09090B]">De câte camere ai nevoie?</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {["2 Camere", "4 Camere", "8 Camere", "16+ Camere"].map((opt) => (
                  <OptionButton key={opt} icon={Camera} label={opt} isActive={selections.cameras === opt} onClick={() => handleSelect("cameras", opt)} testId={`calc-cam-${opt.replace("+", "")}`} />
                ))}
              </div>
            </div>
          )}

          {/* ── Step 3: Storage days ── */}
          {step === 3 && (
            <div>
              <h3 className="text-xl font-bold mb-6 text-center text-[#09090B]">Câte zile de înregistrare?</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {["14 zile", "30 de zile", "60 de zile", "90+ zile"].map((opt) => (
                  <OptionButton key={opt} icon={Check} label={opt} isActive={selections.storage === opt} onClick={() => handleSelect("storage", opt)} testId={`calc-storage-${opt.replace("+", "")}`} />
                ))}
              </div>
            </div>
          )}

          {/* ── Step 4: Installation type ── */}
          {step === 4 && (
            <div>
              <h3 className="text-xl font-bold mb-6 text-center text-[#09090B]">Tipul instalării</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <OptionButton icon={Zap} label="Standard (pat cablu)" isActive={selections.installation === "Standard (pat cablu)"} onClick={() => setSelections((p) => ({ ...p, installation: "Standard (pat cablu)" }))} testId="calc-inst-standard" />
                <OptionButton icon={Star} label="Premium (ascuns în pereți)" isActive={selections.installation === "Premium (ascuns în pereți)"} onClick={() => setSelections((p) => ({ ...p, installation: "Premium (ascuns în pereți)" }))} testId="calc-inst-premium" />
                <OptionButton icon={Wifi} label="Fără cablu (Wireless)" isActive={selections.installation === "Fără cablu (Wireless)"} onClick={() => setSelections((p) => ({ ...p, installation: "Fără cablu (Wireless)" }))} testId="calc-inst-wireless" />
                <OptionButton icon={HelpCircle} label="Nu știu, vreau sfat" isActive={selections.installation === "Nu știu, vreau sfat"} onClick={() => setSelections((p) => ({ ...p, installation: "Nu știu, vreau sfat" }))} testId="calc-inst-sfat" />
              </div>
              <div className="flex justify-center mt-8">
                <button
                  onClick={() => { if (selections.installation) setStep(5); }}
                  disabled={!selections.installation}
                  className="bg-[#FF4F00] text-white font-bold px-8 py-3.5 rounded-xl hover:opacity-90 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_4px_20px_rgba(255,79,0,0.3)]"
                >
                  Calculează devizul →
                </button>
              </div>
            </div>
          )}

          {/* ── Step 5: Loading ── */}
          {step === 5 && (
            <div className="text-center py-12">
              <div className="w-20 h-20 mx-auto mb-6 relative">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
                  <circle cx="40" cy="40" r="34" fill="none" stroke="#E4E4E7" strokeWidth="8" />
                  <circle
                    cx="40" cy="40" r="34" fill="none" stroke="#FF4F00" strokeWidth="8"
                    strokeDasharray={`${2 * Math.PI * 34}`}
                    strokeDashoffset={`${2 * Math.PI * 34 * (1 - loadingProgress / 100)}`}
                    strokeLinecap="round"
                    className="transition-all duration-150"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-sm font-black text-[#FF4F00]">{Math.round(loadingProgress)}%</span>
              </div>
              <p className="text-zinc-500 text-sm animate-pulse">{loadingText}</p>
            </div>
          )}

          {/* ── Step 6: Results with real catalog products ── */}
          {step === 6 && (
            <div>
              {/* Cost summary */}
              <div className="bg-white rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.06)] border border-zinc-100 p-6 mb-6">
                <p className="text-[10px] font-black text-[#FF4F00] uppercase tracking-widest mb-4">Deviz estimativ</p>
                <div className="space-y-2 text-sm mb-4">
                  <div className="flex justify-between text-zinc-600">
                    <span>📷 {calc.cameraCount}× cameră supraveghere</span>
                    <span className="font-mono font-bold">{(calc.cameraCount * (selectedCamera?.price ?? filteredCameras[0]?.price ?? 1500)).toLocaleString()} MDL</span>
                  </div>
                  {recommendedNvr && (
                    <div className="flex justify-between text-zinc-600">
                      <span>🖥 NVR / DVR recorder</span>
                      <span className="font-mono font-bold">{recommendedNvr.price.toLocaleString()} MDL</span>
                    </div>
                  )}
                  <div className="flex justify-between text-zinc-600">
                    <span>🔧 Instalare ({selections.installation.split(" ")[0]})</span>
                    <span className="font-mono font-bold">{calc.installCost.toLocaleString()} MDL</span>
                  </div>
                  <div className="border-t border-zinc-100 pt-3 flex justify-between items-center">
                    <span className="font-black text-[#09090B]">Total estimat</span>
                    <span className="font-black text-2xl text-[#FF4F00]">~{calc.total.toLocaleString()} MDL</span>
                  </div>
                </div>
                <p className="text-[11px] text-zinc-400">* Prețul final se confirmă după consultație gratuită cu tehnicianul nostru.</p>
              </div>

              {/* Camera model selection from catalog */}
              <div className="mb-6">
                <h4 className="font-bold text-[#09090B] mb-3 flex items-center gap-2">
                  <Camera className="w-4 h-4 text-[#FF4F00]" />
                  Alege modelul de cameră ({filteredCameras.length} disponibile)
                </h4>
                {filteredCameras.length === 0 ? (
                  <div className="text-center py-6 text-zinc-400 text-sm bg-white rounded-xl border border-zinc-100">
                    Nu sunt camere disponibile pentru filtrul ales.
                  </div>
                ) : (
                  <div className="flex flex-col gap-2 max-h-72 overflow-y-auto pr-0.5">
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
              </div>

              {/* NVR recommendation */}
              {recommendedNvr && (
                <div className="bg-white rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.04)] border border-zinc-100 overflow-hidden mb-6">
                  <div className="px-5 py-3 border-b border-zinc-50 flex items-center gap-2">
                    <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">NVR Recomandat</span>
                  </div>
                  <div className="flex items-center gap-4 p-4">
                    <div className="w-16 h-16 rounded-lg bg-zinc-50 overflow-hidden shrink-0">
                      <img src={recommendedNvr.imageUrl} alt={recommendedNvr.name} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] text-zinc-400 font-medium">{recommendedNvr.brand}</p>
                      <p className="font-bold text-sm text-[#09090B] line-clamp-2">{recommendedNvr.name}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="font-black text-[#FF4F00]">{recommendedNvr.price.toLocaleString()}</p>
                      <p className="text-[10px] text-zinc-400">MDL</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Add to cart */}
              {selectedCamera && (
                <button
                  type="button"
                  onClick={() => {
                    for (let i = 0; i < calc.cameraCount; i++) addItem(selectedCamera as any);
                    if (recommendedNvr) addItem(recommendedNvr as any);
                    toast({ title: "Adăugat în coș!", description: `${calc.cameraCount}× ${selectedCamera.name.slice(0, 40)}${recommendedNvr ? " + NVR" : ""}` });
                    setTimeout(() => openCart(), 300);
                  }}
                  className="w-full bg-[#FF4F00] text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 mb-4 shadow-[0_4px_20px_rgba(255,79,0,0.3)] active:scale-[0.98] transition-all hover:opacity-90"
                >
                  <ShoppingCart className="w-5 h-5" /> Adaugă sistemul în coș
                </button>
              )}

              {/* Divider */}
              <div className="relative flex items-center gap-3 mb-5">
                <div className="flex-1 h-px bg-zinc-200" />
                <span className="text-xs text-zinc-400">sau solicită ofertă personalizată</span>
                <div className="flex-1 h-px bg-zinc-200" />
              </div>

              {/* Contact form */}
              <form onSubmit={handleFormSubmit} className="flex flex-col gap-3">
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Prenume și Nume (opțional)"
                  className="w-full border border-zinc-200 rounded-xl px-4 py-3 text-[#09090B] text-sm placeholder:text-zinc-400 focus:outline-none focus:border-[#FF4F00] transition-colors bg-white"
                />
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))}
                  placeholder="+373 __ ___ ___"
                  className="w-full border border-zinc-200 rounded-xl px-4 py-3 text-[#09090B] text-sm placeholder:text-zinc-400 focus:outline-none focus:border-[#FF4F00] transition-colors bg-white"
                  required
                />
                <button
                  type="submit"
                  className="w-full bg-zinc-800 text-white font-bold py-3.5 rounded-xl hover:bg-zinc-700 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  Solicită ofertă detaliată →
                </button>
              </form>

              {/* Reset */}
              <div className="text-center mt-6">
                <button
                  onClick={resetCalc}
                  className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-[#FF4F00] transition-colors underline underline-offset-4"
                >
                  ↩ Calculează din nou cu alte opțiuni
                </button>
              </div>
            </div>
          )}

          {/* ── Step 7: Success ── */}
          {step === 7 && (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-green-500" />
              </div>
              <h3 className="font-black text-[#09090B] text-xl mb-2">Cerere trimisă cu succes!</h3>
              <p className="text-zinc-500 text-sm mb-6 max-w-xs mx-auto">
                Echipa noastră te contactează în 30 de minute cu o ofertă personalizată.
              </p>

              <div className="grid grid-cols-2 gap-3 max-w-xs mx-auto mb-6">
                <a
                  href={`https://wa.me/${(settings.general?.adminPhone || "37367200463").replace(/\D/g, "")}?text=${encodeURIComponent(`Bună! Am configurat un sistem TECO.MD: ${calc.cameraCount} camere, ${selections.installation}, model: ${selectedCamera?.name ?? "?"}, total ~${calc.total.toLocaleString()} MDL. Telefon: ${formData.phone}`)}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 bg-[#25D366] text-white font-bold py-3 rounded-xl hover:opacity-90 active:scale-95 transition-all shadow-[0_4px_14px_rgba(37,211,102,0.3)] text-sm"
                >
                  📱 WhatsApp
                </a>
                <a
                  href={`viber://chat?number=${(settings.general?.adminPhone || "37367200463").replace(/\D/g, "")}`}
                  className="flex items-center justify-center gap-2 bg-[#7360F2] text-white font-bold py-3 rounded-xl hover:opacity-90 active:scale-95 transition-all shadow-[0_4px_14px_rgba(115,96,242,0.3)] text-sm"
                >
                  💬 Viber
                </a>
              </div>

              <button
                onClick={resetCalc}
                className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-[#FF4F00] transition-colors underline underline-offset-4"
              >
                ↩ Calculează din nou cu alte opțiuni
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
