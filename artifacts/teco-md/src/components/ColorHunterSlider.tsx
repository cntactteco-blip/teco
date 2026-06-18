import { useState, useRef } from "react";
import { ShoppingCart } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { useToast } from "@/hooks/use-toast";
import { useStore } from "@/lib/store";

export default function ColorHunterSlider() {
  const [sliderPos, setSliderPos] = useState(40);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const addItem = useCart((s) => s.addItem);
  const openCart = useCart((s) => s.openCart);
  const { toast } = useToast();

  // Admin-configured images and product
  const settings = useStore((s) => s.settings);
  const allProducts = useStore((s) => s.products);
  const adminProduct = settings.moduleB.productId
    ? allProducts.find((p) => p.id === settings.moduleB.productId) ?? null
    : null;
  const imgLeft  = settings.moduleB.imageLeft  || "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=960&q=85&auto=format&fit=crop";
  const imgRight = settings.moduleB.imageRight || "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=960&q=85&auto=format&fit=crop";

  const calcPos = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setSliderPos((Math.max(0, Math.min(clientX - rect.left, rect.width)) / rect.width) * 100);
  };

  const handleAdd = () => {
    if (!adminProduct) return;
    addItem(adminProduct as any);
    toast({ title: "Adăugat în coș!", description: adminProduct.name });
    setTimeout(() => openCart(), 400);
  };

  return (
    <section className="relative bg-zinc-950 py-12 px-4 text-white overflow-hidden">
      {/* Smooth fade from white sections above */}
      <div className="absolute top-0 left-0 right-0 h-10 bg-gradient-to-b from-white to-transparent pointer-events-none z-10" />
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 md:mb-8">
          <span className="inline-block bg-white/10 text-white/80 text-xs font-bold px-3 py-1 rounded-full mb-3">TEHNOLOGIE EXCLUSIVĂ</span>
          <h2 className="font-black text-2xl md:text-3xl text-white tracking-tight">Color Night Vision — Ziua &amp; Noaptea</h2>
          <p className="text-zinc-400 text-sm mt-1">Trage slider-ul și compară: cameră clasică infraroșu <span className="text-white font-semibold">vs</span> ColorHunter 4K în timp real</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 items-start">
          {/* Slider */}
          <div>
            <div
              ref={containerRef}
              className="relative w-full h-[240px] md:h-[360px] rounded-2xl overflow-hidden select-none cursor-ew-resize border border-white/10"
              style={{ touchAction: "pan-y" }}
              onMouseDown={(e) => { setIsDragging(true); calcPos(e.clientX); }}
              onMouseMove={(e) => { if (isDragging) calcPos(e.clientX); }}
              onMouseUp={() => setIsDragging(false)}
              onMouseLeave={() => setIsDragging(false)}
              onTouchStart={(e) => { setIsDragging(true); calcPos(e.touches[0].clientX); }}
              onTouchMove={(e) => calcPos(e.touches[0].clientX)}
              onTouchEnd={() => setIsDragging(false)}
              data-testid="colorhunter-slider"
            >
              {/* Right: Color image (full layer) */}
              <img src={imgRight} alt="Color Hunter" className="absolute inset-0 w-full h-full object-cover" draggable={false} />

              {/* Left: IR/grayscale overlay clipped to left side */}
              <img
                src={imgLeft}
                alt="IR vision"
                className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)`, filter: "grayscale(1) brightness(0.55) contrast(1.15)" }}
                draggable={false}
              />
              <div
                className="absolute inset-0 pointer-events-none"
                style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)`, background: "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.08) 3px, rgba(0,0,0,0.08) 4px)" }}
              />

              {/* Labels */}
              <div className="absolute top-3 left-3 pointer-events-none z-20" style={{ opacity: sliderPos > 15 ? 1 : 0, transition: "opacity 0.2s" }}>
                <span className="bg-black/70 text-zinc-300 font-mono text-[10px] font-bold px-2 py-1 rounded-sm">IR CLASIC — Alb/Negru</span>
              </div>
              <div className="absolute top-3 right-3 pointer-events-none z-20" style={{ opacity: sliderPos < 85 ? 1 : 0, transition: "opacity 0.2s" }}>
                <span className="bg-green-600/90 text-white font-mono text-[10px] font-bold px-2 py-1 rounded-sm">COLOR HUNTER 4K ✦</span>
              </div>

              {/* Drag handle */}
              <div className="absolute inset-y-0 z-30 flex items-center justify-center pointer-events-none" style={{ left: `${sliderPos}%`, transform: "translateX(-50%)" }}>
                <div className="w-[2px] h-full bg-white/80 shadow-[0_0_12px_rgba(255,255,255,0.6)]" />
                <div className="absolute w-9 h-9 bg-white rounded-full shadow-[0_2px_16px_rgba(0,0,0,0.4)] flex items-center justify-center gap-[3px]">
                  <div className="w-[2px] h-4 bg-zinc-400 rounded-full" /><div className="w-[2px] h-4 bg-zinc-400 rounded-full" />
                </div>
              </div>

              {sliderPos === 40 && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/60 text-white/70 text-[10px] px-2 py-1 rounded-full font-medium pointer-events-none z-20 whitespace-nowrap">
                  ← trage pentru a compara →
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-3 overflow-x-auto no-scrollbar">
              {["0.001 Lux (vs 0.05 IR)", "Apertura F1.0", "H.265+", "IP67 Impermeabil", "IR fallback 30m"].map((s) => (
                <span key={s} className="flex-shrink-0 bg-white/5 border border-white/10 text-zinc-400 text-[10px] px-2.5 py-1 rounded-full font-medium">{s}</span>
              ))}
            </div>
          </div>

          {/* Product card — admin or fallback */}
          {(() => {
            const p = adminProduct ?? {
              id: 201,
              name: "Camera Uniview IPC3612LB ColorHunter 2MP",
              price: 900,
              oldPrice: 1100,
              specs: "2MP | ColorHunter 0.005Lux | F1.0 | PoE | IP67",
              badge: "BEST SELLER",
              brand: "UNIVIEW",
              model: "IPC3612LB",
              imageUrl: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=600&q=85&auto=format&fit=crop",
              category: "camere",
              description: "Color noapte la 0.005 Lux — fără infraroșu.",
              inStock: true,
            };
            const discount = p.oldPrice ? Math.round((1 - p.price / p.oldPrice) * 100) : 0;
            return (
              <div className="bg-white rounded-2xl p-5 text-[#09090B]">
                {p.badge && (
                  <span className="inline-block bg-zinc-900 text-white text-[10px] font-bold px-2.5 py-1 rounded-full mb-3">{p.badge}</span>
                )}
                <div className="bg-zinc-50 rounded-xl overflow-hidden mb-4 relative">
                  <img src={p.imageUrl} alt={p.name} className="w-full h-40 object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                  <div className="absolute top-2 right-2 bg-green-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">COLOR 24/7</div>
                </div>
                <p className="text-[10px] font-bold text-zinc-400 mb-0.5">{p.brand} · {p.model}</p>
                <h3 className="font-bold text-sm leading-tight mb-1">{p.name}</h3>
                <p className="font-mono text-[10px] text-zinc-400 mb-3">{p.specs}</p>
                <div className="flex items-end justify-between mb-4">
                  <div>
                    {p.oldPrice && <p className="text-[10px] text-zinc-400 line-through">{p.oldPrice.toLocaleString()} MDL</p>}
                    <p className="font-mono font-black text-2xl text-[#FF4F00]">{p.price.toLocaleString()} MDL</p>
                  </div>
                  {discount > 0 && (
                    <span className="bg-orange-50 text-[#FF4F00] text-[10px] font-bold px-2 py-0.5 rounded-full">-{discount}%</span>
                  )}
                </div>
                <button onClick={handleAdd} data-testid="colorhunter-add-btn" className="w-full bg-[#FF4F00] text-white font-bold py-3 rounded-xl hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2 text-sm">
                  <ShoppingCart className="w-4 h-4" /> Adaugă în Coș
                </button>
                <p className="text-center text-[10px] text-zinc-400 mt-2">Livrare în 24h · Garanție 5 ani</p>
              </div>
            );
          })()}
        </div>
      </div>
    </section>
  );
}
