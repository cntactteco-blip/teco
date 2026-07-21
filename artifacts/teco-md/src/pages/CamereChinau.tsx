import { useState } from "react";
import { Link } from "wouter";
import { MapPin, Phone, Star, ChevronDown, Camera, Shield, Clock, CheckCircle2, ArrowRight, Wrench, Zap } from "lucide-react";
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

const SECTORS = [
  "Centru", "Botanica", "Buiucani", "Ciocana", "Rîșcani",
  "Telecentru", "Trudovoe", "Durlești", "Stăuceni", "Codru",
  "Cricova", "Vatra", "Grătești", "Colonița", "Ciorescu",
];

const FAQS = [
  { q: "Instalați camere de supraveghere în Chișinău cu venire la domiciliu?", a: "Da, tehnicianul vine la adresa ta în Chișinău — orice sector (Centru, Botanica, Buiucani, Ciocana, Rîșcani etc.). Programăm vizita pentru ziua sau a doua zi. Sună la 067 200 463." },
  { q: "Cât costă un sistem de supraveghere în Chișinău?", a: "Un sistem complet pentru casă sau apartament în Chișinău costă de la 3.500 MDL (2 camere WiFi + configurare). Un sistem profesional de 4 camere PoE + NVR + montaj pornește de la 8.000 MDL. Contactați-ne pentru ofertă personalizată gratuită." },
  { q: "Câte zile durează până instalați în Chișinău?", a: "De obicei instalăm în 24–48h de la confirmare. Pentru urgențe, putem veni în aceeași zi dacă tehnicianul este disponibil." },
  { q: "Puteți instala camere la apartament în bloc?", a: "Da, instalăm camere WiFi și PoE la apartamente în bloc (interior și pe hol/ușă intrare). Oferim soluții fără cabluri vizibile și fără modificări la structura blocului." },
  { q: "Ce branduri de camere instalați în Chișinău?", a: "Instalăm IMOU, Dahua, Uniview, Uniarch, Reolink, TP-Link Tapo, Ajax. Toate produsele sunt originale, cu garanție producător 2–3 ani." },
  { q: "Oferiți garanție pentru instalarea din Chișinău?", a: "Da, garanție 2 ani pentru montajul nostru. Dacă apare orice problemă cu instalarea în această perioadă, revenim gratuit." },
  { q: "Pot vedea camerele de pe telefon, de oriunde?", a: "Da, configurăm accesul remote complet — vizualizare live și înregistrări din aplicație, de oriunde în lume, pe iPhone sau Android." },
  { q: "Instalați și sisteme de alarmă în Chișinău?", a: "Da, instalăm sisteme Ajax wireless — cele mai fiabile din Moldova. Senzori de mișcare, ușă/fereastră, sirenă, monitorizare 24/7 prin aplicație." },
];

export default function CamereChisinau() {
  const { lang } = useLang();
  const storeProducts = useStore(s => s.products);
  const topProducts = storeProducts.filter(p => p.inStock !== false && p.price > 0).slice(0, 4);

  const title = "Camere Supraveghere Chișinău | Instalare și Montaj | Teco.md";
  const description = "Camere de supraveghere în Chișinău — instalare profesională în toate sectoarele. WiFi, PoE, 4G Solar, NVR. Garanție 2 ani. Venim la tine în 24h. ☎ 067 200 463";
  const keywords = "camere supraveghere chisinau, instalare camere chisinau, montaj sistem supraveghere chisinau, camere ip chisinau, sisteme securitate chisinau, teco.md chisinau";

  const jsonLd = [
    schemas.breadcrumb([
      { name: "Acasă", url: "https://teco.md/" },
      { name: "Camere Supraveghere Chișinău", url: "https://teco.md/camere-supraveghere-chisinau" },
    ]),
    {
      "@context": "https://schema.org",
      "@type": "Service",
      name: "Camere Supraveghere Chișinău — Instalare Profesională",
      description: "Vânzare și instalare sisteme de supraveghere video în Chișinău. Acoperim toate sectoarele: Centru, Botanica, Buiucani, Ciocana, Rîșcani. Tehnicieni certificați, garanție 2 ani.",
      url: "https://teco.md/camere-supraveghere-chisinau",
      provider: { "@type": "LocalBusiness", "@id": "https://teco.md/#business", name: "Teco.md" },
      areaServed: [
        { "@type": "City", name: "Chișinău", containedInPlace: { "@type": "Country", name: "Moldova" } },
        ...SECTORS.map(s => ({ "@type": "Place", name: `${s}, Chișinău` })),
      ],
      serviceType: "Security Camera Installation",
      aggregateRating: { "@type": "AggregateRating", ratingValue: "4.9", reviewCount: "213", bestRating: "5", worstRating: "1" },
    },
    schemas.faq(FAQS.slice(0, 6).map(f => ({ question: f.q, answer: f.a }))),
    schemas.localBusiness(lang as "ro" | "ru"),
  ];

  return (
    <>
      <SEO title={title} description={description} keywords={keywords} canonical="/camere-supraveghere-chisinau" lang={lang as "ro" | "ru"} jsonLd={jsonLd} />
      <main className="flex-1 bg-white">
        {/* Breadcrumb */}
        <nav className="max-w-6xl mx-auto px-4 pt-4 pb-1">
          <ol className="flex items-center gap-1.5 text-xs text-zinc-400">
            <li><Link href="/" className="hover:text-[#FF4F00] transition-colors">Acasă</Link></li>
            <li className="text-zinc-300">/</li>
            <li className="text-zinc-600 font-medium">Camere Supraveghere Chișinău</li>
          </ol>
        </nav>

        {/* Hero */}
        <section className="bg-[#09090B] text-white py-14 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-[#FF4F00]/20 text-[#FF4F00] text-xs font-bold px-3 py-1.5 rounded-full mb-5 uppercase tracking-wide">
              <MapPin className="w-3.5 h-3.5" />
              Chișinău — toate sectoarele
            </div>
            <h1 className="text-3xl md:text-5xl font-black leading-tight mb-5">
              Camere de Supraveghere
              <span className="block text-[#FF4F00] mt-1">în Chișinău</span>
            </h1>
            <p className="text-zinc-300 text-base md:text-lg max-w-2xl mx-auto mb-8 leading-relaxed">
              Instalare profesională în toate sectoarele Chișinăului. Tehnicianul vine la tine în <strong className="text-white">24h</strong>. Garanție 2 ani. Prețuri de la <strong className="text-white">300 MDL/cameră</strong>.
            </p>
            <div className="flex items-center justify-center gap-2 mb-8">
              <div className="flex">{[1,2,3,4,5].map(i => <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />)}</div>
              <span className="text-zinc-300 text-sm"><strong className="text-white">4.9</strong> — 213 clienți în Chișinău</span>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a href="tel:+37367200463" className="inline-flex items-center justify-center gap-2 bg-[#FF4F00] text-white font-bold px-7 py-3.5 rounded-xl text-base hover:opacity-90 transition-all shadow-lg">
                <Phone className="w-4 h-4" /> Sună: 067 200 463
              </a>
              <Link href="/produse" className="inline-flex items-center justify-center gap-2 border border-zinc-700 text-white font-semibold px-7 py-3.5 rounded-xl text-base hover:bg-zinc-800 transition-all">
                <Camera className="w-4 h-4" /> Vezi Catalog
              </Link>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="bg-[#FF4F00] py-8 px-4">
          <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-white text-center">
            {[{ n: "500+", l: "Sisteme în Chișinău" }, { n: "24h", l: "Instalare rapidă" }, { n: "15", l: "Sectoare acoperite" }, { n: "2 ani", l: "Garanție montaj" }].map(s => (
              <div key={s.l}><div className="text-3xl font-black mb-0.5">{s.n}</div><div className="text-orange-100 text-sm">{s.l}</div></div>
            ))}
          </div>
        </section>

        {/* De ce Teco.md */}
        <section className="py-14 px-4">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-black text-[#09090B] text-center mb-3">De ce aleg chișinăuienii Teco.md</h2>
            <p className="text-zinc-500 text-center text-sm mb-10 max-w-xl mx-auto">Cel mai complet serviciu de supraveghere din Chișinău — echipament + montaj + garanție</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[
                { icon: MapPin, t: "Acoperim toate sectoarele", d: "Centru, Botanica, Buiucani, Ciocana, Rîșcani, Telecentru — oriunde în Chișinău." },
                { icon: Clock, t: "Tehnicianul vine în 24h", d: "Programăm instalarea pentru ziua sau a doua zi — nu aștepți săptămâni." },
                { icon: Shield, t: "Garanție 2 ani la montaj", d: "Dacă apare vreo problemă cu instalarea noastră, revenim și remediem gratuit." },
                { icon: Camera, t: "Stoc fizic în Chișinău", d: "Nu comandăm din China — toate produsele sunt în stoc și le aduce tehnicianul." },
                { icon: Zap, t: "Configurare completă", d: "Setăm NVR-ul, aplicația pe telefonul tău și alertele — totul funcțional din prima zi." },
                { icon: CheckCircle2, t: "Prețuri transparente", d: "Ofertă detaliată înainte de montaj — exact cât costă, fără surprize." },
              ].map(f => (
                <div key={f.t} className="bg-zinc-50 rounded-2xl p-5 border border-zinc-100">
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

        {/* Sectoare */}
        <section className="py-14 px-4 bg-zinc-50">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-black text-[#09090B] mb-3">Sectoare și Cartiere Deservite</h2>
            <p className="text-zinc-500 text-sm mb-8">Instalăm camere de supraveghere în toate zonele Chișinăului</p>
            <div className="flex flex-wrap justify-center gap-2 mb-8">
              {SECTORS.map(s => (
                <span key={s} className={`px-3 py-1.5 rounded-full text-sm font-medium border ${["Centru","Botanica","Buiucani","Ciocana","Rîșcani"].includes(s) ? "bg-[#09090B] text-white border-transparent" : "bg-white text-zinc-700 border-zinc-200"}`}>{s}</span>
              ))}
              <span className="px-3 py-1.5 rounded-full text-sm font-medium bg-white text-zinc-400 border border-zinc-200">+ suburbii</span>
            </div>
            <a href="tel:+37367200463" className="inline-flex items-center gap-2 bg-[#FF4F00] text-white font-bold px-7 py-3.5 rounded-xl text-base hover:opacity-90 transition-all">
              <Phone className="w-4 h-4" /> Solicită Vizita în Sectorul Tău
            </a>
          </div>
        </section>

        {/* Tipuri sisteme */}
        <section className="py-14 px-4">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-black text-[#09090B] text-center mb-3">Sisteme disponibile în Chișinău</h2>
            <p className="text-zinc-500 text-center text-sm mb-10">Alegem soluția potrivită pentru casa, apartamentul sau afacerea ta</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {[
                { title: "Camere WiFi", href: "/produse?cat=wifi", desc: "Ideale pentru apartamente și case mici. Fără cabluri — se conectează la WiFi-ul tău. Instalare simplă în 1–2 ore.", badge: "Fără cabluri" },
                { title: "Sisteme PoE + NVR", href: "/produse?cat=poe", desc: "Sisteme profesionale cu înregistrare 24/7. Cabluri LAN mascate, imagine 4K–8MP, stocare pe HDD.", badge: "Profesional" },
                { title: "Camere 4G Solar", href: "/produse?cat=4g", desc: "Pentru curți, grădini sau locuri fără curent. Funcționează autonom cu panou solar și SIM card.", badge: "Fără curent" },
                { title: "Kituri Complete", href: "/produse?cat=kituri", desc: "NVR + camere + cabluri + montaj — totul într-un pachet. Cel mai bun raport calitate-preț.", badge: "Recomandat" },
              ].map(s => (
                <Link key={s.title} href={s.href} className="group bg-zinc-50 rounded-2xl p-5 border border-zinc-100 hover:border-[#FF4F00]/30 hover:shadow-md transition-all flex gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-bold text-[#09090B] text-sm">{s.title}</span>
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-[#FF4F00]/10 text-[#FF4F00]">{s.badge}</span>
                    </div>
                    <p className="text-zinc-500 text-xs leading-relaxed">{s.desc}</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-zinc-300 group-hover:text-[#FF4F00] transition-colors flex-shrink-0 self-center" />
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-14 px-4 bg-zinc-50">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-black text-[#09090B] text-center mb-10">Întrebări frecvente — Chișinău</h2>
            <div className="flex flex-col gap-3">{FAQS.map(f => <FAQItem key={f.q} q={f.q} a={f.a} />)}</div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 px-4 bg-[#FF4F00]">
          <div className="max-w-2xl mx-auto text-center text-white">
            <h2 className="text-2xl md:text-3xl font-black mb-4">Instalăm în Chișinău — sună acum</h2>
            <p className="text-orange-100 text-sm mb-8">Tehnicianul vine la adresa ta în 24h. Consultație gratuită.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a href="tel:+37367200463" className="inline-flex items-center justify-center gap-2 bg-white text-[#FF4F00] font-black px-8 py-4 rounded-xl text-base hover:opacity-90 transition-all">
                <Phone className="w-5 h-5" /> 067 200 463
              </a>
              <a href="https://wa.me/37367200463" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 bg-white/20 text-white font-bold px-8 py-4 rounded-xl border border-white/30 hover:bg-white/30 transition-all">
                WhatsApp
              </a>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
