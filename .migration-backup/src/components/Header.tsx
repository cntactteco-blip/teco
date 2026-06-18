import { useEffect, useState, useRef } from "react";
import { ShoppingCart, Search, Menu, Settings2, X } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useCart } from "@/hooks/useCart";
import { SidebarDrawer } from "./SidebarDrawer";
import { useStore } from "@/lib/store";
import { useLang } from "@/contexts/LangContext";

function OnlineIndicator() {
  const { t } = useLang();
  const [count] = useState(() => 2 + Math.floor(Math.random() * 4));
  return (
    <div className="hidden md:flex items-center gap-1.5 bg-zinc-50 border border-zinc-200 rounded-full px-3 py-1.5 text-xs font-medium text-zinc-600 select-none">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
      </span>
      {count} {t("nav.technicians")}
    </div>
  );
}

function LangSwitcher() {
  const { lang, setLang } = useLang();
  return (
    <div className="flex items-center border border-zinc-200 rounded-full overflow-hidden text-[11px] font-black select-none flex-shrink-0">
      <button
        onClick={() => setLang("ro")}
        className={`px-2.5 py-1.5 transition-colors ${lang === "ro" ? "bg-[#FF4F00] text-white" : "text-zinc-400 hover:text-zinc-600"}`}
      >
        RO
      </button>
      <button
        onClick={() => setLang("ru")}
        className={`px-2.5 py-1.5 transition-colors ${lang === "ru" ? "bg-[#FF4F00] text-white" : "text-zinc-400 hover:text-zinc-600"}`}
      >
        RU
      </button>
    </div>
  );
}

export function Header() {
  const { t } = useLang();
  const cartCount = useCart((state) => state.count);
  const openCart = useCart((state) => state.openCart);
  const products = useStore((s) => s.products);
  const [scrolled, setScrolled] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<typeof products>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const [, navigate] = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    const q = query.toLowerCase();
    setResults(
      products
        .filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            p.model.toLowerCase().includes(q) ||
            p.brand.toLowerCase().includes(q) ||
            p.specs.toLowerCase().includes(q)
        )
        .slice(0, 6)
    );
  }, [query, products]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSearchSelect = () => {
    setQuery("");
    setResults([]);
    setSearchOpen(false);
  };

  return (
    <>
      <SidebarDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <header
        className={`sticky top-0 z-30 transition-all duration-300 border-b border-[#E4E4E7] h-16 sm:h-20 flex items-center px-4 md:px-6 ${
          scrolled ? "bg-white/90 backdrop-blur-md shadow-sm" : "bg-white"
        }`}
        data-testid="header"
      >
        <div className="flex w-full max-w-7xl mx-auto items-center gap-3 md:gap-4">
          {/* Hamburger */}
          <button
            onClick={() => setDrawerOpen(true)}
            className="flex-shrink-0 flex items-center justify-center w-10 h-10 hover:bg-zinc-100 rounded-full transition-colors"
            aria-label="Meniu"
            data-testid="btn-menu"
          >
            <Menu className="w-5 h-5 text-[#09090B]" />
          </button>

          {/* Logo */}
          <Link
            href="/"
            className="flex-shrink-0 font-black text-xl tracking-tighter text-[#09090B] hidden sm:block"
            data-testid="logo"
          >
            TECO<span className="text-[#FF4F00]">.</span>MD
          </Link>

          {/* Center Search */}
          <div className="flex-1 relative" ref={searchRef}>
            <div className="relative flex items-center">
              <Search className="absolute left-4 w-4 h-4 text-[#71717A] pointer-events-none z-10" />
              <input
                type="text"
                placeholder={t("nav.search_placeholder")}
                value={query}
                onChange={(e) => { setQuery(e.target.value); setSearchOpen(true); }}
                onFocus={() => setSearchOpen(true)}
                className="w-full h-11 bg-[#FAFAFA] border border-[#E4E4E7] rounded-full text-sm px-10 focus:outline-none focus:border-[#FF4F00] focus:ring-2 focus:ring-[#FF4F00]/20 transition-all text-[#09090B] placeholder:text-[#71717A]"
                data-testid="input-search"
              />
              {query && (
                <button
                  onClick={() => { setQuery(""); setResults([]); }}
                  className="absolute right-4 text-zinc-400 hover:text-zinc-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Search dropdown */}
            {searchOpen && results.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl border border-zinc-200 shadow-xl z-50 overflow-hidden">
                {results.map((p) => (
                  <Link
                    key={p.id}
                    href="/produse"
                    onClick={handleSearchSelect}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-zinc-50 transition-colors border-b border-zinc-50 last:border-0"
                  >
                    <div className="w-10 h-10 rounded-lg bg-zinc-100 overflow-hidden flex-shrink-0">
                      <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#09090B] truncate">{p.name}</p>
                      <p className="text-[11px] text-zinc-400 font-mono">{p.brand} · {p.price.toLocaleString()} MDL</p>
                    </div>
                    {p.badge && (
                      <span className="text-[9px] bg-orange-100 text-[#FF4F00] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0">{p.badge}</span>
                    )}
                  </Link>
                ))}
                <Link
                  href="/produse"
                  onClick={handleSearchSelect}
                  className="block text-center text-xs font-semibold text-[#FF4F00] py-2.5 hover:bg-orange-50 transition-colors"
                >
                  {t("nav.all_products")}
                </Link>
              </div>
            )}
          </div>

          {/* Right side */}
          <div className="flex-shrink-0 flex items-center gap-2 sm:gap-3">
            <OnlineIndicator />

            {/* Language switcher — always visible */}
            <LangSwitcher />

            <Link
              href="/produse"
              className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-full bg-zinc-50 hover:bg-zinc-100 transition-colors text-xs font-semibold text-zinc-700"
            >
              <Settings2 className="w-3.5 h-3.5" /> Configurator
            </Link>

            <button
              onClick={openCart}
              className="relative flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-full bg-[#FAFAFA] hover:bg-[#E4E4E7] transition-colors"
              data-testid="btn-cart"
            >
              <ShoppingCart className="w-5 h-5 text-[#09090B]" />
              <span className="font-medium text-[#09090B] hidden sm:inline text-sm">{t("nav.cart")} ({cartCount})</span>
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#FF4F00] text-[10px] font-bold text-white border-2 border-white sm:hidden">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>
    </>
  );
}
