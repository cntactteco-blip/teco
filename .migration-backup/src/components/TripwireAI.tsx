import { useState, useEffect } from "react";
import { Check, ShoppingCart } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { useToast } from "@/hooks/use-toast";

const BG_IMAGE = "https://images.unsplash.com/photo-1590736704728-f4730bb30770?w=960&q=80&auto=format&fit=crop";

const product = {
  id: 401,
  name: "Înregistrator Video (NVR) Dahua WizSense 8 Canale",
  price: 4750,
  specs: "8CH | 4K | AI SMD+ | H.265+ | HDMI",
  icon: "Server",
  badge: "AI",
  category: "nvr",
};

export default function TripwireAI() {
  const [count, setCount] = useState(47);
  const [isTriggered, setIsTriggered] = useState(false);
  const [silhouetteX, setSilhouetteX] = useState(-60);
  const [time, setTime] = useState("");
  const addItem = useCart((s) => s.addItem);
  const openCart = useCart((s) => s.openCart);
  const { toast } = useToast();

  useEffect(() => {
    const update = () => {
      const now = new Date();
      const d = now.toLocaleDateString("ro-RO", { day: "2-digit", month: "2-digit", year: "numeric" });
      const t = now.toTimeString().slice(0, 8);
      setTime(`${d} | ${t}`);
    };
    update();
    const iv = setInterval(update, 1000);
    return () => clearInterval(iv);
  }, []);

  // Animate silhouette across the screen
  useEffect(() => {
    let x = -60;
    let frame: number;
    const SPEED = 1.2;
    const MAX = 560;

    const step = () => {
      x += SPEED;
      if (x > MAX) x = -60;
      setSilhouetteX(x);

      // Trigger tripwire when crossing ~center
      if (x > 220 && x < 224) {
        setIsTriggered(true);
        setCount((c) => c + 1);
        setTimeout(() => setIsTriggered(false), 600);
      }
      frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, []);

  const handleAdd = () => {
    addItem(product as any);
    toast({ title: "Adăugat în coș!", description: product.name });
    setTimeout(() => openCart(), 400);
  };

  return (
    <section className="relative bg-zinc-950 py-12 px-4 text-white overflow-hidden">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-center">

        {/* Left: Live simulation */}
        <div>
          <span className="inline-block bg-white/10 text-white/80 text-xs font-bold px-3 py-1 rounded-full mb-3">DETECTARE INSTANTĂ</span>
          <h2 className="font-black text-2xl md:text-3xl mb-1 tracking-tight">AI Tripwire & Analytics</h2>
          <p className="text-zinc-400 text-sm mb-5">
            Linie virtuală configurabilă. Orice traversare = alertă instant pe telefon — ziua și noaptea.
          </p>

          <div className="relative h-[220px] md:h-[300px] rounded-2xl overflow-hidden border border-white/10">
            {/* Background: real parking lot image */}
            <img
              src={BG_IMAGE}
              alt="Parcare supravegheată"
              className="absolute inset-0 w-full h-full object-cover opacity-70"
              draggable={false}
            />
            {/* Dark gradient overlay for readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

            {/* LIVE badge */}
            <div className="absolute top-3 left-3 bg-black/50 px-2 py-1 rounded-sm flex items-center gap-1.5 z-20">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="font-mono text-[10px] font-bold text-red-400">● REC | AI ACTIV</span>
            </div>

            {/* Camera channel */}
            <div className="absolute top-3 right-3 font-mono text-[10px] text-white/50 z-20">CAM 02 / CH04</div>

            {/* Tripwire line */}
            <div
              className="absolute z-10 transition-all duration-100"
              style={{
                top: "62%",
                left: "10%",
                right: "10%",
                height: "2px",
                background: isTriggered
                  ? "rgba(74, 222, 128, 0.95)"
                  : "rgba(250, 204, 21, 0.85)",
                boxShadow: isTriggered
                  ? "0 0 10px #4ade80, 0 0 30px rgba(74,222,128,0.5)"
                  : "0 0 8px rgba(250,204,21,0.6)",
              }}
            />

            {/* Tripwire label */}
            <div
              className="absolute z-10 transition-colors duration-100"
              style={{ top: "calc(62% - 18px)", left: "10%" }}
            >
              <span
                className="font-mono text-[9px] font-bold px-1.5 py-0.5 rounded-sm"
                style={{
                  background: isTriggered ? "rgba(74,222,128,0.2)" : "rgba(250,204,21,0.15)",
                  color: isTriggered ? "#4ade80" : "#facc15",
                  border: `1px solid ${isTriggered ? "rgba(74,222,128,0.4)" : "rgba(250,204,21,0.3)"}`,
                }}
              >
                {isTriggered ? "⚡ TRIPWIRE DECLANȘAT!" : "─── LINIE VIRTUALĂ ───"}
              </span>
            </div>

            {/* Alert flash */}
            {isTriggered && (
              <div className="absolute inset-0 border-2 border-red-500/80 rounded-2xl z-20 pointer-events-none animate-pulse" />
            )}

            {/* Moving silhouette — human shape */}
            <div
              className="absolute z-15 pointer-events-none"
              style={{
                bottom: "28%",
                left: 0,
                transform: `translateX(${silhouetteX}px)`,
              }}
            >
              {/* Head */}
              <div className="w-5 h-5 rounded-full bg-zinc-200/80 mx-auto mb-0.5" />
              {/* Body */}
              <div className="w-4 h-8 bg-zinc-300/80 rounded-sm mx-auto" />
              {/* Legs */}
              <div className="flex gap-0.5 justify-center mt-0.5">
                <div className="w-1.5 h-4 bg-zinc-300/80 rounded-sm" />
                <div className="w-1.5 h-4 bg-zinc-300/80 rounded-sm" />
              </div>
              {/* Detection box */}
              <div
                className="absolute -inset-2 border rounded transition-colors duration-100"
                style={{
                  borderColor: isTriggered ? "rgba(239,68,68,0.9)" : "rgba(74,222,128,0.7)",
                  boxShadow: isTriggered ? "0 0 8px rgba(239,68,68,0.4)" : "0 0 4px rgba(74,222,128,0.3)",
                }}
              >
                <span
                  className="absolute -top-4 left-0 font-mono text-[8px] font-bold whitespace-nowrap"
                  style={{ color: isTriggered ? "#ef4444" : "#4ade80" }}
                >
                  {isTriggered ? "⚠ ALERTĂ" : "PERSOANĂ ✓"}
                </span>
              </div>
            </div>

            {/* Timestamp */}
            <div className="absolute bottom-3 left-3 font-mono text-[9px] text-white/50 z-20">{time}</div>

            {/* Counter */}
            <div className="absolute bottom-3 right-3 bg-black/60 rounded-lg px-2.5 py-1.5 z-20 text-right">
              <div className="font-mono text-xs text-green-400 font-bold">INTRĂRI: {count}</div>
              <div className="font-mono text-[9px] text-zinc-500">ALERTE TRIMISE: {count}</div>
            </div>
          </div>

          <div className="flex gap-2 mt-3 flex-wrap">
            {["Tripwire / Intrusion Zone", "Detectare Față & Plăcuță Auto", "Alertă Push pe Telefon"].map((f) => (
              <span key={f} className="flex items-center gap-1 text-[11px] text-zinc-400 bg-white/5 border border-white/10 px-2.5 py-1 rounded-full">
                <Check className="w-3 h-3 text-green-400" />{f}
              </span>
            ))}
          </div>
        </div>

        {/* Right: Product card */}
        <div className="bg-white rounded-2xl overflow-hidden text-[#09090B]">
          <div className="relative h-44 bg-zinc-100 overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80&auto=format&fit=crop"
              alt={product.name}
              className="w-full h-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
            <span className="absolute top-3 right-3 bg-zinc-900 text-white text-[10px] font-bold px-2.5 py-1 rounded-full">INTELIGENȚĂ ARTIFICIALĂ</span>
          </div>

          <div className="p-5">
            <p className="text-xs text-zinc-400 font-semibold mb-1">Înregistrator Video AI Recomandat</p>
            <h3 className="font-bold text-base leading-tight mb-2">{product.name}</h3>
            <span className="inline-block font-mono text-[10px] text-zinc-500 bg-zinc-50 px-2 py-1 rounded-lg mb-3">{product.specs}</span>

            <ul className="space-y-1.5 mb-4">
              {["Tripwire / Intrusion Detection", "Recunoaștere Fețe & Plăcuțe Auto", "Analiză Trafic Persoane/Vehicule"].map((f) => (
                <li key={f} className="flex items-center gap-2 text-xs text-zinc-600">
                  <Check className="w-3.5 h-3.5 text-[#10B981] flex-shrink-0" />{f}
                </li>
              ))}
            </ul>

            <div className="flex items-end justify-between mb-4">
              <p className="font-mono font-black text-2xl text-[#09090B]">{product.price.toLocaleString()} MDL</p>
              <span className="text-[10px] text-zinc-400">+TVA inclus</span>
            </div>

            <button
              onClick={handleAdd}
              data-testid="tripwire-add-btn"
              className="w-full bg-[#FF4F00] text-white font-bold py-3 rounded-xl hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2 text-sm"
            >
              <ShoppingCart className="w-4 h-4" /> Adaugă în Coș
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
