import { useState, useEffect } from "react";
import { useStore } from "@/lib/store";

export function Hero() {
  const settings = useStore((s) => s.settings);
  const [objective, setObjective] = useState<"Casa" | "Business" | "Depozit">("Casa");
  const [cameras, setCameras] = useState<"2" | "4" | "8+">("2");
  const [quality, setQuality] = useState<"Pro HD" | "4K AI">("Pro HD");
  const [price, setPrice] = useState(2450);

  useEffect(() => {
    let base = 2450;
    if (objective === "Business") base += 1000;
    if (objective === "Depozit") base += 2000;
    
    if (cameras === "4") base += 1200;
    if (cameras === "8+") base += 3500;
    
    if (quality === "4K AI") base += 1800;

    setPrice(base);
  }, [objective, cameras, quality]);

  return (
    <section className="w-full bg-white border-b border-zinc-200">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row min-h-[500px]">
        {/* Left Column */}
        <div className="flex-1 p-8 lg:p-16 flex flex-col justify-center border-b lg:border-b-0 lg:border-r border-zinc-200">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.1] text-zinc-950 mb-8 max-w-2xl tracking-tight">
            Securitate fara compromisuri. Sisteme AI configurate pentru Moldova.
          </h1>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono text-sm text-zinc-600 mt-auto">
            <div className="flex flex-col border-t border-zinc-200 pt-4">
              <span className="font-bold text-zinc-900 mb-1">Stoc Real in Chisinau</span>
              <span>Livrari instant</span>
            </div>
            <div className="flex flex-col border-t border-zinc-200 pt-4">
              <span className="font-bold text-zinc-900 mb-1">Echipamente Premium</span>
              <span>UNV, Dahua, Tiandy</span>
            </div>
            <div className="flex flex-col border-t border-zinc-200 pt-4">
              <span className="font-bold text-zinc-900 mb-1">Instalare Profesionala Inclusa</span>
              <span>Garantie montaj</span>
            </div>
          </div>
        </div>

        {/* Hero media — shown between text and configurator when set */}
        {settings.hero?.bannerMedia && (
          <div className="w-full lg:w-[380px] flex-shrink-0 relative overflow-hidden bg-zinc-950">
            {settings.hero.bannerMediaType === "video" ? (
              <video
                src={settings.hero.bannerMedia}
                autoPlay muted loop playsInline
                className="w-full h-full object-cover min-h-[260px] max-h-[500px]"
              />
            ) : (
              <img
                src={settings.hero.bannerMedia}
                alt="Hero promo"
                className="w-full h-full object-cover min-h-[260px] max-h-[500px]"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent pointer-events-none" />
          </div>
        )}

        {/* Right Column - Configurator */}
        <div className={`${settings.hero?.bannerMedia ? "w-full lg:w-[420px]" : "w-full lg:w-[480px]"} bg-zinc-50 p-8 lg:p-12 flex flex-col`}>
          <div className="font-mono text-xs font-bold text-zinc-400 mb-8 uppercase tracking-widest">
            Smart Configurator Instant
          </div>

          <div className="space-y-8 flex-1">
            {/* Step 1 */}
            <div>
              <label className="block font-mono text-xs text-zinc-500 mb-3">01. Obiectiv</label>
              <div className="flex border border-zinc-200 bg-white">
                {["Casa", "Business", "Depozit"].map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setObjective(opt as any)}
                    className={`flex-1 py-3 text-sm font-medium border-r border-zinc-200 last:border-r-0 transition-colors ${
                      objective === opt ? "bg-zinc-900 text-white" : "text-zinc-600 hover:bg-zinc-50"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {/* Step 2 */}
            <div>
              <label className="block font-mono text-xs text-zinc-500 mb-3">02. Numar Camere</label>
              <div className="flex border border-zinc-200 bg-white">
                {["2", "4", "8+"].map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setCameras(opt as any)}
                    className={`flex-1 py-3 text-sm font-medium border-r border-zinc-200 last:border-r-0 transition-colors ${
                      cameras === opt ? "bg-zinc-900 text-white" : "text-zinc-600 hover:bg-zinc-50"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {/* Step 3 */}
            <div>
              <label className="block font-mono text-xs text-zinc-500 mb-3">03. Calitate Imagine</label>
              <div className="flex border border-zinc-200 bg-white">
                {["Pro HD", "4K AI"].map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setQuality(opt as any)}
                    className={`flex-1 py-3 text-sm font-medium border-r border-zinc-200 last:border-r-0 transition-colors ${
                      quality === opt ? "bg-zinc-900 text-white" : "text-zinc-600 hover:bg-zinc-50"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-zinc-200">
            <div className="flex items-end justify-between mb-6">
              <span className="font-mono text-sm text-zinc-500">Estimare</span>
              <span className="font-mono text-3xl font-bold text-zinc-900">{price.toLocaleString()} MDL</span>
            </div>
            
            <button className="w-full bg-primary hover:bg-[#E64600] text-white py-4 font-bold transition-colors">
              Rezerva Kitul + Obtine Consultanta Gratuita
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
