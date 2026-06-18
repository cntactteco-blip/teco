import { useState } from "react";
import { useCart } from "@/hooks/useCart";
import { useToast } from "@/hooks/use-toast";

const PRODUCTS = [
  {
    id: 1,
    name: "Camera Turret Tiandy 5MP AI",
    price: 3290,
    oldPrice: 3890,
    specs: "5MP | AI | IR 40m",
    badge: null
  },
  {
    id: 2,
    name: "Registrator NVR 8 Canale Dahua WizSense",
    price: 4750,
    oldPrice: null,
    specs: "8CH | 4K | SMD Plus",
    badge: null
  },
  {
    id: 3,
    name: "Kit Complet Teco Pro-Solar",
    price: 8900,
    oldPrice: null,
    specs: "4 Camere | Panou Solar | 4G",
    badge: "BEST SELLER"
  },
  {
    id: 4,
    name: "Sistem Alarma Wireless Ajax Starter",
    price: 5200,
    oldPrice: null,
    specs: "Hub | Motion | Door | SpaceControl",
    badge: null
  }
];

export function ProductCatalog() {
  const addItem = useCart((state) => state.addItem);
  const { toast } = useToast();
  const [addedIds, setAddedIds] = useState<Record<number, boolean>>({});

  const handleAdd = (id: number) => {
    const product = PRODUCTS.find((p) => p.id === id);
    if (!product) return;
    addItem({ id: product.id, name: product.name, price: product.price });
    setAddedIds(prev => ({ ...prev, [id]: true }));
    
    toast({
      title: "Produsul a fost rezervat",
      description: "Stoc asigurat. Poti finaliza comanda in cos.",
      duration: 3000,
    });

    setTimeout(() => {
      setAddedIds(prev => ({ ...prev, [id]: false }));
    }, 2000);
  };

  return (
    <section className="w-full bg-zinc-50 py-16 px-6 border-b border-zinc-200">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold text-zinc-900 mb-10 tracking-tight">Echipamente Recomandate</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {PRODUCTS.map((p) => (
            <div key={p.id} className="bg-white border border-zinc-200 flex flex-col p-6 rounded-sm relative">
              {p.badge && (
                <div className="absolute top-4 right-4 bg-zinc-900 text-white font-mono text-[10px] font-bold px-2 py-1">
                  {p.badge}
                </div>
              )}
              
              <div className="h-40 bg-zinc-50 border border-zinc-100 mb-6 flex items-center justify-center">
                 <div className="w-16 h-16 border-2 border-zinc-200 rounded-full flex items-center justify-center">
                    <div className="w-6 h-6 bg-zinc-300 rounded-full" />
                 </div>
              </div>

              <div className="flex-1">
                <h3 className="text-sm font-semibold text-zinc-900 leading-tight mb-2 h-10">{p.name}</h3>
                <p className="font-mono text-xs text-zinc-500 mb-4">{p.specs}</p>
                
                <div className="flex items-baseline gap-2 mb-6">
                  <span className="font-mono text-xl font-bold text-zinc-900">{p.price.toLocaleString()} MDL</span>
                  {p.oldPrice && (
                    <span className="font-mono text-xs text-zinc-400 line-through">{p.oldPrice.toLocaleString()} MDL</span>
                  )}
                </div>
              </div>

              <button
                onClick={() => handleAdd(p.id)}
                className={`w-full py-3 font-mono text-xs font-bold uppercase tracking-wider transition-all border ${
                  addedIds[p.id] 
                    ? "bg-emerald-500 border-emerald-500 text-white" 
                    : "bg-white border-zinc-300 text-zinc-900 hover:bg-zinc-50"
                }`}
              >
                {addedIds[p.id] ? "Adaugat in Cos ✓" : "Adauga in Cos"}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
