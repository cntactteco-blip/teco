import { ArrowLeft, Truck, CheckCircle2, Clock, MapPin, Package } from "lucide-react";
import { Link } from "wouter";
import { SEO } from "@/components/SEO";
import { useLang } from "@/contexts/LangContext";

export default function Livrare() {
  const { lang } = useLang();
  const ro = lang === "ro";

  return (
    <>
      <SEO
        title="Informații Livrare — Teco.md"
        description="Tarife și termeni de livrare pentru comenzile Teco.md. Livrare gratuită pentru comenzi peste 5000 MDL oriunde în Moldova."
        canonical="/livrare"
        lang={ro ? "ro" : "ru"}
      />
      <main className="flex-1 bg-[#FAFAFA] pb-[64px] md:pb-0">
        <div className="max-w-2xl mx-auto px-4 py-8">

          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Link href="/" className="w-9 h-9 rounded-xl bg-white border border-zinc-200 flex items-center justify-center hover:bg-zinc-50 transition-colors">
              <ArrowLeft className="w-4 h-4 text-zinc-600" />
            </Link>
            <div>
              <h1 className="font-black text-2xl text-[#09090B]">Informații Livrare Teco.md</h1>
              <p className="text-zinc-500 text-sm mt-0.5">Curierat rapid direct la ușa dumneavoastră</p>
            </div>
          </div>

          {/* Intro */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-5 mb-5">
            <div className="flex items-start gap-3">
              <Truck className="w-5 h-5 text-[#FF4F00] mt-0.5 shrink-0" />
              <p className="text-sm text-zinc-600 leading-relaxed">
                Toate comenzile plasate pe site-ul Teco.md sunt livrate exclusiv prin intermediul serviciilor de curierat rapid extern, <strong>direct la ușa dumneavoastră</strong>.
              </p>
            </div>
          </div>

          {/* Free shipping highlight */}
          <div className="bg-green-50 border border-green-200 rounded-2xl p-5 mb-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="font-black text-green-800 text-base">LIVRARE GRATUITĂ</p>
              <p className="text-green-700 text-sm mt-0.5">
                Pentru orice comandă de peste <strong>5.000 MDL</strong>, livrarea este gratuită oriunde în Republica Moldova.
              </p>
            </div>
          </div>

          {/* Tariff table */}
          <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden mb-5">
            <div className="px-5 py-4 border-b border-zinc-100">
              <h2 className="font-black text-[#09090B] text-base">Tarife Livrare (comenzi sub 5.000 MDL)</h2>
            </div>
            <div className="divide-y divide-zinc-100">
              {[
                { icon: MapPin, zone: "Chișinău (Oraș)", price: "95 MDL", time: "24 – 48 ore lucrătoare", color: "text-[#FF4F00]" },
                { icon: MapPin, zone: "Suburbii Chișinău", price: "125 MDL", time: "24 – 48 ore lucrătoare", color: "text-[#FF4F00]" },
                { icon: Truck, zone: "Toată Moldova (Orice localitate)", price: "145 MDL", time: "48 – 72 ore lucrătoare", color: "text-[#FF4F00]" },
              ].map((row) => (
                <div key={row.zone} className="flex items-center gap-4 px-5 py-4">
                  <row.icon className="w-4 h-4 text-zinc-400 shrink-0" />
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-[#09090B]">{row.zone}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Clock className="w-3 h-3 text-zinc-400" />
                      <p className="text-xs text-zinc-500">{row.time}</p>
                    </div>
                  </div>
                  <span className={`font-black text-base ${row.color}`}>{row.price}</span>
                </div>
              ))}
              <div className="flex items-center gap-4 px-5 py-4 bg-green-50">
                <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                <div className="flex-1">
                  <p className="font-semibold text-sm text-green-800">Comenzi peste 5.000 MDL — toate regiunile</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Clock className="w-3 h-3 text-green-500" />
                    <p className="text-xs text-green-600">24 – 72 ore lucrătoare (în funcție de regiune)</p>
                  </div>
                </div>
                <span className="font-black text-base text-green-600">GRATUIT</span>
              </div>
            </div>
          </div>

          {/* How it works */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-5 mb-5">
            <div className="flex items-center gap-2 mb-4">
              <Package className="w-4 h-4 text-[#FF4F00]" />
              <h2 className="font-black text-[#09090B] text-base">Cum funcționează livrarea</h2>
            </div>
            <div className="flex flex-col gap-3">
              {[
                { n: "1", text: "Comenzile sunt preluate și transmise către serviciul de curierat după confirmarea telefonică cu operatorul nostru." },
                { n: "2", text: "Înainte de livrare, veți fi contactat telefonic de către curierul firmei de transport pentru a stabili detaliile primirii coletului." },
                { n: "3", text: "Plata se efectuează la livrare — numerar sau card, în funcție de curierul alocat." },
              ].map((step) => (
                <div key={step.n} className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-[#FF4F00] text-white text-xs font-black flex items-center justify-center shrink-0 mt-0.5">{step.n}</span>
                  <p className="text-sm text-zinc-600 leading-relaxed">{step.text}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="text-center">
            <Link
              href="/produse"
              className="inline-flex items-center gap-2 bg-[#FF4F00] text-white font-bold px-6 py-3.5 rounded-2xl shadow-[0_4px_20px_rgba(255,79,0,0.3)] hover:opacity-90 transition-all"
            >
              <Truck className="w-4 h-4" />
              Comandă acum
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
