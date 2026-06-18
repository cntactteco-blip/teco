import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Check, ShoppingCart } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { useToast } from "@/hooks/use-toast";
import type { StoreProduct } from "@/lib/store";

function useLiveViewers(id: number) {
  const [count, setCount] = useState(() => 3 + (id * 5 + 7) % 19);
  useEffect(() => {
    const t = setTimeout(
      () => setCount(c => Math.max(2, c + (Math.random() > 0.5 ? 1 : -1))),
      8000 + Math.random() * 12000
    );
    return () => clearTimeout(t);
  }, [count]);
  return count;
}

export function ProductCardSmall({ product }: { product: StoreProduct }) {
  const addItem = useCart((state) => state.addItem);
  const { toast } = useToast();
  const [added, setAdded] = useState(false);
  const viewers = useLiveViewers(product.id);

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product);
    setAdded(true);
    toast({ title: "Adaugat in cos!", description: "Produsul a fost rezervat." });
    setTimeout(() => setAdded(false), 2500);
  };

  const discount = product.oldPrice
    ? Math.round((1 - product.price / product.oldPrice) * 100)
    : null;

  return (
    <Link href={`/product/${product.id}`}
      className="group block w-[170px] md:w-[210px] bg-white border border-zinc-100 rounded-2xl overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex-shrink-0 cursor-pointer"
      data-testid={`card-product-${product.id}`}>

      {/* Image */}
      <div className="relative h-[130px] md:h-[150px] bg-zinc-50 overflow-hidden">
        <img
          src={product.imageUrl}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {product.badge && (
          <div className={`absolute top-2 left-2 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wide ${product.badge === "PROMO" ? "bg-[#FF4F00]" : product.badge.includes("COLOR") ? "bg-violet-600" : "bg-zinc-900"}`}>
            {product.badge}
          </div>
        )}
        {discount && (
          <div className="absolute top-2 right-2 bg-emerald-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">
            -{discount}%
          </div>
        )}
        {/* Live viewers badge */}
        <div className="absolute bottom-1.5 left-1.5 flex items-center gap-1 bg-black/50 backdrop-blur-sm rounded-full px-1.5 py-0.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
          <span className="text-white text-[9px] font-medium leading-none">{viewers} văd</span>
        </div>
      </div>

      {/* Info */}
      <div className="p-3 flex flex-col gap-1.5">
        <p className="text-[9px] text-zinc-400 font-medium uppercase tracking-wider">{product.brand}</p>
        <h3 className="text-xs font-bold leading-tight text-zinc-900 line-clamp-2 min-h-[32px]">
          {product.name}
        </h3>

        <div className="flex items-baseline gap-1.5 mt-0.5">
          <span className="font-black text-sm text-zinc-950">{product.price.toLocaleString('ro-MD')}</span>
          <span className="text-[10px] text-zinc-400">MDL</span>
          {product.oldPrice && (
            <span className="font-mono text-[9px] text-zinc-300 line-through">{product.oldPrice.toLocaleString('ro-MD')}</span>
          )}
        </div>

        <button
          onClick={handleAdd}
          className={`mt-1 py-2 rounded-xl text-[11px] font-bold transition-all active:scale-95 flex items-center justify-center gap-1.5 ${
            added ? "bg-emerald-500 text-white" : "bg-[#FF4F00] text-white hover:bg-orange-600"
          }`}
          data-testid={`btn-add-cart-small-${product.id}`}
        >
          {added ? <><Check className="w-3 h-3"/> Adăugat</> : <><ShoppingCart className="w-3 h-3"/> Adaugă</>}
        </button>
      </div>
    </Link>
  );
}
