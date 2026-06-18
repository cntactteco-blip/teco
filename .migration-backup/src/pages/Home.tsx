import { useState, useEffect, Suspense, lazy } from "react";
import { Link } from "wouter";
import { Camera, Shield, Server, Zap, Truck, Phone, Award, Star, CheckCircle2, ChevronDown } from "lucide-react";
import { ProductCarousel } from "@/components/ProductCarousel";
import { useCart } from "@/hooks/useCart";
import { useToast } from "@/hooks/use-toast";
import { useStore } from "@/lib/store";
import { useLang } from "@/contexts/LangContext";

const SmartCostCalculator = lazy(() => import("@/components/SmartCostCalculator"));
const ColorHunterSlider = lazy(() => import("@/components/ColorHunterSlider"));
const BrandComparator = lazy(() => import("@/components/BrandComparator"));
const TripwireAI = lazy(() => import("@/components/TripwireAI"));

export default function Home() {
  const { t } = useLang();
  const [timeLeft, setTimeLeft] = useState({ h: 23, m: 59, s: 59 });
  const [heroCount, setHeroCount] = useState(0);
  const [heroRating, setHeroRating] = useState("0.0");
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const addItem = useCart((state) => state.addItem);
  const openCart = useCart((state) => state.openCart);
  const { toast } = useToast();
  const heroProductId = useStore((s) => s.settings.hero?.productId ?? 3);
  const storeProducts = useStore((s) => s.products);
  const [heroIndex, setHeroIndex] = useState(0);

  const heroProducts = (() => {
    const all = storeProducts.filter(p => p.inStock !== false);
    const startIdx = all.findIndex(p => p.id === heroProductId);
    const start = startIdx >= 0 ? startIdx : 0;
    const rotated = [...all.slice(start), ...all.slice(0, start)];
    return rotated.slice(0, 6);
  })();
  const heroProduct = heroProducts[heroIndex] ?? storeProducts[0];
  const featuredProduct = heroProduct;

  useEffect(() => {
    const targetDate = new Date();
    targetDate.setHours(targetDate.getHours() + 24);
    const interval = setInterval(() => {
      const now = new Date();
      const diff = targetDate.getTime() - now.getTime();
      if (diff <= 0) { clearInterval(interval); return; }
      setTimeLeft({
        h: Math.floor((diff % (1000*60*60*24)) / (1000*60*60)),
        m: Math.floor((diff % (1000*60*60)) / (1000*60)),
        s: Math.floor((diff % (1000*60)) / 1000),
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (heroProducts.length <= 1) return;
    const timer = setInterval(() => {
      setHeroIndex(i => (i + 1) % heroProducts.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [heroProducts.length]);

  useEffect(() => {
    let frame = 0;
    const total = 55;
    const timer = setInterval(() => {
      frame++;
      const p = frame / total;
      const ease = 1 - Math.pow(1 - p, 3);
      setHeroCount(Math.round(ease * 847));
      setHeroRating((ease * 4.9).toFixed(1));
      if (frame >= total) clearInterval(timer);
    }, 18);
    return () => clearInterval(timer);
  }, []);

  const handleHeroAdd = () => {
    addItem(featuredProduct);
    toast({ title: t("products.added"), description: featuredProduct.name });
    setTimeout(() => openCart(), 500);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: t("home.contact.toast_title"),
      description: t("home.contact.toast_desc"),
    });
    (e.target as HTMLFormElement).reset();
  };

  const tickerItems = t("hero.ticker").split(" • ");

  return (
    <div className="flex-1 w-full bg-white">
      
      {/* ══════════════════════════════════════════════
          HERO — PREMIUM WHITE — MATCHING STORE STYLE
          ══════════════════════════════════════════════ */}
      <section className="relative bg-white overflow-hidden border-b border-zinc-100">

        {/* ── Ticker tape ── */}
        <div className="bg-[#FF4F00] text-white text-[11px] font-semibold py-1.5 overflow-hidden select-none">
          <div className="ticker-track whitespace-nowrap">
            {[1,2].map(n => (
              <span key={n} className="inline-flex items-center gap-6 px-6">
                {tickerItems.map((item, i) => (
                  <span key={i} className="inline-flex items-center gap-6">
                    <span>{item}</span>
                    <span className="opacity-40">•</span>
                  </span>
                ))}
              </span>
            ))}
          </div>
        </div>

        {/* ── Main hero body ── */}
        <div className="max-w-7xl mx-auto px-5 py-10 md:py-16 grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-8 items-center">

          {/* LEFT — copy */}
          <div className="flex flex-col gap-5">

            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2 self-start bg-orange-50 border border-orange-100 rounded-full px-3 py-1 animate-fade-in">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF4F00] animate-pulse" />
              <span className="text-[#FF4F00] text-[11px] font-bold tracking-wide uppercase">{t("hero.badge")}</span>
            </div>

            {/* Headline */}
            <h1 className="font-black leading-[0.9] tracking-tight text-[#09090B]"
                style={{ fontSize: "clamp(2.8rem, 9vw, 5.5rem)" }}>
              <span className="block animate-fade-in" style={{ animationDelay: "0.05s" }}>
                {t("hero.title1")}
              </span>
              <span className="hero-shine block animate-fade-in" style={{ animationDelay: "0.12s" }}>
                {t("hero.title2")}
              </span>
              <span className="block text-zinc-400 font-black animate-fade-in" style={{ animationDelay: "0.19s", fontSize: "clamp(1.1rem, 3.5vw, 2rem)" }}>
                {t("hero.subtitle")}
              </span>
            </h1>

            {/* Stats row */}
            <div className="flex items-center gap-0 animate-fade-in" style={{ animationDelay: "0.28s" }}>
              <div className="flex flex-col pr-5 border-r border-zinc-200">
                <span className="text-[2rem] font-black font-mono text-[#FF4F00] leading-none tabular-nums">{heroCount}+</span>
                <span className="text-[9px] text-zinc-400 uppercase tracking-widest mt-0.5">{t("hero.stat_installs")}</span>
              </div>
              <div className="flex flex-col px-5 border-r border-zinc-200">
                <span className="text-[2rem] font-black font-mono text-[#09090B] leading-none tabular-nums">{heroRating}★</span>
                <span className="text-[9px] text-zinc-400 uppercase tracking-widest mt-0.5">{t("hero.stat_rating")}</span>
              </div>
              <div className="flex flex-col pl-5">
                <span className="text-[2rem] font-black font-mono text-[#FF4F00] leading-none">24h</span>
                <span className="text-[9px] text-zinc-400 uppercase tracking-widest mt-0.5">{t("hero.stat_delivery")}</span>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 animate-fade-in" style={{ animationDelay: "0.36s" }}>
              <Link href="/produse"
                className="hero-btn-glow flex items-center justify-center gap-2 bg-[#FF4F00] text-white px-7 py-4 rounded-2xl font-black text-lg">
                <Zap className="w-5 h-5" />
                {t("hero.cta_buy")}
              </Link>
              <button
                onClick={() => document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" })}
                className="flex items-center justify-center gap-2 border-2 border-zinc-900 text-[#09090B] px-7 py-4 rounded-2xl font-bold text-lg hover:bg-zinc-50 transition-colors active:scale-95">
                <Phone className="w-4 h-4" />
                {t("hero.cta_consult")}
              </button>
            </div>

            {/* Trust pills */}
            <div className="flex flex-wrap gap-x-5 gap-y-2 animate-fade-in" style={{ animationDelay: "0.44s" }}>
              {[t("hero.trust1"), t("hero.trust2"), t("hero.trust3")].map(pill => (
                <span key={pill} className="flex items-center gap-1.5 text-zinc-500 text-xs font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                  {pill}
                </span>
              ))}
            </div>
          </div>

          {/* RIGHT — product showcase */}
          <div className="relative flex items-center justify-center lg:justify-end">

            <div className="absolute w-72 h-72 bg-[#FF4F00] rounded-full blur-[100px] opacity-10 pointer-events-none" />

            <div
              className={`hero-float relative w-full touch-pan-y select-none ${isDragging ? "" : "swipe-hint-anim"}`}
              onTouchStart={(e) => {
                setTouchStartX(e.touches[0].clientX);
                setIsDragging(true);
              }}
              onTouchEnd={(e) => {
                if (touchStartX === null) return;
                const dx = touchStartX - e.changedTouches[0].clientX;
                if (Math.abs(dx) > 40) {
                  setHeroIndex(i =>
                    dx > 0
                      ? (i + 1) % heroProducts.length
                      : (i - 1 + heroProducts.length) % heroProducts.length
                  );
                }
                setTouchStartX(null);
                setIsDragging(false);
              }}
            >
              <Link href={`/product/${heroProduct.id}`} className="block overflow-hidden rounded-3xl">
                <img
                  key={heroProduct.id}
                  src={heroProduct.imageUrl || "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=85&auto=format&fit=crop"}
                  alt={heroProduct.name}
                  className="hero-img-in hero-img-glow w-full object-cover aspect-[3/2] md:aspect-[4/3] cursor-pointer"
                />
              </Link>

              <div className="badge-pop absolute -top-3 -right-3 bg-[#FF4F00] text-white text-[11px] font-black px-3 py-1.5 rounded-xl shadow-lg rotate-[-3deg] whitespace-nowrap pointer-events-none">
                {t("hero.badge_install")}
              </div>

              {heroProducts.length > 1 && (
                <div className="absolute -top-7 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
                  {heroProducts.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setHeroIndex(i)}
                      className={`h-1.5 rounded-full transition-all duration-300 ${i === heroIndex ? "bg-[#FF4F00] w-5" : "bg-zinc-300 w-1.5"}`}
                    />
                  ))}
                </div>
              )}

              {/* Countdown card */}
              <Link href={`/product/${heroProduct.id}`}
                className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-[90%] bg-white/95 backdrop-blur-md border border-zinc-100 rounded-2xl shadow-xl px-4 py-3 flex items-center gap-3 hover:shadow-2xl transition-shadow cursor-pointer">
                <div className="w-9 h-9 bg-orange-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Camera className="w-[18px] h-[18px] text-[#FF4F00]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-red-500 font-bold uppercase tracking-wide animate-pulse">{t("hero.limited_offer")}</p>
                  <p className="text-zinc-900 font-bold text-xs truncate">{heroProduct.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[#FF4F00] font-black text-sm font-mono">{heroProduct.price.toLocaleString()} MDL</span>
                    <div className="flex items-center gap-0.5">
                      {[timeLeft.h, timeLeft.m, timeLeft.s].map((v, i) => (
                        <span key={i} className="flex items-center">
                          <span className="bg-zinc-900 text-white font-mono text-[9px] px-1 py-0.5 rounded">{String(v).padStart(2,"0")}</span>
                          {i < 2 && <span className="text-zinc-400 text-[9px] mx-0.5">:</span>}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <button
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleHeroAdd(); }}
                  className="bg-zinc-900 text-white text-[10px] font-bold px-2.5 py-1.5 rounded-lg hover:bg-zinc-700 active:scale-95 transition-all flex-shrink-0">
                  {t("hero.add")}
                </button>
              </Link>
            </div>

          </div>
        </div>

        {/* Scroll hint */}
        <div className="flex justify-center pb-4 opacity-40">
          <ChevronDown className="w-5 h-5 text-zinc-400 animate-bounce" />
        </div>

      </section>

      <Suspense fallback={null}>
        <SmartCostCalculator />
      </Suspense>

      {/* 5. TRUST STRIP */}
      <section className="bg-white border-y border-zinc-100 py-5 md:py-10">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="grid grid-cols-4 divide-x divide-zinc-100">
            {[
              { num: "847+", label: t("home.trust.installs") },
              { num: "4.9★", label: t("home.trust.rating") },
              { num: "24h",  label: t("home.trust.delivery") },
              { num: "5 ani", label: t("home.trust.warranty") },
            ].map(({ num, label }) => (
              <div key={label} className="flex flex-col items-center py-2 md:py-4 gap-1">
                <span className="text-[#FF4F00] font-black text-xl md:text-4xl leading-none tracking-tight">{num}</span>
                <span className="text-zinc-400 text-[10px] md:text-sm uppercase tracking-widest">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. CATEGORIES */}
      <section className="bg-white py-8 md:py-20 overflow-hidden border-b border-zinc-100">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="flex items-end justify-between mb-6 md:mb-10">
            <div>
              <p className="text-[#FF4F00] text-xs font-bold uppercase tracking-[0.2em] mb-1">{t("home.cat.label")}</p>
              <h2 className="text-2xl md:text-4xl font-black text-zinc-950 tracking-tight leading-tight">{t("home.cat.title")}</h2>
            </div>
            <Link href="/produse" className="text-zinc-400 text-sm hover:text-zinc-900 transition-colors flex items-center gap-1">
              {t("home.cat.see_all")} <span className="text-[#FF4F00]">→</span>
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto no-scrollbar snap-x md:grid md:grid-cols-4 md:gap-5 pb-2">
            {[
              { icon: Camera, label: t("home.cat.ip"),         count: "124", img: "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=500&q=80&auto=format&fit=crop" },
              { icon: Server, label: t("home.cat.nvr"),        count: "45",  img: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500&q=80&auto=format&fit=crop" },
              { icon: Shield, label: t("home.cat.alarm"),      count: "32",  img: "https://images.unsplash.com/photo-1558002038-1055907df827?w=500&q=80&auto=format&fit=crop" },
              { icon: Zap,    label: t("home.cat.accessories"), count: "218", img: "https://images.unsplash.com/photo-1620714223084-8fcacc2dfd4d?w=500&q=80&auto=format&fit=crop" },
            ].map(({ icon: Icon, label, count, img }) => (
              <Link key={label} href="/produse"
                className="group relative snap-start min-w-[200px] md:min-w-0 h-[240px] md:h-[300px] rounded-2xl overflow-hidden cursor-pointer flex-shrink-0 block shadow-sm hover:shadow-xl transition-shadow duration-300">
                <img src={img} alt={label} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/90 via-zinc-900/40 to-transparent" />
                <div className="absolute inset-0 bg-[#FF4F00]/0 group-hover:bg-[#FF4F00]/8 transition-all duration-300" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <div className="w-8 h-8 bg-white/15 backdrop-blur-sm border border-white/20 rounded-lg flex items-center justify-center mb-2">
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="text-white font-black text-lg leading-tight">{label}</h3>
                  <p className="text-white/60 text-xs mt-0.5 group-hover:text-[#FF4F00] transition-colors">{count} {t("home.cat.products")} →</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <Suspense fallback={null}>
        <ColorHunterSlider />
      </Suspense>

      {/* 7. CAROUSELS SECTION */}
      <section id="produse" className="py-8 md:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 md:px-6 mb-5 md:mb-10">
          <p className="text-[#FF4F00] text-xs font-bold uppercase tracking-[0.2em] mb-1">{t("home.products.label")}</p>
          <div className="flex items-end justify-between">
            <h2 className="text-2xl md:text-4xl font-black text-zinc-950 tracking-tight leading-tight">{t("home.products.title")}</h2>
            <Link href="/produse" className="text-zinc-400 text-sm hover:text-zinc-900 transition-colors flex items-center gap-1">
              {t("home.products.see_all")} <span className="text-[#FF4F00]">→</span>
            </Link>
          </div>
        </div>
        <ProductCarousel
          title=""
          subtitle=""
          products={storeProducts.slice(0, 8)}
        />
        
        <div className="max-w-7xl mx-auto px-4 md:px-6 mt-8 md:mt-16 mb-5 md:mb-10">
          <p className="text-[#FF4F00] text-xs font-bold uppercase tracking-[0.2em] mb-1">{t("home.kits.label")}</p>
          <h2 className="text-2xl md:text-4xl font-black text-zinc-950 tracking-tight leading-tight">{t("home.kits.title")}</h2>
        </div>
        <ProductCarousel
          title=""
          subtitle=""
          products={storeProducts.filter(p => p.category === "kituri" || p.category === "alarme").slice(0, 6)}
        />
      </section>

      {/* 8. DE CE TECO? */}
      <section className="bg-white py-10 md:py-20 relative overflow-hidden border-t border-zinc-100">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="mb-10 md:mb-14">
            <p className="text-[#FF4F00] text-xs font-bold uppercase tracking-[0.2em] mb-2">{t("home.why.label")}</p>
            <h2 className="text-3xl md:text-5xl font-black text-zinc-950 tracking-tight leading-tight max-w-lg">
              {t("home.why.title1")}<br/>
              <span className="text-[#FF4F00]">{t("home.why.title2")}</span>
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { num: "01", icon: Truck, titleKey: "home.why.01.title" as const, descKey: "home.why.01.desc" as const },
              { num: "02", icon: Award, titleKey: "home.why.02.title" as const, descKey: "home.why.02.desc" as const },
              { num: "03", icon: Shield, titleKey: "home.why.03.title" as const, descKey: "home.why.03.desc" as const },
            ].map(({ num, icon: Icon, titleKey, descKey }) => (
              <div key={num} className="relative bg-[#FAFAFA] border border-zinc-100 rounded-2xl p-6 md:p-8 flex flex-col gap-4 group hover:shadow-lg hover:border-orange-100 hover:bg-orange-50/30 transition-all duration-300 overflow-hidden">
                <span className="absolute top-4 right-5 text-zinc-200 font-black select-none pointer-events-none" style={{ fontSize: "clamp(3.5rem, 8vw, 5rem)", lineHeight: 1 }}>{num}</span>
                <div className="w-12 h-12 border border-orange-200 rounded-2xl flex items-center justify-center bg-orange-50 group-hover:bg-[#FF4F00] group-hover:border-[#FF4F00] transition-all duration-300">
                  <Icon className="w-5 h-5 text-[#FF4F00] group-hover:text-white transition-colors duration-300" />
                </div>
                <div>
                  <h3 className="text-zinc-950 font-black text-xl mb-2 leading-tight">{t(titleKey)}</h3>
                  <p className="text-zinc-500 text-sm leading-relaxed">{t(descKey)}</p>
                </div>
                <div className="w-8 h-0.5 bg-[#FF4F00] group-hover:w-20 transition-all duration-500 mt-auto" />
              </div>
            ))}
          </div>
        </div>
      </section>

      <Suspense fallback={null}>
        <BrandComparator />
      </Suspense>

      <Suspense fallback={null}>
        <TripwireAI />
      </Suspense>

      {/* 9. LEAD FORM SECTION */}
      <section id="contact" className="py-20 bg-zinc-950 text-white relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_50%_0%,_rgba(255,79,0,0.15)_0%,_transparent_70%),_#09090B] -z-10"></div>
        <div className="max-w-7xl mx-auto px-6 text-center relative z-10">
          <h2 className="text-3xl md:text-5xl font-black mb-4 tracking-tight">{t("home.contact.title")}</h2>
          <p className="text-sm md:text-xl text-zinc-400 max-w-2xl mx-auto mb-10">{t("home.contact.sub")}</p>
          
          <form onSubmit={handleFormSubmit} className="max-w-4xl mx-auto bg-zinc-900/50 backdrop-blur-md border border-zinc-800 p-6 md:p-8 rounded-2xl flex flex-col md:flex-row gap-4">
            <input
              type="text"
              placeholder={t("home.contact.name")}
              required
              className="w-full md:flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3.5 text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#FF4F00] focus:ring-1 focus:ring-[#FF4F00] transition-all"
            />
            <input
              type="tel"
              placeholder={t("home.contact.phone")}
              required
              className="w-full md:flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3.5 text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#FF4F00] focus:ring-1 focus:ring-[#FF4F00] transition-all"
            />
            <select className="w-full md:flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3.5 text-zinc-400 focus:outline-none focus:border-[#FF4F00] focus:ring-1 focus:ring-[#FF4F00] transition-all appearance-none cursor-pointer">
              <option value="" disabled>{t("home.contact.interest")}</option>
              <option value="casa">{t("home.contact.home")}</option>
              <option value="afacere">{t("home.contact.business")}</option>
              <option value="altceva">{t("home.contact.other")}</option>
            </select>
            <button type="submit" className="w-full md:w-auto bg-[#FF4F00] text-white font-bold px-8 py-3.5 rounded-xl hover:bg-orange-600 active:scale-95 transition-all whitespace-nowrap">
              {t("home.contact.btn")}
            </button>
          </form>
        </div>
      </section>

    </div>
  );
}
