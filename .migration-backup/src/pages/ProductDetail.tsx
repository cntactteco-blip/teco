import { useParams, Link } from "wouter";
import { useStore } from "@/lib/store";
import { useCart } from "@/hooks/useCart";
import { ShoppingCart, Check, ChevronLeft, Star, Truck, ShieldCheck, Wrench, Eye, Flame, CircleCheck as CheckCircle2, Phone, ChevronRight, Package, ChevronDown, ThumbsUp, MapPin, MessageCircle } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { useLang } from "@/contexts/LangContext";

// ── Rating data (deterministic, varied per product) ──────────────────
const RATING_DATA = [
  { r: 4.7, n: 23 }, { r: 4.9, n: 89 }, { r: 4.8, n: 34 },
  { r: 4.6, n: 17 }, { r: 4.9, n: 67 }, { r: 4.7, n: 41 },
  { r: 4.8, n: 28 }, { r: 5.0, n: 156 }, { r: 4.7, n: 19 },
  { r: 4.8, n: 73 }, { r: 4.9, n: 44 }, { r: 4.6, n: 11 },
  { r: 4.9, n: 58 }, { r: 4.7, n: 32 }, { r: 4.8, n: 97 },
  { r: 4.9, n: 22 }, { r: 4.7, n: 63 }, { r: 4.8, n: 51 },
];
const ratingFor = (id: number) => RATING_DATA[(id - 1) % RATING_DATA.length];

// ── Fake reviews pool ────────────────────────────────────────────────
const REVIEW_POOL = [
  { name: "Alexandru M.", loc: "Chișinău", r: 5, date: "12 mai 2026", text: "Cameră excelentă! Am instalat-o singur în 30 min, imaginea e super clară zi și noapte. Detecția de persoane funcționează impecabil — primesc notificări instant pe telefon.", helpful: 14 },
  { name: "Elena V.", loc: "Bălți", r: 5, date: "3 mai 2026", text: "Foarte mulțumită de achiziție. Teco.md a livrat a doua zi și tot echipamentul era exact cum am comandat. Calitate excelentă față de preț.", helpful: 8 },
  { name: "Ion C.", loc: "Orhei", r: 4, date: "28 apr 2026", text: "Produs bun, am comandat pentru biroul meu. Instalarea rapidă, aplicația merge excelent, văd camerele de pe telefon de oriunde. Recomand!", helpful: 6 },
  { name: "Natalia P.", loc: "Cahul", r: 5, date: "15 apr 2026", text: "A doua cameră cumpărată de la Teco.md. De fiecare dată — calitate și service excelent. Nu am de ce să cumpăr de altundeva.", helpful: 19 },
  { name: "Andrei L.", loc: "Chișinău", r: 5, date: "8 apr 2026", text: "Imagine super clară, chiar și pe timp de ploaie. Setarea a durat 15 minute cu ajutorul instrucțiunilor video. Sistemul funcționează stabil de 2 luni.", helpful: 11 },
  { name: "Maria T.", loc: "Soroca", r: 4, date: "1 apr 2026", text: "Ușor de configurat. Văd camera de pe telefon oriunde în lume. Soțul a instalat-o fără ajutor suplimentar. Mulțumit de achiziție.", helpful: 5 },
  { name: "Victor B.", loc: "Strășeni", r: 5, date: "20 mar 2026", text: "Am luat kit complet pentru casă. Totul funcționează perfect, imaginile sunt clare și noaptea. Echipa Teco.md a răspuns rapid la întrebări.", helpful: 22 },
  { name: "Alina R.", loc: "Ungheni", r: 5, date: "14 mar 2026", text: "Produs de calitate superioară. IP66 chiar rezistă la ploaie, imaginea nocturnă e impresionantă. Recomand cu încredere tuturor.", helpful: 9 },
  { name: "Dumitru G.", loc: "Chișinău", r: 4, date: "5 mar 2026", text: "Raport calitate-preț excelent. Am monitorizat și gardul casei — camera funcționează fără probleme iarna și vara. Satisfăcut 100%.", helpful: 7 },
];
const reviewsFor = (id: number) =>
  [0, 1, 2].map((i) => REVIEW_POOL[(id + i) % REVIEW_POOL.length]);

// ── Warranty by brand ────────────────────────────────────────────────
const WARRANTY: Record<string, string> = {
  "TP-Link Tapo": "24 luni", "TP-Link VIGI": "24 luni",
  "Reolink": "24 luni", "Uniarch": "24 luni",
  "Uniview": "36 luni", "Tiandy": "24 luni",
  "Ajax Systems": "24 luni", "Teco.md": "12 luni",
};

// ── Badge + brand colors ─────────────────────────────────────────────
const BADGE_COLORS: Record<string, string> = {
  "PROMO": "bg-red-500 text-white", "BEST SELLER": "bg-zinc-900 text-white",
  "COLOR NV": "bg-green-600 text-white", "COLOR 24/7": "bg-green-600 text-white",
  "COLOR HUNTER": "bg-emerald-600 text-white", "4G SOLAR": "bg-blue-600 text-white",
  "4K": "bg-purple-600 text-white", "AI PRO": "bg-orange-600 text-white",
  "AI SMART": "bg-orange-600 text-white", "KIT COMPLET": "bg-zinc-900 text-white",
  "POPULAR": "bg-[#FF4F00] text-white", "DUAL VIEW": "bg-indigo-600 text-white",
  "LOW LIGHT": "bg-teal-600 text-white",
};
const BRAND_COLORS: Record<string, string> = {
  "TP-Link Tapo": "text-green-700 bg-green-50 border-green-200",
  "TP-Link VIGI": "text-blue-700 bg-blue-50 border-blue-200",
  "Uniarch": "text-purple-700 bg-purple-50 border-purple-200",
  "Reolink": "text-red-700 bg-red-50 border-red-200",
  "Tiandy": "text-zinc-700 bg-zinc-100 border-zinc-200",
  "Uniview": "text-teal-700 bg-teal-50 border-teal-200",
  "Teco.md": "text-orange-700 bg-orange-50 border-orange-200",
  "Ajax Systems": "text-zinc-900 bg-zinc-100 border-zinc-300",
};

// ── Avatar initials color ────────────────────────────────────────────
const AVATAR_COLORS = [
  "bg-orange-500", "bg-blue-500", "bg-green-600",
  "bg-purple-500", "bg-rose-500", "bg-teal-500",
];

function useViewerCount(id: number) {
  const [count, setCount] = useState(() => 11 + (id * 7) % 23);
  useEffect(() => {
    const timer = setTimeout(
      () => setCount(c => Math.max(8, c + (Math.random() > 0.5 ? 1 : -1))),
      9000 + Math.random() * 10000
    );
    return () => clearTimeout(timer);
  }, [count]);
  return count;
}

// ── Stars renderer ───────────────────────────────────────────────────
function Stars({ r, size = "sm" }: { r: number; size?: "sm" | "xs" }) {
  const sz = size === "xs" ? "w-3 h-3" : "w-3.5 h-3.5";
  return (
    <span className="flex">
      {[1,2,3,4,5].map(i => (
        <Star key={i} className={`${sz} ${i <= Math.round(r) ? "fill-[#FF4F00] text-[#FF4F00]" : "text-zinc-300"}`} />
      ))}
    </span>
  );
}

// ── FAQ item ─────────────────────────────────────────────────────────
function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <button
      onClick={() => setOpen(o => !o)}
      className="w-full text-left border-b border-zinc-100 py-3.5 flex items-start gap-3 group"
    >
      <span className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${open ? "border-[#FF4F00] bg-[#FF4F00]" : "border-zinc-300 group-hover:border-zinc-400"}`}>
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? "text-white rotate-180" : "text-zinc-500"}`} />
      </span>
      <div className="flex-1">
        <p className="font-semibold text-sm text-[#09090B]">{q}</p>
        {open && <p className="text-sm text-zinc-600 mt-2 leading-relaxed">{a}</p>}
      </div>
    </button>
  );
}

// ── Count-DOWN animation hook (from high → real price) ───────────────
function useCountUp(target: number, from?: number, duration = 950) {
  const startVal = from ?? Math.round(target * 1.32);
  const [val, setVal] = useState(startVal);
  useEffect(() => {
    setVal(startVal);
    const start = Date.now();
    const tick = () => {
      const p = Math.min((Date.now() - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(startVal - (startVal - target) * eased));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, startVal, duration]);
  return val;
}

// ── Confetti burst ────────────────────────────────────────────────────
function spawnConfetti(x: number, y: number) {
  const colors = ['#FF4F00','#FFB800','#10B981','#3B82F6','#8B5CF6','#EC4899','#F59E0B'];
  for (let i = 0; i < 22; i++) {
    const angle = (i / 22) * 360;
    const dist  = 55 + Math.random() * 80;
    const tx    = Math.cos(angle * Math.PI / 180) * dist;
    const ty    = Math.sin(angle * Math.PI / 180) * dist - 30;
    const rot   = (Math.random() - 0.5) * 600;
    const size  = 5 + Math.random() * 7;
    const el    = document.createElement('div');
    el.className = 'confetti-particle';
    el.style.cssText = `left:${x}px;top:${y}px;width:${size}px;height:${size}px;` +
      `background:${colors[i % colors.length]};` +
      `border-radius:${Math.random() > 0.5 ? '50%' : '2px'};` +
      `--tx:${tx}px;--ty:${ty}px;--rot:${rot}deg;`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 950);
  }
}

// ── Scroll reveal hook ────────────────────────────────────────────────
function useScrollReveal() {
  useEffect(() => {
    const els = document.querySelectorAll('.reveal-section');
    const obs = new IntersectionObserver(
      (entries) => entries.forEach(e => { if (e.isIntersecting) { (e.target as HTMLElement).classList.add('visible'); obs.unobserve(e.target); } }),
      { threshold: 0.08 }
    );
    els.forEach(el => obs.observe(el));
    return () => obs.disconnect();
  });
}

// ── Main component ───────────────────────────────────────────────────
export default function ProductDetail() {
  const { t } = useLang();
  const { id } = useParams<{ id: string }>();
  const storeProducts = useStore(s => s.products);
  const adminPhone = useStore(s => s.settings.general.adminPhone);
  const product = storeProducts.find(p => p.id === Number(id));

  const addItem = useCart(s => s.addItem);
  const openCart = useCart(s => s.openCart);
  const { toast } = useToast();

  const [added, setAdded] = useState(false);
  const [qty, setQty] = useState(1);
  const [timeLeft, setTimeLeft] = useState({ h: 3, m: 47, s: 22 });
  const [imgError, setImgError] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const viewers = useViewerCount(Number(id));
  const animatedPrice = useCountUp(product?.price ?? 0, product?.oldPrice ?? undefined);
  const addBtnRef = useRef<HTMLButtonElement>(null);
  useScrollReveal();

  useEffect(() => { window.scrollTo(0, 0); setAdded(false); setQty(1); setActiveImageIndex(0); }, [id]);
  useEffect(() => {
    const iv = setInterval(() => {
      setTimeLeft(p => {
        let { h, m, s } = p; s--;
        if (s < 0) { s = 59; m--; }
        if (m < 0) { m = 59; h--; }
        if (h < 0) return p;
        return { h, m, s };
      });
    }, 1000);
    return () => clearInterval(iv);
  }, [id]);

  if (!product) {
    return (
      <main className="flex-1 flex items-center justify-center min-h-[60vh] bg-white">
        <div className="text-center px-6">
          <p className="text-5xl mb-4">🔍</p>
          <h1 className="text-xl font-bold mb-3 text-[#09090B]">
            {t("pd.breadcrumb_products")}
          </h1>
          <Link href="/produse" className="bg-[#FF4F00] text-white font-bold px-6 py-3 rounded-xl inline-block hover:opacity-90 transition-all">
            {t("pd.breadcrumb_products")}
          </Link>
        </div>
      </main>
    );
  }

  // Image gallery helpers
  const imageList: string[] = (product.images && product.images.length > 0)
    ? product.images
    : (product.imageUrl ? [product.imageUrl] : []);
  const hasGallery = imageList.length > 1;

  const handleAdd = () => {
    for (let i = 0; i < qty; i++) addItem(product as any);
    setAdded(true);
    toast({ title: `✓ ${t("pd.added")}`, description: product.name });
    if (addBtnRef.current) {
      const r = addBtnRef.current.getBoundingClientRect();
      spawnConfetti(r.left + r.width / 2, r.top + r.height / 2);
    }
    setTimeout(() => openCart(), 400);
    setTimeout(() => setAdded(false), 3000);
  };

  const handleWhatsApp = () => {
    const phone = adminPhone?.replace(/\D/g, "") || "37367200463";
    const msg = encodeURIComponent(
      `${t("pd.wa_msg")}\n*${product.name}*\nModel: ${product.model}\nMDL: ${product.price.toLocaleString()}\n${t("pd.wa_qty")}: ${qty}`
    );
    window.open(`https://wa.me/${phone}?text=${msg}`, "_blank");
  };

  const handleInstallWhatsApp = () => {
    const phone = adminPhone?.replace(/\D/g, "") || "37367200463";
    const msg = encodeURIComponent(
      `${t("pd.install_wa_msg")}\n*${product.name}*\n${t("pd.install_wa_detail")}`
    );
    window.open(`https://wa.me/${phone}?text=${msg}`, "_blank");
  };

  const savings = product.oldPrice ? product.oldPrice - product.price : 0;
  const discountPct = product.oldPrice ? Math.round((1 - product.price / product.oldPrice) * 100) : 0;
  const warranty = WARRANTY[product.brand] ?? "24 luni";
  const badgeClass = product.badge ? (BADGE_COLORS[product.badge] ?? "bg-zinc-900 text-white") : "";
  const brandClass = BRAND_COLORS[product.brand] ?? "text-zinc-600 bg-zinc-100 border-zinc-200";
  const specChips = product.specs.split(" | ");
  const { r: rating, n: reviewCount } = ratingFor(product.id);
  const reviews = reviewsFor(product.id);

  const techSpecRows = product.techSpecs
    ? product.techSpecs.split("\n").map(l => l.split(": ")).filter(p => p.length === 2)
    : [];

  const longDescParagraphs = product.longDescription
    ? product.longDescription.split("\n").filter(Boolean)
    : [];

  const similarProducts = storeProducts
    .filter(p => p.id !== product.id && p.category === product.category)
    .slice(0, 4)
    .concat(storeProducts.filter(p => p.id !== product.id && p.category !== product.category))
    .slice(0, 4);

  const stockLeft = 4 + (product.id * 3) % 7;
  const stockPct = Math.round((stockLeft / 15) * 100);

  return (
    <div className="flex-1 w-full bg-[#FAFAFA] pb-[80px] md:pb-0">

      {/* BREADCRUMB */}
      <div className="bg-white border-b border-[#E4E4E7] px-4 py-2.5">
        <nav className="max-w-7xl mx-auto flex items-center gap-1 text-xs text-zinc-400 font-medium">
          <Link href="/" className="hover:text-zinc-700 transition-colors">{t("pd.breadcrumb_home")}</Link>
          <ChevronRight className="w-3 h-3" />
          <Link href="/produse" className="hover:text-zinc-700 transition-colors">{t("pd.breadcrumb_products")}</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-zinc-600 truncate max-w-[160px]">{product.name}</span>
        </nav>
      </div>

      <div className="max-w-7xl mx-auto px-0 md:px-6 md:py-8">
        <div className="md:grid md:grid-cols-12 md:gap-10">

          {/* ── IMAGE ────────────────────────────────────────────── */}
          <div className="md:col-span-6 lg:col-span-7">
            {/* Main image with zoom */}
            <div className="relative bg-zinc-900 md:rounded-2xl overflow-hidden aspect-[4/3] group">
              {!imgError && (imageList[activeImageIndex] || product.imageUrl) ? (
                <img
                  src={imageList[activeImageIndex] || product.imageUrl}
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                  onError={() => setImgError(true)}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-zinc-800">
                  <ShoppingCart className="w-20 h-20 text-zinc-600" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

              <Link href="/produse"
                className="md:hidden absolute top-4 left-4 z-10 w-9 h-9 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center text-white">
                <ChevronLeft className="w-5 h-5" />
              </Link>

              {product.badge && (
                <span className={`absolute top-4 right-4 z-10 text-xs font-black px-3 py-1 rounded-full ${badgeClass}`}>
                  {product.badge}
                </span>
              )}

              {product.badge === "PROMO" && (
                <div className="absolute bottom-0 left-0 right-0 z-10 bg-black/70 backdrop-blur-sm px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-white">
                    <Flame className="w-4 h-4 text-[#FF4F00] animate-pulse" />
                    <span className="text-xs font-semibold">{t("pd.promo_expires")}</span>
                  </div>
                  <span className="font-mono font-black text-[#FF4F00] text-sm tracking-wider">
                    {String(timeLeft.h).padStart(2,"0")}:{String(timeLeft.m).padStart(2,"0")}:{String(timeLeft.s).padStart(2,"0")}
                  </span>
                </div>
              )}

              <div className="absolute top-4 left-1/2 -translate-x-1/2 md:hidden z-10 bg-black/50 backdrop-blur-sm rounded-full px-3 py-1.5 flex items-center gap-1.5 text-white text-xs font-medium">
                <Eye className="w-3.5 h-3.5 text-green-400" />
                <span>{viewers} {t("pd.viewers")}</span>
              </div>
            </div>

            {/* Thumbnails scroll strip */}
            {hasGallery && (
              <div className="mt-3 overflow-x-auto no-scrollbar snap-x snap-mandatory scroll-smooth">
                <div className="flex gap-2 px-0 md:px-0">
                  {imageList.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveImageIndex(i)}
                      className={`relative flex-shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-xl overflow-hidden snap-start border-2 transition-all duration-200 ${
                        i === activeImageIndex ? "border-[#FF4F00] ring-2 ring-[#FF4F00]/20" : "border-transparent hover:border-zinc-300"
                      }`}
                    >
                      <img
                        src={img}
                        alt={`${product.name} ${i + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                        loading="lazy"
                      />
                      {i === activeImageIndex && (
                        <div className="absolute inset-0 bg-[#FF4F00]/10 pointer-events-none" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Desktop trust strip */}
            <div className="hidden md:grid grid-cols-3 gap-3 mt-4">
              {[
                { icon: Truck, color: "text-[#FF4F00]", title: `${t("pd.delivery")} ${t("pd.delivery_sub")}`, sub: "comenzi peste 5.000 MDL" },
                { icon: ShieldCheck, color: "text-[#10B981]", title: `${t("pd.warranty")} ${warranty}`, sub: t("pd.benefit3") },
                { icon: Wrench, color: "text-blue-500", title: t("pd.installation"), sub: t("pd.install_sub") },
              ].map(({ icon: Icon, color, title, sub }) => (
                <div key={title} className="bg-white rounded-xl p-3 border border-[#E4E4E7] flex items-center gap-3">
                  <Icon className={`w-5 h-5 ${color} flex-shrink-0`} />
                  <div><p className="text-xs font-bold text-[#09090B]">{title}</p><p className="text-[10px] text-zinc-500">{sub}</p></div>
                </div>
              ))}
            </div>
          </div>

          {/* ── INFO ─────────────────────────────────────────────── */}
          <div className="md:col-span-6 lg:col-span-5 px-4 md:px-0 pt-4 md:pt-0 flex flex-col gap-0">

            {/* 1. Brand + rating */}
            <div className="flex items-center justify-between mb-3">
              <span className={`text-xs font-bold px-3 py-1 rounded-full border ${brandClass}`}>{product.brand}</span>
              <div className="flex items-center gap-1.5">
                <Stars r={rating} />
                <span className="text-xs text-zinc-500">{rating} <span className="text-zinc-400">({reviewCount})</span></span>
              </div>
            </div>

            {/* 2. Title + model */}
            <h1 className="text-xl md:text-2xl font-black text-[#09090B] leading-tight mb-0.5">{product.name}</h1>
            <p className="text-[11px] font-mono text-zinc-400 mb-3">{product.brand} · {product.model}</p>

            {/* 3. PRICE — prominent + count-up */}
            <div className="mb-1 flex items-baseline gap-3 flex-wrap">
              <span className="font-mono font-black text-[2rem] text-[#09090B] leading-none price-glow">
                {animatedPrice.toLocaleString()}
                <span className="text-base font-bold text-zinc-400 ml-1.5">MDL</span>
              </span>
              {product.oldPrice && (
                <span className="font-mono text-sm text-zinc-400 line-through">{product.oldPrice.toLocaleString()} MDL</span>
              )}
              {savings > 0 && (
                <span className="text-xs font-black text-white bg-[#FF4F00] px-2 py-0.5 rounded-full">-{discountPct}%</span>
              )}
            </div>
            {savings > 0 && (
              <p className="text-xs text-emerald-600 font-semibold mb-3">
                {t("pd.save", { n: savings.toLocaleString() })}
              </p>
            )}
            {!savings && <p className="text-[11px] text-zinc-400 mb-3">{t("pd.no_fees")}</p>}

            {/* 5. Stock urgency */}
            <div className="bg-zinc-50 border border-zinc-100 rounded-xl px-3.5 py-2.5 mb-4">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="flex items-center gap-1.5 text-zinc-600 font-semibold">
                  <Package className="w-3.5 h-3.5 text-[#FF4F00]" /> {t("pd.in_stock")}
                </span>
                <span className="text-[#FF4F00] font-black">{t("pd.only_left", { n: stockLeft })}</span>
              </div>
              <div className="w-full bg-zinc-200 h-1.5 rounded-full overflow-hidden mb-1.5">
                <div className="bg-gradient-to-r from-[#FF4F00] to-orange-400 h-full rounded-full stock-bar-grow" style={{ width: `${stockPct}%` }} />
              </div>
              <p className="text-[10px] text-zinc-500">🔥 {2 + (product.id % 4)} {t("pd.bought_24h")}</p>
            </div>

            {/* 6. Spec chips */}
            <div className="flex flex-wrap gap-1.5 mb-4">
              {specChips.map((chip, i) => (
                <span key={i} className="bg-white text-zinc-600 text-[10px] font-mono font-semibold px-2.5 py-1 rounded-lg border border-zinc-200">
                  {chip}
                </span>
              ))}
            </div>

            {/* 7. Qty + primary CTA */}
            <div className="flex items-center gap-2.5 mb-2.5">
              <div className="flex items-center border border-zinc-200 rounded-xl bg-white select-none flex-shrink-0">
                <button onClick={() => setQty(q => Math.max(1, q - 1))}
                  className="w-10 h-11 flex items-center justify-center text-zinc-500 hover:bg-zinc-50 rounded-l-xl transition-colors text-lg font-bold">−</button>
                <span className="w-7 text-center font-bold text-sm">{qty}</span>
                <button onClick={() => setQty(q => q + 1)}
                  className="w-10 h-11 flex items-center justify-center text-zinc-500 hover:bg-zinc-50 rounded-r-xl transition-colors text-lg font-bold">+</button>
              </div>
              <button ref={addBtnRef} onClick={handleAdd}
                className={`relative overflow-hidden flex-1 h-11 rounded-xl font-bold text-sm transition-all active:scale-95 flex items-center justify-center gap-2 ${
                  added ? "bg-[#10B981] text-white" : "bg-[#FF4F00] text-white hover:opacity-90"
                }`}>
                {!added && <span className="btn-shine-sweep" />}
                {added
                  ? <><Check className="w-4 h-4" /> {t("pd.added")}</>
                  : <><ShoppingCart className="w-4 h-4" /> {t("pd.add_to_cart")}</>
                }
              </button>
            </div>

            {/* 8. WhatsApp secondary CTA */}
            <button onClick={handleWhatsApp}
              className="w-full h-11 rounded-xl font-bold text-sm border border-[#25D366] text-[#25D366] hover:bg-[#25D366] hover:text-white transition-all active:scale-95 flex items-center justify-center gap-2 mb-4">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
              </svg>
              {t("pd.order_wa")}
            </button>

            {/* 9. Trust strip — 3 icons horizontal */}
            <div className="grid grid-cols-3 divide-x divide-zinc-100 border border-zinc-100 rounded-xl overflow-hidden">
              {[
                { icon: Truck, color: "text-[#FF4F00]", label: t("pd.delivery"), sub: t("pd.delivery_sub") },
                { icon: ShieldCheck, color: "text-emerald-500", label: t("pd.warranty"), sub: warranty },
                { icon: Wrench, color: "text-blue-500", label: t("pd.installation"), sub: t("pd.install_sub") },
              ].map(({ icon: Icon, color, label, sub }) => (
                <div key={label} className="flex flex-col items-center text-center gap-1 py-2.5 px-1 bg-zinc-50/50">
                  <Icon className={`w-4 h-4 ${color}`} />
                  <p className="text-[10px] font-bold text-zinc-700 leading-tight">{label}</p>
                  <p className="text-[9px] text-zinc-400 leading-tight">{sub}</p>
                </div>
              ))}
            </div>

            {/* 10. Short description + benefits */}
            {product.description && (
              <div className="mt-4 border-t border-zinc-100 pt-4">
                <p className="text-xs font-bold text-zinc-800 mb-2">{t("pd.why_title")}</p>
                <p className="text-xs text-zinc-600 leading-relaxed mb-2.5">{product.description}</p>
                {[t("pd.benefit1"), t("pd.benefit2"), `${t("pd.warranty")} ${warranty} ${t("pd.benefit3")}`].map((b, i) => (
                  <div key={i} className="flex items-center gap-2 text-[11px] text-zinc-600 mb-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981] flex-shrink-0" />{b}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ══ BELOW THE FOLD ═══════════════════════════════════════════ */}
        <div className="px-4 md:px-0 mt-8 space-y-8">

          {/* Long description */}
          {longDescParagraphs.length > 0 && (
            <section className="reveal-section bg-white rounded-2xl border border-[#E4E4E7] p-5 md:p-7">
              <h2 className="text-lg font-black text-[#09090B] mb-4">{t("pd.desc_title")}</h2>
              <div className="space-y-3">
                {longDescParagraphs.map((p, i) => (
                  <p key={i} className="text-sm text-zinc-600 leading-relaxed">{p}</p>
                ))}
              </div>
            </section>
          )}

          {/* Tech specs table */}
          {techSpecRows.length > 0 && (
            <section className="reveal-section bg-white rounded-2xl border border-[#E4E4E7] overflow-hidden">
              <div className="px-5 py-4 border-b border-[#E4E4E7]">
                <h2 className="text-lg font-black text-[#09090B]">{t("pd.specs_title")}</h2>
              </div>
              <div className="divide-y divide-zinc-50">
                {techSpecRows.map(([key, val], i) => (
                  <div key={i} className={`flex px-5 py-3 ${i % 2 === 0 ? "bg-zinc-50/50" : "bg-white"}`}>
                    <span className="w-2/5 text-xs font-semibold text-zinc-500 flex-shrink-0">{key}</span>
                    <span className="text-xs font-mono font-semibold text-[#09090B]">{val}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Rating summary + Reviews */}
          <section className="reveal-section bg-white rounded-2xl border border-[#E4E4E7] p-5 md:p-7">
            <div className="flex items-center gap-5 mb-6 pb-5 border-b border-zinc-100">
              <div className="text-center">
                <p className="text-5xl font-black text-[#09090B]">{rating}</p>
                <Stars r={rating} />
                <p className="text-xs text-zinc-400 mt-1">{reviewCount} {t("pd.reviews_count")}</p>
              </div>
              <div className="flex-1">
                {[5,4,3,2,1].map(s => {
                  const pct = s === 5 ? 72 : s === 4 ? 20 : s === 3 ? 5 : s === 2 ? 2 : 1;
                  return (
                    <div key={s} className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] w-3 text-zinc-500 font-semibold">{s}</span>
                      <Star className="w-3 h-3 fill-[#FF4F00] text-[#FF4F00]" />
                      <div className="flex-1 bg-zinc-100 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-[#FF4F00] h-full rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-[10px] text-zinc-400 w-6">{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <h3 className="font-bold text-sm text-[#09090B] mb-4">{t("pd.reviews_title")}</h3>
            <div className="space-y-4">
              {reviews.map((rev, i) => (
                <div key={i} className="border border-zinc-100 rounded-xl p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full ${AVATAR_COLORS[(product.id + i) % AVATAR_COLORS.length]} flex items-center justify-center text-white font-black text-sm flex-shrink-0`}>
                        {rev.name[0]}
                      </div>
                      <div>
                        <p className="font-bold text-sm text-[#09090B]">{rev.name}</p>
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3 h-3 text-zinc-400" />
                          <span className="text-[10px] text-zinc-400">{rev.loc}</span>
                          <span className="text-zinc-200">·</span>
                          <span className="text-[10px] text-zinc-400">{rev.date}</span>
                        </div>
                      </div>
                    </div>
                    <Stars r={rev.r} size="xs" />
                  </div>
                  <p className="text-xs text-zinc-600 leading-relaxed mb-2.5">{rev.text}</p>
                  <div className="flex items-center gap-1.5 text-[10px] text-zinc-400">
                    <ThumbsUp className="w-3 h-3" />
                    <span>{rev.helpful} {t("pd.helpful")}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* FAQ */}
          <section className="reveal-section bg-white rounded-2xl border border-[#E4E4E7] p-5 md:p-7">
            <h2 className="text-lg font-black text-[#09090B] mb-2">{t("pd.faq_title")}</h2>
            <p className="text-xs text-zinc-500 mb-4">{t("pd.faq_sub")}</p>
            <FaqItem q={t("pd.faq_q1")} a={t("pd.faq_a1")} />
            <FaqItem q={t("pd.faq_q2")} a={t("pd.faq_a2")} />
            <FaqItem q={t("pd.faq_q3")} a={`${t("pd.faq_a3_pre")} ${warranty} ${t("pd.faq_a3_suf")} ${product.brand}. ${t("pd.faq_a3_end")}`} />
            <FaqItem q={t("pd.faq_q4")} a={t("pd.faq_a4")} />
            <FaqItem q={t("pd.faq_q5")} a={t("pd.faq_a5")} />
          </section>

          {/* Installation CTA */}
          <section className="reveal-section bg-zinc-950 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center gap-5">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Wrench className="w-5 h-5 text-[#FF4F00]" />
                <span className="text-[#FF4F00] text-xs font-bold uppercase tracking-wider">{t("pd.service_label")}</span>
              </div>
              <h3 className="text-xl font-black text-white mb-2">{t("pd.service_title")}</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">{t("pd.service_text")}</p>
              <div className="flex flex-wrap gap-3 mt-3">
                {[t("pd.service_f1"), t("pd.service_f2"), t("pd.service_f3"), t("pd.service_f4")].map(f => (
                  <span key={f} className="flex items-center gap-1.5 text-xs text-zinc-300">
                    <Check className="w-3.5 h-3.5 text-[#10B981]" /> {f}
                  </span>
                ))}
              </div>
            </div>
            <button onClick={handleInstallWhatsApp}
              className="flex-shrink-0 bg-[#FF4F00] text-white font-bold px-6 py-3.5 rounded-xl hover:opacity-90 active:scale-95 transition-all flex items-center gap-2 text-sm whitespace-nowrap">
              <MessageCircle className="w-4 h-4" /> {t("pd.service_cta")}
            </button>
          </section>

          {/* Similar products */}
          {similarProducts.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-black text-[#09090B]">{t("pd.similar")}</h2>
                <Link href="/produse" className="text-xs text-[#FF4F00] font-bold hover:underline">
                  {t("pd.see_all")}
                </Link>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {similarProducts.map(p => (
                  <Link key={p.id} href={`/product/${p.id}`}
                    className="bg-white rounded-xl border border-[#E4E4E7] overflow-hidden hover:shadow-md transition-all group">
                    <div className="relative h-28 bg-zinc-50 overflow-hidden">
                      <img src={p.imageUrl} alt={p.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      {p.badge && (
                        <span className={`absolute top-1.5 left-1.5 text-[9px] font-black px-2 py-0.5 rounded-full ${BADGE_COLORS[p.badge] ?? "bg-zinc-900 text-white"}`}>
                          {p.badge}
                        </span>
                      )}
                    </div>
                    <div className="p-2.5">
                      <p className="text-xs font-bold text-[#09090B] leading-tight line-clamp-2 mb-1">{p.name}</p>
                      <div className="flex items-center gap-1 mb-1">
                        <Stars r={ratingFor(p.id).r} size="xs" />
                        <span className="text-[9px] text-zinc-400">({ratingFor(p.id).n})</span>
                      </div>
                      <p className="font-mono font-black text-sm text-[#FF4F00]">{p.price.toLocaleString()} MDL</p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>

      {/* STICKY BOTTOM BAR (mobile) */}
      <div className="md:hidden fixed bottom-[56px] left-0 right-0 bg-white/95 backdrop-blur-md border-t border-[#E4E4E7] px-4 py-2.5 z-40 flex items-center gap-3 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        <div className="flex-1 min-w-0">
          <p className="text-[10px] text-zinc-500 truncate">{product.name}</p>
          <p className="font-mono font-black text-base text-[#FF4F00]">{product.price.toLocaleString()} MDL</p>
        </div>
        <button onClick={handleWhatsApp}
          className="flex-shrink-0 bg-[#25D366] text-white font-bold px-4 py-2.5 rounded-xl text-sm flex items-center gap-1.5 active:scale-95 transition-all">
          <Phone className="w-4 h-4" /> {t("pd.order_wa")}
        </button>
        <button onClick={handleAdd}
          className={`flex-shrink-0 font-bold px-4 py-2.5 rounded-xl text-sm flex items-center gap-1.5 active:scale-95 transition-all ${
            added ? "bg-[#10B981] text-white" : "bg-[#FF4F00] text-white"
          }`}>
          {added ? <Check className="w-4 h-4" /> : <ShoppingCart className="w-4 h-4" />}
          {added ? t("pd.added") : t("nav.cart")}
        </button>
      </div>
    </div>
  );
}
