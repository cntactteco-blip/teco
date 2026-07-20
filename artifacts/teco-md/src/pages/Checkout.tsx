import { useState } from "react";
import { Link, useLocation } from "wouter";
import { CheckCircle, ShoppingCart, Truck, CreditCard, Phone, Mail, MapPin, User, ArrowLeft } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { storeActions, getState } from "@/lib/store";
import { SEO } from "@/components/SEO";
import { ConsentCheckbox } from "@/components/ConsentCheckbox";

// ── Shipping config ─────────────────────────────────────────────────────────
export const SHIPPING_OPTIONS = [
  { id: "chisinau",  label: "Livrare prin Curier Rapid",           hint: "Chișinău (Oraș)",                                                          price: 95  },
  { id: "suburbii",  label: "Livrare Suburbii - Curier Rapid",     hint: "Codru, Durlești, Stăuceni, Bubuieci etc.",                                  price: 125 },
  { id: "national",  label: "Livrare Națională - Curier Rapid",    hint: "Restul raioanelor Republicii Moldova",                                      price: 145 },
] as const;

export const FREE_SHIPPING_THRESHOLD = 5000;

export function getShippingCost(deliveryId: string, cartTotal: number): number {
  if (cartTotal >= FREE_SHIPPING_THRESHOLD) return 0;
  return SHIPPING_OPTIONS.find((o) => o.id === deliveryId)?.price ?? 95;
}

interface FormData {
  name: string; phone: string; email: string;
  address: string; delivery: string; notes: string;
}

const EMPTY: FormData = { name: "", phone: "", email: "", address: "", delivery: "chisinau", notes: "" };

// ── Extracted OUTSIDE Checkout — prevents input remount/keyboard-dismiss on every keystroke ──
function FormField({ label, field, type = "text", placeholder = "", icon: Icon, form, errors, onChange }: {
  label: string; field: keyof FormData; type?: string; placeholder?: string;
  icon?: React.ElementType; form: FormData; errors: Partial<FormData>;
  onChange: (k: keyof FormData, v: string) => void;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-zinc-500 mb-1.5">{label}</label>
      <div className="relative">
        {Icon && <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />}
        <input
          type={type}
          value={form[field] as string}
          onChange={(e) => onChange(field, e.target.value)}
          placeholder={placeholder}
          className={`w-full bg-[#FAFAFA] border ${errors[field] ? "border-red-400" : "border-zinc-200"} rounded-xl ${Icon ? "pl-10" : "px-4"} py-3 text-sm text-[#09090B] placeholder:text-zinc-400 focus:outline-none focus:border-[#FF4F00] focus:ring-2 focus:ring-[#FF4F00]/20 transition-all`}
        />
      </div>
      {errors[field] && <p className="text-xs text-red-400 mt-1">{errors[field]}</p>}
    </div>
  );
}

export default function Checkout() {
  const [form, setForm] = useState<FormData>(EMPTY);
  const [submitted, setSubmitted] = useState(false);
  const [orderId, setOrderId] = useState("");
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [consentGiven, setConsentGiven] = useState(false);

  const items = useCart((s) => s.items);
  const total = useCart((s) => s.total);
  const clearCart = useCart((s) => s.clearCart);
  const [, navigate] = useLocation();

  const set = (key: keyof FormData, val: string) => {
    setForm((f) => ({ ...f, [key]: val }));
    setErrors((e) => ({ ...e, [key]: "" }));
  };

  const validate = () => {
    const e: Partial<FormData> = {};
    if (!form.name.trim()) e.name = "Câmp obligatoriu";
    if (!form.phone.trim()) e.phone = "Câmp obligatoriu";
    if (!form.address.trim()) e.address = "Câmp obligatoriu";
    return e;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!consentGiven) return;
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); return; }

    const order = await storeActions.addOrder({
      customer: { name: form.name, phone: form.phone, email: form.email, address: form.address, delivery: form.delivery },
      items: items.map((i) => ({ id: i.id, name: i.name, price: i.price, qty: i.qty })),
      total,
    });
    const shortId = order!.id.slice(0, 8).toUpperCase();
    setOrderId(shortId);
    clearCart?.();
    setSubmitted(true);
    window.scrollTo({ top: 0, behavior: "smooth" });

    // Notificare Telegram — comandă nouă
    const { getSessionPayload } = await import("@/lib/session");
    const shipping = getShippingCost(form.delivery, total);
    const grandTotal = total + shipping;
    const API = import.meta.env.VITE_API_URL || "";
    fetch(API + "/api/notify/order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orderId: shortId,
        name: form.name,
        phone: form.phone,
        address: form.address,
        delivery: SHIPPING_OPTIONS.find((o) => o.id === form.delivery)?.label ?? form.delivery,
        items: items.map((i) => ({ name: i.name, qty: i.qty, price: i.price })),
        subtotal: total,
        shippingCost: shipping,
        total: grandTotal,
        session: getSessionPayload(),
      }),
    }).catch(() => {});
  };

  if (submitted) {
    const viberPhone = getState().settings.general?.adminPhone?.replace(/\D/g, "") ?? "";
    return (
      <div className="flex-1 bg-[#FAFAFA] flex items-center justify-center px-4 py-16 pb-[64px] md:pb-8">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="font-black text-2xl text-[#09090B] mb-2">Comandă Plasată!</h1>
          <p className="text-zinc-500 mb-2">Număr comandă: <span className="font-mono font-bold text-[#09090B]">#{orderId}</span></p>
          <p className="text-zinc-500 text-sm mb-8">
            Vei fi contactat(ă) de echipa noastră în cel mult <strong>2 ore</strong> pentru confirmare și detalii livrare.
          </p>
          <div className="bg-white rounded-2xl border border-zinc-200 p-5 mb-6 text-left">
            <p className="font-semibold text-sm mb-3 text-[#09090B]">📦 Ce urmează:</p>
            <div className="space-y-2 text-sm text-zinc-600">
              <p>✓ Confirmare telefonică la {form.phone}</p>
              <p>✓ Pregătire și ambalare comandă (1-2 ore)</p>
              <p>✓ Livrare {form.delivery.toLowerCase()} în 24h</p>
              <p>✓ Testare și pornire sistem la locație (dacă ai ales instalare)</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/" className="inline-flex items-center justify-center gap-2 bg-[#FF4F00] text-white font-bold px-6 py-3 rounded-xl hover:opacity-90 active:scale-95 transition-all">
              <ArrowLeft className="w-4 h-4" /> Înapoi la magazin
            </Link>
            {viberPhone && (
              <a
                href={`viber://chat?number=${viberPhone.replace(/\D/g, "")}`}
                className="inline-flex items-center justify-center gap-2 bg-[#7360F2] text-white font-bold px-6 py-3 rounded-xl hover:opacity-90 active:scale-95 transition-all"
              >
                <span className="text-base leading-none">💬</span> Contactați pe Viber
              </a>
            )}
            {viberPhone && (
              <a
                href={`https://wa.me/${viberPhone.replace(/\D/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-[#25D366] text-white font-bold px-6 py-3 rounded-xl hover:opacity-90 active:scale-95 transition-all"
              >
                <span className="text-base leading-none">💬</span> Contactați pe WhatsApp
              </a>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex-1 bg-[#FAFAFA] flex items-center justify-center px-4 py-16 pb-[64px] md:pb-8">
        <div className="text-center">
          <ShoppingCart className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
          <h2 className="font-bold text-lg text-[#09090B] mb-2">Coșul tău este gol</h2>
          <p className="text-zinc-500 text-sm mb-6">Adaugă produse înainte de a plasa o comandă.</p>
          <Link href="/produse" className="bg-[#FF4F00] text-white font-bold px-6 py-3 rounded-xl hover:opacity-90 transition-all">
            Explorează Produsele
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEO title="Finalizare Comandă — Teco.md" description="Completează comanda pentru sisteme de supraveghere. Livrare în 24h, plată la livrare, garanție 2–3 ani." keywords="comandă, checkout, plată, livrare, sisteme securitate, Moldova" noIndex canonical="/checkout" lang="ro" />
      <main className="flex-1 bg-[#FAFAFA] pb-[64px] md:pb-0 min-h-screen" role="main">
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-6 md:py-8">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate("/")} className="p-2 hover:bg-white rounded-xl transition-colors">
            <ArrowLeft className="w-5 h-5 text-zinc-500" />
          </button>
          <h1 className="font-black text-2xl text-[#09090B]">Finalizare Comandă</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-white rounded-2xl border border-zinc-200 p-5 md:p-6">
              <div className="flex items-center gap-2 mb-5">
                <User className="w-4 h-4 text-[#FF4F00]" />
                <h2 className="font-bold text-[#09090B]">Date Contact</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <FormField label="Nume și Prenume *" field="name" icon={User} placeholder="Ion Popescu" form={form} errors={errors} onChange={set} />
                </div>
                <FormField label="Telefon *" field="phone" type="tel" icon={Phone} placeholder="+373 69 XXX XXX" form={form} errors={errors} onChange={set} />
                <FormField label="Email (opțional)" field="email" type="email" icon={Mail} placeholder="email@exemplu.md" form={form} errors={errors} onChange={set} />
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-zinc-200 p-5 md:p-6">
              <div className="flex items-center gap-2 mb-5">
                <Truck className="w-4 h-4 text-[#FF4F00]" />
                <h2 className="font-bold text-[#09090B]">Livrare</h2>
              </div>
              {total >= FREE_SHIPPING_THRESHOLD && (
                <div className="flex items-center gap-2 mb-4 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                  <span className="text-green-700 text-sm font-bold">✓ Comandă peste 5.000 MDL — Livrare GRATUITĂ oriunde în Moldova!</span>
                </div>
              )}
              <div className="flex flex-col gap-3 mb-4">
                {SHIPPING_OPTIONS.map((opt) => {
                  const cost = getShippingCost(opt.id, total);
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => set("delivery", opt.id)}
                      className={`flex items-center justify-between px-4 py-3.5 rounded-xl border text-left transition-all active:scale-[0.99] ${form.delivery === opt.id ? "border-[#FF4F00] bg-orange-50" : "border-zinc-200 bg-white hover:border-zinc-300"}`}
                    >
                      <div>
                        <p className={`text-sm font-bold ${form.delivery === opt.id ? "text-[#FF4F00]" : "text-[#09090B]"}`}>{opt.label}</p>
                        <p className="text-xs text-zinc-400 mt-0.5">{opt.hint}</p>
                      </div>
                      <span className={`font-black text-base shrink-0 ml-4 ${cost === 0 ? "text-green-600" : form.delivery === opt.id ? "text-[#FF4F00]" : "text-[#09090B]"}`}>
                        {cost === 0 ? "GRATUIT" : `${cost} MDL`}
                      </span>
                    </button>
                  );
                })}
              </div>
              <FormField label="Adresa de livrare *" field="address" icon={MapPin} placeholder="Str. Exemplu 12, ap. 5, Chișinău" form={form} errors={errors} onChange={set} />
            </div>

            <div className="bg-white rounded-2xl border border-zinc-200 p-5 md:p-6">
              <label className="block text-xs font-semibold text-zinc-500 mb-1.5">Note pentru comandă (opțional)</label>
              <textarea
                value={form.notes}
                onChange={(e) => set("notes", e.target.value)}
                rows={3}
                placeholder="Informații suplimentare, preferințe de livrare..."
                className="w-full bg-[#FAFAFA] border border-zinc-200 rounded-xl px-4 py-3 text-sm text-[#09090B] placeholder:text-zinc-400 focus:outline-none focus:border-[#FF4F00] focus:ring-2 focus:ring-[#FF4F00]/20 transition-all resize-none"
              />
            </div>

            <div className="bg-white rounded-2xl border border-zinc-200 p-4">
              <ConsentCheckbox checked={consentGiven} onChange={setConsentGiven} />
            </div>
            <button
              type="submit"
              disabled={!consentGiven}
              className="w-full bg-[#FF4F00] text-white font-black py-4 rounded-2xl text-lg hover:opacity-90 active:scale-[0.99] transition-all shadow-[0_4px_14px_rgba(255,79,0,0.35)] flex items-center justify-center gap-3 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
            >
              <CreditCard className="w-5 h-5" /> Plasează Comanda
            </button>
            <p className="text-center text-xs text-zinc-400">Plata se face la livrare. Fără taxe ascunse.</p>
          </form>

          <div className="lg:sticky lg:top-24 h-fit">
            <div className="bg-white rounded-2xl border border-zinc-200 p-5 md:p-6">
              <h2 className="font-bold text-[#09090B] mb-4 flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-[#FF4F00]" /> Sumar Comandă
              </h2>

              <div className="space-y-3 mb-4">
                {items.map((item) => (
                  <div key={item.id} className="flex items-start gap-3">
                    <div className="w-12 h-12 bg-zinc-50 rounded-xl overflow-hidden flex-shrink-0">
                      <img src={(item as any).imageUrl || ""} alt={item.name} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-[#09090B] leading-tight truncate">{item.name}</p>
                      <p className="text-[10px] text-zinc-400 font-mono mt-0.5">×{item.qty}</p>
                    </div>
                    <p className="font-mono font-bold text-sm text-[#09090B] flex-shrink-0">{(item.price * item.qty).toLocaleString()} MDL</p>
                  </div>
                ))}
              </div>

              <div className="border-t border-zinc-100 pt-4 space-y-2">
                <div className="flex justify-between text-sm text-zinc-500">
                  <span>Subtotal</span>
                  <span className="font-mono">{total.toLocaleString()} MDL</span>
                </div>
                <div className="flex justify-between text-sm text-zinc-500">
                  <span>Livrare</span>
                  {getShippingCost(form.delivery, total) === 0
                    ? <span className="text-green-600 font-bold">GRATUITĂ</span>
                    : <span className="font-semibold text-[#09090B]">{getShippingCost(form.delivery, total)} MDL</span>
                  }
                </div>
                <div className="flex justify-between font-black text-base text-[#09090B] pt-2 border-t border-zinc-100">
                  <span>Total</span>
                  <span className="font-mono text-[#FF4F00]">{(total + getShippingCost(form.delivery, total)).toLocaleString()} MDL</span>
                </div>
              </div>

              <div className="mt-4 bg-zinc-50 rounded-xl p-3 text-xs text-zinc-500 space-y-1">
                <p>✓ Garanție 2–3 ani pe echipamente</p>
                <p>✓ Plată la livrare — fără risc</p>
                <p>✓ Suport tehnic inclus 1 an</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
    </>
  );
}
