import { useState, useMemo, useEffect } from "react";
import { Link } from "wouter";
import { Search, ShoppingCart, SlidersHorizontal, X } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { useToast } from "@/hooks/use-toast";
import { useStore, type StoreProduct } from "@/lib/store";
import { useLang } from "@/contexts/LangContext";

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

// ─── Image map by type ────────────────────────────────────────────
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

function ProductCard({ product }: { product: StoreProduct }) {
  const { t } = useLang();
  const addItem = useCart((s) => s.addItem);
  const openCart = useCart((s) => s.openCart);
  const { toast } = useToast();
  const [imgError, setImgError] = useState(false);
  const viewers = useLiveViewers(product.id);

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product);
    toast({ title: t("products.added"), description: product.name });
    setTimeout(() => openCart(), 400);
  };

  const badgeClass = product.badge ? (BADGE_COLORS[product.badge] ?? "bg-zinc-900 text-white") : "";
  const brandClass = BRAND_COLORS[product.brand] ?? "text-zinc-600 bg-zinc-100";

  return (
    <Link href={`/product/${product.id}`} className="bg-white rounded-2xl border border-[#E4E4E7] overflow-hidden flex flex-col hover:shadow-md hover:border-zinc-300 transition-all duration-200 group cursor-pointer">
      {/* Image */}
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
        {/* Live viewers */}
        <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-black/50 backdrop-blur-sm rounded-full px-2 py-0.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
          <span className="text-white text-[9px] font-medium">{viewers} {t("pd.viewers")}</span>
        </div>
      </div>

      {/* Content */}
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

        <button
          onClick={handleAdd}
          className="w-full bg-[#FF4F00] text-white font-bold py-2.5 rounded-xl hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2 text-xs"
        >
          <ShoppingCart className="w-3.5 h-3.5" /> {t("products.add_to_cart")}
        </button>
      </div>
    </Link>
  );
}

export default function Products() {
  const { t } = useLang();
  const products = useStore((s) => s.products);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [showMobileFilter, setShowMobileFilter] = useState(false);

  const TABS = [
    { key: "all",    label: t("products.all") },
    { key: "wifi",   label: "Camere WiFi" },
    { key: "poe",    label: "Camere PoE" },
    { key: "4g",     label: "4G / Solar" },
    { key: "nvr",    label: "NVR-uri" },
    { key: "kituri", label: t("footer.p.kits") },
    { key: "alarme", label: t("footer.p.alarm") },
  ];

  const tabCounts = useMemo(() => {
    const counts: Record<string, number> = { all: products.length };
    products.forEach((p) => {
      counts[p.category] = (counts[p.category] || 0) + 1;
    });
    return counts;
  }, [products]);

  const filtered = useMemo(() => {
    let list = activeTab === "all" ? products : products.filter((p) => p.category === activeTab);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.model.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.specs.toLowerCase().includes(q)
      );
    }
    return list;
  }, [activeTab, search, products]);

  return (
    <div className="flex-1 bg-[#FAFAFA] pb-[64px] md:pb-0 min-h-screen">
      {/* Page Header */}
      <div className="bg-white border-b border-[#E4E4E7] px-4 md:px-6 py-5 md:py-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-[#09090B] tracking-tight">{t("products.title")}</h1>
              <p className="text-zinc-500 text-sm mt-0.5">{products.length} {t("products.in_stock")}</p>
            </div>
            <button
              onClick={() => setShowMobileFilter(!showMobileFilter)}
              className="md:hidden flex items-center gap-2 bg-zinc-100 px-3 py-2 rounded-xl text-sm font-semibold text-zinc-700"
            >
              <SlidersHorizontal className="w-4 h-4" /> {t("products.filter")}
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder={t("products.search")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#FAFAFA] border border-[#E4E4E7] rounded-xl pl-10 pr-10 py-3 text-sm text-[#09090B] placeholder:text-zinc-400 focus:outline-none focus:border-[#FF4F00] focus:ring-2 focus:ring-[#FF4F00]/20 transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Category tabs */}
      <div className="bg-white border-b border-[#E4E4E7] md:sticky md:top-[57px] z-20">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="flex gap-1 overflow-x-auto no-scrollbar py-2.5">
            {TABS.map((tab) => {
              const count = tabCounts[tab.key] ?? 0;
              if (tab.key !== "all" && count === 0) return null;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                    activeTab === tab.key
                      ? "bg-[#FF4F00] text-white shadow-sm"
                      : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700"
                  }`}
                >
                  {tab.label}
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                      activeTab === tab.key ? "bg-white/20 text-white" : "bg-zinc-100 text-zinc-500"
                    }`}
                  >
                    {tab.key === "all" ? tabCounts["all"] : (tabCounts[tab.key] ?? 0)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Product grid */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-4xl mb-3">🔍</p>
            <p className="font-bold text-lg text-[#09090B]">{t("nav.no_results")}</p>
            <p className="text-zinc-500 text-sm mt-1">{t("products.search")}</p>
            <button
              onClick={() => { setSearch(""); setActiveTab("all"); }}
              className="mt-4 bg-[#FF4F00] text-white font-bold px-6 py-2.5 rounded-xl text-sm hover:opacity-90 active:scale-95 transition-all"
            >
              {t("products.all")}
            </button>
          </div>
        ) : (
          <>
            <p className="text-xs text-zinc-400 font-medium mb-4">
              {filtered.length} {t("products.count_label")}
              {search && <> {t("nav.results_found")} „<span className="text-[#09090B] font-bold">{search}</span>"</>}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
              {filtered.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
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
            onClick={(e) => { e.preventDefault(); document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" }); window.location.href = "/"; }}
            className="flex-shrink-0 bg-[#FF4F00] text-white font-bold px-6 py-3 rounded-xl hover:opacity-90 active:scale-95 transition-all text-sm whitespace-nowrap"
          >
            {t("home.contact.btn")} →
          </a>
        </div>
      </div>
    </div>
  );
}
