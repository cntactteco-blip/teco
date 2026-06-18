import { useState, useRef } from "react";

export function BentoGrid() {
  const [isHovered, setIsHovered] = useState(false);
  const [sliderPos, setSliderPos] = useState(50);
  const sliderRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    setSliderPos((x / rect.width) * 100);
  };

  return (
    <section className="w-full bg-white py-16 px-6 border-b border-zinc-200">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0 border-t border-l border-zinc-200">
        
        {/* Block 1 - AI Simulation */}
        <div 
          className="relative h-64 border-r border-b border-zinc-200 bg-zinc-900 overflow-hidden group cursor-crosshair flex flex-col justify-end p-6"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Simulated view */}
          <div className="absolute inset-0 opacity-40 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-zinc-700 via-zinc-900 to-black"></div>
          
          {/* Moving dot */}
          <div className={`absolute top-1/2 left-1/4 w-4 h-4 bg-zinc-400 rounded-full transition-all duration-1000 ${isHovered ? 'translate-x-32' : ''}`} />
          
          {/* Targeting box */}
          {isHovered && (
            <div className="absolute top-1/2 left-1/4 translate-x-32 -translate-y-2 w-12 h-12 border-2 border-red-500 rounded-sm animate-pulse flex items-center justify-center">
               <div className="absolute -top-6 left-0 text-[10px] font-mono text-red-500 whitespace-nowrap bg-black px-1">
                 Alerta AI trimisa pe telefon
               </div>
            </div>
          )}

          <div className="relative z-10 font-mono text-sm text-white">AI Detection Live</div>
        </div>

        {/* Block 2 - Day/Night Slider */}
        <div 
          className="relative h-64 border-r border-b border-zinc-200 overflow-hidden cursor-ew-resize select-none"
          ref={sliderRef}
          onMouseMove={handleMouseMove}
          onTouchMove={handleMouseMove}
        >
          {/* Colored Night Vision (Right) */}
          <div className="absolute inset-0 bg-blue-900 flex items-center justify-center">
             <div className="w-full h-full bg-[linear-gradient(45deg,#0e1e38,#1f3d6b)] opacity-80" />
          </div>
          
          {/* Grayscale Night Vision (Left) */}
          <div 
            className="absolute inset-0 bg-zinc-800 flex items-center justify-center border-r border-white/50"
            style={{ width: `${sliderPos}%` }}
          >
             <div className="w-full h-full bg-[linear-gradient(45deg,#2a2a2a,#4a4a4a)] grayscale contrast-75 brightness-75" />
          </div>
          
          {/* Slider Handle */}
          <div 
            className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize shadow-[0_0_10px_rgba(0,0,0,0.5)]"
            style={{ left: `calc(${sliderPos}% - 2px)` }}
          >
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-white border border-zinc-200 rounded-full flex items-center justify-center shadow-sm">
              <div className="w-0.5 h-3 bg-zinc-400 mx-[1px]" />
              <div className="w-0.5 h-3 bg-zinc-400 mx-[1px]" />
            </div>
          </div>

          <div className="absolute bottom-6 left-6 z-10 font-mono text-sm text-white drop-shadow-md">
            Color Night Vision 4K
          </div>
        </div>

        {/* Block 3 - Stock Ticker */}
        <div className="relative h-64 border-r border-b border-zinc-200 bg-zinc-50 flex items-center justify-center p-6 lg:col-span-1 md:col-span-2">
           <div className="flex flex-col w-full">
              <div className="flex items-center space-x-2 mb-4">
                <span className="w-3 h-3 bg-red-500 animate-pulse" />
                <span className="font-mono text-xs text-red-500 font-bold uppercase">Stoc Limitat</span>
              </div>
              <p className="font-mono text-lg text-zinc-900">
                Ultimele 3 registratoare NVR in stoc cu reducere — 
                <span className="bg-primary text-white px-2 py-1 ml-2 font-bold">-15%</span>
              </p>
           </div>
        </div>

        {/* Block 4 - Trust Metrics */}
        <div className="relative h-64 border-r border-b border-zinc-200 bg-white grid grid-cols-2 grid-rows-2 md:col-span-2 lg:col-span-3">
           <div className="border-r border-b border-zinc-100 flex flex-col items-center justify-center text-center p-4">
             <span className="font-mono text-3xl md:text-4xl font-bold text-zinc-900">1,200+</span>
             <span className="font-mono text-xs text-zinc-500 mt-2">Instalari</span>
           </div>
           <div className="border-b border-zinc-100 flex flex-col items-center justify-center text-center p-4">
             <span className="font-mono text-3xl md:text-4xl font-bold text-zinc-900">4.9</span>
             <span className="font-mono text-xs text-zinc-500 mt-2">Rating</span>
           </div>
           <div className="border-r border-zinc-100 flex flex-col items-center justify-center text-center p-4">
             <span className="font-mono text-3xl md:text-4xl font-bold text-zinc-900">48h</span>
             <span className="font-mono text-xs text-zinc-500 mt-2">Livrare</span>
           </div>
           <div className="flex flex-col items-center justify-center text-center p-4">
             <span className="font-mono text-3xl md:text-4xl font-bold text-zinc-900">5 Ani</span>
             <span className="font-mono text-xs text-zinc-500 mt-2">Garantie</span>
           </div>
        </div>

      </div>
    </section>
  );
}
