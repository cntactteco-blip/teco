import { Home, Grid2x2, ShoppingCart, X, Wrench, ClipboardList } from "lucide-react";
import { useLocation, useRouter } from "wouter";
import { useCart } from "@/hooks/useCart";
import { useStore } from "@/lib/store";
import { useState, useEffect, useRef } from "react";
import { useLang } from "@/contexts/LangContext";

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function ViberIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 1C6.477 1 2 5.254 2 10.5c0 2.963 1.388 5.61 3.57 7.37L5 22l4.109-2.148A11.02 11.02 0 0012 20c5.523 0 10-4.254 10-9.5S17.523 1 12 1zm0 17c-.93 0-1.83-.14-2.67-.4L7 18.5l.49-2.63C5.97 14.65 5 12.67 5 10.5 5 6.91 8.13 4 12 4s7 2.91 7 6.5S15.87 18 12 18z"/>
      <path d="M15.5 13.06c-.28-.14-.84-.41-.96-.46-.13-.05-.22-.07-.32.07s-.37.46-.45.55c-.08.1-.17.11-.3.04-.14-.07-.57-.21-1.09-.67-.4-.36-.67-.8-.75-.94-.08-.14-.01-.2.06-.27l.2-.24c.07-.07.09-.12.14-.2.05-.08.02-.16-.01-.23L11.5 9.5c-.11-.28-.22-.24-.3-.24h-.26c-.09 0-.24.04-.37.18-.13.13-.49.47-.49 1.15s.5 1.34.57 1.43c.07.1.98 1.5 2.38 2.1.33.14.59.23.8.3.33.1.63.08.87.05.27-.04.83-.34.94-.67.12-.33.12-.61.09-.67-.04-.07-.13-.11-.27-.17z"/>
    </svg>
  );
}

export function BottomNav() {
  const { t, lang } = useLang();
  const [location] = useLocation();
  const router = useRouter();
  const cartCount = useCart((state) => state.count);
  const openCart = useCart((state) => state.openCart);
  const adminPhone = useStore((s) => s.settings.general?.adminPhone ?? "");
  const [contactOpen, setContactOpen] = useState(false);
  const contactRef = useRef<HTMLDivElement>(null);

  const phone = adminPhone || "37367200463";
  const WA_MSG = encodeURIComponent(
    t("nav.contact") === "Контакт"
      ? "Здравствуйте! Меня интересуют системы видеонаблюдения TECO.MD. Можно получить предложение?"
      : "Bună ziua! Sunt interesat de sistemele de supraveghere TECO.MD. Pot primi o ofertă?"
  );
  const waLink = `https://wa.me/${phone.replace(/\D/g, "")}?text=${WA_MSG}`;
  const viberLink = `viber://chat?number=${phone.replace(/\D/g, "")}`;

  useEffect(() => {
    if (!contactOpen) return;
    const handler = (e: MouseEvent | TouchEvent) => {
      if (contactRef.current && !contactRef.current.contains(e.target as Node)) {
        setContactOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, [contactOpen]);

  const navigate = (path: string) => {
    window.history.pushState(null, "", router.base + path);
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  const goHome = () => {
    if (location !== "/") navigate("/");
    else window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      {contactOpen && (
        <div className="md:hidden fixed bottom-[56px] left-0 right-0 z-50 flex justify-end px-3 pb-2 pointer-events-none">
          <div
            ref={contactRef}
            className="pointer-events-auto flex flex-col items-end gap-2"
            style={{ animation: "slideUpContact 0.18s ease-out" }}
          >
            <button
              onClick={() => { setContactOpen(false); navigate("/servicii"); }}
              className="flex items-center gap-2.5 bg-[#FF4F00] text-white text-sm font-bold pl-3 pr-4 py-2.5 rounded-2xl shadow-[0_4px_20px_rgba(255,79,0,0.45)] active:scale-95 transition-all"
              style={{ animation: "slideUpContact 0.12s ease-out" }}
            >
              <Wrench className="w-4 h-4" />
              <span>{lang === "ru" ? "Заказать Монтаж" : "Solicită Montaj"}</span>
            </button>
            <a
              href={viberLink}
              onClick={() => setContactOpen(false)}
              className="flex items-center gap-2.5 bg-[#7360F2] text-white text-sm font-bold pl-3 pr-4 py-2.5 rounded-2xl shadow-[0_4px_20px_rgba(115,96,242,0.45)] active:scale-95 transition-all"
            >
              <ViberIcon className="w-5 h-5" />
              <span>Viber</span>
            </a>
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setContactOpen(false)}
              className="flex items-center gap-2.5 bg-[#25D366] text-white text-sm font-bold pl-3 pr-4 py-2.5 rounded-2xl shadow-[0_4px_20px_rgba(37,211,102,0.45)] active:scale-95 transition-all"
            >
              <WhatsAppIcon className="w-5 h-5" />
              <span>WhatsApp</span>
            </a>
          </div>
        </div>
      )}

      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-[20px] border-t border-[#e4e4e7] pb-[env(safe-area-inset-bottom,0px)]">
        <div className="flex items-center justify-around px-2 h-14">

          <button
            onClick={goHome}
            className={`flex flex-col items-center justify-center gap-0.5 w-14 transition-colors ${location === "/" ? "text-[#FF4F00]" : "text-zinc-400"}`}
          >
            <Home className="w-5 h-5" />
            <span className="text-[9px] font-medium">{t("nav.home")}</span>
          </button>

          <button
            onClick={() => navigate("/produse")}
            className={`flex flex-col items-center justify-center gap-0.5 w-14 transition-colors ${location === "/produse" ? "text-[#FF4F00]" : "text-zinc-400"}`}
          >
            <Grid2x2 className="w-5 h-5" />
            <span className="text-[9px] font-medium">{t("nav.products")}</span>
          </button>

          <button
            onClick={() => navigate("/oferta")}
            className={`flex flex-col items-center justify-center gap-0.5 w-14 relative transition-colors ${location === "/oferta" ? "text-[#FF4F00]" : "text-zinc-400"}`}
          >
            <div className="relative">
              <ClipboardList className="w-5 h-5" />
              {location !== "/oferta" && (
                <span className="absolute -top-1 -right-1.5 bg-[#FF4F00] w-2 h-2 rounded-full border border-white" />
              )}
            </div>
            <span className="text-[9px] font-medium">{lang === "ru" ? "Ofertă" : "Ofertă"}</span>
          </button>

          <button
            onClick={openCart}
            className={`flex flex-col items-center justify-center gap-0.5 w-14 relative transition-colors ${cartCount > 0 ? "text-[#FF4F00]" : "text-zinc-400"}`}
          >
            <div className="relative">
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-[#FF4F00] text-white text-[9px] font-bold h-3.5 min-w-[14px] px-0.5 rounded-full flex items-center justify-center border border-white">
                  {cartCount}
                </span>
              )}
            </div>
            <span className="text-[9px] font-medium">{t("nav.cart")}</span>
          </button>

          <button
            onClick={() => setContactOpen(o => !o)}
            className="flex flex-col items-center justify-center gap-0.5 w-14"
          >
            <div className="relative">
              {!contactOpen && (
                <>
                  <span className="absolute inset-0 rounded-full bg-[#FF4F00] opacity-25 animate-ping" />
                  <span className="absolute inset-0 rounded-full bg-[#FF4F00] opacity-15 animate-ping [animation-delay:0.5s]" />
                </>
              )}
              <div className={`relative w-8 h-8 rounded-full flex items-center justify-center transition-all ${contactOpen ? "bg-zinc-700" : "bg-[#FF4F00]"}`}>
                {contactOpen
                  ? <X className="w-4 h-4 text-white" />
                  : <WhatsAppIcon className="w-4 h-4 text-white" />
                }
              </div>
            </div>
            <span className={`text-[9px] font-medium ${contactOpen ? "text-[#FF4F00]" : "text-zinc-400"}`}>{t("nav.contact")}</span>
          </button>

        </div>
      </div>

      <style>{`
        @keyframes slideUpContact {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
}
