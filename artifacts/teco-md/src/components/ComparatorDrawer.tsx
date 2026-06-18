import { X, BarChart2, ShoppingCart, Check, Minus } from "lucide-react";
import { useComparator } from "@/hooks/useComparator";
import { useCart } from "@/hooks/useCart";
import { useLang } from "@/contexts/LangContext";
import { useState } from "react";
import { Link } from "wouter";

const SPEC_ROWS = [
  { key: "brand", label: { ro: "Brand", ru: "Бренд" } },
  { key: "price", label: { ro: "Preț", ru: "Цена" } },
  { key: "specs", label: { ro: "Specificații", ru: "Характеристики" } },
  { key: "description", label: { ro: "Descriere", ru: "Описание" } },
  { key: "inStock", label: { ro: "Disponibilitate", ru: "Наличие" } },
];

export function ComparatorDrawer() {
  const { items, remove, clear, count } = useComparator();
  const addItem = useCart((s) => s.addItem);
  const { lang } = useLang();
  const ro = lang === "ro";
  const [open, setOpen] = useState(false);

  if (count === 0) return null;

  return (
    <>
      {/* Floating bar */}
      <div className="fixed bottom-[64px] md:bottom-4 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 bg-[#09090B] text-white rounded-2xl shadow-2xl px-4 py-2.5 text-sm font-semibold border border-white/10 animate-fade-in">
        <BarChart2 className="w-4 h-4 text-[#FF4F00]" />
        <span>{ro ? `Compari ${count} produse` : `Сравниваете ${count} товара`}</span>
        <button
          onClick={() => setOpen(true)}
          className="ml-2 bg-[#FF4F00] text-white px-3 py-1 rounded-xl text-xs font-bold hover:opacity-90 transition-all"
        >
          {ro ? "Compară" : "Сравнить"}
        </button>
        <button onClick={clear} className="ml-1 text-zinc-400 hover:text-white transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Full comparator modal */}
      {open && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-end md:items-center justify-center p-0 md:p-4 animate-fade-in" onClick={() => setOpen(false)}>
          <div
            className="bg-white rounded-t-3xl md:rounded-3xl w-full md:max-w-4xl max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-zinc-100 px-5 py-4 flex items-center justify-between z-10">
              <div className="flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-[#FF4F00]" />
                <h2 className="font-black text-[#09090B] text-lg">
                  {ro ? "Comparare produse" : "Сравнение товаров"}
                </h2>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={clear} className="text-xs text-zinc-400 hover:text-zinc-700 transition-colors">
                  {ro ? "Șterge tot" : "Очистить всё"}
                </button>
                <button onClick={() => setOpen(false)} className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center hover:bg-zinc-200 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Product header row */}
            <div className="p-5 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <td className="w-28 md:w-36 pr-4 align-top">
                      <span className="text-xs text-zinc-400 font-medium">{ro ? "Caracteristici" : "Характеристики"}</span>
                    </td>
                    {items.map((p) => (
                      <td key={p.id} className="align-top pb-4 px-3 text-center min-w-[140px]">
                        <div className="relative">
                          <button
                            onClick={() => remove(p.id)}
                            className="absolute -top-1 -right-1 w-5 h-5 bg-zinc-200 rounded-full flex items-center justify-center hover:bg-red-100 hover:text-red-600 transition-colors z-10"
                          >
                            <X className="w-3 h-3" />
                          </button>
                          <Link href={`/product/${p.id}`} onClick={() => setOpen(false)}>
                            <img src={p.imageUrl} alt={p.name} className="w-20 h-20 object-cover rounded-xl mx-auto mb-2 border border-zinc-100" />
                          </Link>
                          <p className="font-bold text-[#09090B] text-xs leading-tight line-clamp-2">{p.name}</p>
                          <p className="text-[#FF4F00] font-black text-base mt-1">{p.price.toLocaleString()} MDL</p>
                        </div>
                      </td>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {SPEC_ROWS.map((row) => (
                    <tr key={row.key} className="border-t border-zinc-100">
                      <td className="py-3 pr-4 text-xs font-semibold text-zinc-500 align-top">
                        {row.label[lang === "ru" ? "ru" : "ro"]}
                      </td>
                      {items.map((p) => (
                        <td key={p.id} className="py-3 px-3 text-xs text-zinc-700 align-top text-center">
                          {row.key === "inStock" ? (
                            p.inStock
                              ? <span className="inline-flex items-center gap-1 text-green-600 font-semibold"><Check className="w-3 h-3" />{ro ? "În stoc" : "В наличии"}</span>
                              : <span className="inline-flex items-center gap-1 text-red-500"><Minus className="w-3 h-3" />{ro ? "Indisponibil" : "Нет в наличии"}</span>
                          ) : row.key === "price" ? (
                            <span className="font-black text-[#FF4F00]">{(p as any)[row.key]?.toLocaleString()} MDL</span>
                          ) : (
                            <span className="leading-snug">{(p as any)[row.key] ?? "—"}</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                  {/* Add to cart row */}
                  <tr className="border-t border-zinc-100">
                    <td className="py-3 pr-4 text-xs font-semibold text-zinc-500">{ro ? "Acțiune" : "Действие"}</td>
                    {items.map((p) => (
                      <td key={p.id} className="py-3 px-3 text-center">
                        <button
                          onClick={() => { addItem(p); setOpen(false); }}
                          className="w-full bg-[#FF4F00] text-white font-bold py-2 px-3 rounded-xl hover:opacity-90 active:scale-95 transition-all text-xs flex items-center justify-center gap-1.5"
                        >
                          <ShoppingCart className="w-3.5 h-3.5" />
                          {ro ? "Adaugă" : "Добавить"}
                        </button>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
