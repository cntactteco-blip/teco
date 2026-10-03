import { useState, useEffect } from "react";
import { X, ArrowRight, Tag } from "lucide-react";
import { Link } from "wouter";
import { useStore } from "@/lib/store";
import { useLang } from "@/contexts/LangContext";
import { seasonalOffer } from "@/lib/seasonal-offer";

export function AnnouncementBar() {
  const { lang } = useLang();
  const [visible, setVisible] = useState(true);
  const [now, setNow] = useState(() => new Date());
  const products = useStore(s => s.products);
  const offer = seasonalOffer(products, lang, now);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 3600000);
    return () => window.clearInterval(timer);
  }, []);
  if (!visible) return null;
  return (
    <div className="relative flex items-center justify-center gap-2 bg-[#111111] px-3 pr-10 py-2 text-white border-b border-white/10">
      <Link href={offer.href} className="group flex min-h-7 min-w-0 items-center justify-center gap-2 sm:gap-3 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#FF4F00] rounded-md">
        <span className="flex shrink-0 items-center gap-1 rounded-md bg-[#FF4F00] px-2 py-1 text-[9px] sm:text-[10px] font-black uppercase tracking-wide">
          <Tag className="hidden sm:block h-3 w-3" />
          {offer.label}
        </span>
        <span className="text-[11px] sm:text-sm font-semibold leading-tight">{offer.headline}</span>
        <span className="hidden lg:inline shrink-0 text-xs font-bold text-orange-300 group-hover:text-white transition-colors">{offer.cta}</span>
        <ArrowRight className="h-4 w-4 shrink-0 text-[#FF6A1A] group-hover:translate-x-0.5 transition-transform" />
      </Link>
      <button aria-label={lang === "ru" ? "Закрыть предложение" : "Închide oferta"} onClick={() => setVisible(false)} className="absolute right-1 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full text-white/60 hover:bg-white/10 hover:text-white transition-colors">
        <X size={14} />
      </button>
    </div>
  );
}
