import { Home, Grid2x2, ShoppingCart, X } from "lucide-react";
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
      <path d="M11.398.002C8.195.017 3.76.46 1.517 2.53 -.024 4.07-.498 6.304-.554 9.073c-.055 2.77-.12 7.958 4.874 9.359h.004l-.004 2.146s-.033.876.545.876c.578 0 .875-.645 1.366-1.237c.276-.327.653-.807.938-1.16c2.586.217 4.573-.28 4.802-.355c.522-.168 3.476-.548 3.955-4.47c.495-4.043-.24-6.598-1.533-7.757zm.064 13.748c-.378.087-.78.132-1.191.136a5.6 5.6 0 01-.98-.085l-1.065 1.252-.005-2.618c-3.317-1.132-3.13-5.29-3.086-7.372c.045-2.08.437-3.785 1.644-4.867C8.985.92 12.396.613 13.6.607c1.213-.007 4.625.022 6.66 1.83c2.036 1.808 1.86 5.836 1.86 5.836c-.365 3.253-2.693 4.207-3.153 4.364c-.182.06-1.682.46-3.568.347zM15.24 9.516a.469.469 0 01-.468-.476c0-.092.025-.178.07-.25-.03-.08-.063-.169-.1-.267a1.26 1.26 0 00-.175-.35 2.21 2.21 0 00-.612-.548c-.354-.215-.7-.29-.9-.3h-.044a.47.47 0 01-.468-.47c0-.263.211-.475.474-.475l.044.001c.31.015.852.123 1.374.445.296.18.56.41.785.686.16.196.293.41.394.64.058.133.105.26.143.38a.472.472 0 01-.517.184zm1.658 1.027a.471.471 0 01-.47-.471 3.23 3.23 0 00-.094-.78 4.247 4.247 0 00-.49-1.205 4.003 4.003 0 00-.873-.994 3.784 3.784 0 00-1.57-.76 3.91 3.91 0 00-.67-.086.47.47 0 01-.46-.479.47.47 0 01.479-.46c.273.006.548.039.817.1.73.167 1.4.507 1.956.983.463.395.85.878 1.14 1.422.25.472.423.984.51 1.513.04.24.059.484.059.737a.471.471 0 01-.334.48zm1.628 1.123a.47.47 0 01-.472-.468 6.244 6.244 0 00-.042-.73 6.803 6.803 0 00-.654-2.288 6.416 6.416 0 00-1.308-1.797 5.925 5.925 0 00-1.87-1.21 5.957 5.957 0 00-1.44-.384 6.29 6.29 0 00-.798-.048.47.47 0 01-.47-.47c0-.26.21-.47.47-.47.305 0 .61.018.91.055.666.08 1.315.265 1.918.548a6.83 6.83 0 012.18 1.436c.627.62 1.11 1.36 1.421 2.175.237.624.372 1.283.4 1.95.008.18.012.36.012.64a.47.47 0 01-.257.061z" />
    </svg>
  );
}

export function BottomNav() {
  const { t } = useLang();
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
  const viberLink = `viber://chat?number=%2B${phone.replace(/\D/g, "")}`;

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
