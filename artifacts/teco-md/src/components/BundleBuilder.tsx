import { useState, useMemo } from "react";
import { Camera, Server, Package, ShoppingCart, Check, X } from "lucide-react";
import { useStore } from "@/lib/store";
import { useCart } from "@/hooks/useCart";
import { useLang } from "@/contexts/LangContext";
import { useToast } from "@/hooks/use-toast";

const CAMERA_OPTIONS = [
  { qty: 2, label: { ro: "2 camere", ru: "2 камеры" }, hint: { ro: "Apartament / birou mic", ru: "Квартира / малый офис" } },
  { qty: 4, label: { ro: "4 camere", ru: "4 камеры" }, hint: { ro: "Casă standard", ru: "Стандартный дом" }, popular: true },
  { qty: 6, label: { ro: "6 camere", ru: "6 камер" }, hint: { ro: "Casă mare / afacere mică", ru: "Большой дом / малый бизнес" } },
  { qty: 8, label: { ro: "8 camere", ru: "8 камер" }, hint: { ro: "Depozit / magazin", ru: "Склад / магазин" } },
  { qty: 16, label: { ro: "16+ camere", ru: "16+ камер" }, hint: { ro: "Complex industrial", ru: "Промышленный объект" } },
];

const NVR_MAP: Record<number, string> = { 2: "4ch", 4: "4ch", 6: "8ch", 8: "8ch", 16: "16ch" };

// Fallback unit prices (MDL) when no matching products exist in the store
const DEFAULT_CAM_PRICE: Record<"wifi" | "poe", number> = { wifi: 1_200, poe: 1_650 };
const DEFAULT_NVR_PRICE = 1_700;

export default function BundleBuilder({ onClose }: { onClose?: () => void } = {}) {
  const { lang } = useLang();
  const ro = lang === "ro";
  const products = useStore((s) => s.products);
  const addItem = useCart((s) => s.addItem);
  const { toast } = useToast();

  const [camQty, setCamQty] = useState(4);
  const [camType, setCamType] = useState<"wifi" | "poe">("poe");
  const [withNvr, setWithNvr] = useState(true);
  const [withInstall, setWithInstall] = useState(false);

  // Categoriile reale din catalog: "wifi", "poe", "4g", "nvr", "kituri", "alarme"
  const cameras = useMemo(() =>
    products
      .filter((p) => p.inStock !== false && p.category === camType)
      .sort((a, b) => a.price - b.price),
    [products, camType]
  );

  const nvrs = useMemo(() =>
    products
      .filter((p) => p.inStock !== false && p.category === "nvr")
      .sort((a, b) => a.price - b.price),
    [products]
  );

  const [selCamera, setSelCamera] = useState<number | null>(null);
  const [selNvr, setSelNvr] = useState<number | null>(null);

  const camera = products.find((p) => p.id === selCamera) ?? cameras[0] ?? null;
  const nvr = products.find((p) => p.id === selNvr) ?? nvrs[0] ?? null;

  // Use real product prices when available, fall back to sensible defaults
  const camUnitPrice = camera?.price ?? DEFAULT_CAM_PRICE[camType];
  const nvrUnitPrice = nvr?.price ?? DEFAULT_NVR_PRICE;

  const camTotal = camUnitPrice * camQty;
  const nvrTotal = withNvr ? nvrUnitPrice : 0;
  const installTotal = withInstall ? camQty * 300 : 0;
  const total = camTotal + nvrTotal + installTotal;

  const addAll = () => {
    let added = false;
    if (camera) {
      for (let i = 0; i < camQty; i++) addItem(camera);
      added = true;
    }
    if (withNvr && nvr) { addItem(nvr); added = true; }
    if (added) {
      toast({
        title: ro ? "Sistem adăugat în coș!" : "Система добавлена в корзину!",
        description: ro
          ? `${camQty} camere ${withNvr ? "+ NVR" : ""} • Total: ${total.toLocaleString()} MDL`
          : `${camQty} камер ${withNvr ? "+ NVR" : ""} • Итого: ${total.toLocaleString()} MDL`,
      });
    } else {
      toast({
        title: ro ? "Contactați-ne pentru ofertă" : "Свяжитесь с нами для предложения",
        description: ro ? "Vom pregăti devizul personalizat." : "Подготовим индивидуальное предложение.",
      });
    }
  };

  return (
    <section className="py-16 bg-[#09090B] overflow-hidden" id="bundle-builder">
      <div className="max-w-5xl mx-auto px-4 md:px-6">
        <div className="text-center mb-10 relative">
          {onClose && (
            <button
              onClick={onClose}
              className="absolute right-0 top-0 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
              aria-label="Închide"
            >
              <X className="w-5 h-5" />
            </button>
          )}
          <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 text-sm font-semibold text-white/80 mb-4">
            <Package className="w-4 h-4 text-[#FF4F00]" />
            {ro ? "CONFIGURATOR SISTEM" : "КОНФИГУРАТОР СИСТЕМЫ"}
          </div>
          <h2 className="font-black text-3xl md:text-4xl text-white mb-3">
            {ro ? <>Construiește-ți<br /><span className="text-[#FF4F00]">sistemul perfect</span></> : <>Создай свою<br /><span className="text-[#FF4F00]">идеальную систему</span></>}
          </h2>
          <p className="text-zinc-400 text-sm max-w-md mx-auto">
            {ro ? "Alege numărul de camere și tipul — îți recomandăm NVR-ul potrivit și calculăm totul." : "Выберите количество камер и тип — подберём NVR и посчитаем всё."}
          </p>
        </div>

        <div className="flex flex-col md:grid md:grid-cols-3 gap-6">
          {/* Step 1: Cameras qty */}
          <div className="md:col-span-2 space-y-5 min-w-0">
            {/* Qty */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 rounded-full bg-[#FF4F00] flex items-center justify-center text-white text-xs font-black">1</div>
                <h3 className="font-bold text-white text-sm">{ro ? "Câte camere?" : "Сколько камер?"}</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                {CAMERA_OPTIONS.map((o) => (
                  <button
                    key={o.qty}
                    onClick={() => setCamQty(o.qty)}
                    className={`relative py-3 px-2 rounded-xl border text-center transition-all ${camQty === o.qty ? "border-[#FF4F00] bg-[#FF4F00]/10" : "border-white/10 hover:border-white/30"}`}
                  >
                    {o.popular && <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-[#FF4F00] text-white text-[8px] font-black px-1.5 py-0.5 rounded-full whitespace-nowrap">TOP</span>}
                    <p className="font-black text-white text-sm">{o.label[ro ? "ro" : "ru"]}</p>
                    <p className="text-[10px] text-zinc-400 mt-0.5 leading-tight">{o.hint[ro ? "ro" : "ru"]}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Type */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 rounded-full bg-[#FF4F00] flex items-center justify-center text-white text-xs font-black">2</div>
                <h3 className="font-bold text-white text-sm">{ro ? "Tipul camerelor" : "Тип камер"}</h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {(["wifi", "poe"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setCamType(t)}
                    className={`py-4 px-4 rounded-xl border text-left transition-all ${camType === t ? "border-[#FF4F00] bg-[#FF4F00]/10" : "border-white/10 hover:border-white/30"}`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Camera className="w-4 h-4 text-[#FF4F00]" />
                      <span className="font-black text-white text-sm">{t === "wifi" ? "WiFi" : "PoE (cablu)"}</span>
                      {camType === t && <Check className="w-3.5 h-3.5 text-[#FF4F00] ml-auto" />}
                    </div>
                    <p className="text-xs text-zinc-400">
                      {t === "wifi"
                        ? (ro ? "Fără cabluri, instalare ușoară" : "Без проводов, простая установка")
                        : (ro ? "Mai stabile, recomandate" : "Надёжнее, рекомендуется")}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Camera selector */}
            {cameras.length > 0 && (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-6 h-6 rounded-full bg-[#FF4F00] flex items-center justify-center text-white text-xs font-black">3</div>
                  <h3 className="font-bold text-white text-sm">{ro ? "Modelul camerei" : "Модель камеры"}</h3>
                </div>
                <div className="flex flex-col gap-2 max-h-64 overflow-y-auto pr-0.5">
                  {cameras.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setSelCamera(c.id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${(selCamera === c.id || (!selCamera && c === cameras[0])) ? "border-[#FF4F00] bg-[#FF4F00]/10" : "border-white/10 hover:border-white/30"}`}
                    >
                      <img src={c.imageUrl} alt={c.name} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-white text-xs truncate">{c.name}</p>
                        <p className="text-[10px] text-zinc-400 truncate">{c.specs}</p>
                      </div>
                      <p className="font-black text-[#FF4F00] text-sm flex-shrink-0">{c.price.toLocaleString()} MDL</p>
                    </button>
                  ))}
                </div>
                {cameras.length > 3 && (
                  <p className="text-[10px] text-zinc-500 text-center mt-1">↕ Derulează pentru mai multe ({cameras.length} modele)</p>
                )}
              </div>
            )}

            {/* Options */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 rounded-full bg-[#FF4F00] flex items-center justify-center text-white text-xs font-black">4</div>
                <h3 className="font-bold text-white text-sm">{ro ? "Opțiuni suplimentare" : "Дополнительные опции"}</h3>
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl border border-white/10 hover:border-white/30 transition-all">
                  <input type="checkbox" checked={withNvr} onChange={(e) => setWithNvr(e.target.checked)} className="w-4 h-4 accent-[#FF4F00]" />
                  <div className="flex items-center gap-2 flex-1">
                    <Server className="w-4 h-4 text-[#FF4F00]" />
                    <div>
                      <p className="text-white text-sm font-semibold">{ro ? "Include NVR recomandat" : "Включить рекомендованный NVR"}</p>
                      <p className="text-[10px] text-zinc-400">
                        {nvr ? `${nvr.name} • ${nvr.price.toLocaleString()} MDL` : `NVR ${NVR_MAP[camQty] ?? "4ch"} • ${DEFAULT_NVR_PRICE.toLocaleString()} MDL`}
                      </p>
                    </div>
                  </div>
                </label>
                <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl border border-white/10 hover:border-white/30 transition-all">
                  <input type="checkbox" checked={withInstall} onChange={(e) => setWithInstall(e.target.checked)} className="w-4 h-4 accent-[#FF4F00]" />
                  <div className="flex-1">
                    <p className="text-white text-sm font-semibold">{ro ? "Adaugă instalare profesională" : "Добавить профессиональный монтаж"}</p>
                    <p className="text-[10px] text-zinc-400">300 MDL × {camQty} = {(300 * camQty).toLocaleString()} MDL</p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="md:col-span-1 min-w-0">
            <div className="md:sticky md:top-4 bg-white rounded-2xl p-5 shadow-xl">
              <h3 className="font-black text-[#09090B] text-lg mb-4">{ro ? "Rezumatul tău" : "Ваш заказ"}</h3>
              <div className="space-y-2.5 mb-5">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">{ro ? `${camQty}× cameră` : `${camQty}× камера`}</span>
                  <span className="font-bold text-[#09090B]">{camTotal.toLocaleString()} MDL</span>
                </div>
                {withNvr && nvr && (
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-500">NVR</span>
                    <span className="font-bold text-[#09090B]">{nvrTotal.toLocaleString()} MDL</span>
                  </div>
                )}
                {withInstall && (
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-500">{ro ? "Instalare" : "Монтаж"}</span>
                    <span className="font-bold text-[#09090B]">{installTotal.toLocaleString()} MDL</span>
                  </div>
                )}
                <div className="border-t border-zinc-100 pt-2.5 flex justify-between">
                  <span className="font-black text-[#09090B]">Total</span>
                  <span className="font-black text-[#FF4F00] text-xl">{total.toLocaleString()} MDL</span>
                </div>
              </div>

              <button
                onClick={addAll}
                disabled={!camera}
                className="w-full bg-[#FF4F00] text-white font-black py-4 rounded-2xl hover:opacity-90 active:scale-95 transition-all disabled:opacity-40 flex items-center justify-center gap-2 mb-3"
              >
                <ShoppingCart className="w-5 h-5" />
                {ro ? "Adaugă totul în coș" : "Добавить всё в корзину"}
              </button>

              <div className="space-y-1.5">
                {[
                  ro ? "Livrare gratuită peste 5.000 MDL" : "Бесплатная доставка от 5000 MDL",
                  ro ? "Garanție 2–5 ani pe echipamente" : "Гарантия 2–5 лет на оборудование",
                  ro ? "Suport tehnic inclus" : "Техническая поддержка включена",
                ].map((f) => (
                  <div key={f} className="flex items-center gap-1.5 text-xs text-zinc-500">
                    <Check className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                    {f}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
