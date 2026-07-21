import { useState } from "react";
import { Link } from "wouter";
import { Check, ShoppingCart, Heart, BarChart2 } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { useToast } from "@/hooks/use-toast";
import { useWishlist } from "@/hooks/useWishlist";
import { useComparator } from "@/hooks/useComparator";
import type { StoreProduct } from "@/lib/store";

export function ProductCard({ product }: { product: StoreProduct }) {
  const addItem = useCart((state) => state.addItem);
  const openCart = useCart((state) => state.openCart);
  const { toast } = useToast();
  const [added, setAdded] = useState(false);
  const { toggle: wishlistToggle, has: wishlistHas } = useWishlist();
  const { toggle: comparatorToggle, has: comparatorHas } = useComparator();

  const discount = product.oldPrice
    ? Math.round((1 - product.price / product.oldPrice) * 100)
    : null;

  const isWished = wishlistHas(product.id);
  const isCompared = comparatorHas(product.id);

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product);
    setAdded(true);
    toast({ title: "Adăugat în coș!", description: "Produsul a fost rezervat." });
    setTimeout(() => openCart(), 500);
    setTimeout(() => setAdded(false), 2500);
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    wishlistToggle(product.id);
    toast({
      title: isWished ? "Eliminat din favorite" : "Adăugat la favorite ❤️",
      description: isWished ? "" : "Găsești produsul în pagina Favorite.",
    });
  };

  const handleCompare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    comparatorToggle(product);
    toast({
      title: isCompared ? "Eliminat din comparator" : "Adăugat în comparator",
      description: isCompared ? "" : "Selectează până la 3 produse pentru comparare.",
    });
  };

  return (
    <Link href={`/product/${product.id}`}
      className="group block bg-white border border-zinc-100 rounded-2xl overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer"
      data-testid={`card-product-${product.id}`}>

      {/* Image */}
      <div className="relative aspect-[4/3] bg-zinc-50 overflow-hidden">
        <img
          src={product.imageUrl}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {product.badge && (() => {
          const parts = product.badge.split("|");
          const badgeText = parts[0].trim();
          const badgeColor = parts[1]?.trim() || (product.badge === "PROMO" ? "#FF4F00" : "#09090B");
          return (
            <div className="absolute top-3 left-3 text-white text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wide"
              style={{ backgroundColor: badgeColor }}>
              {badgeText}
            </div>
          );
        })()}
        {discount && (
          <div className="absolute top-3 right-3 bg-emerald-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
            -{discount}%
          </div>
        )}
        {/* Wishlist button */}
        <button
          onClick={handleWishlist}
          aria-label={isWished ? "Elimină din favorite" : "Adaugă la favorite"}
          className={`absolute bottom-3 right-3 w-8 h-8 rounded-full flex items-center justify-center shadow-md transition-all active:scale-90 ${
            isWished
              ? "bg-[#FF4F00] text-white"
              : "bg-white/90 text-zinc-400 hover:text-[#FF4F00] hover:bg-white opacity-0 group-hover:opacity-100"
          }`}
        >
          <Heart className={`w-4 h-4 ${isWished ? "fill-white" : ""}`} />
        </button>
      </div>

      {/* Info */}
      <div className="p-4 flex flex-col gap-2">
        <p className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider">{product.brand}</p>
        <h3 className="font-bold text-sm leading-tight text-zinc-900 line-clamp-2 min-h-[40px]">
          {product.name}
        </h3>
        <p className="text-[11px] text-zinc-400 font-mono truncate">{product.specs}</p>

        <div className="flex items-baseline gap-1.5 mt-1">
          <span className="font-black text-xl text-zinc-950">{product.price.toLocaleString('ro-MD')}</span>
          <span className="text-sm text-zinc-400">MDL</span>
          {product.oldPrice && (
            <span className="font-mono text-sm text-zinc-300 line-through">{product.oldPrice.toLocaleString('ro-MD')}</span>
          )}
        </div>

        <div className="flex items-center gap-1.5 text-xs font-semibold">
          <div className={`w-1.5 h-1.5 rounded-full ${product.inStock ? 'bg-emerald-500' : 'bg-[#FF4F00]'}`} />
          <span className={product.inStock ? 'text-emerald-600' : 'text-[#FF4F00]'}>
            {product.inStock ? 'În Stoc' : 'Stoc Limitat'}
          </span>
        </div>

        <button
          onClick={handleAdd}
          className={`w-full py-3 rounded-xl font-bold text-sm transition-all active:scale-95 flex items-center justify-center gap-2 mt-1 ${
            added ? "bg-emerald-500 text-white" : "bg-[#FF4F00] text-white hover:bg-orange-600"
          }`}
          data-testid={`btn-add-cart-${product.id}`}
        >
          {added
            ? <><Check className="w-4 h-4"/> Adăugat în Coș</>
            : <><ShoppingCart className="w-4 h-4"/> Adaugă în Coș</>}
        </button>

        <button
          onClick={handleCompare}
          className={`w-full py-2 rounded-xl text-xs font-semibold transition-all active:scale-95 flex items-center justify-center gap-1.5 ${
            isCompared
              ? "bg-blue-100 text-blue-700 border border-blue-200"
              : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200 hover:text-zinc-700"
          }`}
        >
          <BarChart2 className="w-3.5 h-3.5" />
          {isCompared ? "Adăugat în comparator ✓" : "Compară"}
        </button>
      </div>
    </Link>
  );
}
