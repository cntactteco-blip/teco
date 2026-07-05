import { Building2, ShieldCheck, Users, Zap, CheckCircle, Phone, ArrowRight, Factory, ShoppingBag, Car, Building } from "lucide-react";
import { Link } from "wouter";
import { useLang } from "@/contexts/LangContext";
import { useStore, storeActions } from "@/lib/store";
import { SEO, schemas } from "@/components/SEO";
import { useState } from "react";

const SECTORS = [
  { icon: ShoppingBag, ro: "Retail & Magazine", ru: "Розница & Магазины", desc_ro: "Sisteme anti-furt, supraveghere casieri, monitorizare intrări", desc_ru: "Противокражные системы, видеонаблюдение за кассами, мониторинг входов" },
  { icon: Factory, ro: "Depozite & Producție", ru: "Склады & Производство", desc_ro: "Perimetru exterior, zone de încărcare, camere de control acces", desc_ru: "Периметр, зоны загрузки, контроль доступа" },
  { icon: Building, ro: "Birouri & Hoteluri", ru: "Офисы & Отели", desc_ro: "Control acces, monitorizare recepție, parcare, camere comune", desc_ru: "Контроль доступа, мониторинг ресепшн, парковка, общие зоны" },
  { icon: Car, ro: "Parcări & Transport", ru: "Парковки & Транспорт", desc_ro: "Citire plăcuțe (LPR), control acces vehicule, monitorizare 24/7", desc_ru: "Распознавание номеров (LPR), контроль въезда, мониторинг 24/7" },
  { icon: Building2, ro: "Blocuri & Rezidențial", ru: "Жилые комплексы", desc_ro: "Interfoane video, control acces scări, parcare, spații comune", desc_ru: "Видеодомофоны, контроль доступа к лестницам, парковка, общие зоны" },
  { icon: Users, ro: "Instituții & Școli", ru: "Учреждения & Школы", desc_ro: "Perimetru școlar, control acces, camere clase, monitorizare intrări", desc_ru: "Периметр, контроль доступа, классы, мониторинг входов" },
];

const PACKAGES = [
  {
    id: "starter",
    ro: { name: "B2B Starter", cameras: "4–8 camere", price: "de la 8.000 MDL", desc: "Ideal pentru magazine mici, birouri, farmacii.", features: ["4–8 camere IP PoE", "NVR 4/8ch inclus", "Instalare profesională", "Configurare remote acces", "Garanție 12 luni lucrare"] },
    ru: { name: "B2B Starter", cameras: "4–8 камер", price: "от 8.000 MDL", desc: "Для небольших магазинов, офисов, аптек.", features: ["4–8 IP PoE камер", "NVR 4/8ch включен", "Профессиональный монтаж", "Настройка удалённого доступа", "Гарантия 12 месяцев на работу"] },
  },
  {
    id: "business",
    popular: true,
    ro: { name: "B2B Business", cameras: "8–16 camere", price: "de la 18.000 MDL", desc: "Depozite, restaurante, complexe de birouri.", features: ["8–16 camere IP PoE HD", "NVR 8/16ch + HDD", "Cablu structurat inclus", "Analitică video AI", "Mentenanță 6 luni inclusă", "Manager dedicat"] },
    ru: { name: "B2B Business", cameras: "8–16 камер", price: "от 18.000 MDL", desc: "Склады, рестораны, бизнес-центры.", features: ["8–16 IP PoE HD камер", "NVR 8/16ch + HDD", "Структурированный кабель", "AI видеоаналитика", "Обслуживание 6 месяцев", "Персональный менеджер"] },
  },
  {
    id: "enterprise",
    ro: { name: "B2B Enterprise", cameras: "16–64+ camere", price: "deviz personalizat", desc: "Fabrici, centre comerciale, rețele multi-loc.", features: ["16–64+ camere 4K AI", "NVR rack + UPS", "LPR (citire plăcuțe)", "Integrare alarmă Ajax", "Mentenanță 12 luni", "SLA 4h intervenție", "Rapoarte lunare"] },
    ru: { name: "B2B Enterprise", cameras: "16–64+ камеры", price: "персональный расчёт", desc: "Заводы, торговые центры, сетевые объекты.", features: ["16–64+ 4K AI камер", "Rack NVR + UPS", "LPR (распознавание номеров)", "Интеграция с Ajax", "Обслуживание 12 месяцев", "SLA 4h выезд", "Ежемесячные отчёты"] },
  },
];

const TESTIMONIALS = [
  { name: "SRL Artizana", city: "Chișinău", sector_ro: "Rețea de restaurante (12 locații)", sector_ru: "Сеть ресторанов (12 локаций)", text_ro: "Teco.md ne-a echipat toate locațiile cu sisteme unificate. Acum monitorizăm toate restaurantele dintr-o singură aplicație. Rapid, profesional, preț corect.", text_ru: "Teco.md оснастил все наши заведения унифицированными системами. Теперь мы следим за всеми ресторанами из одного приложения. Быстро, профессионально." },
  { name: "Imobil Nordului", city: "Bălți", sector_ro: "Bloc rezidențial 9 etaje", sector_ru: "Жилой дом 9 этажей", text_ro: "Sistem complet cu interfoane video, control acces și 24 camere. Totul funcționează perfect de 2 ani fără niciun incident.", text_ru: "Полная система с видеодомофонами, контролем доступа и 24 камерами. Работает безупречно уже 2 года." },
  { name: "Farmacia Albă", city: "Chișinău", sector_ro: "Lanț de farmacii (7 locații)", sector_ru: "Сеть аптек (7 аптек)", text_ro: "Am ales Teco.md pentru că oferea cel mai bun raport calitate-preț și un manager dedicat care răspunde oricând.", text_ru: "Выбрали Teco.md за лучшее соотношение цены и качества и персонального менеджера, доступного в любое время." },
];

export default function B2B() {
  const { lang } = useLang();
  const ro = lang === "ro";
  const adminPhone = useStore((s) => s.settings.general?.adminPhone ?? "");
  const phone = (adminPhone || "37367200463").replace(/\D/g, "");
  const [formName, setFormName] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formSector, setFormSector] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    storeActions.addLead({ name: formName, phone: formPhone, source: "B2B", notes: `Sector: ${formSector}` });
    const msg = ro
      ? `Bună ziua! Solicit deviz comercial B2B.\nCompanie/Nume: ${formName}\nTelefon: ${formPhone}\nSector: ${formSector}`
      : `Здравствуйте! Запрашиваю коммерческое предложение B2B.\nКомпания/Имя: ${formName}\nТелефон: ${formPhone}\nСектор: ${formSector}`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  const jsonLd = [
    schemas.service({ name: ro ? "Sisteme de supraveghere pentru afaceri Moldova" : "Системы видеонаблюдения для бизнеса Молдова", description: ro ? "Sisteme de securitate complete pentru retail, depozite, birouri, parcari si institutii in Moldova. Preturi B2B, manager dedicat, SLA garantat." : "Комплексные системы безопасности для розницы, складов, офисов, парковок в Молдове. B2B цены, персональный менеджер.", url: "https://teco.md/b2b" }),
    schemas.localBusiness(lang),
    schemas.breadcrumb([{ name: "Teco.md", url: "https://teco.md" }, { name: ro ? "Soluții B2B" : "B2B Решения", url: "https://teco.md/b2b" }]),
  ];

  return (
    <>
      <SEO
        title={ro ? "Sisteme Securitate Afaceri Moldova — B2B Teco.md | Retail, Depozite, Birouri" : "Системы Безопасности для Бизнеса Молдова — B2B Teco.md"}
        description={ro ? "Soluții complete de supraveghere pentru afaceri în Moldova. Retail, depozite, birouri, parcări. Prețuri B2B, manager dedicat, garanție SLA, instalare în 24h. Teco.md." : "Комплексные решения видеонаблюдения для бизнеса в Молдове. Розница, склады, офисы, парковки. B2B цены, персональный менеджер, гарантия SLA."}
        keywords={ro ? "sisteme securitate afaceri Moldova, supraveghere retail depozit birou, camere B2B pret, teco.md business" : "системы безопасности бизнес Молдова, видеонаблюдение магазин склад офис, камеры B2B цена"}
        canonical="/b2b"
        lang={ro ? "ro" : "ru"}
        jsonLd={jsonLd}
      />
      <main className="flex-1 bg-[#FAFAFA] pb-[64px] md:pb-0">

        {/* Hero */}
        <section className="bg-[#09090B] text-white py-16 md:py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_50%,_rgba(255,79,0,0.12)_0%,_transparent_70%)]" />
          <div className="max-w-5xl mx-auto px-4 md:px-6 relative z-10">
            <div className="inline-flex items-center gap-2 bg-[#FF4F00]/20 border border-[#FF4F00]/30 rounded-full px-4 py-1.5 text-sm font-semibold text-[#FF4F00] mb-6">
              <Building2 className="w-4 h-4" />
              {ro ? "SOLUȚII PENTRU AFACERI" : "РЕШЕНИЯ ДЛЯ БИЗНЕСА"}
            </div>
            <h1 className="font-black text-4xl md:text-6xl leading-tight mb-5">
              {ro ? <>Securitatea afacerii tale,<br /><span className="text-[#FF4F00]">garantată de Teco.md</span></> : <>Безопасность вашего бизнеса,<br /><span className="text-[#FF4F00]">гарантированная Teco.md</span></>}
            </h1>
            <p className="text-zinc-300 text-lg max-w-xl mb-8 leading-relaxed">
              {ro ? "Proiectăm, instalăm și întreținem sisteme complete de securitate pentru companii din toată Moldova. Prețuri B2B, manager dedicat, SLA garantat." : "Проектируем, устанавливаем и обслуживаем комплексные системы безопасности для компаний по всей Молдове. B2B цены, персональный менеджер, гарантированный SLA."}
            </p>
            <div className="flex flex-wrap gap-3">
              <a
                href={`https://wa.me/${phone}?text=${encodeURIComponent(ro ? "Bună ziua! Solicit o ofertă B2B pentru afacerea mea." : "Здравствуйте! Запрашиваю коммерческое предложение B2B.")}`}
                target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-[#FF4F00] text-white font-bold px-7 py-3.5 rounded-2xl hover:opacity-90 active:scale-95 transition-all"
              >
                <Phone className="w-4 h-4" />
                {ro ? "Solicită Ofertă B2B" : "Запросить B2B предложение"}
              </a>
              <a href="#pachete" className="inline-flex items-center gap-2 bg-white/10 text-white font-semibold px-7 py-3.5 rounded-2xl hover:bg-white/20 transition-all">
                {ro ? "Vezi pachete" : "Смотреть пакеты"} <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="bg-white border-b border-zinc-100">
          <div className="max-w-5xl mx-auto px-4 md:px-6 py-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { n: "120+", ro: "Afaceri echipate", ru: "Оснащённых бизнесов" },
                { n: "24h", ro: "SLA intervenție", ru: "SLA выезда" },
                { n: "5 ani", ro: "Experiență B2B", ru: "Опыт B2B" },
                { n: "100%", ro: "Clienți mulțumiți", ru: "Довольных клиентов" },
              ].map(({ n, ro: roLabel, ru: ruLabel }) => (
                <div key={n} className="text-center py-2">
                  <p className="font-black text-2xl text-[#FF4F00]">{n}</p>
                  <p className="text-xs text-zinc-500 mt-1">{ro ? roLabel : ruLabel}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Sectors */}
        <section className="max-w-5xl mx-auto px-4 md:px-6 py-12">
          <div className="text-center mb-8">
            <p className="text-xs font-black uppercase tracking-widest text-[#FF4F00] mb-2">{ro ? "SECTOARE" : "ОТРАСЛИ"}</p>
            <h2 className="font-black text-2xl md:text-3xl text-[#09090B]">{ro ? "Lucrăm cu toate tipurile de afaceri" : "Работаем со всеми типами бизнеса"}</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {SECTORS.map((s) => (
              <div key={s.ro} className="bg-white border border-zinc-200 rounded-2xl p-5 hover:border-[#FF4F00]/30 hover:shadow-md transition-all">
                <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center mb-3">
                  <s.icon className="w-5 h-5 text-[#FF4F00]" />
                </div>
                <h3 className="font-bold text-[#09090B] text-sm mb-1">{ro ? s.ro : s.ru}</h3>
                <p className="text-zinc-500 text-xs leading-relaxed">{ro ? s.desc_ro : s.desc_ru}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Packages */}
        <section id="pachete" className="bg-[#09090B] py-14">
          <div className="max-w-5xl mx-auto px-4 md:px-6">
            <div className="text-center mb-10">
              <p className="text-xs font-black uppercase tracking-widest text-[#FF4F00] mb-2">{ro ? "PACHETE B2B" : "ПАКЕТЫ B2B"}</p>
              <h2 className="font-black text-2xl md:text-3xl text-white">{ro ? "Alege pachetul potrivit" : "Выберите подходящий пакет"}</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-5">
              {PACKAGES.map((pkg) => {
                const p = ro ? pkg.ro : pkg.ru;
                return (
                  <div key={pkg.id} className={`relative rounded-2xl p-6 flex flex-col ${pkg.popular ? "bg-[#FF4F00] text-white" : "bg-white/5 border border-white/10 text-white"}`}>
                    {pkg.popular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white text-[#FF4F00] text-[10px] font-black px-3 py-1 rounded-full">
                        {ro ? "CEL MAI ALES" : "ПОПУЛЯРНЫЙ"}
                      </div>
                    )}
                    <p className={`text-xs font-black uppercase tracking-wider mb-1 ${pkg.popular ? "text-white/80" : "text-[#FF4F00]"}`}>{p.cameras}</p>
                    <h3 className="font-black text-xl mb-1">{p.name}</h3>
                    <p className={`text-sm mb-4 ${pkg.popular ? "text-white/80" : "text-zinc-400"}`}>{p.desc}</p>
                    <p className={`font-black text-2xl mb-5 ${pkg.popular ? "text-white" : "text-[#FF4F00]"}`}>{p.price}</p>
                    <ul className="space-y-2 mb-6 flex-1">
                      {p.features.map((f) => (
                        <li key={f} className="flex items-start gap-2 text-sm">
                          <CheckCircle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${pkg.popular ? "text-white" : "text-[#FF4F00]"}`} />
                          <span className={pkg.popular ? "text-white/90" : "text-zinc-300"}>{f}</span>
                        </li>
                      ))}
                    </ul>
                    <a
                      href={`https://wa.me/${phone}?text=${encodeURIComponent(ro ? `Bună ziua! Sunt interesat de pachetul ${p.name} (${p.cameras}). Pot primi o ofertă?` : `Здравствуйте! Интересует пакет ${p.name} (${p.cameras}). Можно получить предложение?`)}`}
                      target="_blank" rel="noopener noreferrer"
                      className={`w-full text-center font-bold py-3 rounded-xl transition-all text-sm ${pkg.popular ? "bg-white text-[#FF4F00] hover:bg-zinc-100" : "bg-[#FF4F00] text-white hover:opacity-90"}`}
                    >
                      {ro ? "Solicită ofertă" : "Запросить предложение"}
                    </a>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="max-w-5xl mx-auto px-4 md:px-6 py-14">
          <div className="text-center mb-8">
            <p className="text-xs font-black uppercase tracking-widest text-[#FF4F00] mb-2">{ro ? "CE SPUN PARTENERII" : "ЧТО ГОВОРЯТ ПАРТНЁРЫ"}</p>
            <h2 className="font-black text-2xl text-[#09090B]">{ro ? "Companiile care au ales Teco.md" : "Компании, выбравшие Teco.md"}</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="bg-white border border-zinc-200 rounded-2xl p-5 hover:shadow-md transition-all">
                <div className="flex items-center gap-1 mb-3">
                  {[1,2,3,4,5].map((i) => <span key={i} className="text-yellow-400 text-sm">★</span>)}
                </div>
                <p className="text-zinc-600 text-sm leading-relaxed mb-4 italic">"{ro ? t.text_ro : t.text_ru}"</p>
                <div>
                  <p className="font-bold text-[#09090B] text-sm">{t.name}</p>
                  <p className="text-xs text-zinc-400">{t.city} · {ro ? t.sector_ro : t.sector_ru}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Contact form */}
        <section className="bg-[#FF4F00] py-14" id="contact-b2b">
          <div className="max-w-3xl mx-auto px-4 md:px-6">
            <div className="text-center mb-8">
              <h2 className="font-black text-3xl text-white mb-2">{ro ? "Solicită deviz B2B gratuit" : "Запросить бесплатный B2B расчёт"}</h2>
              <p className="text-white/80 text-sm">{ro ? "Un manager te contactează în 30 minute cu o ofertă personalizată." : "Менеджер свяжется с вами в течение 30 минут с персональным предложением."}</p>
            </div>
            <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 md:p-8 space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <input value={formName} onChange={(e) => setFormName(e.target.value)} required placeholder={ro ? "Companie sau Nume *" : "Компания или Имя *"} className="w-full border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#FF4F00] focus:ring-1 focus:ring-[#FF4F00] transition-all" />
                <input value={formPhone} onChange={(e) => setFormPhone(e.target.value)} required type="tel" placeholder={ro ? "Telefon *" : "Телефон *"} className="w-full border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#FF4F00] focus:ring-1 focus:ring-[#FF4F00] transition-all" />
              </div>
              <select value={formSector} onChange={(e) => setFormSector(e.target.value)} className="w-full border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#FF4F00] focus:ring-1 focus:ring-[#FF4F00] transition-all appearance-none bg-white">
                <option value="">{ro ? "Sectorul afacerii tale..." : "Сфера вашего бизнеса..."}</option>
                {SECTORS.map((s) => <option key={s.ro} value={ro ? s.ro : s.ru}>{ro ? s.ro : s.ru}</option>)}
              </select>
              <button type="submit" className="w-full bg-[#FF4F00] text-white font-black py-4 rounded-2xl hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2">
                <Phone className="w-4 h-4" />
                {ro ? "Trimite cererea pe WhatsApp" : "Отправить запрос в WhatsApp"}
              </button>
            </form>
          </div>
        </section>

      </main>
    </>
  );
}
