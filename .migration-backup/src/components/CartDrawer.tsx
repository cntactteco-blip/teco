import { useCart } from "@/hooks/useCart";
import { X, Plus, Minus, ShoppingBag, ArrowRight } from "lucide-react";
import { Link } from "wouter";

export function CartDrawer() {
  const isOpen    = useCart((s) => s.isOpen);
  const items     = useCart((s) => s.items);
  const total     = useCart((s) => s.total);
  const closeCart = useCart((s) => s.closeCart);
  const updateQty = useCart((s) => s.updateQty);
  const removeItem= useCart((s) => s.removeItem);

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" onClick={closeCart} />
      <div className="fixed right-0 top-0 h-full w-full sm:w-[400px] bg-white shadow-2xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-100">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-[#FF4F00]" />
            <h2 className="text-lg font-black text-[#09090B]">Coșul tău</h2>
            {items.length > 0 && (
              <span className="text-xs bg-[#FF4F00] text-white font-bold px-2 py-0.5 rounded-full">{items.length}</span>
            )}
          </div>
          <button onClick={closeCart} className="p-2 hover:bg-zinc-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-zinc-500" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {items.length === 0 ? (
            <div className="text-center py-16">
              <ShoppingBag className="w-12 h-12 text-zinc-200 mx-auto mb-3" />
              <p className="font-medium text-zinc-400">Coșul este gol</p>
              <p className="text-xs text-zinc-300 mt-1">Adaugă produse pentru a continua</p>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.id} className="flex gap-3 items-start bg-zinc-50 rounded-2xl p-3">
                <div className="w-14 h-14 bg-white rounded-xl overflow-hidden flex-shrink-0 border border-zinc-100">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="w-6 h-6 rounded-full bg-zinc-200" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-xs text-[#09090B] leading-tight line-clamp-2 mb-1">{item.name}</h3>
                  <p className="text-[#FF4F00] font-mono font-bold text-sm">{item.price.toLocaleString()} MDL</p>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex items-center border border-zinc-200 rounded-lg bg-white overflow-hidden">
                      <button onClick={() => updateQty(item.id, item.qty - 1)} className="px-2 py-1 hover:bg-zinc-50 transition-colors active:scale-95">
                        <Minus className="w-3 h-3 text-zinc-500" />
                      </button>
                      <span className="w-7 text-center text-xs font-bold text-[#09090B]">{item.qty}</span>
                      <button onClick={() => updateQty(item.id, item.qty + 1)} className="px-2 py-1 hover:bg-zinc-50 transition-colors active:scale-95">
                        <Plus className="w-3 h-3 text-zinc-500" />
                      </button>
                    </div>
                    <button onClick={() => removeItem(item.id)} className="text-[10px] text-zinc-400 hover:text-red-500 transition-colors underline">
                      Șterge
                    </button>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-mono font-bold text-xs text-[#09090B]">{(item.price * item.qty).toLocaleString()}</p>
                  <p className="text-[10px] text-zinc-400">MDL</p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="px-6 py-5 border-t border-zinc-100 bg-white">
            {/* Free shipping indicator */}
            {total < 5000 && (
              <div className="mb-3">
                <div className="flex justify-between text-xs text-zinc-500 mb-1">
                  <span>Livrare gratuită de la 5.000 MDL</span>
                  <span>{(5000 - total).toLocaleString()} MDL mai</span>
                </div>
                <div className="h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                  <div className="h-full bg-[#FF4F00] rounded-full transition-all" style={{ width: `${Math.min((total / 5000) * 100, 100)}%` }} />
                </div>
              </div>
            )}
            {total >= 5000 && (
              <div className="flex items-center gap-2 mb-3 bg-green-50 border border-green-100 rounded-xl px-3 py-2">
                <span className="text-green-600 text-xs font-bold">✓ Livrare GRATUITĂ inclusă!</span>
              </div>
            )}

            <div className="flex justify-between items-center mb-4">
              <span className="text-sm text-zinc-500">Total</span>
              <span className="text-2xl font-black font-mono text-[#09090B]">{total.toLocaleString()} MDL</span>
            </div>

            <Link
              href="/checkout"
              onClick={closeCart}
              className="flex items-center justify-center gap-2 w-full bg-[#FF4F00] text-white py-4 rounded-2xl font-bold text-base hover:opacity-90 active:scale-[0.99] transition-all shadow-[0_4px_14px_rgba(255,79,0,0.3)] mb-3"
            >
              Finalizează Comanda <ArrowRight className="w-4 h-4" />
            </Link>
            <button onClick={closeCart} className="w-full text-center text-sm font-medium text-zinc-500 hover:text-zinc-700 transition-colors">
              Continuă Cumpărăturile
            </button>
          </div>
        )}
      </div>
    </>
  );
}
