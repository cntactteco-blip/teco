import { useState, useEffect } from "react";
import { X, Check, Settings2, ChevronDown, ChevronUp, Cookie } from "lucide-react";
import { saveConsent, acceptAll, acceptEssentialOnly, hasConsented } from "@/lib/consent";

type Panel = "bar" | "expanded";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [panel, setPanel] = useState<Panel>("bar");
  const [analytics, setAnalytics] = useState(true);
  const [marketing, setMarketing] = useState(false);
  const [detailOpen, setDetailOpen] = useState<string | null>(null);

  useEffect(() => {
    if (!hasConsented()) setVisible(true);
  }, []);

  if (!visible) return null;

  const handleAcceptAll = () => { acceptAll(); setVisible(false); };
  const handleEssentialOnly = () => { acceptEssentialOnly(); setVisible(false); };
  const handleSavePreferences = () => { saveConsent({ analytics, marketing }); setVisible(false); };

  const categories = [
    {
      id: "essential",
      title: "Esențiale",
      desc: "Necesare pentru funcționare: coș, limbă, sesiune. Nu pot fi dezactivate.",
      always: true,
    },
    {
      id: "analytics",
      title: "Analytics",
      desc: "Ne ajută să îmbunătățim site-ul. Date anonimizate (Google Analytics).",
      value: analytics,
      onChange: setAnalytics,
    },
    {
      id: "marketing",
      title: "Marketing",
      desc: "Reclame relevante pe alte platforme (Facebook Pixel).",
      value: marketing,
      onChange: setMarketing,
    },
  ];

  /* ── Mini-bar (default pe mobile) ─────────────────────────────────── */
  if (panel === "bar") {
    return (
      <div className="fixed bottom-[64px] md:bottom-4 left-3 right-3 md:left-auto md:right-4 md:w-auto z-[9999]
                      animate-in slide-in-from-bottom-2 duration-300">
        <div className="bg-zinc-900/95 backdrop-blur-sm text-white rounded-2xl shadow-2xl
                        flex items-center gap-2.5 px-3.5 py-2.5 md:px-4 md:py-3">

          {/* Iconiță mică */}
          <Cookie className="w-4 h-4 text-[#FF4F00] flex-shrink-0" />

          {/* Text compact */}
          <p className="text-xs text-zinc-300 flex-1 min-w-0 leading-tight">
            Folosim cookie-uri.{" "}
            <button
              onClick={() => setPanel("expanded")}
              className="text-[#FF4F00] underline underline-offset-2 hover:opacity-80 transition-opacity whitespace-nowrap"
            >
              Detalii
            </button>
          </p>

          {/* Butoane acțiune */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              onClick={handleEssentialOnly}
              className="text-[10px] font-semibold text-zinc-400 hover:text-zinc-200 transition-colors px-2 py-1.5 rounded-lg hover:bg-white/10"
            >
              Esențiale
            </button>
            <button
              onClick={handleAcceptAll}
              className="bg-[#FF4F00] text-white text-[11px] font-black px-3 py-1.5 rounded-xl
                         hover:opacity-90 active:scale-95 transition-all flex items-center gap-1"
            >
              <Check className="w-3 h-3" /> Accept
            </button>
          </div>

          {/* X */}
          <button
            onClick={handleEssentialOnly}
            className="text-zinc-500 hover:text-zinc-300 transition-colors ml-0.5 flex-shrink-0"
            aria-label="Acceptă esențiale și închide"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  /* ── Panoul extins cu preferințe ─────────────────────────────────── */
  return (
    <div className="fixed inset-0 z-[9999] flex items-end md:items-end md:justify-end md:p-4">
      {/* Overlay tap-to-dismiss */}
      <div className="absolute inset-0 bg-black/30" onClick={() => setPanel("bar")} />

      <div className="relative w-full md:w-96 bg-white rounded-t-3xl md:rounded-3xl shadow-2xl
                      animate-in slide-in-from-bottom-3 duration-300 max-h-[85vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-zinc-100 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-[#FF4F00]/10 rounded-xl flex items-center justify-center">
              <Cookie className="w-4 h-4 text-[#FF4F00]" />
            </div>
            <span className="font-black text-zinc-900 text-sm">Preferințe Cookie</span>
          </div>
          <button
            onClick={() => setPanel("bar")}
            className="w-7 h-7 flex items-center justify-center text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-full transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Categorii */}
        <div className="overflow-y-auto flex-1 px-4 py-3 space-y-2">
          <p className="text-[11px] text-zinc-400 leading-relaxed px-1 pb-1">
            Prin utilizarea site-ului TECO.MD ești de acord cu{" "}
            <a href="/confidentialitate" className="text-[#FF4F00] underline underline-offset-1">Politica de Confidențialitate</a>
            {" "}și{" "}
            <a href="/termeni" className="text-[#FF4F00] underline underline-offset-1">Termenii și Condițiile</a>.
          </p>

          {categories.map((cat) => (
            <div key={cat.id} className="border border-zinc-100 rounded-2xl overflow-hidden">
              <button
                className="w-full flex items-center justify-between px-4 py-3 text-left bg-zinc-50 hover:bg-zinc-100 transition-colors"
                onClick={() => setDetailOpen(detailOpen === cat.id ? null : cat.id)}
              >
                <div className="flex items-center gap-3">
                  {cat.always ? (
                    <span className="text-[9px] font-black bg-green-100 text-green-700 px-2 py-0.5 rounded-full tracking-wide">NECESAR</span>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); cat.onChange?.(!cat.value); }}
                      className={`w-9 h-5 rounded-full transition-colors flex-shrink-0 relative ${cat.value ? "bg-[#FF4F00]" : "bg-zinc-300"}`}
                    >
                      <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${cat.value ? "translate-x-4" : "translate-x-0.5"}`} />
                    </button>
                  )}
                  <span className="text-sm font-bold text-zinc-800">{cat.title}</span>
                </div>
                {detailOpen === cat.id
                  ? <ChevronUp className="w-3.5 h-3.5 text-zinc-400" />
                  : <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />}
              </button>
              {detailOpen === cat.id && (
                <div className="px-4 py-3 text-xs text-zinc-500 leading-relaxed border-t border-zinc-100 bg-white">
                  {cat.desc}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Butoane fixe jos */}
        <div className="px-4 pb-5 pt-3 flex gap-2 flex-shrink-0 border-t border-zinc-100">
          <button
            onClick={handleSavePreferences}
            className="flex-1 bg-[#FF4F00] text-white font-black py-3 rounded-2xl text-sm hover:opacity-90 transition-opacity"
          >
            Salvează
          </button>
          <button
            onClick={handleAcceptAll}
            className="flex-1 bg-zinc-100 text-zinc-700 font-bold py-3 rounded-2xl text-sm hover:bg-zinc-200 transition-colors"
          >
            Accept Toate
          </button>
        </div>
      </div>
    </div>
  );
}

/** Buton mic pentru retragerea consimțământului — montat în Footer */
export function ReopenConsentButton() {
  const reopen = () => {
    try { localStorage.removeItem("teco_cookie_consent"); } catch {}
    window.location.reload();
  };
  return (
    <button
      onClick={reopen}
      className="text-xs text-zinc-400 hover:text-zinc-200 transition-colors underline underline-offset-2"
    >
      Preferințe Cookie
    </button>
  );
}
