import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useCart } from "@/hooks/useCart";
import { Link } from "wouter";
import { Minus, Plus, Trash2, ArrowRight, ShoppingBag } from "lucide-react";

export default function Cart() {
  const items = useCart(s => s.items);
  const total = useCart(s => s.total);
  const updateQuantity = useCart(s => s.updateQty);
  const removeItem = useCart(s => s.removeItem);

  const isFreeShipping = total >= 5000;
  const shippingCost = isFreeShipping || total === 0 ? 0 : 150;
  const finalTotal = total + shippingCost;

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-6 py-8">
        <h1 className="text-2xl font-bold text-[#09090B] mb-8">Cosul tau</h1>

        {items.length === 0 ? (
          <div className="text-center py-24 bg-[#FAFAFA] rounded-xl border border-[#E4E4E7]">
            <div className="bg-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-[#E4E4E7]">
              <ShoppingBag className="w-8 h-8 text-[#71717A]" />
            </div>
            <h2 className="text-xl font-medium text-[#09090B] mb-2">Cosul tau este gol</h2>
            <p className="text-[#71717A] mb-6">Nu ai adaugat niciun produs in cos inca.</p>
            <Link href="/" className="inline-flex items-center gap-2 bg-[#FF4F00] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#E64600] transition-colors" data-testid="btn-continue-shopping">
              Continua Cumparaturile <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {items.map(item => (
                <div key={item.id} className="flex gap-4 p-4 border border-[#E4E4E7] rounded-xl bg-white items-center">
                  <div className="w-20 h-20 bg-zinc-50 rounded-lg flex items-center justify-center shrink-0">
                    <ShoppingBag className="w-8 h-8 text-zinc-300" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-[#09090B] truncate text-sm md:text-base">{item.name}</h3>
                    <p className="text-[#71717A] font-mono text-sm mt-1">{item.price.toLocaleString('ro-MD')} MDL</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center border border-[#E4E4E7] rounded-lg bg-[#FAFAFA]">
                      <button onClick={() => updateQuantity(item.id, item.qty - 1)} className="p-2 hover:bg-zinc-100 text-[#09090B]" data-testid={`btn-dec-${item.id}`}>
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-8 text-center font-mono text-sm">{item.qty}</span>
                      <button onClick={() => updateQuantity(item.id, item.qty + 1)} className="p-2 hover:bg-zinc-100 text-[#09090B]" data-testid={`btn-inc-${item.id}`}>
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <button onClick={() => removeItem(item.id)} className="p-2 text-[#EF4444] hover:bg-red-50 rounded-lg transition-colors" data-testid={`btn-remove-${item.id}`}>
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="lg:col-span-1">
              <div className="border border-[#E4E4E7] rounded-xl p-6 bg-[#FAFAFA] sticky top-24">
                <h2 className="text-lg font-medium text-[#09090B] mb-4">Sumar comanda</h2>
                <div className="space-y-3 text-sm mb-6">
                  <div className="flex justify-between text-[#71717A]">
                    <span>Subtotal</span>
                    <span className="font-mono text-[#09090B]">{total.toLocaleString('ro-MD')} MDL</span>
                  </div>
                  <div className="flex justify-between text-[#71717A]">
                    <span>Livrare</span>
                    <span className="font-mono text-[#09090B]">{shippingCost === 0 ? "Gratuita" : `${shippingCost} MDL`}</span>
                  </div>
                  {total > 0 && total < 5000 && (
                    <div className="text-xs text-[#10B981] bg-emerald-50 p-2 rounded-lg mt-2 border border-emerald-100">
                      Mai adauga produse de {(5000 - total).toLocaleString('ro-MD')} MDL pentru livrare gratuita!
                    </div>
                  )}
                </div>
                <div className="border-t border-[#E4E4E7] pt-4 mb-6">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-[#09090B]">Total</span>
                    <span className="font-mono text-xl font-bold text-[#09090B]">{finalTotal.toLocaleString('ro-MD')} MDL</span>
                  </div>
                </div>
                <button className="w-full bg-[#FF4F00] text-white py-3 rounded-lg font-medium hover:bg-[#E64600] transition-colors mb-4" data-testid="btn-checkout">
                  Finalizeaza Comanda
                </button>
                <Link href="/" className="block text-center text-sm text-[#71717A] hover:text-[#09090B] transition-colors" data-testid="link-continue-shopping">
                  Continua Cumparaturile
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
