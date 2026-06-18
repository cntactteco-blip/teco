import { Heart, ShoppingCart, Trash2, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { useWishlist } from "@/hooks/useWishlist";
import { useStore } from "@/lib/store";
import { useCart } from "@/hooks/useCart";
import { useLang } from "@/contexts/LangContext";
import { SEO } from "@/components/SEO";
import { useToast } from "@/hooks/use-toast";

export default function Wishlist() {
  const { ids, toggle } = useWishlist();
  const products = useStore((s) => s.products);
  const { addItem } = useCart((s) => ({ addItem: s.addItem }));
  const { lang } = useLang();
  const ro = lang === "ro";
  const { toast } = useToast();
  const wishlisted = products.filter((p) => ids.includes(p.id));

  return (
    <>
      <SEO
        title={ro ? "Lista de Dorințe — Teco.md" : "Список Желаний — Teco.md"}
        description={ro ? "Produsele tale favorite salvate pe Teco.md." : "Ваши сохраненные избранные товары на Teco.md."}
        canonical="/favorit"
        lang={ro ? "ro" : "ru"}
      />
      <main className="flex-1 bg-[#FAFAFA] pb-[64px] md:pb-0">
        <div className="max-w-5xl mx-auto px-4 md:px-6 py-8">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Link href="/produse" className="w-9 h-9 rounded-xl bg-white border border-zinc-200 flex items-center justify-center hover:bg-zinc-50 transition-colors">
              <ArrowLeft className="w-4 h-4 text-zinc-600" />
            </Link>
            <div>
              <h1 className="font-black text-2xl text-[#09090B] flex items-center gap-2">
                <Heart className="w-6 h-6 text-red-500 fill-red-500" />
                {ro ? "Lista de Dorințe" : "Список Желаний"}
              </h1>
              <p className="text-zinc-500 text-sm mt-0.5">
                {wishlisted.length === 0
                  ? (ro ? "Nu ai produse salvate" : "Нет сохранённых товаров")
                  : (ro ? `${wishlisted.length} produse salvate` : `${wishlisted.length} сохранённых товаров`)}
              </p>
            </div>
          </div>

          {wishlisted.length === 0 ? (
            <div className="text-center py-20">
              <Heart className="w-16 h-16 text-zinc-200 mx-auto mb-4" />
              <h2 className="font-black text-xl text-zinc-400 mb-2">
                {ro ? "Lista ta de dorințe e goală" : "Ваш список желаний пуст"}
              </h2>
              <p className="text-zinc-400 text-sm mb-6">
                {ro ? "Adaugă produse apăsând ❤ pe orice produs din catalog." : "Добавляйте товары, нажимая ❤ на любой товар в каталоге."}
              </p>
              <Link href="/produse" className="inline-flex items-center gap-2 bg-[#FF4F00] text-white font-bold px-6 py-3 rounded-xl hover:opacity-90 transition-all">
                {ro ? "Explorează catalogul" : "Перейти в каталог"}
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {wishlisted.map((p) => (
                <div key={p.id} className="bg-white rounded-2xl border border-zinc-200 overflow-hidden group hover:shadow-lg transition-all">
                  <Link href={`/product/${p.id}`} className="block relative h-44 bg-zinc-50 overflow-hidden">
                    <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    {p.badge && (
                      <span className="absolute top-2 left-2 bg-[#FF4F00] text-white text-[10px] font-black px-2.5 py-1 rounded-full">
                        {p.badge}
                      </span>
                    )}
                  </Link>
                  <div className="p-4">
                    <p className="text-xs text-zinc-400 mb-0.5">{p.brand}</p>
                    <Link href={`/product/${p.id}`}>
                      <h3 className="font-bold text-[#09090B] text-sm leading-snug mb-2 hover:text-[#FF4F00] transition-colors line-clamp-2">{p.name}</h3>
                    </Link>
                    <div className="flex items-center gap-2 mb-4">
                      <span className="font-black text-[#FF4F00] text-lg">{p.price.toLocaleString()} MDL</span>
                      {p.oldPrice && <span className="text-xs text-zinc-400 line-through">{p.oldPrice.toLocaleString()}</span>}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => { addItem(p); toast({ title: ro ? "Adăugat în coș" : "Добавлено в корзину", description: p.name }); }}
                        className="flex-1 bg-[#FF4F00] text-white font-bold py-2.5 rounded-xl hover:opacity-90 active:scale-95 transition-all text-sm flex items-center justify-center gap-1.5"
                      >
                        <ShoppingCart className="w-4 h-4" />
                        {ro ? "Adaugă" : "В корзину"}
                      </button>
                      <button
                        onClick={() => toggle(p.id)}
                        className="w-10 h-10 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center hover:bg-red-100 transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
