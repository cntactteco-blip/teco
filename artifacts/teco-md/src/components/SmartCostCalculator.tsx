import React, { useState, useEffect, useRef } from "react";
import { Home, Building, Briefcase, MapPin, Cable, Zap, Star, Wifi, HelpCircle, Check, Camera, ShoppingCart } from "lucide-react";
import { ConsentCheckbox } from "@/components/ConsentCheckbox";
import { useCart } from "@/hooks/useCart";
import { useToast } from "@/hooks/use-toast";
import { useStore, storeActions, getState } from "@/lib/store";
import { getSessionPayload } from "@/lib/session";

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

export default function SmartCostCalculator() {
  const [step, setStep] = useState(1);
  const [selections, setSelections] = useState({ objective: "", cameras: "", storage: "", installation: "" });
  const [formData, setFormData] = useState({ name: "", phone: "" });
  const [calcConsent, setCalcConsent] = useState(false);

  const sectionRef = useRef<HTMLElement>(null);

  const resetCalc = () => {
    setStep(1);
    setSelections({ objective: "", cameras: "", storage: "", installation: "" });
    setFormData({ name: "", phone: "" });
  };

  // Scroll la top-ul calculatorului la fiecare schimbare de step
  useEffect(() => {
    if (step > 1) {
      setTimeout(() => {
        sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 50);
    }
  }, [step]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingText, setLoadingText] = useState("Verificăm stocul disponibil...");

  const addItem = useCart((state) => state.addItem);
  const openCart = useCart((state) => state.openCart);
  const { toast } = useToast();

  // Admin-configured product for module A
  const settings = useStore((s) => s.settings);
  const allProducts = useStore((s) => s.products);
  const adminProduct = settings.moduleA.productId
    ? allProducts.find((p) => p.id === settings.moduleA.productId) ?? null
    : null;

  useEffect(() => {
    if (step === 5) {
      const texts = ["Verificăm stocul disponibil...", "Calculăm costul manoperei...", "Generăm devizul personalizat..."];
      let ti = 0;
      const textInt = setInterval(() => { ti = (ti + 1) % texts.length; setLoadingText(texts[ti]); }, 800);
      setLoadingProgress(0);
      const progInt = setInterval(() => setLoadingProgress((p) => Math.min(p + 100 / (2500 / 50), 99)), 50);
      const t = setTimeout(() => { clearInterval(textInt); clearInterval(progInt); setStep(6); }, 2500);
      return () => { clearTimeout(t); clearInterval(textInt); clearInterval(progInt); };
    }
    return undefined;
  }, [step]);

  const handleSelect = (key: keyof typeof selections, value: string) => {
    setSelections((prev) => ({ ...prev, [key]: value }));
    if (key !== "installation") setTimeout(() => setStep((prev) => prev + 1), 300);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.phone.trim()) { alert("Introduceți numărul de telefon"); return; }
    // Save lead to store
    storeActions.addLead({
      name: formData.name,
      phone: formData.phone,
      source: "Calculator Cost",
      selections,
    });

    // Trimite la Telegram cu toate detaliile calculatorului
    const { equipmentCost, installCost, totalCost } = getCalculations();
    const session = getSessionPayload();
    const API = import.meta.env.VITE_API_URL || "";
    fetch(API + "/api/notify/calculator", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: formData.name,
        phone: formData.phone,
        selections,
        equipmentCost,
        installCost,
        totalCost,
        session,
      }),
    }).catch(() => {});

    setStep(7);
  };

  // Extrage numărul de camere dintr-un produs (kit)
  const extractCameraCount = (p: { name: string; specs: string }): number | null => {
    const text = `${p.name} ${p.specs}`.toLowerCase();
    let m = text.match(/(\d+)\s*(?:x|×)?\s*camer/);
    if (m) return parseInt(m[1]);
    m = text.match(/(\d+)\s*buc/);
    if (m) return parseInt(m[1]);
    m = text.match(/set\s*(?:of\s*)?(\d+)/);
    if (m) return parseInt(m[1]);
    return null;
  };

  const getCalculations = () => {
    const cameraCount = parseInt(selections.cameras) || 2;
    const installCost = cameraCount <= 1 ? 750 : 650 * cameraCount;

    // Toate kiturile cu număr de camere detectat
    const seturi = allProducts
      .filter((p) => p.category === "kituri" && p.inStock !== false)
      .map((p) => ({ product: p, count: extractCameraCount(p) }))
      .filter((s): s is { product: typeof allProducts[number]; count: number } => s.count !== null);

    // Găsește cea mai mică dimensiune de kit care acoperă cerința
    const countMinim = seturi
      .filter((s) => s.count >= cameraCount)
      .reduce((min, s) => (s.count < min ? s.count : min), Infinity);

    // Kituri cu EXACT acea dimensiune minimă (cele mai apropiate de cerință)
    const kitPotrivite = seturi
      .filter((s) => s.count === countMinim)
      .sort((a, b) => a.product.price - b.product.price);

    if (kitPotrivite.length >= 2) {
      // Estimat = cel mai scump din categoria potrivită; Recomandat = cel mai ieftin
      const kitCalc = kitPotrivite[kitPotrivite.length - 1].product;
      const kitRecomandat = kitPotrivite[0].product;
      const economisire = Math.max(0, kitCalc.price - kitRecomandat.price);
      return { equipmentCost: kitCalc.price, installCost, totalCost: kitCalc.price + installCost, kitRecomandat, economisire };
    }

    if (kitPotrivite.length === 1) {
      // Un singur kit potrivit — estimatul e +15% ca să existe diferența față de recomandare
      const kit = kitPotrivite[0].product;
      const equipmentCost = Math.round(kit.price * 1.15);
      return { equipmentCost, installCost, totalCost: equipmentCost + installCost, kitRecomandat: kit, economisire: Math.round(kit.price * 0.15) };
    }

    // Niciun kit cu count >= cameraCount — scalăm prețul per-cameră din cel mai mare kit disponibil
    const celMaiMareKit = [...seturi].sort((a, b) => b.count - a.count)[0];
    if (celMaiMareKit) {
      const pretPerCam = celMaiMareKit.product.price / celMaiMareKit.count;
      const equipmentCost = Math.round(pretPerCam * cameraCount * 1.1);
      return { equipmentCost, installCost, totalCost: equipmentCost + installCost, kitRecomandat: celMaiMareKit.product, economisire: Math.max(0, equipmentCost - celMaiMareKit.product.price) };
    }

    // Fallback final: camere individuale
    const poeCameras = allProducts.filter((p) => p.category === "poe" && p.inStock !== false).sort((a, b) => a.price - b.price);
    const wifiCameras = allProducts.filter((p) => p.category === "wifi" && p.inStock !== false).sort((a, b) => a.price - b.price);
    const nvrList = allProducts.filter((p) => p.category === "nvr" && p.inStock !== false).sort((a, b) => a.price - b.price);
    const bestCamera = poeCameras[0] ?? wifiCameras[0];
    const bestNvr = nvrList[0];
    const equipmentCost = (bestCamera?.price ?? 1_800) * cameraCount + (bestNvr?.price ?? 1_900);
    return { equipmentCost, installCost, totalCost: equipmentCost + installCost, kitRecomandat: null, economisire: 0 };
  };

  const bannerImage = settings.moduleA?.bannerImage;

  return (
    <section ref={sectionRef} className="w-full bg-white border-y border-zinc-100 py-16 px-4 relative overflow-hidden">
      {bannerImage && (
        <div className="max-w-[800px] mx-auto mb-8 rounded-2xl overflow-hidden shadow-sm">
          <img src={bannerImage} alt="Banner Calculator" className="w-full max-h-48 object-cover" />
        </div>
      )}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#FF4F00] to-transparent opacity-60" />
      <div className="max-w-[800px] mx-auto text-center">
        {step < 5 && (
          <div className="mb-10">
            <p className="text-[#FF4F00] text-xs font-bold uppercase tracking-[0.2em] mb-3">Calculator Gratuit</p>
            <h2 className="font-black text-3xl md:text-4xl mb-3 text-zinc-950 tracking-tight">Calculează Costul<br className="md:hidden"/> Sistemului Tău</h2>
            <p className="text-zinc-400 max-w-md mx-auto">Răspunde la 4 întrebări și primești devizul estimativ gratuit în 60 de secunde.</p>
          </div>
        )}

        {step <= 4 && (
          <div className="flex items-center justify-center gap-4 mb-8">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex items-center">
                <button
                  onClick={() => s < step ? setStep(s) : undefined}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${s === step ? "bg-[#FF4F00] text-white shadow-[0_0_12px_rgba(255,79,0,0.4)]" : s < step ? "bg-orange-100 text-[#FF4F00] cursor-pointer hover:bg-orange-200" : "bg-zinc-100 text-zinc-400 cursor-default"}`}>
                  {s < step ? <Check className="w-4 h-4" /> : s}
                </button>
                {s < 4 && <div className={`w-12 h-1 transition-colors ${s < step ? "bg-[#FF4F00]/30" : "bg-zinc-100"}`} />}
              </div>
            ))}
          </div>
        )}

        <div className="animate-fade-in text-left">
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

          {step === 2 && (
            <div>
              <h3 className="text-xl font-bold mb-6 text-center text-[#09090B]">De câte camere ai nevoie?</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {["2 Camere", "4 Camere", "8 Camere", "16+ Camere"].map((opt) => (
                  <OptionButton key={opt} icon={Camera} label={opt} isActive={selections.cameras === opt} onClick={() => handleSelect("cameras", opt)} testId={`calc-cam-${opt.replace("+","")}`} />
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h3 className="text-xl font-bold mb-6 text-center text-[#09090B]">Câte zile de înregistrare?</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {["14 zile", "30 de zile", "60 de zile", "90+ zile"].map((opt) => (
                  <OptionButton key={opt} icon={Check} label={opt} isActive={selections.storage === opt} onClick={() => handleSelect("storage", opt)} testId={`calc-storage-${opt.replace("+","")}`} />
                ))}
              </div>
            </div>
          )}

          {step === 4 && (
            <div>
              <h3 className="text-xl font-bold mb-6 text-center text-[#09090B]">Tipul instalării</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <OptionButton icon={Zap} label="Standard (pat cablu)" isActive={selections.installation === "Standard (pat cablu)"} onClick={() => handleSelect("installation", "Standard (pat cablu)")} testId="calc-inst-standard" />
                <OptionButton icon={Star} label="Premium (ascuns în pereți)" isActive={selections.installation === "Premium (ascuns în pereți)"} onClick={() => handleSelect("installation", "Premium (ascuns în pereți)")} testId="calc-inst-premium" />
                <OptionButton icon={Wifi} label="Fără cablu (Wireless)" isActive={selections.installation === "Fără cablu (Wireless)"} onClick={() => handleSelect("installation", "Fără cablu (Wireless)")} testId="calc-inst-wireless" />
                <OptionButton icon={HelpCircle} label="Nu știu, vreau sfat" isActive={selections.installation === "Nu știu, vreau sfat"} onClick={() => handleSelect("installation", "Nu știu, vreau sfat")} testId="calc-inst-sfat" />
              </div>
              <div className="flex justify-center mt-8">
                <button
                  onClick={() => { if (selections.installation) setStep(5); }}
                  disabled={!selections.installation}
                  className="bg-[#FF4F00] text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-orange-600 transition-colors disabled:opacity-50 active:scale-95"
                  data-testid="calc-submit-btn"
                >
                  Calculează Devizul
                </button>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="py-16 flex flex-col items-center gap-6">
              <div className="w-16 h-16 rounded-full bg-orange-50 flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-[#FF4F00] border-t-transparent rounded-full animate-spin" />
              </div>
              <div className="w-full max-w-xs bg-zinc-100 h-1.5 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-[#FF4F00] to-orange-300 rounded-full transition-all duration-[50ms]" style={{ width: `${loadingProgress}%` }} />
              </div>
              <p className="text-sm font-medium text-zinc-500 animate-pulse">{loadingText}</p>
            </div>
          )}

          {step === 6 && (
            <div className="bg-zinc-950 text-white rounded-2xl p-8 max-w-lg mx-auto shadow-2xl animate-fade-in relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4">
                <div className="bg-[#FF4F00] text-white text-xs font-bold px-3 py-1 rounded-full">Devizul tău este gata!</div>
              </div>
              <h3 className="text-2xl font-bold mb-4 pr-24 text-white">Deblochează prețul calculat</h3>
              <p className="text-zinc-300 mb-4">Primești INSTANT pe Viber/WhatsApp:</p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-3 text-sm text-zinc-300"><Check className="w-5 h-5 text-[#10B981] shrink-0" />Prețul estimativ (Echipamente + Manoperă)</li>
                <li className="flex items-start gap-3 text-sm text-zinc-300"><Check className="w-5 h-5 text-[#10B981] shrink-0" />Voucher -10% pentru instalare (valabil 48h)</li>
                <li className="flex items-start gap-3 text-sm text-zinc-300"><Check className="w-5 h-5 text-[#10B981] shrink-0" />Schiță tehnică gratuită de amplasare a camerelor</li>
              </ul>
              <form onSubmit={handleFormSubmit} className="flex flex-col gap-4">
                <input type="text" placeholder="Nume complet" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#FF4F00]" data-testid="calc-form-name" />
                <input type="tel" placeholder="+373 " required value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#FF4F00]" data-testid="calc-form-phone" />
                <ConsentCheckbox checked={calcConsent} onChange={setCalcConsent} dark />
                <button type="submit" disabled={!calcConsent} className="w-full bg-[#FF4F00] text-white font-bold py-4 rounded-xl hover:bg-orange-600 active:scale-95 transition-all mt-2 shadow-[0_4px_14px_rgba(255,79,0,0.4)] disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none" data-testid="calc-form-submit">
                  Deblochează Prețul + Obține Voucherul
                </button>
              </form>
            </div>
          )}

          {step === 7 && (() => {
            const { equipmentCost, installCost, totalCost, kitRecomandat, economisire } = getCalculations();
            const phone = (settings.general?.adminPhone || "373").replace(/\D/g, "");
            return (
            <div className="animate-fade-in max-w-lg mx-auto">
              {/* Header */}
              <div className="text-center mb-6">
                <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 text-sm font-semibold px-4 py-1.5 rounded-full border border-green-200 mb-3">
                  <Check className="w-4 h-4" /> Deviz trimis cu succes!
                </div>
                <h2 className="font-bold text-2xl text-[#09090B]">
                  Deviz Estimativ {formData.name ? `pentru ${formData.name}` : ""}
                </h2>
              </div>

              {/* Price card */}
              <div className="bg-gradient-to-br from-zinc-950 to-zinc-900 text-white rounded-2xl p-6 mb-4 shadow-xl">
                <div className="space-y-3 mb-4">
                  <div className="flex justify-between items-center text-zinc-300">
                    <span className="text-sm">📦 Echipamente (estimat)</span>
                    <span className="font-mono font-semibold">~{equipmentCost.toLocaleString("ro-MD")} MDL</span>
                  </div>
                  <div className="flex justify-between items-center text-zinc-300">
                    <span className="text-sm">🔧 Instalare</span>
                    <span className="font-mono font-semibold">~{installCost.toLocaleString("ro-MD")} MDL</span>
                  </div>
                  <div className="border-t border-zinc-700 pt-3 flex justify-between items-center">
                    <span className="font-bold text-white">Total estimat</span>
                    <span className="font-mono font-black text-2xl text-[#FF4F00]">~{totalCost.toLocaleString("ro-MD")} MDL</span>
                  </div>
                </div>
                <p className="text-xs text-zinc-500 text-center bg-zinc-800 rounded-lg p-2">
                  Prețul exact îl primești pe WhatsApp / Viber în câteva minute.
                </p>
              </div>

              {/* Contact buttons */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <a
                  href={`https://wa.me/${phone}?text=${encodeURIComponent(`Bună! Am completat calculatorul TECO.MD. Nume: ${formData.name}, Tel: ${formData.phone}. Aștept devizul detaliat.`)}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 bg-[#25D366] text-white font-bold py-3 rounded-xl hover:opacity-90 active:scale-95 transition-all shadow-[0_4px_14px_rgba(37,211,102,0.3)]"
                >
                  <span>📱</span> WhatsApp
                </a>
                <a
                  href={`viber://chat?number=${phone}`}
                  className="flex items-center justify-center gap-2 bg-[#7360F2] text-white font-bold py-3 rounded-xl hover:opacity-90 active:scale-95 transition-all shadow-[0_4px_14px_rgba(115,96,242,0.3)]"
                >
                  <span>💬</span> Viber
                </a>
              </div>

              {/* Reset */}
              <div className="text-center mb-6">
                <button
                  onClick={resetCalc}
                  className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-[#FF4F00] transition-colors underline underline-offset-4"
                >
                  ↩ Calculează din nou cu alte opțiuni
                </button>
              </div>

              {/* Kit recomandat din catalog — mai ieftin decât estimatul */}
              {kitRecomandat && (
                <>
                  <div className="text-center mb-4">
                    <h4 className="font-bold text-lg text-[#09090B]">💡 Kit complet disponibil acum</h4>
                    {economisire > 0 && (
                      <p className="text-sm text-green-600 font-semibold mt-1">
                        Economisești ~{economisire.toLocaleString("ro-MD")} MDL față de estimat
                      </p>
                    )}
                  </div>
                  <div className="bg-white rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.06)] border border-[#E4E4E7] overflow-hidden">
                    {kitRecomandat.imageUrl && (
                      <div className="h-40 bg-zinc-50 overflow-hidden">
                        <img
                          src={kitRecomandat.imageUrl}
                          alt={kitRecomandat.name}
                          className="w-full h-full object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                        />
                      </div>
                    )}
                    <div className="p-5">
                      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                        {kitRecomandat.brand}{kitRecomandat.model ? ` · ${kitRecomandat.model}` : ""}
                      </p>
                      <h5 className="font-bold text-[#09090B] mb-1 text-base leading-snug">{kitRecomandat.name}</h5>
                      <p className="text-xs text-zinc-400 mb-4 line-clamp-2">{kitRecomandat.specs}</p>
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          {kitRecomandat.oldPrice && (
                            <p className="text-xs text-zinc-400 line-through">{kitRecomandat.oldPrice.toLocaleString()} MDL</p>
                          )}
                          <p className="font-mono font-black text-2xl text-[#FF4F00]">{kitRecomandat.price.toLocaleString()} MDL</p>
                          <p className="text-[10px] text-zinc-400">echipamente · fără manoperă</p>
                        </div>
                        {economisire > 0 && (
                          <div className="bg-green-50 border border-green-200 rounded-xl px-3 py-2 text-center">
                            <p className="text-[10px] text-green-600 font-bold uppercase">Economii</p>
                            <p className="text-base font-black text-green-700">~{economisire.toLocaleString()} MDL</p>
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => { addItem(kitRecomandat as any); toast({ title: "Kit adăugat în coș! 🎉" }); setTimeout(() => openCart(), 300); }}
                        className="w-full bg-[#FF4F00] text-white font-bold py-3 rounded-xl hover:opacity-90 transition-all active:scale-95 flex items-center justify-center gap-2 shadow-[0_4px_14px_rgba(255,79,0,0.3)]"
                      >
                        <ShoppingCart className="w-4 h-4" /> Adaugă în Coș
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
            );
          })()}
        </div>
      </div>
    </section>
  );
}
