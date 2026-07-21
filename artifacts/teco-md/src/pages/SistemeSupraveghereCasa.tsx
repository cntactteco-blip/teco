import { useState } from "react";
import { Link } from "wouter";
import { Home, Phone, Star, ChevronDown, Camera, Shield, Clock, CheckCircle2, Wifi, Server, Zap, ArrowRight } from "lucide-react";
import { SEO, schemas } from "@/components/SEO";
import { useLang } from "@/contexts/LangContext";
import { useStore } from "@/lib/store";
import { useCart } from "@/hooks/useCart";
import { useToast } from "@/hooks/use-toast";

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden">
      <button onClick={() => setOpen(v => !v)} className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-zinc-50 transition-colors" aria-expanded={open}>
        <span className="font-semibold text-[#09090B] text-sm leading-snug">{q}</span>
        <ChevronDown className={`w-4 h-4 text-zinc-400 flex-shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="px-5 pb-4 text-zinc-600 text-sm leading-relaxed border-t border-zinc-100 pt-3">{a}</div>}
    </div>
  );
}

const FAQS = [
  { q: "Ce sistem de supraveghere este cel mai bun pentru o casă?", a: "Pentru o casă standard recomandăm un sistem PoE cu NVR: 4–6 camere 4MP sau 5MP, înregistrator NVR cu HDD de 1TB, aplicație mobilă. Acesta oferă imagine HD, înregistrare continuă 24/7 și acces remote. Prețul unui astfel de sistem complet (echipament + montaj) pornește de la 8.000 MDL." },
  { q: "Câte camere are nevoie o casă?", a: "Recomandăm: 2 camere pentru apartament (ușă intrare + living/curte), 4 camere pentru casă mică (față, spate, 2 laterale), 6–8 camere pentru case mari cu curte. Cu cât mai multe unghiuri, cu atât mai puține zone moarte." },
  { q: "Pot vedea camerele noaptea?", a: "Da, toate camerele noastre au iluminat infraroșu (IR) sau Full-Color — unele modele văd noaptea ca ziua (color night vision). Distanța de vedere nocturnă variază de la 20m la 60m, în funcție de model." },
  { q: "Cât costă un sistem complet de supraveghere pentru casă în Moldova?", a: "Un sistem complet (camere + NVR + HDD + cabluri + montaj) costă: 2 camere WiFi de la 3.000 MDL, 4 camere PoE + NVR de la 8.000 MDL, 6 camere PoE + NVR + HDD 1TB de la 13.000 MDL. Vedeți ofertele noastre complete pe pagina de seturi." },
  { q: "Sistemul funcționează și fără internet?", a: "Da, sistemele cu NVR înregistrează local pe HDD-ul din înregistrator, chiar fără internet. Veți putea accesa înregistrările de pe ecran sau TV. Accesul remote (de pe telefon) necesită conexiune la internet." },
  { q: "Ce se întâmplă dacă cineva taie curentul sau internetul?", a: "Sistemele PoE cu NVR înregistrează local și nu depind de internet pentru stocare. Puteți adăuga un UPS (baterie backup) pentru a menține sistemul funcțional câteva ore fără curent. Camerele 4G Solar sunt complet autonome." },
  { q: "Pot instala eu singur camerele pentru casă?", a: "Camerele WiFi pot fi instalate relativ simplu fără cunoștințe tehnice. Sistemele PoE cu NVR necesită cablare și configurare mai complexă — recomandăm tehnicianul pentru un rezultat profesional." },
  { q: "Cât timp se păstrează înregistrările?", a: "Cu HDD de 1TB și 4 camere la rezoluție standard, înregistrările se păstrează 20–30 de zile. Cu 2TB sau rezoluție redusă, poți ajunge la 60 de zile. Sistemul suprascrie automat cele mai vechi înregistrări." },
];

const PACKAGES = [
  { name: "Start — Apartament", cameras: 2, type: "WiFi", price: "de la 3.200 MDL", includes: ["2 camere WiFi 3MP", "Configurare aplicație", "Montaj inclus", "Vedere nocturnă"], popular: false },
  { name: "Standard — Casă Mică", cameras: 4, type: "PoE + NVR", price: "de la 8.500 MDL", includes: ["4 camere PoE 4MP", "NVR 4 canale", "HDD 1TB", "Cablare + montaj + config"], popular: true },
  { name: "Pro — Casă Mare", cameras: 6, type: "PoE + NVR", price: "de la 13.500 MDL", includes: ["6 camere PoE 5MP", "NVR 8 canale", "HDD 1TB", "Cablare mascată + montaj"], popular: false },
  { name: "Premium — Vilă", cameras: 8, type: "PoE + NVR AI", price: "de la 18.000 MDL", includes: ["8 camere 4K AI", "NVR 8 canale 4K", "HDD 2TB", "Alerte inteligente + montaj"], popular: false },
];

export default function SistemeSupraveghereCasa() {
  const { lang } = useLang();
  const storeProducts = useStore(s => s.products);
  const kits = storeProducts.filter(p => p.category === "kituri" && p.inStock !== false && p.price > 0).slice(0, 3);

  const title = "Sistem Supraveghere Casă Moldova | Camere Video Casă | Teco.md";
  const description = "Sisteme de supraveghere complete pentru casă în Moldova. Camere WiFi, PoE + NVR, 4G Solar. Pachete complete de la 3.200 MDL cu montaj profesional inclus. ☎ 067 200 463";
  const keywords = "sistem supraveghere casa moldova, camere supraveghere casa, kit supraveghere casa, camere video casa, sistem securitate casa chisinau, nvr camere casa, teco.md";

  const jsonLd = [
    schemas.breadcrumb([
      { name: "Acasă", url: "https://teco.md/" },
      { name: "Sistem Supraveghere Casă", url: "https://teco.md/sisteme-supraveghere-casa" },
    ]),
    {
      "@context": "https://schema.org",
      "@type": "Service",
      name: "Sisteme de Supraveghere pentru Casă — Teco.md Moldova",
      description: "Sisteme complete de supraveghere video pentru casă și curte în Moldova. Camere WiFi și PoE, NVR, instalare și configurare profesională. Pachete de la 3.200 MDL.",
      url: "https://teco.md/sisteme-supraveghere-casa",
      provider: { "@type": "LocalBusiness", "@id": "https://teco.md/#business", name: "Teco.md" },
      areaServed: { "@type": "Country", name: "Moldova" },
      serviceType: "Home Security System Installation",
      aggregateRating: { "@type": "AggregateRating", ratingValue: "4.9", reviewCount: "213", bestRating: "5", worstRating: "1" },
    },
    schemas.faq(FAQS.slice(0, 6).map(f => ({ question: f.q, answer: f.a }))),
    ...(kits.length > 0 ? [schemas.collectionPage(kits.map(p => ({ id: p.id, name: p.name, imageUrl: p.imageUrl, price: p.price, inStock: p.inStock })), { name: "Seturi Complete Supraveghere Casă", url: "https://teco.md/sisteme-supraveghere-casa", description: "Kituri complete de supraveghere pentru casă în Moldova" })] : []),
    schemas.localBusiness(lang as "ro" | "ru"),
  ];

  return (
    <>
      <SEO title={title} description={description} keywords={keywords} canonical="/sisteme-supraveghere-casa" lang={lang as "ro" | "ru"} jsonLd={jsonLd} />
      <main className="flex-1 bg-white">
        {/* Breadcrumb */}
        <nav className="max-w-6xl mx-auto px-4 pt-4 pb-1">
          <ol className="flex items-center gap-1.5 text-xs text-zinc-400">
            <li><Link href="/" className="hover:text-[#FF4F00] transition-colors">Acasă</Link></li>
            <li className="text-zinc-300">/</li>
            <li className="text-zinc-600 font-medium">Sistem Supraveghere Casă</li>
          </ol>
        </nav>

        {/* Hero */}
        <section className="bg-[#09090B] text-white py-14 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-[#FF4F00]/20 text-[#FF4F00] text-xs font-bold px-3 py-1.5 rounded-full mb-5 uppercase tracking-wide">
              <Home className="w-3.5 h-3.5" /> Securitate Acasă
            </div>
            <h1 className="text-3xl md:text-5xl font-black leading-tight mb-5">
              Sistem de Supraveghere
              <span className="block text-[#FF4F00] mt-1">pentru Casa Ta</span>
            </h1>
            <p className="text-zinc-300 text-base md:text-lg max-w-2xl mx-auto mb-8 leading-relaxed">
              Pachete complete de camere video pentru casă și curte în Moldova. De la <strong className="text-white">3.200 MDL</strong> cu montaj profesional inclus. Garanție 2 ani.
            </p>
            <div className="flex items-center justify-center gap-2 mb-8">
              <div className="flex">{[1,2,3,4,5].map(i => <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />)}</div>
              <span className="text-zinc-300 text-sm"><strong className="text-white">4.9</strong> din 213 recenzii</span>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a href="tel:+37367200463" className="inline-flex items-center justify-center gap-2 bg-[#FF4F00] text-white font-bold px-7 py-3.5 rounded-xl text-base hover:opacity-90 transition-all shadow-lg">
                <Phone className="w-4 h-4" /> Sună: 067 200 463
              </a>
              <Link href="/produse?cat=kituri" className="inline-flex items-center justify-center gap-2 border border-zinc-700 text-white font-semibold px-7 py-3.5 rounded-xl text-base hover:bg-zinc-800 transition-all">
                <Camera className="w-4 h-4" /> Vezi Seturi Complete
              </Link>
            </div>
          </div>
        </section>

        {/* Pachete */}
        <section className="py-14 px-4 bg-zinc-50">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-black text-[#09090B] text-center mb-3">Pachete Recomandate pentru Casă</h2>
            <p className="text-zinc-500 text-center text-sm mb-10 max-w-xl mx-auto">Toate pachetele includ echipament original + cablare + montaj profesional + configurare aplicație</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {PACKAGES.map(p => (
                <div key={p.name} className={`relative bg-white rounded-2xl p-6 border-2 ${p.popular ? "border-[#FF4F00] shadow-xl shadow-orange-100" : "border-zinc-200"}`}>
                  {p.popular && <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#FF4F00] text-white text-[10px] font-black px-4 py-1 rounded-full uppercase tracking-wide whitespace-nowrap">Cel mai popular</div>}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">{p.type}</div>
                      <h3 className="font-black text-[#09090B] text-lg leading-tight">{p.name}</h3>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-black text-[#FF4F00]">{p.cameras}</div>
                      <div className="text-xs text-zinc-400">camere</div>
                    </div>
                  </div>
                  <ul className="space-y-2 mb-5">
                    {p.includes.map(item => (
                      <li key={item} className="flex items-center gap-2 text-sm text-zinc-600">
                        <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" /> {item}
                      </li>
                    ))}
                  </ul>
                  <div className="font-black text-[#09090B] text-xl mb-4">{p.price}</div>
                  <Link href="/oferta" className={`block w-full text-center py-3 rounded-xl font-bold text-sm transition-all ${p.popular ? "bg-[#FF4F00] text-white hover:opacity-90" : "bg-zinc-100 text-[#09090B] hover:bg-zinc-200"}`}>
                    Solicită Ofertă
                  </Link>
                </div>
              ))}
            </div>
            <p className="text-center text-zinc-400 text-xs mt-6">* Prețurile sunt orientative. Oferta finală se calculează după consultația gratuită la fața locului.</p>
          </div>
        </section>

        {/* Tipuri */}
        <section className="py-14 px-4">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-black text-[#09090B] text-center mb-3">Ce tip de sistem se potrivește casei tale</h2>
            <p className="text-zinc-500 text-center text-sm mb-10">Alegem soluția în funcție de tipul locuinței și buget</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[
                { icon: Wifi, title: "WiFi — Apartament", desc: "Camere wireless, fără găuri în pereți. Ideal pentru chiriași sau apartamente. Configurare în 30 min.", href: "/produse?cat=wifi", label: "Camere WiFi" },
                { icon: Server, title: "PoE + NVR — Casă", desc: "Sistem profesional cu cabluri mascate, înregistrare 24/7 pe HDD, imagine 4K. Cea mai fiabilă soluție.", href: "/produse?cat=poe", label: "Sisteme PoE" },
                { icon: Zap, title: "4G Solar — Curte", desc: "Pentru garaje, grădini sau locuri fără curent electric. Funcționează 100% autonom.", href: "/produse?cat=4g", label: "Camere 4G" },
              ].map(t => (
                <div key={t.title} className="bg-zinc-50 rounded-2xl p-6 border border-zinc-100">
                  <div className="w-12 h-12 bg-[#FF4F00]/10 rounded-2xl flex items-center justify-center mb-4">
                    <t.icon className="w-6 h-6 text-[#FF4F00]" />
                  </div>
                  <h3 className="font-bold text-[#09090B] text-base mb-2">{t.title}</h3>
                  <p className="text-zinc-500 text-sm leading-relaxed mb-4">{t.desc}</p>
                  <Link href={t.href} className="inline-flex items-center gap-1 text-[#FF4F00] font-bold text-sm hover:underline">
                    {t.label} <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-14 px-4 bg-zinc-50">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-black text-[#09090B] text-center mb-10">Întrebări frecvente — Sistem supraveghere casă</h2>
            <div className="flex flex-col gap-3">{FAQS.map(f => <FAQItem key={f.q} q={f.q} a={f.a} />)}</div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 px-4 bg-[#FF4F00]">
          <div className="max-w-2xl mx-auto text-center text-white">
            <h2 className="text-2xl md:text-3xl font-black mb-4">Protejează-ți casa azi</h2>
            <p className="text-orange-100 text-sm mb-8">Sună pentru consultație gratuită — îți recomandam sistemul potrivit și programăm instalarea.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a href="tel:+37367200463" className="inline-flex items-center justify-center gap-2 bg-white text-[#FF4F00] font-black px-8 py-4 rounded-xl text-base hover:opacity-90 transition-all">
                <Phone className="w-5 h-5" /> 067 200 463
              </a>
              <Link href="/produse?cat=kituri" className="inline-flex items-center justify-center gap-2 bg-white/20 text-white font-bold px-8 py-4 rounded-xl border border-white/30 hover:bg-white/30 transition-all">
                Vezi Seturi Complete
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
