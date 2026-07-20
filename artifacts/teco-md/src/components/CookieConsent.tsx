import { useState, useEffect } from "react";
import { Shield, ChevronDown, ChevronUp, X, Check, Settings2 } from "lucide-react";
import {
  getConsent, saveConsent, acceptAll, acceptEssentialOnly, hasConsented,
  type ConsentChoice
} from "@/lib/consent";

type Panel = "main" | "settings";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [panel, setPanel] = useState<Panel>("main");
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const [detailOpen, setDetailOpen] = useState<string | null>(null);

  useEffect(() => {
    if (!hasConsented()) setVisible(true);
  }, []);

  if (!visible) return null;

  const handleAcceptAll = () => { acceptAll(); setVisible(false); };
  const handleEssentialOnly = () => { acceptEssentialOnly(); setVisible(false); };
  const handleSavePreferences = () => {
    saveConsent({ analytics, marketing });
    setVisible(false);
  };

  const categories = [
    {
      id: "essential",
      title: "Cookie-uri esențiale",
      desc: "Necesare pentru funcționarea site-ului. Nu pot fi dezactivate. Include: coșul de cumpărături, preferințe limbă, sesiunea de cumpărare.",
      examples: ["teco_cart", "teco_wishlist", "teco_session_id"],
      always: true,
    },
    {
      id: "analytics",
      title: "Analytics & performanță",
      desc: "Ne ajută să înțelegem cum folosești site-ul pentru a-l îmbunătăți. Datele sunt anonimizate. Include Google Analytics.",
      examples: ["_ga", "_gid"],
      value: analytics,
      onChange: setAnalytics,
    },
    {
      id: "marketing",
      title: "Marketing & publicitate",
      desc: "Folosite pentru a-ți arăta reclame relevante pe alte site-uri. Include Facebook Pixel.",
      examples: ["_fbp", "_fbc"],
      value: marketing,
      onChange: setMarketing,
    },
  ];

  return (
    <>
      {/* Overlay semi-transparent pe mobile */}
      <div className="fixed inset-0 bg-black/40 z-[9998] md:hidden" />

      {/* Banner */}
      <div className="fixed bottom-0 left-0 right-0 z-[9999] md:bottom-4 md:left-4 md:right-4 md:max-w-xl md:mx-auto">
        <div className="bg-white border border-zinc-200 rounded-t-3xl md:rounded-3xl shadow-2xl overflow-hidden">

          {panel === "main" ? (
            <div className="p-5 md:p-6">
              {/* Header */}
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 bg-[#FF4F00]/10 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <Shield className="w-5 h-5 text-[#FF4F00]" />
                </div>
                <div>
                  <h3 className="font-black text-zinc-900 text-base">Confidențialitatea ta contează</h3>
                  <p className="text-xs text-zinc-500 mt-0.5 leading-relaxed">
                    Folosim cookie-uri pentru a-ți oferi cea mai bună experiență. Poți alege ce permiți.
                  </p>
                </div>
              </div>

              <p className="text-xs text-zinc-600 leading-relaxed mb-4">
                Prin utilizarea site-ului TECO.MD, ești de acord cu{" "}
                <a href="/confidentialitate" className="text-[#FF4F00] underline underline-offset-2">Politica de Confidențialitate</a>
                {" "}și{" "}
                <a href="/termeni" className="text-[#FF4F00] underline underline-offset-2">Termenii și Condițiile</a>.
                Datele tale sunt prelucrate conform{" "}
                <span className="font-medium text-zinc-700">Legii nr. 133/2011</span> privind protecția datelor cu caracter personal (Republica Moldova).
              </p>

              {/* Butoane */}
              <div className="flex flex-col gap-2">
                <button
                  onClick={handleAcceptAll}
                  className="w-full bg-[#FF4F00] text-white font-black py-3.5 rounded-2xl text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" /> Accept Toate Cookie-urile
                </button>
                <div className="flex gap-2">
                  <button
                    onClick={handleEssentialOnly}
                    className="flex-1 bg-zinc-100 text-zinc-700 font-bold py-3 rounded-2xl text-xs hover:bg-zinc-200 transition-colors"
                  >
                    Doar Esențiale
                  </button>
                  <button
                    onClick={() => setPanel("settings")}
                    className="flex-1 bg-zinc-100 text-zinc-700 font-bold py-3 rounded-2xl text-xs hover:bg-zinc-200 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Settings2 className="w-3.5 h-3.5" /> Preferințe
                  </button>
                </div>
              </div>
            </div>

          ) : (
            <div className="p-5 md:p-6">
              {/* Header preferințe */}
              <div className="flex items-center gap-3 mb-4">
                <button onClick={() => setPanel("main")} className="text-zinc-400 hover:text-zinc-700 transition-colors">
                  <X className="w-5 h-5" />
                </button>
                <h3 className="font-black text-zinc-900 text-base">Preferințe Cookie</h3>
              </div>

              <div className="space-y-2 mb-5 max-h-64 overflow-y-auto">
                {categories.map((cat) => (
                  <div key={cat.id} className="border border-zinc-200 rounded-2xl overflow-hidden">
                    <button
                      className="w-full flex items-center justify-between px-4 py-3 text-left"
                      onClick={() => setDetailOpen(detailOpen === cat.id ? null : cat.id)}
                    >
                      <div className="flex items-center gap-3">
                        {cat.always ? (
                          <span className="text-[10px] font-black bg-green-100 text-green-700 px-2 py-0.5 rounded-full">NECESAR</span>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); cat.onChange?.(!cat.value); }}
                            className={`w-10 h-5 rounded-full transition-colors flex-shrink-0 relative ${cat.value ? "bg-[#FF4F00]" : "bg-zinc-300"}`}
                          >
                            <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${cat.value ? "translate-x-5" : "translate-x-0.5"}`} />
                          </button>
                        )}
                        <span className="text-sm font-bold text-zinc-800">{cat.title}</span>
                      </div>
                      {detailOpen === cat.id ? <ChevronUp className="w-4 h-4 text-zinc-400" /> : <ChevronDown className="w-4 h-4 text-zinc-400" />}
                    </button>
                    {detailOpen === cat.id && (
                      <div className="px-4 pb-3 text-xs text-zinc-500 leading-relaxed border-t border-zinc-100">
                        <p className="mt-2 mb-1">{cat.desc}</p>
                        <p className="text-zinc-400">Cookie-uri: <span className="font-mono">{cat.examples.join(", ")}</span></p>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleSavePreferences}
                  className="flex-1 bg-[#FF4F00] text-white font-black py-3.5 rounded-2xl text-sm hover:opacity-90 transition-opacity"
                >
                  Salvează Preferințele
                </button>
                <button
                  onClick={handleAcceptAll}
                  className="flex-1 bg-zinc-100 text-zinc-700 font-bold py-3.5 rounded-2xl text-sm hover:bg-zinc-200 transition-colors"
                >
                  Accept Toate
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
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
