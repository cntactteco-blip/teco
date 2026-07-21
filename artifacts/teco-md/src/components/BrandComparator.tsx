import { useState } from "react";
import { ShoppingCart, Star, Zap, Shield, TrendingUp } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { useToast } from "@/hooks/use-toast";
import { useStore } from "@/lib/store";
import { useLang } from "@/contexts/LangContext";

const brands = ["TAPO", "REOLINK", "UNIARCH", "DAHUA", "UNIVIEW", "TIANDY"] as const;
type Brand = typeof brands[number];

const BRAND_VISUAL: Record<Brand, {
  image: string; filter?: string; label: string; labelColor: string;
  overlay?: string;
  quality: { ro: string; ru: string };
  risk: { ro: string; ru: string };
  riskColor: string;
}> = {
  TAPO: {
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=40&auto=format&fit=crop",
    filter: "grayscale(0.4) contrast(0.75) brightness(0.65)",
    label: "720P | IR Standard", labelColor: "#9ca3af",
    overlay: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.12) 2px, rgba(0,0,0,0.12) 3px)",
    quality: { ro: "Calitate de bază", ru: "Базовое качество" },
    risk: { ro: "Față neidentificabilă pe întuneric", ru: "Лицо не идентифицируется в темноте" },
    riskColor: "#ef4444",
  },
  REOLINK: {
    image: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&q=80&auto=format&fit=crop",
    filter: "brightness(0.8) contrast(1.05)", label: "2K | Smart Detection", labelColor: "#60a5fa",
    quality: { ro: "Bună", ru: "Хорошее" },
    risk: { ro: "Identificare parțială — fără plăcuță auto", ru: "Частичная идентификация — без номерного знака" },
    riskColor: "#f59e0b",
  },
  UNIARCH: {
    image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80&auto=format&fit=crop",
    filter: "brightness(0.85) contrast(1.1) saturate(0.9)",
    label: "4MP | H.265+ | Ultra265", labelColor: "#34d399",
    quality: { ro: "Foarte bună", ru: "Очень хорошее" },
    risk: { ro: "Detalii clare — stocare -50% față de alte branduri", ru: "Чёткие детали — хранение -50% против других брендов" },
    riskColor: "#34d399",
  },
  DAHUA: {
    image: "https://images.unsplash.com/photo-1590736704728-f4730bb30770?w=800&q=80&auto=format&fit=crop",
    filter: "brightness(0.75) contrast(1.15) hue-rotate(10deg)",
    label: "4MP | WizSense AI | TiOC", labelColor: "#4ade80",
    quality: { ro: "Excelentă (AI)", ru: "Отличное (ИИ)" },
    risk: { ro: "AI detectează persoane & vehicule — zero alarme false", ru: "ИИ определяет людей и транспорт — ноль ложных тревог" },
    riskColor: "#4ade80",
  },
  UNIVIEW: {
    image: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800&q=80&auto=format&fit=crop",
    filter: "brightness(1.05) saturate(1.4) contrast(1.05)",
    label: "4MP | ColorHunter | F1.0", labelColor: "#fb923c",
    quality: { ro: "Premium (Color Noapte)", ru: "Премиум (цвет ночью)" },
    risk: { ro: "Color clar noaptea — vezi chipul, nu doar silueta", ru: "Чёткий цвет ночью — видите лицо, а не только силуэт" },
    riskColor: "#fb923c",
  },
  TIANDY: {
    image: "https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=800&q=80&auto=format&fit=crop",
    filter: "brightness(0.6) saturate(0.5) contrast(1.2)",
    label: "5MP | Super Starlight | 0.0001 Lux", labelColor: "#67e8f9",
    quality: { ro: "Ultra Premium", ru: "Ультра Премиум" },
    risk: { ro: "Detectare la lumina stelelor — interior și exterior", ru: "Обнаружение при звёздном свете — внутри и снаружи" },
    riskColor: "#67e8f9",
  },
};

const BRAND_STARS: Record<Brand, number> = {
  TAPO: 3, REOLINK: 3.5, UNIARCH: 4, DAHUA: 4.5, UNIVIEW: 4.5, TIANDY: 5,
};

const BRAND_BADGE: Partial<Record<Brand, { ro: string; ru: string }>> = {
  DAHUA:   { ro: "CEL MAI ALES", ru: "ПОПУЛЯРНЫЙ" },
  UNIVIEW: { ro: "COLOR NOAPTE", ru: "ЦВЕТ НОЧЬЮ" },
  TIANDY:  { ro: "ULTRA PREMIUM", ru: "УЛЬТРА ПРЕМИУМ" },
};

const FALLBACK: Record<Brand, { id: number; name: string; price: number; specs: string; badge: string | null;
  desc: { ro: string; ru: string }; urgency: { ro: string; ru: string } }> = {
  TAPO:    { id: 301, name: "Camera Tapo C310 WiFi 2K",        price: 810,  specs: "2K | WiFi | IR 30m",
    badge: "BUGET",      desc: { ro: "Soluție simplă și accesibilă pentru acasă.",      ru: "Простое и доступное решение для дома." },
    urgency: { ro: "Disponibil azi", ru: "Доступно сегодня" } },
  REOLINK: { id: 302, name: "Reolink Argus Eco 3MP Battery",   price: 1510, specs: "3MP | Acumulator | WiFi | IP65",
    badge: null,         desc: { ro: "Fără cabluri — se montează oriunde!",             ru: "Без кабелей — монтируется где угодно!" },
    urgency: { ro: "Livrare 24h", ru: "Доставка за 24ч" } },
  UNIARCH: { id: 303, name: "Uniarch Uho-S2E-M4 4MP WiFi",     price: 940,  specs: "4MP | WiFi | IR 10m | Zoom 2×",
    badge: "RECOMANDAT", desc: { ro: "Raport excelent preț/calitate.",                 ru: "Отличное соотношение цена/качество." },
    urgency: { ro: "Cel mai vândut", ru: "Самый продаваемый" } },
  DAHUA:   { id: 304, name: "Camera Dahua WizSense 4MP",       price: 1890, specs: "4MP | AI SMD+ | IR 40m | TiOC",
    badge: "POPULAR",    desc: { ro: "Detectare AI precisă — zero alarme false.",       ru: "Точное обнаружение ИИ — ноль ложных тревог." },
    urgency: { ro: "3 bucăți rămase", ru: "Осталось 3 штуки" } },
  UNIVIEW: { id: 305, name: "UNV IPC3612LB ColorHunter 2MP",   price: 900,  specs: "2MP | ColorHunter 0.005Lux | PoE",
    badge: "BEST SELLER", desc: { ro: "Color noapte la 0.005 Lux.",                    ru: "Цветная картинка ночью при 0.005 Лк." },
    urgency: { ro: "Stoc limitat", ru: "Ограниченный запас" } },
  TIANDY:  { id: 306, name: "Tiandy TC-C34XN 4MP S+265",       price: 990,  specs: "4MP | S+265 | IR 30m | IP66",
    badge: "PREMIUM",    desc: { ro: "Robustă și fiabilă la condiții extreme.",         ru: "Прочная и надёжная в экстремальных условиях." },
    urgency: { ro: "Instalare gratuită", ru: "Монтаж бесплатно" } },
};

export default function BrandComparator() {
  const [active, setActive] = useState<Brand>("DAHUA");
  const addItem = useCart((s) => s.addItem);
  const openCart = useCart((s) => s.openCart);
  const { toast } = useToast();
  const { lang } = useLang();
  const ru = lang === "ru";

  const settings = useStore((s) => s.settings);
  const allProducts = useStore((s) => s.products);

  const vis = BRAND_VISUAL[active];
  const adminProductId = settings.moduleC[active];
  const adminProd = adminProductId ? allProducts.find((p) => p.id === adminProductId) : null;

  const customImage = settings.moduleComparatorImages?.[active];
  const feedImage = customImage || vis.image;

  const handleAdd = () => {
    if (adminProd) {
      addItem(adminProd as any);
      toast({ title: ru ? "Добавлено в корзину!" : "Adăugat în coș!", description: adminProd.name });
    } else {
      const fb = FALLBACK[active];
      addItem({ ...fb, icon: "Camera", category: "camere", imageUrl: feedImage, model: "", brand: active, description: fb.desc.ro, inStock: true } as any);
      toast({ title: ru ? "Добавлено в корзину!" : "Adăugat în coș!", description: FALLBACK[active].name });
    }
    setTimeout(() => openCart(), 400);
  };

  const fb = FALLBACK[active];
  const prod = adminProd
    ? { name: adminProd.name, price: adminProd.price, specs: adminProd.specs, badge: adminProd.badge,
        desc: adminProd.description, imageUrl: adminProd.imageUrl || feedImage,
        urgency: ru ? "Доступно сегодня" : "Disponibil azi" }
    : { ...fb, imageUrl: feedImage, desc: ru ? fb.desc.ru : fb.desc.ro, urgency: ru ? fb.urgency.ru : fb.urgency.ro };

  const stars = BRAND_STARS[active];
  const brandBadgeObj = BRAND_BADGE[active];
  const brandBadge = brandBadgeObj ? (ru ? brandBadgeObj.ru : brandBadgeObj.ro) : undefined;

  return (
    <section className="bg-white py-14 px-4 border-y border-zinc-200">
      <div className="max-w-7xl mx-auto">

        {/* Header + Social proof */}
        <div className="mb-6">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
            <span className="inline-block bg-zinc-100 text-zinc-600 text-xs font-bold px-3 py-1 rounded-full">
              {ru ? "СРАВНИТЕ БРЕНДЫ" : "COMPARĂ BRANDURILE"}
            </span>
            <div className="flex items-center gap-1.5 text-xs text-zinc-500">
              <TrendingUp className="w-3.5 h-3.5 text-[#FF4F00]" />
              <span><strong className="text-[#09090B]">847</strong> {ru ? "клиентов выбрали камеру после сравнения" : "clienți au ales camera după comparație"}</span>
            </div>
          </div>
          <h2 className="font-black text-2xl md:text-3xl text-[#09090B] tracking-tight">
            {ru ? "Проверьте реальное качество" : "Testează Calitatea Reală"}
          </h2>
          <p className="text-zinc-500 text-sm mt-1">
            {ru
              ? <>Выберите бренд и посмотрите, как выглядит изображение камеры <strong className="text-[#09090B]">в реальных ночных условиях</strong> — разница огромная.</>
              : <>Selectează brandul și vezi cum arată imaginea camerei <strong className="text-[#09090B]">în condiții reale de noapte</strong> — diferența este enormă.</>
            }
          </p>
        </div>

        {/* Brand tabs */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-3 mb-6">
          {brands.map((b) => (
            <button key={b} onClick={() => setActive(b)} data-testid={`brand-tab-${b}`}
              className={`flex-shrink-0 rounded-full px-5 py-2 text-sm font-bold border transition-all duration-200 relative ${active === b ? "bg-zinc-900 text-white border-zinc-900 shadow-sm" : "bg-white text-zinc-500 border-zinc-200 hover:border-zinc-400 hover:text-zinc-700"}`}
            >
              {b}
              {BRAND_BADGE[b] && (
                <span className="absolute -top-2.5 -right-1 bg-[#FF4F00] text-white text-[8px] font-black px-1.5 py-0.5 rounded-full whitespace-nowrap leading-none">
                  ★
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[58%_42%] gap-5">
          {/* Feed simulation */}
          <div className="space-y-3">
            <div className="relative h-[220px] md:h-[300px] rounded-2xl overflow-hidden border border-zinc-200 bg-zinc-900">
              <img key={active} src={feedImage} alt={`Feed ${active}`} className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500" style={{ filter: vis.filter }} draggable={false} />
              {vis.overlay && <div className="absolute inset-0 pointer-events-none" style={{ background: vis.overlay }} />}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20 pointer-events-none" />

              {active === "DAHUA" && (
                <>
                  <div className="absolute top-[25%] left-[20%] w-12 h-24 border-2 border-green-400 rounded z-10">
                    <span className="absolute -top-5 left-0 text-green-400 font-mono text-[9px] font-bold bg-green-400/20 px-1 rounded-sm whitespace-nowrap">
                      {ru ? "ЧЕЛОВЕК" : "PERSOANĂ"}
                    </span>
                  </div>
                  <div className="absolute top-[35%] right-[15%] w-28 h-16 border-2 border-red-400 rounded z-10">
                    <span className="absolute -top-5 left-0 text-red-400 font-mono text-[9px] font-bold bg-red-400/20 px-1 rounded-sm whitespace-nowrap">
                      {ru ? "ТРАНСПОРТ" : "VEHICUL"}
                    </span>
                  </div>
                  <div className="absolute top-3 right-3 w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_8px_red] z-10" style={{ animation: "pulse 1s infinite" }} />
                </>
              )}
              {active === "UNIVIEW" && <div className="absolute top-3 left-3 bg-green-600/90 text-white font-mono text-[10px] font-bold px-2 py-1 rounded-sm z-10">✦ COLOR HUNTER | 0.001 Lux</div>}
              {active === "TIANDY"  && <div className="absolute top-3 left-3 bg-cyan-900/80 text-cyan-300 font-mono text-[10px] font-bold px-2 py-1 rounded-sm z-10">★ SUPER STARLIGHT | 0.0001 Lux</div>}
              {active === "TAPO"   && <div className="absolute top-3 left-3 bg-zinc-800/80 text-zinc-400 font-mono text-[10px] font-bold px-2 py-1 rounded-sm z-10">IR STANDARD | 720P</div>}
              {active === "REOLINK" && <div className="absolute top-[20%] right-[25%] w-14 h-28 border border-blue-400 rounded z-10"><span className="absolute -top-5 left-0 text-blue-300 font-mono text-[9px] whitespace-nowrap">{ru ? "Человек ✓" : "Persoană ✓"}</span></div>}
              {active === "UNIARCH" && <div className="absolute top-3 right-3 text-emerald-400 font-mono text-[10px] font-bold bg-emerald-400/10 border border-emerald-400/30 px-2 py-1 rounded-sm z-10">Ultra265 | -50% HDD</div>}

              <div className="absolute bottom-0 left-0 right-0 bg-black/70 px-3 py-2 flex items-center justify-between z-10">
                <span className="font-mono text-[10px] font-bold" style={{ color: vis.labelColor }}>{vis.label}</span>
                <span className="font-mono text-[10px] text-zinc-400">{active} · CAM 01</span>
              </div>
            </div>

            {/* Risk/benefit insight bar */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium" style={{
              borderColor: vis.riskColor + "40",
              background: vis.riskColor + "10",
              color: vis.riskColor,
            }}>
              <Shield className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{ru ? vis.risk.ru : vis.risk.ro}</span>
            </div>
          </div>

          {/* Product card */}
          <div key={active} className="bg-white rounded-2xl border border-zinc-100 shadow-sm overflow-hidden flex flex-col" style={{ animation: "fadeIn 0.3s ease" }}>
            <div className="relative h-36 bg-zinc-50 overflow-hidden">
              <img src={prod.imageUrl} alt={prod.name} className="w-full h-full object-cover opacity-60" style={{ filter: "blur(1px)" }} />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 bg-white/90 rounded-2xl shadow flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="w-9 h-9 text-zinc-300 fill-none stroke-current stroke-[1.5]">
                    <path d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>
              {(prod.badge || brandBadge) && (
                <span className="absolute top-3 right-3 bg-zinc-900 text-white text-[10px] font-bold px-2.5 py-1 rounded-full">
                  {brandBadge || prod.badge}
                </span>
              )}
            </div>

            <div className="p-5 flex flex-col flex-1">
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">{active}</span>
                  <span className="text-[10px] text-zinc-300">·</span>
                  <span className="text-[10px] text-zinc-500">{ru ? vis.quality.ru : vis.quality.ro}</span>
                </div>
                <div className="flex items-center gap-0.5">
                  {[1,2,3,4,5].map((s) => (
                    <Star key={s} className={`w-2.5 h-2.5 ${s <= Math.floor(stars) ? "text-amber-400 fill-amber-400" : s - 0.5 <= stars ? "text-amber-400 fill-amber-200" : "text-zinc-200 fill-zinc-200"}`} />
                  ))}
                </div>
              </div>
              <h3 className="font-bold text-sm leading-tight text-[#09090B] mb-1.5">{prod.name}</h3>
              <p className="font-mono text-[10px] text-zinc-400 bg-zinc-50 px-2 py-1 rounded-lg mb-2">{prod.specs}</p>
              <p className="text-xs text-zinc-500 italic mb-3 flex-1">"{prod.desc}"</p>

              {/* Urgency badge */}
              <div className="flex items-center gap-1.5 mb-3">
                <Zap className="w-3 h-3 text-[#FF4F00]" />
                <span className="text-[10px] font-bold text-[#FF4F00]">{prod.urgency}</span>
              </div>

              <div className="flex items-end justify-between mb-3">
                <p className="font-mono font-black text-xl text-[#09090B]">{prod.price.toLocaleString()} MDL</p>
              </div>
              <button onClick={handleAdd} data-testid={`comparator-add-${active}`} className="w-full bg-[#FF4F00] text-white font-bold py-3 rounded-xl hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2 text-sm shadow-[0_4px_14px_rgba(255,79,0,0.25)]">
                <ShoppingCart className="w-4 h-4" /> {ru ? "Хочу эту камеру →" : "Vreau această cameră →"}
              </button>
            </div>
          </div>
        </div>
      </div>
      <style>{`@keyframes fadeIn { from { opacity:0; transform:translateY(4px); } to { opacity:1; transform:translateY(0); } }`}</style>
    </section>
  );
}
