import { useState, useMemo, useEffect, useRef } from "react";
import { Link, useRoute, useSearch } from "wouter";
import { Search, ShoppingCart, SlidersHorizontal, X, ChevronDown, Check, ArrowUpDown, Heart, BarChart2 } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { useToast } from "@/hooks/use-toast";
import { useStore, type StoreProduct } from "@/lib/store";
import { useLang } from "@/contexts/LangContext";
import { useWishlist } from "@/hooks/useWishlist";
import { useComparator } from "@/hooks/useComparator";
import { SEO, schemas } from "@/components/SEO";

function useLiveViewers(id: number) {
  const [count, setCount] = useState(() => 3 + (id * 5 + 11) % 17);
  useEffect(() => {
    const timer = setTimeout(
      () => setCount(c => Math.max(2, c + (Math.random() > 0.5 ? 1 : -1))),
      9000 + Math.random() * 11000
    );
    return () => clearTimeout(timer);
  }, [count]);
  return count;
}

const IMAGE_MAP: Record<string, string> = {
  indoor:          "https://images.unsplash.com/photo-1562813733-b31f71025d54?w=400&q=80&auto=format&fit=crop",
  "outdoor-bullet":"https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=400&q=80&auto=format&fit=crop",
  "outdoor-dome":  "https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=400&q=80&auto=format&fit=crop",
  ptz:             "https://images.unsplash.com/photo-1616763355548-1b606f439f86?w=400&q=80&auto=format&fit=crop",
  battery:         "https://images.unsplash.com/photo-1625378760232-c44f6d1e74dd?w=400&q=80&auto=format&fit=crop",
  color:           "https://images.unsplash.com/photo-1510511459019-5dda7724fd87?w=400&q=80&auto=format&fit=crop",
  nvr:             "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=400&q=80&auto=format&fit=crop",
  kit:             "https://images.unsplash.com/photo-1558002038-1055907df827?w=400&q=80&auto=format&fit=crop",
  alarm:           "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80&auto=format&fit=crop",
};

const BADGE_COLORS: Record<string, string> = {
  "PROMO":       "bg-red-500 text-white",
  "BEST SELLER": "bg-zinc-900 text-white",
  "COLOR NV":    "bg-green-600 text-white",
  "COLOR 24/7":  "bg-green-600 text-white",
  "COLOR HUNTER":"bg-emerald-600 text-white",
  "4G SOLAR":    "bg-blue-600 text-white",
  "4K":          "bg-purple-600 text-white",
  "AI PRO":      "bg-orange-600 text-white",
  "AI SMART":    "bg-orange-600 text-white",
  "KIT COMPLET": "bg-zinc-900 text-white",
  "POPULAR":     "bg-[#FF4F00] text-white",
  "DUAL VIEW":   "bg-indigo-600 text-white",
  "LOW LIGHT":   "bg-teal-600 text-white",
};

const BRAND_COLORS: Record<string, string> = {
  "TP-Link Tapo": "text-green-700 bg-green-50",
  "TP-Link VIGI": "text-blue-700 bg-blue-50",
  "Uniarch":      "text-purple-700 bg-purple-50",
  "Reolink":      "text-red-700 bg-red-50",
  "Tiandy":       "text-zinc-700 bg-zinc-100",
  "Uniview":      "text-teal-700 bg-teal-50",
  "Teco.md":      "text-orange-700 bg-orange-50",
  "Ajax Systems": "text-zinc-900 bg-zinc-100",
};

type SortKey = "relevance" | "price_asc" | "price_desc";

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "relevance",  label: "Relevanță" },
  { key: "price_asc",  label: "Preț: mic → mare" },
  { key: "price_desc", label: "Preț: mare → mic" },
];

const TABS = [
  { key: "all",    label: "Toate" },
  { key: "wifi",   label: "Camere WiFi" },
  { key: "poe",    label: "Camere PoE" },
  { key: "4g",     label: "4G / Solar" },
  { key: "nvr",    label: "NVR-uri" },
  { key: "kituri", label: "Kituri" },
  { key: "alarme", label: "Alarme" },
];

const PRICE_PRESETS = [
  { label: "Sub 500", min: 0,    max: 500  },
  { label: "500–1000",min: 500,  max: 1000 },
  { label: "1000–3000",min:1000, max: 3000 },
  { label: "3000+",   min: 3000, max: 99999},
];

function ProductCard({ product }: { product: StoreProduct }) {
  const { t } = useLang();
  const addItem = useCart((s) => s.addItem);
  const openCart = useCart((s) => s.openCart);
  const { toast } = useToast();
  const { toggle: toggleWish, has: hasWish } = useWishlist();
  const { toggle: toggleComp, has: hasComp } = useComparator();
  const [imgError, setImgError] = useState(false);
  const viewers = useLiveViewers(product.id);
  const wished = hasWish(product.id);
  const compared = hasComp(product.id);

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product);
    toast({ title: t("products.added"), description: product.name });
    setTimeout(() => openCart(), 400);
  };

  const handleWish = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWish(product.id);
    toast({ title: wished ? "Eliminat din favorite" : "Adăugat la favorite", description: product.name });
  };

  const handleComp = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleComp(product);
    toast({ title: compared ? "Eliminat din comparare" : "Adăugat la comparare", description: product.name });
  };

  const badgeClass = product.badge ? (BADGE_COLORS[product.badge] ?? "bg-zinc-900 text-white") : "";
  const brandClass = BRAND_COLORS[product.brand] ?? "text-zinc-600 bg-zinc-100";

  return (
    <Link href={`/product/${product.id}`} className="bg-white rounded-2xl border border-[#E4E4E7] overflow-hidden flex flex-col hover:shadow-md hover:border-zinc-300 transition-all duration-200 group cursor-pointer">
      <div className="relative h-40 bg-zinc-50 overflow-hidden">
        {!imgError ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={() => setImgError(true)}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-zinc-100">
            <ShoppingCart className="w-10 h-10 text-zinc-300" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
        {product.badge && (
          <span className={`absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full ${badgeClass}`}>
            {product.badge}
          </span>
        )}
        {/* Wishlist heart — top right */}
        <button
          onClick={handleWish}
          className={`absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center transition-all ${wished ? "bg-red-500 shadow-md" : "bg-white/80 backdrop-blur-sm hover:bg-white"}`}
        >
          <Heart className={`w-3.5 h-3.5 transition-all ${wished ? "text-white fill-white" : "text-zinc-500"}`} />
        </button>
        <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-black/50 backdrop-blur-sm rounded-full px-2 py-0.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
          <span className="text-white text-[9px] font-medium">{viewers} {t("pd.viewers")}</span>
        </div>
      </div>

      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-center gap-2 mb-1.5">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${brandClass}`}>{product.brand}</span>
        </div>
        <p className="text-[10px] font-mono text-zinc-400 mb-0.5">{product.model}</p>
        <h3 className="font-bold text-sm text-[#09090B] leading-tight mb-1.5 flex-1">{product.name}</h3>
        <p className="font-mono text-[10px] text-zinc-400 bg-zinc-50 px-2 py-1 rounded-lg mb-3 leading-relaxed">{product.specs}</p>

        <div className="flex items-end justify-between mb-3">
          <div>
            {product.oldPrice && (
              <p className="text-[10px] text-zinc-400 line-through">{product.oldPrice.toLocaleString()} MDL</p>
            )}
            <p className="font-mono font-black text-lg text-[#FF4F00]">{product.price.toLocaleString()} MDL</p>
          </div>
          {product.oldPrice && (
            <span className="text-[10px] font-bold text-green-700 bg-green-50 px-1.5 py-0.5 rounded-full">
              -{Math.round((1 - product.price / product.oldPrice) * 100)}%
            </span>
          )}
        </div>

        <div className="flex gap-1.5">
          <button
            onClick={handleAdd}
            className="flex-1 bg-[#FF4F00] text-white font-bold py-2.5 rounded-xl hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-1.5 text-xs"
          >
            <ShoppingCart className="w-3.5 h-3.5" /> {t("products.add_to_cart")}
          </button>
          <button
            onClick={handleComp}
            title="Adaugă la comparare"
            className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${compared ? "bg-[#09090B] text-white" : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"}`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </Link>
  );
}

export default function Products() {
  const [isKitRoute] = useRoute("/seturi-camere-supraveghere");
  const searchStr = useSearch();
  const { t, lang } = useLang();
  const products = useStore((s) => s.products);

  const [activeCategory, setActiveCategory] = useState<string>(() => {
    if (isKitRoute) return "kituri";
    const params = new URLSearchParams(searchStr);
    return params.get("cat") ?? "all";
  });

  // Sincronizează categoria când URL-ul se schimbă (ex: navigare între /produse?cat=wifi și ?cat=poe)
  useEffect(() => {
    if (isKitRoute) return;
    const params = new URLSearchParams(searchStr);
    const cat = params.get("cat") ?? "all";
    setActiveCategory(cat);
  }, [searchStr, isKitRoute]);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("relevance");
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [priceMin, setPriceMin] = useState<number>(0);
  const [priceMax, setPriceMax] = useState<number>(99999);
  const [showFilters, setShowFilters] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);

  const allBrands = useMemo(() => [...new Set(products.map(p => p.brand))].sort(), [products]);
  const minPrice = useMemo(() => Math.min(...products.map(p => p.price)), [products]);
  const maxPrice = useMemo(() => Math.max(...products.map(p => p.price)), [products]);

  const catCounts = useMemo(() => {
    const c: Record<string, number> = { all: products.length };
    products.forEach(p => { c[p.category] = (c[p.category] || 0) + 1; });
    return c;
  }, [products]);

  const filtered = useMemo(() => {
    let list = activeCategory === "all" ? products : products.filter(p => p.category === activeCategory);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.model.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.specs.toLowerCase().includes(q)
      );
    }
    if (selectedBrands.length > 0) {
      list = list.filter(p => selectedBrands.includes(p.brand));
    }
    if (priceMin > 0 || priceMax < 99999) {
      list = list.filter(p => p.price >= priceMin && p.price <= priceMax);
    }
    if (sortBy === "price_asc")  list = [...list].sort((a, b) => a.price - b.price);
    if (sortBy === "price_desc") list = [...list].sort((a, b) => b.price - a.price);
    return list;
  }, [activeCategory, search, selectedBrands, priceMin, priceMax, sortBy, products]);

  const activeFilterCount = useMemo(() => {
    let n = 0;
    if (activeCategory !== "all") n++;
    if (selectedBrands.length > 0) n++;
    if (priceMin > 0 || priceMax < 99999) n++;
    return n;
  }, [activeCategory, selectedBrands, priceMin, priceMax]);

  const clearAll = () => {
    setActiveCategory("all");
    setSelectedBrands([]);
    setPriceMin(0);
    setPriceMax(99999);
    setSortBy("relevance");
    setSearch("");
    window.scrollTo({ top: 0, behavior: "instant" });
  };

  const toggleBrand = (brand: string) => {
    setSelectedBrands(prev =>
      prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]
    );
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) setShowSortDropdown(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const pageTitle = isKitRoute
    ? (lang === "ru" ? "Комплекты Видеонаблюдения — Готовые Наборы Камер | Teco.md" : "Seturi Camere de Supraveghere — Cele Mai Bune Kituri din Moldova | Teco.md")
    : (lang === "ru" ? "Каталог Продуктов — Камеры, NVR, Комплекты | Teco.md" : "Catalog Produse — Camere, NVR-uri, Kituri, Alarme | Teco.md");
  const pageDesc = isKitRoute
    ? (lang === "ru" ? "Готовые комплекты видеонаблюдения для дома и офиса. Установка под ключ, гарантия 12 месяцев." : "Seturi complete camere de supraveghere pentru casă și birou. Montaj profesional, garanție 12 luni, livrare în toată Moldova.")
    : (lang === "ru" ? "Полный каталог оборудования для видеонаблюдения: камеры IP, WiFi, PoE, 4G, NVR, комплекты, сигнализации. Молдова." : "Catalog complet sisteme de supraveghere: camere IP, WiFi, PoE, 4G, NVR, kituri, alarme. Livrare în 24h.");
  const jsonLd = [
    schemas.collectionPage(filtered.map(p => ({ id: p.id, name: p.name, imageUrl: p.imageUrl, price: p.price }))),
    schemas.breadcrumb([
      { name: lang === "ru" ? "Главная" : "Acasă", url: "https://teco.md/" },
      { name: lang === "ru" ? "Продукты" : "Produse", url: "https://teco.md/produse" },
    ]),
  ];

  return (
    <>
      <SEO title={pageTitle} description={pageDesc} keywords={lang === "ru" ? "каталог, камеры, NVR, молдова" : "catalog, camere, NVR, Moldova"} canonical={isKitRoute ? "/seturi-camere-supraveghere" : "/produse"} lang={lang} jsonLd={jsonLd} />

      {/* ── Mobile Filter Bottom Sheet ── */}
      {showFilters && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end md:hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowFilters(false)} />
          <div className="relative bg-white rounded-t-3xl shadow-2xl max-h-[90vh] flex flex-col">
            {/* Handle + header */}
            <div className="px-5 pt-3 pb-4 border-b border-zinc-100 flex-shrink-0">
              <div className="w-10 h-1 bg-zinc-200 rounded-full mx-auto mb-4" />
              <div className="flex items-center justify-between">
                <h3 className="font-black text-lg text-[#09090B]">Filtre & Sortare</h3>
                <button onClick={() => setShowFilters(false)} className="text-zinc-400 p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Scrollable body */}
            <div className="overflow-y-auto flex-1 px-5 py-4 space-y-6">

              {/* Sort */}
              <div>
                <p className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-3">Sortare</p>
                <div className="space-y-2">
                  {SORT_OPTIONS.map(opt => (
                    <button
                      key={opt.key}
                      onClick={() => setSortBy(opt.key)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl border text-sm font-semibold transition-all ${
                        sortBy === opt.key
                          ? "bg-[#FF4F00] text-white border-[#FF4F00]"
                          : "bg-zinc-50 text-zinc-700 border-zinc-200"
                      }`}
                    >
                      {opt.label}
                      {sortBy === opt.key && <Check className="w-4 h-4" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Categorie */}
              <div>
                <p className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-3">Categorie</p>
                <div className="grid grid-cols-2 gap-2">
                  {TABS.map(tab => {
                    const count = tab.key === "all" ? catCounts["all"] : (catCounts[tab.key] ?? 0);
                    if (tab.key !== "all" && count === 0) return null;
                    return (
                      <button
                        key={tab.key}
                        onClick={() => setActiveCategory(tab.key)}
                        className={`flex items-center justify-between px-3 py-2.5 rounded-2xl border text-sm font-semibold transition-all ${
                          activeCategory === tab.key
                            ? "bg-zinc-900 text-white border-zinc-900"
                            : "bg-zinc-50 text-zinc-700 border-zinc-200"
                        }`}
                      >
                        <span className="truncate">{tab.label}</span>
                        <span className={`ml-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                          activeCategory === tab.key ? "bg-white/20 text-white" : "bg-zinc-200 text-zinc-500"
                        }`}>{count}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Preț */}
              <div>
                <p className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-3">Preț (MDL)</p>
                <div className="flex gap-3 mb-3">
                  <div className="flex-1">
                    <label className="text-[11px] text-zinc-400 font-semibold mb-1 block">De la</label>
                    <input
                      type="number"
                      min={0}
                      max={priceMax}
                      value={priceMin === 0 ? "" : priceMin}
                      placeholder={`${minPrice}`}
                      onChange={e => setPriceMin(e.target.value ? Number(e.target.value) : 0)}
                      className="w-full border border-zinc-200 rounded-xl px-3 py-2.5 text-sm font-mono text-[#09090B] focus:outline-none focus:border-[#FF4F00] focus:ring-2 focus:ring-[#FF4F00]/20"
                    />
                  </div>
                  <div className="flex items-end pb-[11px] text-zinc-300 font-bold">—</div>
                  <div className="flex-1">
                    <label className="text-[11px] text-zinc-400 font-semibold mb-1 block">Până la</label>
                    <input
                      type="number"
                      min={priceMin}
                      value={priceMax >= 99999 ? "" : priceMax}
                      placeholder={`${maxPrice}`}
                      onChange={e => setPriceMax(e.target.value ? Number(e.target.value) : 99999)}
                      className="w-full border border-zinc-200 rounded-xl px-3 py-2.5 text-sm font-mono text-[#09090B] focus:outline-none focus:border-[#FF4F00] focus:ring-2 focus:ring-[#FF4F00]/20"
                    />
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {PRICE_PRESETS.map(p => {
                    const active = priceMin === p.min && priceMax === p.max;
                    return (
                      <button
                        key={p.label}
                        onClick={() => { setPriceMin(p.min); setPriceMax(p.max); }}
                        className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${
                          active ? "bg-[#FF4F00] text-white border-[#FF4F00]" : "bg-zinc-50 text-zinc-600 border-zinc-200"
                        }`}
                      >
                        {p.label} MDL
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Brand */}
              <div>
                <p className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-3">Brand</p>
                <div className="space-y-1">
                  {allBrands.map(brand => {
                    const count = products.filter(p => p.brand === brand).length;
                    const checked = selectedBrands.includes(brand);
                    return (
                      <button
                        key={brand}
                        onClick={() => toggleBrand(brand)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all ${
                          checked ? "bg-zinc-900 text-white border-zinc-900" : "bg-zinc-50 text-zinc-700 border-zinc-100 hover:border-zinc-300"
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 ${
                          checked ? "bg-white border-white" : "border-zinc-300"
                        }`}>
                          {checked && <Check className="w-3 h-3 text-zinc-900" />}
                        </div>
                        <span className="flex-1 text-sm font-semibold text-left">{brand}</span>
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                          checked ? "bg-white/20 text-white" : "bg-zinc-200 text-zinc-500"
                        }`}>{count}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Footer actions */}
            <div className="px-5 py-4 border-t border-zinc-100 flex gap-3 flex-shrink-0">
              <button
                onClick={() => { clearAll(); setShowFilters(false); }}
                className="flex-1 py-3 rounded-2xl border-2 border-zinc-200 text-zinc-600 text-sm font-bold hover:border-zinc-400 transition-colors"
              >
                Resetează
              </button>
              <button
                onClick={() => { setShowFilters(false); window.scrollTo({ top: 0, behavior: "instant" }); }}
                className="flex-[2] py-3 rounded-2xl bg-[#FF4F00] text-white text-sm font-black shadow-md hover:opacity-90 transition-opacity"
              >
                Arată {filtered.length} produse
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 bg-[#FAFAFA] pb-[64px] md:pb-0 min-h-screen" role="main">

        {/* ── Page Header ── */}
        <div className="bg-white border-b border-[#E4E4E7] px-4 md:px-6 py-4 md:py-5">
          <div className="max-w-7xl mx-auto space-y-3">

            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl md:text-3xl font-black text-[#09090B] tracking-tight">{t("products.title")}</h1>
                <p className="text-zinc-500 text-sm mt-0.5">{products.length} {t("products.in_stock")}</p>
              </div>

              {/* Desktop sort dropdown */}
              <div className="hidden md:flex items-center gap-2">
                <div className="relative" ref={sortRef}>
                  <button
                    onClick={() => setShowSortDropdown(!showSortDropdown)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-zinc-200 bg-white text-sm font-semibold text-zinc-700 hover:border-zinc-400 transition-colors"
                  >
                    <ArrowUpDown className="w-4 h-4 text-zinc-400" />
                    {SORT_OPTIONS.find(o => o.key === sortBy)?.label}
                    <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform ${showSortDropdown ? "rotate-180" : ""}`} />
                  </button>
                  {showSortDropdown && (
                    <div className="absolute top-full right-0 mt-1 bg-white rounded-2xl border border-zinc-200 shadow-xl z-30 overflow-hidden w-52">
                      {SORT_OPTIONS.map(opt => (
                        <button
                          key={opt.key}
                          onClick={() => { setSortBy(opt.key); setShowSortDropdown(false); }}
                          className={`w-full text-left px-4 py-3 text-sm font-semibold flex items-center justify-between hover:bg-zinc-50 transition-colors ${
                            sortBy === opt.key ? "text-[#FF4F00]" : "text-zinc-700"
                          }`}
                        >
                          {opt.label}
                          {sortBy === opt.key && <Check className="w-4 h-4 text-[#FF4F00]" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                placeholder={t("products.search")}
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-[#FAFAFA] border border-[#E4E4E7] rounded-xl pl-10 pr-10 py-3 text-sm text-[#09090B] placeholder:text-zinc-400 focus:outline-none focus:border-[#FF4F00] focus:ring-2 focus:ring-[#FF4F00]/20 transition-all"
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── Sticky filter/tab bar ── */}
        <div className="bg-white border-b border-[#E4E4E7] sticky top-[57px] md:top-[80px] z-20">
          <div className="max-w-7xl mx-auto px-4 md:px-6">
            <div className="flex items-center gap-2 py-2.5">

              {/* Filter button (mobile) + desktop inline */}
              <button
                onClick={() => setShowFilters(true)}
                className={`md:hidden flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-bold transition-all ${
                  activeFilterCount > 0
                    ? "bg-[#FF4F00] text-white"
                    : "bg-zinc-100 text-zinc-700 border border-zinc-200"
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                Filtre
                {activeFilterCount > 0 && (
                  <span className="bg-white/25 text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </button>

              {/* Mobile sort */}
              <div className="md:hidden relative flex-shrink-0" ref={sortRef}>
                <button
                  onClick={() => setShowSortDropdown(!showSortDropdown)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-bold transition-all ${
                    sortBy !== "relevance" ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-700 border border-zinc-200"
                  }`}
                >
                  <ArrowUpDown className="w-3.5 h-3.5" />
                  {sortBy === "price_asc" ? "Mic → Mare" : sortBy === "price_desc" ? "Mare → Mic" : "Sortare"}
                </button>
                {showSortDropdown && (
                  <div className="absolute top-full left-0 mt-1 bg-white rounded-2xl border border-zinc-200 shadow-xl z-30 overflow-hidden w-48">
                    {SORT_OPTIONS.map(opt => (
                      <button
                        key={opt.key}
                        onClick={() => { setSortBy(opt.key); setShowSortDropdown(false); }}
                        className={`w-full text-left px-4 py-3 text-sm font-semibold flex items-center justify-between hover:bg-zinc-50 transition-colors ${
                          sortBy === opt.key ? "text-[#FF4F00]" : "text-zinc-700"
                        }`}
                      >
                        {opt.label}
                        {sortBy === opt.key && <Check className="w-3.5 h-3.5 text-[#FF4F00]" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Divider */}
              <div className="w-px h-5 bg-zinc-200 flex-shrink-0" />

              {/* Category pills — scrollable */}
              <div className="flex gap-1.5 overflow-x-auto no-scrollbar flex-1">
                {TABS.map(tab => {
                  const count = tab.key === "all" ? catCounts["all"] : (catCounts[tab.key] ?? 0);
                  if (tab.key !== "all" && count === 0) return null;
                  return (
                    <button
                      key={tab.key}
                      onClick={() => { setActiveCategory(tab.key); window.scrollTo({ top: 0, behavior: "instant" }); }}
                      className={`flex-shrink-0 flex items-center gap-1 px-3.5 py-2 rounded-full text-sm font-semibold transition-all ${
                        activeCategory === tab.key
                          ? "bg-[#FF4F00] text-white"
                          : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700"
                      }`}
                    >
                      {tab.label}
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                        activeCategory === tab.key ? "bg-white/20 text-white" : "bg-zinc-100 text-zinc-500"
                      }`}>{count}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ── Active filter chips ── */}
        {(selectedBrands.length > 0 || priceMin > 0 || priceMax < 99999) && (
          <div className="bg-white border-b border-zinc-100 px-4 md:px-6 py-2">
            <div className="max-w-7xl mx-auto flex items-center gap-2 overflow-x-auto no-scrollbar">
              <span className="text-[11px] text-zinc-400 font-semibold flex-shrink-0">Activ:</span>
              {selectedBrands.map(b => (
                <button
                  key={b}
                  onClick={() => toggleBrand(b)}
                  className="flex-shrink-0 flex items-center gap-1 bg-zinc-900 text-white text-xs font-semibold px-3 py-1 rounded-full"
                >
                  {b} <X className="w-3 h-3" />
                </button>
              ))}
              {(priceMin > 0 || priceMax < 99999) && (
                <button
                  onClick={() => { setPriceMin(0); setPriceMax(99999); }}
                  className="flex-shrink-0 flex items-center gap-1 bg-zinc-900 text-white text-xs font-semibold px-3 py-1 rounded-full"
                >
                  {priceMin > 0 ? `${priceMin.toLocaleString()}` : "0"} – {priceMax < 99999 ? `${priceMax.toLocaleString()}` : "∞"} MDL
                  <X className="w-3 h-3" />
                </button>
              )}
              <button
                onClick={clearAll}
                className="flex-shrink-0 text-[11px] text-[#FF4F00] font-bold hover:underline"
              >
                Șterge tot
              </button>
            </div>
          </div>
        )}

        {/* ── Product Grid ── */}
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-5">
          {filtered.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-4xl mb-3">🔍</p>
              <p className="font-bold text-lg text-[#09090B]">{t("nav.no_results")}</p>
              <p className="text-zinc-500 text-sm mt-1">Încearcă alte filtre sau șterge cele active</p>
              <button
                onClick={clearAll}
                className="mt-4 bg-[#FF4F00] text-white font-bold px-6 py-2.5 rounded-xl text-sm hover:opacity-90 active:scale-95 transition-all"
              >
                Resetează filtrele
              </button>
            </div>
          ) : (
            <>
              <p className="text-xs text-zinc-400 font-medium mb-4">
                {filtered.length} {t("products.count_label")}
                {search && <> pentru „<span className="text-[#09090B] font-bold">{search}</span>"</>}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                {filtered.map(p => <ProductCard key={p.id} product={p} />)}
              </div>
            </>
          )}
        </div>

        {/* CTA Banner */}
        <div className="max-w-7xl mx-auto px-4 md:px-6 pb-8">
          <div className="bg-zinc-950 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="font-black text-lg md:text-xl text-white">{t("home.contact.title")}</h3>
              <p className="text-zinc-400 text-sm mt-1">{t("home.contact.sub")}</p>
            </div>
            <a
              href="#contact"
              onClick={(e) => { e.preventDefault(); window.location.href = "/"; }}
              className="flex-shrink-0 bg-[#FF4F00] text-white font-bold px-6 py-3 rounded-xl hover:opacity-90 active:scale-95 transition-all text-sm whitespace-nowrap"
            >
              {t("home.contact.btn")} →
            </a>
          </div>
        </div>
      </main>
    </>
  );
}
