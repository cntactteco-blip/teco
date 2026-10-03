import { useState, useEffect, Suspense, lazy } from "react";
import { Link } from "wouter";
import { Camera, Shield, Server, Zap, Truck, Phone, Award, Star, CheckCircle2, ChevronDown, Wrench, Settings2, ClipboardList, Cctv, Search } from "lucide-react";
import { ProductCarousel } from "@/components/ProductCarousel";
import { AppointmentBooker } from "@/components/AppointmentBooker";
import BundleBuilder from "@/components/BundleBuilder";
import { useCart } from "@/hooks/useCart";
import { useToast } from "@/hooks/use-toast";
import { useStore, storeActions } from "@/lib/store";
import { useLang } from "@/contexts/LangContext";
import { SEO, schemas } from "@/components/SEO";

function HomeFAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-zinc-200 rounded-2xl overflow-hidden bg-white">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-zinc-50 transition-colors"
        aria-expanded={open}
      >
        <span className="font-semibold text-[#09090B] text-sm leading-snug">{q}</span>
        <ChevronDown className={`w-4 h-4 text-zinc-400 flex-shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="px-5 pb-4 pt-3 text-zinc-600 text-sm leading-relaxed border-t border-zinc-100">
          {a}
        </div>
      )}
    </div>
  );
}

const SmartCostCalculator = lazy(() => import("@/components/SmartCostCalculator"));
const ColorHunterSlider = lazy(() => import("@/components/ColorHunterSlider"));
const BrandComparator = lazy(() => import("@/components/BrandComparator"));
const TripwireAI = lazy(() => import("@/components/TripwireAI"));
const GalerieInstalari = lazy(() => import("@/components/GalerieInstalari"));

export default function Home() {
  const { t, lang } = useLang();
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const addItem = useCart((state) => state.addItem);
  const openCart = useCart((state) => state.openCart);
  const { toast } = useToast();
  const heroProductId = useStore((s) => s.settings.hero?.productId ?? 3);
  const heroProductIdsStore = useStore((s) => s.settings.hero?.heroProducts ?? []);
  const heroProductIds = (() => {
    if (heroProductIdsStore.length > 0) {
      try { localStorage.setItem("teco_hero_ids", JSON.stringify(heroProductIdsStore)); } catch {}
      return heroProductIdsStore;
    }
    try {
      const cached = JSON.parse(localStorage.getItem("teco_hero_ids") || "[]");
      if (Array.isArray(cached) && cached.length > 0) return cached as number[];
    } catch {}
    return [116];
  })();
  const storeProducts = useStore((s) => s.products);
  const hasOffers = storeProducts.some((product) => product.inStock !== false && !!product.oldPrice && product.oldPrice > product.price);
  const categories = useStore((s) => s.settings.categories);
  const loaded = useStore((s) => s.loaded);
  const [heroIndex, setHeroIndex] = useState(0);

  const heroProducts = (() => {
    const all = storeProducts.filter(p => p.inStock !== false);
    if (all.length === 0) return [];
    const ids = heroProductIds.length > 0 ? heroProductIds : null;
    if (ids) {
      const result = ids.map(id => all.find(p => p.id === id)).filter(Boolean) as typeof all;
      if (result.length > 0) {
        try { localStorage.setItem("teco_hero_ids", JSON.stringify(ids)); } catch {}
        return result;
      }
    }
    try {
      const cached = JSON.parse(localStorage.getItem("teco_hero_ids") || "[]");
      if (cached.length > 0) {
        const result = cached.map((id: number) => all.find(p => p.id === id)).filter(Boolean) as typeof all;
        if (result.length > 0) return result;
      }
    } catch {}
    const startIdx = all.findIndex(p => p.id === heroProductId);
    const start = startIdx >= 0 ? startIdx : 0;
    const rotated = [...all.slice(start), ...all.slice(0, start)];
    return rotated.slice(0, 6);
  })();
  const FALLBACK_HERO = { id: 116, name: "Set camere de supraveghere 8buc 4MP", brand: "TIANDY", price: 18699, imageUrl: "/product-images/116.jpg", category: "kituri", inStock: true, specs: "", badge: null, oldPrice: null };
  // Salvam produsele hero in localStorage pentru next visit
  if (loaded && heroProducts.length > 0) {
    try { localStorage.setItem("teco_hero_products", JSON.stringify(heroProducts)); } catch {}
  }
  const cachedHeroProducts = (() => {
    try {
      const c = JSON.parse(localStorage.getItem("teco_hero_products") || "[]");
      return Array.isArray(c) && c.length > 0 ? c : null;
    } catch { return null; }
  })();
  const heroProduct = !loaded ? (FALLBACK_HERO as any) : (heroProducts[heroIndex] ?? (cachedHeroProducts?.[heroIndex]) ?? storeProducts.find(p => p.id === 116) ?? (FALLBACK_HERO as any));
  const featuredProduct = heroProduct;

  useEffect(() => {
    if (heroProducts.length <= 1) return;
    const timer = setInterval(() => {
      setHeroIndex(i => (i + 1) % heroProducts.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [heroProducts.length]);

  const handleHeroAdd = () => {
    addItem(featuredProduct);
    toast({ title: t("products.added"), description: featuredProduct.name });
    setTimeout(() => openCart(), 500);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const data = new FormData(form);
    const name = String(data.get("name") || "");
    const phone = String(data.get("phone") || "");
    const interest = String(data.get("interest") || "");
    if (!phone.trim() || !/^[\d\s\+\-\(\)]{7,15}$/.test(phone.trim())) {
      toast({ title: "Telefon invalid", description: "Introduceți un număr de telefon valid.", variant: "destructive" });
      return;
    }
    storeActions.addLead({ name, phone, source: "Homepage Contact", notes: interest ? `Interes: ${interest}` : undefined });
    import("@/lib/notify").then(({ notifyLead }) =>
      notifyLead({ name, phone, source: "Homepage Contact", notes: interest ? `Interes: ${interest}` : undefined })
    );
    toast({
      title: t("home.contact.toast_title"),
      description: t("home.contact.toast_desc"),
    });
    form.reset();
  };

  const tickerItems = t("hero.ticker").split(" • ").filter((item) => !/4[.,]9\s*(din\s*5|из\s*5)/i.test(item));

  const HOME_FAQ_RO = [
    { q: "Câte camere de supraveghere am nevoie pentru o casă?", a: "Pentru o casă standard (3–4 camere) recomandăm: 1 cameră la intrarea principală, 1 la garaj sau parcare, 1–2 pe perimetrul exterior. Numărul exact depinde de suprafață și punctele critice. Consultanța noastră gratuită identifică exact ce ai nevoie." },
    { q: "Ce este mai bine — camere WiFi sau cablate (PoE)?", a: "Camerele WiFi sunt mai ușor de instalat și perfecte pentru case mici sau apartamente. Camerele PoE (cablate) sunt mai stabile, mai sigure și recomandate pentru afaceri sau case mari. Teco.md instalează ambele tipuri — te sfătuim în funcție de nevoile tale." },
    { q: "Pot vedea camerele de pe telefon, de oriunde?", a: "Da, toate sistemele Teco.md includ acces remote gratuit prin aplicație mobilă (iOS și Android). Poți vedea live, vizualiza înregistrările și primi notificări de mișcare oriunde te-ai afla, cu o conexiune la internet." },
    { q: "Livrați sisteme de supraveghere în toată Moldova?", a: "Da, livrăm produse oriunde în Moldova prin curier sau transport propriu. Livrarea este gratuită la comenzi peste 5.000 MDL. Oferim și instalare profesională cu programare confirmată pentru localitatea ta." },
    { q: "Ce garanție au produsele de supraveghere?", a: "Produsele Teco.md au garanție conformă condițiilor producătorului și produsului. Brandurile Dahua, Hikvision, TP-Link Tapo și Reolink sunt renumite pentru fiabilitate. Pe lucrările de instalare oferim garanție separată de 12 luni." },
    { q: "Aveți sisteme complete gata de instalat — kituri?", a: "Da, oferim kituri complete de supraveghere care includ camerele, NVR-ul, cablul și accesoriile necesare. Kiturile sunt configurate plug-and-play și vin cu suport tehnic gratuit. Le găsești în secțiunea Kituri Complete din catalog." },
  ];
  const HOME_FAQ_RU = [
    { q: "Сколько камер видеонаблюдения нужно для дома?", a: "Для стандартного дома (3–4 камеры) рекомендуем: 1 камеру на главный вход, 1 на гараж или парковку, 1–2 по периметру. Точное количество зависит от площади и критических точек. Наша бесплатная консультация подберет оптимальное решение." },
    { q: "Что лучше — WiFi или кабельные (PoE) камеры?", a: "WiFi камеры проще установить — идеальны для небольших домов и квартир. PoE камеры (кабельные) стабильнее, надежнее и рекомендуются для бизнеса или больших домов. Teco.md устанавливает оба типа — посоветуем лучший вариант для вас." },
    { q: "Можно ли смотреть камеры с телефона откуда угодно?", a: "Да, все системы Teco.md включают бесплатный удалённый доступ через мобильное приложение (iOS и Android). Можно смотреть прямой эфир, просматривать записи и получать уведомления о движении из любой точки мира." },
    { q: "Доставляете системы видеонаблюдения по всей Молдове?", a: "Да, доставляем товары по всей Молдове курьером или собственным транспортом. Бесплатная доставка при заказе от 5000 MDL. Также предлагаем профессиональную установку за 24 часа в любом городе страны." },
    { q: "Какая гарантия на оборудование?", a: "Гарантия зависит от конкретного товара и условий производителя. Бренды Dahua, Hikvision, TP-Link Tapo и Reolink известны надёжностью. На монтажные работы предоставляем отдельную гарантию 12 месяцев." },
    { q: "Есть ли комплекты видеонаблюдения под ключ?", a: "Да, предлагаем комплекты видеонаблюдения, включающие камеры, NVR, кабель и необходимые аксессуары. Комплекты настроены plug-and-play и поставляются с бесплатной технической поддержкой. Найдите их в разделе «Kituri Complete»." },
  ];
  const homeFaqLd = schemas.faq(HOME_FAQ_RO.map((x) => ({ question: x.q, answer: x.a })));
  const jsonLd = [schemas.website("ro"), schemas.localBusiness("ro"), schemas.organization(), homeFaqLd];

  return (
    <>
      <SEO lang="ro" jsonLd={jsonLd} />
      <main className="flex-1 w-full bg-white" role="main" aria-label="Pagina principală Teco.md">
      
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
          <div className="flex flex-col gap-5 order-1 lg:order-none lg:col-start-1 lg:row-start-1">

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

          </div>

          {/* RIGHT — seturi dinamice apar aici pe mobil (order-2) */}

          <div className="flex flex-col gap-5 order-3 lg:order-none lg:col-start-1 lg:row-start-2">

            {/* Stats row */}
            <div className="grid grid-cols-3 items-start animate-fade-in" style={{ animationDelay: "0.28s" }}>
              <div className="flex min-w-0 flex-col pr-2 sm:pr-5 border-r border-zinc-200">
                <span className="text-[2rem] font-black font-mono text-[#FF4F00] leading-none tabular-nums">5.0★</span>
                <span className="text-[9px] text-zinc-400 uppercase tracking-widest mt-0.5">Google · {lang === "ro" ? "4 recenzii" : "4 отзыва"}</span>
              </div>
              <div className="flex min-w-0 flex-col px-2 sm:px-5 border-r border-zinc-200">
                <span className="text-[clamp(1.1rem,4vw,1.65rem)] font-black font-mono text-[#09090B] leading-none">{lang === "ro" ? "În Moldova" : "По Молдове"}</span>
                <span className="text-[9px] text-zinc-400 uppercase tracking-widest mt-0.5">{lang === "ro" ? "montaj la cerere" : "монтаж по запросу"}</span>
              </div>
              <div className="flex min-w-0 flex-col pl-2 sm:pl-5">
                <span className="text-[clamp(1.05rem,4.5vw,2rem)] font-black font-mono text-[#FF4F00] leading-none">{lang === "ro" ? "Livrare" : "Доставка"}</span>
                <span className="text-[9px] text-zinc-400 uppercase tracking-widest mt-0.5">{lang === "ro" ? "în Moldova" : "по Молдове"}</span>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 animate-fade-in" style={{ animationDelay: "0.36s" }}>
              <Link href={hasOffers ? "/produse?oferte=1" : "/produse"}
                className="hero-btn-glow flex items-center justify-center gap-2 bg-[#FF4F00] text-white px-7 py-4 rounded-2xl font-black text-lg">
                <Zap className="w-5 h-5" />
                {hasOffers
                  ? t("hero.cta_buy")
                  : (lang === "ro" ? "Vezi produsele" : "Смотреть товары")}
              </Link>
              <button
                onClick={() => document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" })}
                className="flex items-center justify-center gap-2 border-2 border-zinc-900 text-[#09090B] px-7 py-4 rounded-2xl font-bold text-lg hover:bg-zinc-50 transition-colors active:scale-95">
                <Phone className="w-4 h-4" />
                {t("hero.cta_consult")}
              </button>
            </div>

          </div>

          {/* RIGHT — product showcase (seturi dinamice) */}
          <div className="relative flex items-center justify-center lg:justify-end order-2 lg:order-none lg:col-start-2 lg:row-start-1 lg:row-span-2">

            <div className="absolute w-72 h-72 bg-[#FF4F00] rounded-full blur-[100px] opacity-10 pointer-events-none" />

            {!heroProduct ? (
              <div className="hero-float relative w-full aspect-[3/2] md:aspect-[4/3] rounded-3xl bg-zinc-100 animate-pulse" />
            ) : (
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
              <Link href={`/product/${heroProduct.slug || heroProduct.id}`} className="block overflow-hidden rounded-3xl">
                <img
                  key={heroProduct.id}
                  src={heroProduct.imageUrl || "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=85&auto=format&fit=crop"}
                  alt={heroProduct.name}
                  className="hero-img-in hero-img-glow w-full object-cover aspect-[3/2] md:aspect-[4/3] cursor-pointer"
                  fetchPriority="high"
                  loading="eager"
                />
              </Link>

              <div className="badge-pop absolute -top-3 -right-3 bg-[#FF4F00] text-white text-[11px] font-black px-3 py-1.5 rounded-xl shadow-lg rotate-[-3deg] whitespace-nowrap pointer-events-none">
                {lang === "ro" ? "Montaj disponibil la solicitare" : "Установка по запросу"}
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
              <Link href={`/product/${heroProduct.slug || heroProduct.id}`}
                className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-[90%] bg-white/95 backdrop-blur-md border border-zinc-100 rounded-2xl shadow-xl px-4 py-3 flex items-center gap-3 hover:shadow-2xl transition-shadow cursor-pointer">
                <div className="w-9 h-9 bg-orange-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Camera className="w-[18px] h-[18px] text-[#FF4F00]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wide">{lang === "ro" ? "Produs recomandat" : "Рекомендуемый товар"}</p>
                  <p className="text-zinc-900 font-bold text-xs truncate">{heroProduct.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[#FF4F00] font-black text-sm font-mono">{heroProduct.price.toLocaleString()} MDL</span>
                  </div>
                </div>
                <button
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleHeroAdd(); }}
                  className="bg-zinc-900 text-white text-[10px] font-bold px-2.5 py-1.5 rounded-lg hover:bg-zinc-700 active:scale-95 transition-all flex-shrink-0">
                  {t("hero.add")}
                </button>
              </Link>
            </div>
            )}

          </div>
        </div>

        {/* Scroll hint */}
        <div className="flex justify-center pb-4 opacity-40">
          <ChevronDown className="w-5 h-5 text-zinc-400 animate-bounce" />
        </div>

      </section>

      {/* 5. QUICK SHOP — categories first, services second */}
      <section className="bg-white border-y border-zinc-100 py-7 md:py-10">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl md:text-2xl font-black text-zinc-950 tracking-tight">
              {lang === "ro" ? "Categorii populare" : "Популярные категории"}
            </h2>
            <Link href="/produse" className="text-[#FF4F00] text-xs md:text-sm font-bold">
              {lang === "ro" ? "Vezi toate →" : "Смотреть все →"}
            </Link>
          </div>

          <div className="md:hidden flex overflow-x-auto no-scrollbar snap-x snap-mandatory -mx-4">
            {Array.from({ length: Math.ceil(categories.filter((cat) => storeProducts.some((product) => product.category === cat.slug && product.inStock !== false)).length / 4) }).map((_, pageIndex) => {
              const visibleCategories = categories
                .filter((cat) => storeProducts.some((product) => product.category === cat.slug && product.inStock !== false))
                .slice(pageIndex * 4, pageIndex * 4 + 4);
              return (
                <div key={pageIndex} className="snap-start shrink-0 w-full px-4 grid grid-cols-2 gap-3">
                  {visibleCategories.map((cat) => {
                    const catProducts = storeProducts.filter((p) => p.category === cat.slug && p.inStock !== false);
                    const catImg = cat.image || catProducts[0]?.imageUrl;
                    return (
                      <Link key={cat.id} href={`/produse?cat=${cat.slug}`}
                        className="group min-h-[150px] rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm overflow-hidden">
                        <div className="h-20 flex items-center justify-center mb-2">
                          {catImg ? (
                            <img src={catImg} alt={cat.label} loading="lazy" className="max-h-full max-w-full object-contain" />
                          ) : (
                            <Camera className="w-10 h-10 text-[#FF4F00]" />
                          )}
                        </div>
                        <div className="flex items-end justify-between gap-2">
                          <span className="font-black text-sm leading-tight text-zinc-950">
                            {lang === "ro" ? cat.label : (cat.labelRu || cat.label)}
                          </span>
                          <span className="text-[#FF4F00] font-black text-lg">→</span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              );
            })}
          </div>

          <div className="hidden md:grid md:grid-cols-4 gap-3">
            {categories
              .filter((cat) => storeProducts.some((product) => product.category === cat.slug && product.inStock !== false))
              .map((cat) => {
                const catProducts = storeProducts.filter((p) => p.category === cat.slug && p.inStock !== false);
                const catImg = cat.image || catProducts[0]?.imageUrl;
                return (
                  <Link key={cat.id} href={`/produse?cat=${cat.slug}`}
                    className="group min-h-[150px] rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm hover:shadow-md hover:border-orange-200 transition-all overflow-hidden">
                    <div className="h-24 flex items-center justify-center mb-2">
                      {catImg ? (
                        <img src={catImg} alt={cat.label} loading="lazy" className="max-h-full max-w-full object-contain transition-transform duration-300 group-hover:scale-105" />
                      ) : (
                        <Camera className="w-10 h-10 text-[#FF4F00]" />
                      )}
                    </div>
                    <div className="flex items-end justify-between gap-2">
                      <span className="font-black text-base leading-tight text-zinc-950">
                        {lang === "ro" ? cat.label : (cat.labelRu || cat.label)}
                      </span>
                      <span className="text-[#FF4F00] font-black text-lg">→</span>
                    </div>
                  </Link>
                );
              })}
          </div>

          <div className="flex items-center justify-between mt-8 mb-4">
            <h2 className="text-xl md:text-2xl font-black text-zinc-950 tracking-tight">
              {lang === "ro" ? "Serviciile noastre" : "Наши услуги"}
            </h2>
            <Link href="/servicii" className="text-[#FF4F00] text-xs md:text-sm font-bold">
              {lang === "ro" ? "Vezi toate →" : "Смотреть все →"}
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { href: "/montare-camere-supraveghere/", Icon: Cctv, ro: "Instalare profesională", ru: "Профессиональный монтаж" },
              { href: "/oferta/", Icon: Settings2, ro: "Configurare sisteme", ru: "Настройка систем" },
              { href: "/reparatii-camere-supraveghere/", Icon: Search, ro: "Diagnosticare și reparații", ru: "Диагностика и ремонт" },
              { href: "/servicii/", Icon: Shield, ro: "Mentenanță și suport", ru: "Обслуживание и поддержка" },
            ].map(({ href, Icon, ro, ru }) => (
              <Link key={href + ro} href={href}
                className="group min-h-[116px] rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm hover:shadow-md hover:border-orange-200 transition-all flex flex-col justify-between">
                <span className="w-12 h-12 rounded-xl bg-[#FFF6EE] flex items-center justify-center">
                  <Icon className="w-6 h-6 text-[#FF4F00]" strokeWidth={2.5} />
                </span>
                <div className="flex items-end justify-between gap-2 mt-3">
                  <span className="font-black text-sm md:text-base leading-tight text-zinc-950">{lang === "ro" ? ro : ru}</span>
                  <span className="text-[#FF4F00] font-black text-lg">→</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 5b. CALCULATOR */}
      <Suspense fallback={null}>
        <SmartCostCalculator />
      </Suspense>

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
            {categories.filter((cat) => storeProducts.some((product) => product.category === cat.slug && product.inStock !== false)).map((cat) => {
              const catProducts = storeProducts.filter((p) => p.category === cat.slug);
              const count = catProducts.length;
              const productImg = catProducts[0]?.imageUrl;
              const catImg = cat.image || productImg || "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=500&q=80&auto=format&fit=crop";
              return (
                <Link key={cat.id} href={`/produse?cat=${cat.slug}`}
                  className="group relative snap-start min-w-[200px] md:min-w-0 h-[240px] md:h-[300px] rounded-2xl overflow-hidden cursor-pointer flex-shrink-0 block shadow-sm hover:shadow-xl transition-shadow duration-300">
                  <img src={catImg} alt={cat.label} loading="lazy" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4 flex flex-col gap-1">
                    <h3 className="text-white font-black text-lg leading-tight tracking-tight">{lang === "ro" ? cat.label : (cat.labelRu || cat.label)}</h3>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-[#FF4F00]">{count} {t("home.cat.products")}</span>
                      <span className="text-[#FF4F00] text-xs">→</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Programare instalare */}
      <section className="py-8 md:py-12 bg-[#FAFAFA]">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <AppointmentBooker />
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

      <Suspense fallback={null}>
        <GalerieInstalari />
      </Suspense>

      {/* FAQ SECTION */}
      <section className="py-16 bg-white border-t border-zinc-100" aria-label={lang === "ro" ? "Întrebări frecvente" : "Часто задаваемые вопросы"}>
        <div className="max-w-4xl mx-auto px-4 md:px-6">
          <div className="text-center mb-10">
            <div className="text-xs font-black uppercase tracking-widest text-[#FF4F00] mb-2">FAQ</div>
            <h2 className="font-black text-2xl md:text-4xl text-[#09090B] tracking-tight">
              {lang === "ro" ? "Întrebări frecvente" : "Часто задаваемые вопросы"}
            </h2>
            <p className="text-zinc-500 mt-3 text-sm max-w-md mx-auto">
              {lang === "ro"
                ? "Tot ce vrei să știi despre sistemele de supraveghere și serviciile Teco.md."
                : "Всё, что нужно знать о системах видеонаблюдения и услугах Teco.md."}
            </p>
          </div>
          <div className="space-y-3">
            {(lang === "ro" ? HOME_FAQ_RO : HOME_FAQ_RU).map((item, i) => (
              <HomeFAQItem key={i} q={item.q} a={item.a} />
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link href="/servicii" className="inline-flex items-center gap-2 text-[#FF4F00] font-bold text-sm hover:underline">
              {lang === "ro" ? "Vezi toate serviciile și prețurile →" : "Смотреть все услуги и цены →"}
            </Link>
          </div>
        </div>
      </section>

      {/* 8b. BUNDLE BUILDER */}
      <BundleBuilder />

      {/* 9. LEAD FORM SECTION */}
      <section id="contact" className="py-20 bg-zinc-950 text-white relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_50%_0%,_rgba(255,79,0,0.15)_0%,_transparent_70%),_#09090B] -z-10"></div>
        <div className="max-w-7xl mx-auto px-6 text-center relative z-10">
          <h2 className="text-3xl md:text-5xl font-black mb-4 tracking-tight">{t("home.contact.title")}</h2>
          <p className="text-sm md:text-xl text-zinc-400 max-w-2xl mx-auto mb-10">{t("home.contact.sub")}</p>
          
          <form onSubmit={handleFormSubmit} className="max-w-4xl mx-auto bg-zinc-900/50 backdrop-blur-md border border-zinc-800 p-6 md:p-8 rounded-2xl flex flex-col md:flex-row gap-4">
            <input
              type="text"
              name="name"
              placeholder={t("home.contact.name")}
              required
              className="w-full md:flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3.5 text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#FF4F00] focus:ring-1 focus:ring-[#FF4F00] transition-all"
            />
            <input
              type="tel"
              name="phone"
              placeholder={t("home.contact.phone")}
              required
              className="w-full md:flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3.5 text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#FF4F00] focus:ring-1 focus:ring-[#FF4F00] transition-all"
            />
            <select name="interest" className="w-full md:flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3.5 text-zinc-400 focus:outline-none focus:border-[#FF4F00] focus:ring-1 focus:ring-[#FF4F00] transition-all appearance-none cursor-pointer">
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

    </main>
    </>
  );
}
