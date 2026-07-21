import { useState } from "react";
import { Link } from "wouter";
import {
  Wrench, CheckCircle2, Phone, Star, ChevronDown, MapPin,
  Clock, Shield, Award, Zap, Camera, ArrowRight, CalendarCheck
} from "lucide-react";
import { SEO, schemas } from "@/components/SEO";
import { useLang } from "@/contexts/LangContext";

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-zinc-50 transition-colors"
        aria-expanded={open}
      >
        <span className="font-semibold text-[#09090B] text-sm leading-snug">{q}</span>
        <ChevronDown className={`w-4 h-4 text-zinc-400 flex-shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="px-5 pb-4 text-zinc-600 text-sm leading-relaxed border-t border-zinc-100 pt-3">
          {a}
        </div>
      )}
    </div>
  );
}

const PRICES = [
  { cameras: 2, label: "2 Camere", price: "de la 600 MDL", priceNum: 600, note: "Casă mică, apartament" },
  { cameras: 4, label: "4 Camere", price: "de la 1.200 MDL", priceNum: 1200, note: "Casă standard, vilă" },
  { cameras: 6, label: "6 Camere", price: "de la 1.800 MDL", priceNum: 1800, note: "Casă mare, curte extinsă", popular: true },
  { cameras: 8, label: "8 Camere", price: "de la 2.400 MDL", priceNum: 2400, note: "Afacere mică, depozit" },
  { cameras: 16, label: "16 Camere", price: "de la 4.800 MDL", priceNum: 4800, note: "Afacere mare, complex" },
];

const STEPS = [
  { n: "01", icon: Phone, title: "Contactezi echipa", desc: "Suni sau scrii pe WhatsApp — răspundem în maxim 30 de minute și programăm vizita." },
  { n: "02", icon: Camera, title: "Consultație gratuită la fața locului", desc: "Tehnicianul vine la adresa ta, evaluează amplasamentul și recomandă cele mai bune soluții." },
  { n: "03", icon: Wrench, title: "Montaj profesional", desc: "Instalăm camerele, tragem cablurile mascat sau mascabil și configurăm NVR-ul." },
  { n: "04", icon: CalendarCheck, title: "Predare cheie în mână", desc: "Testăm totul, configurăm aplicația pe telefonul tău și te instruim cum să folosești sistemul." },
];

const CITIES = [
  "Chișinău", "Bălți", "Orhei", "Strășeni", "Cahul", "Ungheni",
  "Soroca", "Criuleni", "Ialoveni", "Hîncești", "Florești", "Nisporeni",
  "Edineț", "Drochia", "Anenii Noi", "Rezina",
];

const FEATURES = [
  { icon: Shield, title: "Garanție 2–5 ani la montaj", desc: "Dacă apare orice problemă cu instalarea noastră, revenim gratuit." },
  { icon: Clock, title: "Instalare în 24–48h", desc: "Programăm vizita pentru ziua următoare, în intervalul orar ales de tine." },
  { icon: Award, title: "Tehnicieni certificați", desc: "Echipa noastră are experiență în sisteme Dahua, Uniview, IMOU, Ajax." },
  { icon: Zap, title: "Configurare completă", desc: "Setăm NVR-ul, aplicația mobilă și alertele — totul funcționează din prima zi." },
  { icon: MapPin, title: "Toată Moldova", desc: "Deservim Chișinău, Bălți și toate raioanele. Transport inclus în ofertă." },
  { icon: CheckCircle2, title: "Prețuri transparente", desc: "Oferta detaliată ÎNAINTE de montaj — fără surprize la factură." },
];

const FAQS = [
  {
    q: "Cât costă montarea camerelor de supraveghere în Moldova?",
    a: "Prețul de montare a camerelor de supraveghere în Moldova pornește de la 300 MDL per cameră, incluzând cablare, fixare și configurare. Un sistem de 4 camere costă în total (echipament + montaj) de la 6.000 MDL. Contactați-ne pentru o ofertă personalizată gratuită.",
  },
  {
    q: "Cât durează instalarea unui sistem de supraveghere?",
    a: "Instalarea unui sistem standard de 4 camere durează 4–6 ore. Un sistem de 8 camere cu cablare extinsă poate dura 1–2 zile. Tehnicianul estimează durata exactă după vizita de consultație.",
  },
  {
    q: "Instalați și în afara Chișinăului?",
    a: "Da, deservim toată Moldova: Bălți, Orhei, Strășeni, Cahul, Ungheni, Hîncești și toate raioanele. Costul transportului este inclus în ofertă sau calculat separat pentru distanțe mari.",
  },
  {
    q: "Ce este inclus în serviciul de montaj?",
    a: "Serviciul include: fixarea camerelor, tragerea și mascarea cablurilor, instalarea NVR-ului, configurarea înregistrării, setarea accesului remote prin aplicația mobilă (iPhone și Android), testarea completă și instruirea utilizatorului.",
  },
  {
    q: "Pot instala camerele WiFi singur, fără tehnician?",
    a: "Camerele WiFi pot fi instalate relativ simplu — urmați instrucțiunile din aplicație. Totuși, pentru plasarea optimă, cablare curată și configurare avansată (detecție AI, alerte), recomandăm intervenția unui tehnician.",
  },
  {
    q: "Ce sisteme de supraveghere instalați?",
    a: "Instalăm toate tipurile de sisteme: camere WiFi (IMOU, Reolink, TP-Link Tapo), sisteme PoE cu NVR (Dahua, Uniview, Uniarch), camere 4G cu panou solar pentru locuri fără curent, și sisteme de alarmă Ajax.",
  },
  {
    q: "Oferiți garanție pentru montaj?",
    a: "Da, oferim garanție 2–5 ani pentru montajul realizat de noi. Dacă apare orice problemă legată de instalare în această perioadă, revenim și remediem gratuit.",
  },
  {
    q: "Pot vedea camerele de pe telefon de oriunde?",
    a: "Da, toate sistemele noastre includ configurarea accesului remote. Veți putea vizualiza live camerele de pe orice telefon (iPhone sau Android), de oriunde în lume, prin aplicația IMOU Life, DMSS (Dahua), EZView (Uniview) sau altele.",
  },
  {
    q: "Câte camere are nevoie o casă obișnuită?",
    a: "Pentru o casă medie recomandăm 4 camere: 1 la intrarea principală, 1 la spate, 2 pe laterale. Pentru curți mari sau case cu etaj, 6–8 camere asigură acoperirea completă a perimetrului.",
  },
  {
    q: "Instalați și sisteme de alarmă?",
    a: "Da, instalăm sisteme de alarmă wireless Ajax — cele mai bune din Moldova. Includ detectoare de mișcare, senzori de ușă/fereastră, sirenă și monitorizare 24/7 prin aplicație.",
  },
  {
    q: "Cablurile vor fi vizibile?",
    a: "Tehnicianul nostru mascurează cablurile în tuburi corugat sau canal cablu, urmând conturul pereților. La cerere, putem lucra cu cabluri îngropate în perete (pentru construcții noi) sau wireless (camere WiFi).",
  },
  {
    q: "Pot monta camere și în exterior, rezistente la ploaie?",
    a: "Toate camerele de exterior pe care le montăm au protecție IP66 sau IP67 — rezistă la ploaie, zăpadă, praf și temperaturi de la -30°C la +60°C.",
  },
];

export default function MontareCamere() {
  const { lang } = useLang();

  const title = "Montare Camere Supraveghere Moldova | Instalare Profesională 24h | Teco.md";
  const description = "Montare și instalare sisteme de supraveghere în Moldova. Tehnicieni certificați, garanție 2–5 ani. Prețuri de la 300 MDL/cameră. Programează azi — instalăm în 24h oriunde în Moldova. ☎ +373 67 200 463";
  const keywords = "montare camere supraveghere moldova, instalare sistem supraveghere chisinau, montaj camere ip wifi, instalare nvr dahua uniview, montare camere exterior, pret montaj camera supraveghere moldova, instalare sisteme securitate chisinau, teco.md montaj";

  const jsonLd = [
    schemas.breadcrumb([
      { name: "Acasă", url: "https://teco.md/" },
      { name: "Montare Camere Supraveghere", url: "https://teco.md/montare-camere-supraveghere" },
    ]),
    {
      "@context": "https://schema.org",
      "@type": "Service",
      "@id": "https://teco.md/montare-camere-supraveghere#service",
      name: "Montare și Instalare Sisteme de Supraveghere Moldova",
      description: "Serviciu profesional de montare, instalare și configurare sisteme de supraveghere video, camere IP, NVR-uri și sisteme de alarmă în Moldova. Tehnicieni certificați, garanție 2–5 ani.",
      url: "https://teco.md/montare-camere-supraveghere",
      image: "https://teco.md/opengraph.jpg",
      provider: {
        "@type": "LocalBusiness",
        "@id": "https://teco.md/#business",
        name: "Teco.md",
        telephone: "+37367200463",
        address: { "@type": "PostalAddress", addressLocality: "Chișinău", addressCountry: "MD" },
      },
      areaServed: { "@type": "Country", name: "Moldova" },
      serviceType: "Security Camera Installation",
      category: "Security Systems",
      hasOfferCatalog: {
        "@type": "OfferCatalog",
        name: "Prețuri Montare Camere Supraveghere",
        itemListElement: PRICES.map((p) => ({
          "@type": "Offer",
          name: `Montare ${p.label} de Supraveghere`,
          description: p.note,
          price: p.priceNum,
          priceCurrency: "MDL",
          eligibleQuantity: { "@type": "QuantitativeValue", value: p.cameras, unitCode: "CAM" },
        })),
      },
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: "4.9",
        reviewCount: "213",
        bestRating: "5",
        worstRating: "1",
      },
    },
    schemas.faq(FAQS.slice(0, 8).map((f) => ({ question: f.q, answer: f.a }))),
    schemas.howTo({
      name: "Cum se montează un sistem de supraveghere în Moldova",
      description: "Pași pentru montarea și instalarea camerelor de supraveghere la casă sau birou prin Teco.md",
      totalTime: "PT6H",
      supply: ["Camere de supraveghere", "NVR/DVR înregistrator", "Cablu UTP/coaxial", "Accesorii montaj"],
      tool: ["Burghiu", "Șurubelniță", "Testator cablu", "Laptop pentru configurare"],
      steps: STEPS.map((s) => ({ name: s.title, text: s.desc, url: "https://teco.md/montare-camere-supraveghere" })),
    }),
    schemas.localBusiness(lang as "ro" | "ru"),
  ];

  return (
    <>
      <SEO
        title={title}
        description={description}
        keywords={keywords}
        canonical="/montare-camere-supraveghere"
        ogType="website"
        lang={lang as "ro" | "ru"}
        jsonLd={jsonLd}
      />

      <main className="flex-1 bg-white">
        {/* ── Breadcrumb ──────────────────────────────────────────── */}
        <nav className="max-w-6xl mx-auto px-4 pt-4 pb-1">
          <ol className="flex items-center gap-1.5 text-xs text-zinc-400">
            <li><Link href="/" className="hover:text-[#FF4F00] transition-colors">Acasă</Link></li>
            <li className="text-zinc-300">/</li>
            <li className="text-zinc-600 font-medium">Montare Camere Supraveghere</li>
          </ol>
        </nav>

        {/* ── Hero ────────────────────────────────────────────────── */}
        <section className="bg-[#09090B] text-white py-14 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-[#FF4F00]/20 text-[#FF4F00] text-xs font-bold px-3 py-1.5 rounded-full mb-5 uppercase tracking-wide">
              <Wrench className="w-3.5 h-3.5" />
              Serviciu Profesional
            </div>
            <h1 className="text-3xl md:text-5xl font-black leading-tight mb-5">
              Montare Camere de Supraveghere
              <span className="block text-[#FF4F00] mt-1">în Moldova</span>
            </h1>
            <p className="text-zinc-300 text-base md:text-lg max-w-2xl mx-auto mb-8 leading-relaxed">
              Tehnicieni certificați instalează camerele la adresa ta în 24–48h.
              Garanție 2–5 ani la montaj. Prețuri de la <strong className="text-white">300 MDL/cameră</strong>.
            </p>
            {/* Stars */}
            <div className="flex items-center justify-center gap-2 mb-8">
              <div className="flex">
                {[1,2,3,4,5].map(i => <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />)}
              </div>
              <span className="text-zinc-300 text-sm"><strong className="text-white">4.9</strong> din 213 recenzii</span>
            </div>
            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href="tel:+37367200463"
                className="inline-flex items-center justify-center gap-2 bg-[#FF4F00] text-white font-bold px-7 py-3.5 rounded-xl text-base hover:opacity-90 transition-all shadow-lg"
              >
                <Phone className="w-4 h-4" />
                Sună Acum: 067 200 463
              </a>
              <Link
                href="/produse?cat=kituri"
                className="inline-flex items-center justify-center gap-2 border border-zinc-700 text-white font-semibold px-7 py-3.5 rounded-xl text-base hover:bg-zinc-800 transition-all"
              >
                <Camera className="w-4 h-4" />
                Vezi Seturi Complete
              </Link>
            </div>
          </div>
        </section>

        {/* ── Stats ───────────────────────────────────────────────── */}
        <section className="bg-[#FF4F00] py-8 px-4">
          <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-white text-center">
            {[
              { n: "500+", label: "Sisteme instalate" },
              { n: "24h", label: "Timp de răspuns" },
              { n: "2–5 ani", label: "Garanție montaj" },
              { n: "100%", label: "Clienți mulțumiți" },
            ].map((s) => (
              <div key={s.label}>
                <div className="text-3xl font-black mb-0.5">{s.n}</div>
                <div className="text-orange-100 text-sm">{s.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Ce includem ─────────────────────────────────────────── */}
        <section className="py-14 px-4">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-black text-[#09090B] text-center mb-3">
              Ce este inclus în serviciul de montaj
            </h2>
            <p className="text-zinc-500 text-center text-sm mb-10 max-w-xl mx-auto">
              Instalăm complet — de la fixarea camerelor până la configurarea aplicației pe telefonul tău.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {FEATURES.map((f) => (
                <div key={f.title} className="bg-zinc-50 rounded-2xl p-5 border border-zinc-100 hover:border-zinc-200 transition-colors">
                  <div className="w-10 h-10 bg-[#FF4F00]/10 rounded-xl flex items-center justify-center mb-3">
                    <f.icon className="w-5 h-5 text-[#FF4F00]" />
                  </div>
                  <h3 className="font-bold text-[#09090B] text-sm mb-1">{f.title}</h3>
                  <p className="text-zinc-500 text-xs leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Prețuri ─────────────────────────────────────────────── */}
        <section className="py-14 px-4 bg-zinc-50">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-black text-[#09090B] text-center mb-3">
              Prețuri Montare Camere Supraveghere
            </h2>
            <p className="text-zinc-500 text-center text-sm mb-10 max-w-xl mx-auto">
              Prețuri orientative pentru manopera de instalare. Prețul final include consultația și configurarea completă.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {PRICES.map((p) => (
                <div
                  key={p.cameras}
                  className={`relative bg-white rounded-2xl p-5 border-2 transition-all ${p.popular ? "border-[#FF4F00] shadow-lg shadow-orange-100" : "border-zinc-200"}`}
                >
                  {p.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#FF4F00] text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wide whitespace-nowrap">
                      Cel mai ales
                    </div>
                  )}
                  <div className="text-3xl font-black text-[#09090B] mb-0.5">{p.cameras}</div>
                  <div className="text-zinc-500 text-xs mb-3">camere</div>
                  <div className="text-[#FF4F00] font-black text-lg mb-1">{p.price}</div>
                  <div className="text-zinc-400 text-xs">manoperă</div>
                  <div className="mt-3 pt-3 border-t border-zinc-100 text-zinc-500 text-xs">{p.note}</div>
                </div>
              ))}
            </div>
            <p className="text-center text-zinc-400 text-xs mt-6">
              * Prețurile includ manopera. Echipamentele se achită separat sau puteți alege un{" "}
              <Link href="/produse?cat=kituri" className="text-[#FF4F00] font-semibold hover:underline">
                set complet cu instalare inclusă
              </Link>.
            </p>
          </div>
        </section>

        {/* ── Procesul ────────────────────────────────────────────── */}
        <section className="py-14 px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-black text-[#09090B] text-center mb-3">
              Cum funcționează
            </h2>
            <p className="text-zinc-500 text-center text-sm mb-10">4 pași simpli, de la contact la sistem funcțional</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {STEPS.map((s) => (
                <div key={s.n} className="flex gap-4 bg-zinc-50 rounded-2xl p-5 border border-zinc-100">
                  <div className="flex-shrink-0 w-10 h-10 bg-[#09090B] text-white rounded-xl flex items-center justify-center text-xs font-black">
                    {s.n}
                  </div>
                  <div>
                    <h3 className="font-bold text-[#09090B] text-sm mb-1">{s.title}</h3>
                    <p className="text-zinc-500 text-xs leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Zone deserved ───────────────────────────────────────── */}
        <section className="py-14 px-4 bg-[#09090B] text-white">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 text-[#FF4F00] text-xs font-bold mb-4 uppercase tracking-wide">
              <MapPin className="w-4 h-4" />
              Zone de acoperire
            </div>
            <h2 className="text-2xl md:text-3xl font-black mb-3">
              Instalăm în Toată Moldova
            </h2>
            <p className="text-zinc-400 text-sm mb-8">
              Tehnicieni disponibili în Chișinău și toate raioanele — programează online sau sună.
            </p>
            <div className="flex flex-wrap justify-center gap-2 mb-8">
              {CITIES.map((city) => (
                <span key={city} className={`px-3 py-1.5 rounded-full text-sm font-medium ${city === "Chișinău" ? "bg-[#FF4F00] text-white" : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors"}`}>
                  {city}
                </span>
              ))}
              <span className="px-3 py-1.5 rounded-full text-sm font-medium bg-zinc-700 text-zinc-400">
                + toate raioanele
              </span>
            </div>
            <a
              href="tel:+37367200463"
              className="inline-flex items-center gap-2 bg-[#FF4F00] text-white font-bold px-7 py-3.5 rounded-xl text-base hover:opacity-90 transition-all shadow-lg"
            >
              <Phone className="w-4 h-4" />
              Solicită Ofertă pentru Zona Ta
            </a>
          </div>
        </section>

        {/* ── Seturi recomandate ──────────────────────────────────── */}
        <section className="py-14 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-black text-[#09090B] mb-3">
              Seturi Complete cu Instalare Inclusă
            </h2>
            <p className="text-zinc-500 text-sm mb-8 max-w-xl mx-auto">
              Nu vrei să te ocupi de echipamente separat? Alege un set complet — NVR + camere + cabluri + montaj profesional — totul într-un singur pachet.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/produse?cat=kituri"
                className="inline-flex items-center justify-center gap-2 bg-[#09090B] text-white font-bold px-7 py-3.5 rounded-xl text-sm hover:opacity-90 transition-all"
              >
                <Camera className="w-4 h-4" />
                Vezi Seturi Complete
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/oferta"
                className="inline-flex items-center justify-center gap-2 border-2 border-zinc-200 text-[#09090B] font-bold px-7 py-3.5 rounded-xl text-sm hover:border-zinc-400 transition-all"
              >
                Solicită Ofertă Personalizată
              </Link>
            </div>
          </div>
        </section>

        {/* ── FAQ ─────────────────────────────────────────────────── */}
        <section className="py-14 px-4 bg-zinc-50">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-black text-[#09090B] text-center mb-3">
              Întrebări frecvente despre montarea camerelor
            </h2>
            <p className="text-zinc-500 text-center text-sm mb-10">Tot ce trebuie să știi înainte de a programa instalarea</p>
            <div className="flex flex-col gap-3">
              {FAQS.map((f) => (
                <FAQItem key={f.q} q={f.q} a={f.a} />
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA Final ───────────────────────────────────────────── */}
        <section className="py-16 px-4 bg-[#FF4F00]">
          <div className="max-w-2xl mx-auto text-center text-white">
            <h2 className="text-2xl md:text-3xl font-black mb-4">
              Gata să instalezi sistemul tău de supraveghere?
            </h2>
            <p className="text-orange-100 text-sm mb-8 max-w-lg mx-auto">
              Sună-ne sau scrie pe WhatsApp — îți oferim consultație gratuită și programăm instalarea în cel mai scurt timp.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href="tel:+37367200463"
                className="inline-flex items-center justify-center gap-2 bg-white text-[#FF4F00] font-black px-8 py-4 rounded-xl text-base hover:opacity-90 transition-all shadow-lg"
              >
                <Phone className="w-5 h-5" />
                067 200 463
              </a>
              <a
                href="https://wa.me/37367200463"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-white/20 text-white font-bold px-8 py-4 rounded-xl text-base hover:bg-white/30 transition-all border border-white/30"
              >
                WhatsApp
              </a>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
