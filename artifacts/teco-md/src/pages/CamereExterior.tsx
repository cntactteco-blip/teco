import { useState } from "react";
import { Link } from "wouter";
import { Sun, Phone, Star, ChevronDown, Camera, Shield, CheckCircle2, Wifi, Zap, ArrowRight, Cloud, Thermometer } from "lucide-react";
import { SEO, schemas } from "@/components/SEO";
import { useLang } from "@/contexts/LangContext";
import { useStore } from "@/lib/store";

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
  { q: "Ce camere de exterior sunt cele mai bune pentru Moldova?", a: "Pentru condițiile din Moldova (temperaturi -25°C iarna, ploi, praf) recomandăm camere cu protecție IP66/IP67. Cele mai bune branduri: IMOU (pentru WiFi), Dahua/Uniview (pentru PoE profesional), Reolink (pentru 4G Solar). Toate sunt disponibile la Teco.md cu garanție 2–5 ani." },
  { q: "Care este diferența dintre IP65, IP66 și IP67?", a: "IP65 = protecție la jet de apă din orice direcție. IP66 = protecție la jet de apă puternic (furtuni). IP67 = protecție la imersie în apă până la 1m/30min. Pentru exterior în Moldova, minimum IP66 este recomandat." },
  { q: "Camerele de exterior rezistă la îngheț?", a: "Da, camerele noastre de exterior funcționează la temperaturi de la -30°C la +60°C. Cele cu LED Color Night Vision sau cu Full-Color funcționează optim chiar și pe timp de ger." },
  { q: "Câte MP are nevoie o cameră de exterior?", a: "Recomandăm minimum 4MP pentru exterior. Pentru distanțe mari sau plăcuțe auto, 5MP–8MP (4K). Cu 4MP poți identifica clar o persoană la 15–20m, cu 8MP la 30–40m." },
  { q: "Ce distanță de vedere nocturnă au camerele de exterior?", a: "Camerele cu IR LED: 20–60m (imagine alb-negru noaptea). Camerele Full-Color sau cu LED White Light: 20–40m în culori noaptea. Camerele Dual-Light: IR + LED activat doar la detecție — economie energie." },
  { q: "Pot monta camere de exterior fără cabluri?", a: "Da! Camerele WiFi de exterior (IMOU, Reolink) se conectează wireless la routerul tău. Necesită doar alimentare cu curent (priză). Alternativ, camerele 4G Solar nu au nevoie nici de curent, nici de internet." },
  { q: "Cât costă o cameră de exterior în Moldova?", a: "Camerele de exterior WiFi pornesc de la 1.100 MDL. Camerele PoE profesionale de la 1.300 MDL. Camerele 4G Solar de la 3.500 MDL. Prețurile includ garanție 2–5 ani. Livrare 24h în toată Moldova." },
  { q: "Instalați camere de exterior și la companii/afaceri?", a: "Da, instalăm sisteme de exterior pentru firme, depozite, parcări, restaurante, magazine. Oferim sisteme scalabile de la 4 la 32+ camere, cu NVR profesional și stocare extinsă." },
];

const TYPES = [
  { title: "Camere WiFi Exterior", icon: Wifi, color: "bg-blue-50 border-blue-100", iconColor: "text-blue-600", bg: "bg-blue-600/10", desc: "Fără cabluri LAN — se conectează la WiFi. Ideale pentru case cu WiFi extins în curte sau grădină. Rezoluție până la 5MP.", href: "/produse?cat=wifi", badges: ["IP66/IP67", "Până la 5MP", "Fără cabluri"] },
  { title: "Camere PoE Exterior", icon: Shield, color: "bg-green-50 border-green-100", iconColor: "text-green-600", bg: "bg-green-600/10", desc: "Conectate prin cablu LAN — cea mai stabilă soluție. Imagine 4K–8MP, IR sau Full-Color, detecție AI, pentru sisteme profesionale.", href: "/produse?cat=poe", badges: ["4K–8MP", "Conexiune stabilă", "AI detecție"] },
  { title: "Camere 4G Solar Exterior", icon: Sun, color: "bg-amber-50 border-amber-100", iconColor: "text-amber-600", bg: "bg-amber-600/10", desc: "Complet autonome — fără curent, fără internet. Panou solar + baterie + SIM card. Ideale pentru câmp, grădini, hale fără curent.", href: "/produse?cat=4g", badges: ["Fără curent", "4G LTE", "Panou Solar"] },
];

export default function CamereExterior() {
  const { lang } = useLang();
  const storeProducts = useStore(s => s.products);
  const exteriorProducts = storeProducts.filter(p => p.inStock !== false && p.price > 0 && (p.category === "wifi" || p.category === "poe" || p.category === "4g")).slice(0, 4);

  const title = "Camere Supraveghere Exterior Moldova | IP66/IP67 | WiFi, PoE, 4G Solar | Teco.md";
  const description = "Camere supraveghere exterior pentru casă, curte și afaceri în Moldova. IP66/IP67, vedere nocturnă, WiFi, PoE sau 4G Solar. Prețuri de la 1.100 MDL. Livrare 24h. ☎ 067 200 463";
  const keywords = "camere supraveghere exterior moldova, camera ip exterior, camere exterior wifi, camera supraveghere curte, camera exterior 4k, camera exterior ip66, camere rezistente la apa, teco.md exterior";

  const jsonLd = [
    schemas.breadcrumb([
      { name: "Acasă", url: "https://teco.md/" },
      { name: "Camere Supraveghere Exterior", url: "https://teco.md/camere-supraveghere-exterior" },
    ]),
    {
      "@context": "https://schema.org",
      "@type": "Service",
      name: "Camere de Supraveghere pentru Exterior Moldova",
      description: "Vânzare și instalare camere de supraveghere exterior în Moldova. Camere WiFi, PoE și 4G Solar cu protecție IP66/IP67, vedere nocturnă Full-Color, rezoluție 4K. Garanție 2–5 ani.",
      url: "https://teco.md/camere-supraveghere-exterior",
      provider: { "@type": "LocalBusiness", "@id": "https://teco.md/#business", name: "Teco.md" },
      areaServed: { "@type": "Country", name: "Moldova" },
      serviceType: "Outdoor Security Camera Installation",
      aggregateRating: { "@type": "AggregateRating", ratingValue: "4.9", reviewCount: "213", bestRating: "5", worstRating: "1" },
    },
    schemas.faq(FAQS.slice(0, 6).map(f => ({ question: f.q, answer: f.a }))),
    ...(exteriorProducts.length > 0 ? [schemas.collectionPage(exteriorProducts.map(p => ({ id: p.id, name: p.name, imageUrl: p.imageUrl, price: p.price, inStock: p.inStock })), { name: "Camere Supraveghere Exterior Moldova", url: "https://teco.md/camere-supraveghere-exterior" })] : []),
    schemas.localBusiness(lang as "ro" | "ru"),
  ];

  return (
    <>
      <SEO title={title} description={description} keywords={keywords} canonical="/camere-supraveghere-exterior" lang={lang as "ro" | "ru"} jsonLd={jsonLd} />
      <main className="flex-1 bg-white">
        {/* Breadcrumb */}
        <nav className="max-w-6xl mx-auto px-4 pt-4 pb-1">
          <ol className="flex items-center gap-1.5 text-xs text-zinc-400">
            <li><Link href="/" className="hover:text-[#FF4F00] transition-colors">Acasă</Link></li>
            <li className="text-zinc-300">/</li>
            <li className="text-zinc-600 font-medium">Camere Supraveghere Exterior</li>
          </ol>
        </nav>

        {/* Hero */}
        <section className="bg-[#09090B] text-white py-14 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-[#FF4F00]/20 text-[#FF4F00] text-xs font-bold px-3 py-1.5 rounded-full mb-5 uppercase tracking-wide">
              <Cloud className="w-3.5 h-3.5" /> Rezistente la Intemperii
            </div>
            <h1 className="text-3xl md:text-5xl font-black leading-tight mb-5">
              Camere Supraveghere
              <span className="block text-[#FF4F00] mt-1">pentru Exterior</span>
            </h1>
            <p className="text-zinc-300 text-base md:text-lg max-w-2xl mx-auto mb-6 leading-relaxed">
              IP66/IP67 · Vedere nocturnă Full-Color · WiFi, PoE sau 4G Solar · Funcționează de la <strong className="text-white">-30°C la +60°C</strong>
            </p>
            {/* IP badges */}
            <div className="flex flex-wrap justify-center gap-2 mb-8">
              {["IP66/IP67", "Vedere nocturnă", "4K–8MP", "WiFi / PoE / 4G", "-30°C până la +60°C"].map(b => (
                <span key={b} className="px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-zinc-200 border border-white/10">{b}</span>
              ))}
            </div>
            <div className="flex items-center justify-center gap-2 mb-8">
              <div className="flex">{[1,2,3,4,5].map(i => <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />)}</div>
              <span className="text-zinc-300 text-sm"><strong className="text-white">4.9</strong> din 213 recenzii</span>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/produse" className="inline-flex items-center justify-center gap-2 bg-[#FF4F00] text-white font-bold px-7 py-3.5 rounded-xl text-base hover:opacity-90 transition-all shadow-lg">
                <Camera className="w-4 h-4" /> Vezi Toate Camerele
              </Link>
              <a href="tel:+37367200463" className="inline-flex items-center justify-center gap-2 border border-zinc-700 text-white font-semibold px-7 py-3.5 rounded-xl text-base hover:bg-zinc-800 transition-all">
                <Phone className="w-4 h-4" /> 067 200 463
              </a>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="bg-[#FF4F00] py-8 px-4">
          <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-white text-center">
            {[{ n: "IP66/67", l: "Protecție intemperii" }, { n: "4K", l: "Rezoluție maximă" }, { n: "-30°C", l: "Temperatură minimă" }, { n: "60m", l: "Vedere nocturnă" }].map(s => (
              <div key={s.l}><div className="text-3xl font-black mb-0.5">{s.n}</div><div className="text-orange-100 text-sm">{s.l}</div></div>
            ))}
          </div>
        </section>

        {/* Tipuri */}
        <section className="py-14 px-4">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-black text-[#09090B] text-center mb-3">Tipuri de camere exterior</h2>
            <p className="text-zinc-500 text-center text-sm mb-10">Alege soluția în funcție de locul de instalare și necesități</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {TYPES.map(t => (
                <div key={t.title} className={`rounded-2xl p-6 border ${t.color}`}>
                  <div className={`w-12 h-12 ${t.bg} rounded-2xl flex items-center justify-center mb-4`}>
                    <t.icon className={`w-6 h-6 ${t.iconColor}`} />
                  </div>
                  <h3 className="font-bold text-[#09090B] text-base mb-2">{t.title}</h3>
                  <p className="text-zinc-500 text-sm leading-relaxed mb-4">{t.desc}</p>
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {t.badges.map(b => <span key={b} className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white border border-zinc-200 text-zinc-600">{b}</span>)}
                  </div>
                  <Link href={t.href} className="inline-flex items-center gap-1 text-[#FF4F00] font-bold text-sm hover:underline">
                    Vezi produse <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Caracteristici cheie */}
        <section className="py-14 px-4 bg-zinc-50">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-black text-[#09090B] text-center mb-3">Ce înseamnă o cameră bună de exterior</h2>
            <p className="text-zinc-500 text-center text-sm mb-10">Toate camerele noastre de exterior îndeplinesc aceste standarde</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[
                { icon: Shield, t: "Protecție IP66/IP67", d: "Rezistă la ploaie torențială, zăpadă, praf și jet de apă. Certificată pentru exterior permanent." },
                { icon: Thermometer, t: "Funcționare -30°C→+60°C", d: "Optimizate pentru clima Moldovei — ierni geroase și veri toride. Fără întreruperi tot anul." },
                { icon: Zap, t: "Vedere nocturnă Full-Color", d: "LED-uri albe sau infraroșii — unele modele văd în culori complete și noaptea, fără lumină externă." },
                { icon: Camera, t: "Rezoluție 4MP–8MP (4K)", d: "Suficient de clară pentru a identifica fețe, plăcuțe auto și detalii fine la distanțe mari." },
                { icon: CheckCircle2, t: "Detecție AI", d: "Distinge oameni de animale sau mașini — alerte precise, fără alarme false." },
                { icon: Cloud, t: "Stocare locală + Cloud", d: "NVR/card SD pentru stocare locală plus opțional cloud. Înregistrări sigure chiar dacă camera e furată." },
              ].map(f => (
                <div key={f.t} className="bg-white rounded-2xl p-5 border border-zinc-100">
                  <div className="w-10 h-10 bg-[#FF4F00]/10 rounded-xl flex items-center justify-center mb-3">
                    <f.icon className="w-5 h-5 text-[#FF4F00]" />
                  </div>
                  <h3 className="font-bold text-[#09090B] text-sm mb-1">{f.t}</h3>
                  <p className="text-zinc-500 text-xs leading-relaxed">{f.d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-14 px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-black text-[#09090B] text-center mb-10">Întrebări frecvente — camere exterior</h2>
            <div className="flex flex-col gap-3">{FAQS.map(f => <FAQItem key={f.q} q={f.q} a={f.a} />)}</div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 px-4 bg-[#FF4F00]">
          <div className="max-w-2xl mx-auto text-center text-white">
            <h2 className="text-2xl md:text-3xl font-black mb-4">Alege camera potrivită pentru exteriorul tău</h2>
            <p className="text-orange-100 text-sm mb-8">Consultanța noastră este gratuită — îți recomandăm ce se potrivește cel mai bine locației și bugetului tău.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a href="tel:+37367200463" className="inline-flex items-center justify-center gap-2 bg-white text-[#FF4F00] font-black px-8 py-4 rounded-xl text-base hover:opacity-90 transition-all">
                <Phone className="w-5 h-5" /> 067 200 463
              </a>
              <Link href="/produse" className="inline-flex items-center justify-center gap-2 bg-white/20 text-white font-bold px-8 py-4 rounded-xl border border-white/30 hover:bg-white/30 transition-all">
                Catalog Complet
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
