import React, { useState, useEffect, useRef } from "react";
import { Home, Building, Briefcase, MapPin, Zap, Star, Wifi, HelpCircle, Check, Camera, ShoppingCart, Package, Wrench, Smartphone, MessageCircle, Lightbulb, RotateCcw } from "lucide-react";
import { ConsentCheckbox } from "@/components/ConsentCheckbox";
import { useCart } from "@/hooks/useCart";
import { useToast } from "@/hooks/use-toast";
import { useStore, storeActions } from "@/lib/store";
import { getSessionPayload } from "@/lib/session";
import { useLang } from "@/contexts/LangContext";

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
  const { lang } = useLang();
  const ru = lang === "ru";
  const s = (ro: string, ru_: string) => ru ? ru_ : ro;

  const OBJECTIVES = [
    { icon: Home,      ro: "Casă / Vilă",                 ru: "Дом / Вилла" },
    { icon: Building,  ro: "Apartament",                   ru: "Квартира" },
    { icon: Briefcase, ro: "Spațiu Comercial / Depozit",   ru: "Коммерческое помещение / Склад" },
    { icon: MapPin,    ro: "Curte / Teren",                ru: "Двор / Участок" },
  ];

  const CAMERA_OPTS = [
    { ro: "2 Camere",   ru: "2 камеры"   },
    { ro: "4 Camere",   ru: "4 камеры"   },
    { ro: "8 Camere",   ru: "8 камер"    },
    { ro: "16+ Camere", ru: "16+ камер"  },
  ];

  const STORAGE_OPTS = [
    { ro: "14 zile",    ru: "14 дней"   },
    { ro: "30 de zile", ru: "30 дней"   },
    { ro: "60 de zile", ru: "60 дней"   },
    { ro: "90+ zile",   ru: "90+ дней"  },
  ];

  const INSTALL_OPTS = [
    { icon: Zap,        ro: "Standard (pat cablu)",       ru: "Стандарт (кабель-канал)"     },
    { icon: Star,       ro: "Premium (ascuns în pereți)", ru: "Премиум (скрытый в стенах)"  },
    { icon: Wifi,       ro: "Fără cablu (Wireless)",      ru: "Без кабеля (Wireless)"       },
    { icon: HelpCircle, ro: "Nu știu, vreau sfat",        ru: "Не знаю, хочу совет"         },
  ];

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

  useEffect(() => {
    if (step > 1) {
      setTimeout(() => {
        sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 50);
    }
  }, [step]);

  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const loadingTexts = {
    ro: ["Verificăm stocul disponibil...", "Calculăm costul manoperei...", "Generăm devizul personalizat..."],
    ru: ["Проверяем наличие товаров...", "Рассчитываем стоимость монтажа...", "Формируем персональную смету..."],
  };
  const [loadingText, setLoadingText] = useState(loadingTexts.ro[0]);

  const addItem = useCart((state) => state.addItem);
  const openCart = useCart((state) => state.openCart);
  const { toast } = useToast();

  const settings = useStore((st) => st.settings);
  const allProducts = useStore((st) => st.products);
  const adminProduct = settings.moduleA.productId
    ? allProducts.find((p) => p.id === settings.moduleA.productId) ?? null
    : null;

  useEffect(() => {
    if (step === 5) {
      const texts = ru ? loadingTexts.ru : loadingTexts.ro;
      let ti = 0;
      const textInt = setInterval(() => { ti = (ti + 1) % texts.length; setLoadingText(texts[ti]); }, 800);
      setLoadingProgress(0);
      const progInt = setInterval(() => setLoadingProgress((p) => Math.min(p + 100 / (2500 / 50), 99)), 50);
      const t = setTimeout(() => { clearInterval(textInt); clearInterval(progInt); setStep(6); }, 2500);
      return () => { clearTimeout(t); clearInterval(textInt); clearInterval(progInt); };
    }
    return undefined;
  }, [step, ru]);

  const handleSelect = (key: keyof typeof selections, value: string) => {
    setSelections((prev) => ({ ...prev, [key]: value }));
    if (key !== "installation") setTimeout(() => setStep((prev) => prev + 1), 300);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.phone.trim()) { alert(s("Introduceți numărul de telefon", "Введите номер телефона")); return; }
    storeActions.addLead({
      name: formData.name,
      phone: formData.phone,
      source: s("Calculator Cost", "Калькулятор стоимости"),
      selections,
    });

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
    const seturi = allProducts
      .filter((p) => p.category === "kituri" && p.inStock !== false)
      .map((p) => ({ product: p, count: extractCameraCount(p) }))
      .filter((s_): s_ is { product: typeof allProducts[number]; count: number } => s_.count !== null);
    const countMinim = seturi
      .filter((s_) => s_.count >= cameraCount)
      .reduce((min, s_) => (s_.count < min ? s_.count : min), Infinity);
    const kitPotrivite = seturi
      .filter((s_) => s_.count === countMinim)
      .sort((a, b) => a.product.price - b.product.price);
    if (kitPotrivite.length >= 2) {
      const kitCalc = kitPotrivite[kitPotrivite.length - 1].product;
      const kitRecomandat = kitPotrivite[0].product;
      const economisire = Math.max(0, kitCalc.price - kitRecomandat.price);
      return { equipmentCost: kitCalc.price, installCost, totalCost: kitCalc.price + installCost, kitRecomandat, economisire };
    }
    if (kitPotrivite.length === 1) {
      const kit = kitPotrivite[0].product;
      const equipmentCost = Math.round(kit.price * 1.15);
      return { equipmentCost, installCost, totalCost: equipmentCost + installCost, kitRecomandat: kit, economisire: Math.round(kit.price * 0.15) };
    }
    const celMaiMareKit = [...seturi].sort((a, b) => b.count - a.count)[0];
    if (celMaiMareKit) {
      const pretPerCam = celMaiMareKit.product.price / celMaiMareKit.count;
      const equipmentCost = Math.round(pretPerCam * cameraCount * 1.1);
      return { equipmentCost, installCost, totalCost: equipmentCost + installCost, kitRecomandat: celMaiMareKit.product, economisire: Math.max(0, equipmentCost - celMaiMareKit.product.price) };
    }
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
            <p className="text-[#FF4F00] text-xs font-bold uppercase tracking-[0.2em] mb-3">
              {s("Calculator Gratuit", "Бесплатный калькулятор")}
            </p>
            <h2 className="font-black text-3xl md:text-4xl mb-3 text-zinc-950 tracking-tight">
              {s(<>Calculează Costul<br className="md:hidden"/> Sistemului Tău</>, <>Рассчитайте стоимость<br className="md:hidden"/> вашей системы</>)}
            </h2>
            <p className="text-zinc-400 max-w-md mx-auto">
              {s("Răspunde la 4 întrebări și primești devizul estimativ gratuit în 60 de secunde.", "Ответьте на 4 вопроса и получите бесплатную смету за 60 секунд.")}
            </p>
          </div>
        )}

        {step <= 4 && (
          <div className="flex items-center justify-center gap-4 mb-8">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="flex items-center">
                <button
                  onClick={() => n < step ? setStep(n) : undefined}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${n === step ? "bg-[#FF4F00] text-white shadow-[0_0_12px_rgba(255,79,0,0.4)]" : n < step ? "bg-orange-100 text-[#FF4F00] cursor-pointer hover:bg-orange-200" : "bg-zinc-100 text-zinc-400 cursor-default"}`}>
                  {n < step ? <Check className="w-4 h-4" /> : n}
                </button>
                {n < 4 && <div className={`w-12 h-1 transition-colors ${n < step ? "bg-[#FF4F00]/30" : "bg-zinc-100"}`} />}
              </div>
            ))}
          </div>
        )}

        <div className="animate-fade-in text-left">
          {step === 1 && (
            <div>
              <h3 className="text-xl font-bold mb-6 text-center text-[#09090B]">
                {s("Ce vrei să protejezi?", "Что вы хотите защитить?")}
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {OBJECTIVES.map(({ icon, ro, ru: ruLabel }) => {
                  const label = ru ? ruLabel : ro;
                  return (
                    <OptionButton
                      key={ro}
                      icon={icon}
                      label={label}
                      isActive={selections.objective === ro}
                      onClick={() => handleSelect("objective", ro)}
                      testId={`calc-obj-${ro.toLowerCase().replace(/[^a-z]/g, "")}`}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h3 className="text-xl font-bold mb-6 text-center text-[#09090B]">
                {s("De câte camere ai nevoie?", "Сколько камер вам нужно?")}
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {CAMERA_OPTS.map(({ ro, ru: ruLabel }) => {
                  const label = ru ? ruLabel : ro;
                  return (
                    <OptionButton key={ro} icon={Camera} label={label} isActive={selections.cameras === ro}
                      onClick={() => handleSelect("cameras", ro)} testId={`calc-cam-${ro.replace("+","")}`} />
                  );
                })}
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h3 className="text-xl font-bold mb-6 text-center text-[#09090B]">
                {s("Câte zile de înregistrare?", "Сколько дней записи?")}
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {STORAGE_OPTS.map(({ ro, ru: ruLabel }) => {
                  const label = ru ? ruLabel : ro;
                  return (
                    <OptionButton key={ro} icon={Check} label={label} isActive={selections.storage === ro}
                      onClick={() => handleSelect("storage", ro)} testId={`calc-storage-${ro.replace("+","")}`} />
                  );
                })}
              </div>
            </div>
          )}

          {step === 4 && (
            <div>
              <h3 className="text-xl font-bold mb-6 text-center text-[#09090B]">
                {s("Tipul instalării", "Тип установки")}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                {INSTALL_OPTS.map(({ icon, ro, ru: ruLabel }) => {
                  const label = ru ? ruLabel : ro;
                  return (
                    <OptionButton key={ro} icon={icon} label={label} isActive={selections.installation === ro}
                      onClick={() => handleSelect("installation", ro)} testId={`calc-inst-${ro.toLowerCase().replace(/[^a-z]/g,"")}`} />
                  );
                })}
              </div>
              <div className="flex justify-center mt-8">
                <button
                  onClick={() => { if (selections.installation) setStep(5); }}
                  disabled={!selections.installation}
                  className="bg-[#FF4F00] text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-orange-600 transition-colors disabled:opacity-50 active:scale-95"
                  data-testid="calc-submit-btn"
                >
                  {s("Calculează Devizul", "Рассчитать смету")}
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
                <div className="bg-[#FF4F00] text-white text-xs font-bold px-3 py-1 rounded-full">
                  {s("Devizul tău este gata!", "Ваша смета готова!")}
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-4 pr-24 text-white">
                {s("Deblochează prețul calculat", "Разблокируйте рассчитанную цену")}
              </h3>
              <p className="text-zinc-300 mb-4">
                {s("Primești INSTANT pe Viber/WhatsApp:", "Получите МГНОВЕННО на Viber/WhatsApp:")}
              </p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-3 text-sm text-zinc-300">
                  <Check className="w-5 h-5 text-[#10B981] shrink-0" />
                  {s("Prețul estimativ (Echipamente + Manoperă)", "Ориентировочная цена (оборудование + монтаж)")}
                </li>
                <li className="flex items-start gap-3 text-sm text-zinc-300">
                  <Check className="w-5 h-5 text-[#10B981] shrink-0" />
                  {s("Voucher -10% pentru instalare (valabil 48h)", "Ваучер -10% на монтаж (действует 48ч)")}
                </li>
                <li className="flex items-start gap-3 text-sm text-zinc-300">
                  <Check className="w-5 h-5 text-[#10B981] shrink-0" />
                  {s("Schiță tehnică gratuită de amplasare a camerelor", "Бесплатная техническая схема расстановки камер")}
                </li>
              </ul>
              <form onSubmit={handleFormSubmit} className="flex flex-col gap-4">
                <input type="text" placeholder={s("Nume complet", "Полное имя")} required value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#FF4F00]" data-testid="calc-form-name" />
                <input type="tel" placeholder="+373 " required value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#FF4F00]" data-testid="calc-form-phone" />
                <ConsentCheckbox checked={calcConsent} onChange={setCalcConsent} dark />
                <button type="submit" disabled={!calcConsent}
                  className="w-full bg-[#FF4F00] text-white font-bold py-4 rounded-xl hover:bg-orange-600 active:scale-95 transition-all mt-2 shadow-[0_4px_14px_rgba(255,79,0,0.4)] disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
                  data-testid="calc-form-submit">
                  {s("Deblochează Prețul + Obține Voucherul", "Разблокировать цену + получить ваучер")}
                </button>
              </form>
            </div>
          )}

          {step === 7 && (() => {
            const { equipmentCost, installCost, totalCost, kitRecomandat, economisire } = getCalculations();
            const phone = (settings.general?.adminPhone || "373").replace(/\D/g, "");
            const waText = ru
              ? `Здравствуйте! Заполнил калькулятор TECO.MD. Имя: ${formData.name}, Тел: ${formData.phone}. Жду подробную смету.`
              : `Bună! Am completat calculatorul TECO.MD. Nume: ${formData.name}, Tel: ${formData.phone}. Aștept devizul detaliat.`;
            return (
              <div className="animate-fade-in max-w-lg mx-auto">
                <div className="text-center mb-6">
                  <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 text-sm font-semibold px-4 py-1.5 rounded-full border border-green-200 mb-3">
                    <Check className="w-4 h-4" /> {s("Deviz trimis cu succes!", "Смета успешно отправлена!")}
                  </div>
                  <h2 className="font-bold text-2xl text-[#09090B]">
                    {s("Deviz Estimativ", "Ориентировочная смета")} {formData.name ? (ru ? `для ${formData.name}` : `pentru ${formData.name}`) : ""}
                  </h2>
                </div>

                <div className="bg-gradient-to-br from-zinc-950 to-zinc-900 text-white rounded-2xl p-6 mb-4 shadow-xl">
                  <div className="space-y-3 mb-4">
                    <div className="flex justify-between items-center text-zinc-300">
                      <span className="text-sm flex items-center gap-1.5"><Package className="w-3.5 h-3.5 text-zinc-400" /> {s("Echipamente (estimat)", "Оборудование (оценка)")}</span>
                      <span className="font-mono font-semibold">~{equipmentCost.toLocaleString("ro-MD")} MDL</span>
                    </div>
                    <div className="flex justify-between items-center text-zinc-300">
                      <span className="text-sm flex items-center gap-1.5"><Wrench className="w-3.5 h-3.5 text-zinc-400" /> {s("Instalare", "Монтаж")}</span>
                      <span className="font-mono font-semibold">~{installCost.toLocaleString("ro-MD")} MDL</span>
                    </div>
                    <div className="border-t border-zinc-700 pt-3 flex justify-between items-center">
                      <span className="font-bold text-white">{s("Total estimat", "Итого (оценка)")}</span>
                      <span className="font-mono font-black text-2xl text-[#FF4F00]">~{totalCost.toLocaleString("ro-MD")} MDL</span>
                    </div>
                  </div>
                  <p className="text-xs text-zinc-500 text-center bg-zinc-800 rounded-lg p-2">
                    {s("Prețul exact îl primești pe WhatsApp / Viber în câteva minute.", "Точную цену получите на WhatsApp / Viber в течение нескольких минут.")}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-6">
                  <a
                    href={`https://wa.me/${phone}?text=${encodeURIComponent(waText)}`}
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 bg-[#25D366] text-white font-bold py-3 rounded-xl hover:opacity-90 active:scale-95 transition-all shadow-[0_4px_14px_rgba(37,211,102,0.3)]"
                  >
                    <Smartphone className="w-4 h-4" /> WhatsApp
                  </a>
                  <a
                    href={`viber://chat?number=${phone}`}
                    className="flex items-center justify-center gap-2 bg-[#7360F2] text-white font-bold py-3 rounded-xl hover:opacity-90 active:scale-95 transition-all shadow-[0_4px_14px_rgba(115,96,242,0.3)]"
                  >
                    <MessageCircle className="w-4 h-4" /> Viber
                  </a>
                </div>

                <div className="text-center mb-6">
                  <button onClick={resetCalc}
                    className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-[#FF4F00] transition-colors underline underline-offset-4">
                    <RotateCcw className="w-3.5 h-3.5" /> {s("Calculează din nou cu alte opțiuni", "Пересчитать с другими параметрами")}
                  </button>
                </div>

                {kitRecomandat && (
                  <>
                    <div className="text-center mb-4">
                      <h4 className="font-bold text-lg text-[#09090B] flex items-center justify-center gap-2">
                        <Lightbulb className="w-5 h-5 text-[#FF4F00]" /> {s("Kit complet disponibil acum", "Готовый комплект в наличии")}
                      </h4>
                      {economisire > 0 && (
                        <p className="text-sm text-green-600 font-semibold mt-1">
                          {s(`Economisești ~${economisire.toLocaleString("ro-MD")} MDL față de estimat`,
                             `Экономите ~${economisire.toLocaleString("ro-MD")} MDL по сравнению со сметой`)}
                        </p>
                      )}
                    </div>
                    <div className="bg-white rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.06)] border border-[#E4E4E7] overflow-hidden">
                      {kitRecomandat.imageUrl && (
                        <div className="h-40 bg-zinc-50 overflow-hidden">
                          <img src={kitRecomandat.imageUrl} alt={kitRecomandat.name} className="w-full h-full object-cover"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
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
                            <p className="text-[10px] text-zinc-400">
                              {s("echipamente · fără manoperă", "оборудование · без монтажа")}
                            </p>
                          </div>
                          {economisire > 0 && (
                            <div className="bg-green-50 border border-green-200 rounded-xl px-3 py-2 text-center">
                              <p className="text-[10px] text-green-600 font-bold uppercase">{s("Economii", "Экономия")}</p>
                              <p className="text-base font-black text-green-700">~{economisire.toLocaleString()} MDL</p>
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => { addItem(kitRecomandat as any); toast({ title: s("Kit adăugat în coș!", "Комплект добавлен в корзину!") }); setTimeout(() => openCart(), 300); }}
                          className="w-full bg-[#FF4F00] text-white font-bold py-3 rounded-xl hover:opacity-90 transition-all active:scale-95 flex items-center justify-center gap-2 shadow-[0_4px_14px_rgba(255,79,0,0.3)]"
                        >
                          <ShoppingCart className="w-4 h-4" /> {s("Adaugă în Coș", "Добавить в корзину")}
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
