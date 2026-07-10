import { useParams, Link } from "wouter";
import { MapPin, Phone, Wrench, Clock, CheckCircle, ArrowRight } from "lucide-react";
import { useLang } from "@/contexts/LangContext";
import { useStore } from "@/lib/store";
import { SEO, schemas } from "@/components/SEO";

const CITY_DATA: Record<string, {
  ro: string; ru: string;
  region_ro: string; region_ru: string;
  pop: string;
  lat: number; lng: number;
  eta_ro: string; eta_ru: string;
}> = {
  chisinau: { ro: "Chișinău", ru: "Кишинёв", region_ro: "Municipiul Chișinău", region_ru: "Мун. Кишинёв", pop: "700.000+", lat: 47.0105, lng: 28.8638, eta_ro: "1–2 ore", eta_ru: "1–2 часа" },
  balti: { ro: "Bălți", ru: "Бельцы", region_ro: "Municipiul Bălți", region_ru: "Мун. Бельцы", pop: "100.000+", lat: 47.7617, lng: 27.9290, eta_ro: "2–3 ore", eta_ru: "2–3 часа" },
  orhei: { ro: "Orhei", ru: "Оргеев", region_ro: "Raionul Orhei", region_ru: "Район Оргеев", pop: "25.000+", lat: 47.3776, lng: 28.8274, eta_ro: "1–2 ore", eta_ru: "1–2 часа" },
  cahul: { ro: "Cahul", ru: "Кагул", region_ro: "Raionul Cahul", region_ru: "Район Кагул", pop: "35.000+", lat: 45.9032, lng: 28.1935, eta_ro: "3–4 ore", eta_ru: "3–4 часа" },
  ungheni: { ro: "Ungheni", ru: "Унгены", region_ro: "Raionul Ungheni", region_ru: "Район Унгены", pop: "32.000+", lat: 47.2108, lng: 27.7958, eta_ro: "2–3 ore", eta_ru: "2–3 часа" },
  soroca: { ro: "Soroca", ru: "Сорока", region_ro: "Raionul Soroca", region_ru: "Район Сорока", pop: "28.000+", lat: 48.1582, lng: 28.2876, eta_ro: "2–3 ore", eta_ru: "2–3 часа" },
  straseni: { ro: "Strășeni", ru: "Страшены", region_ro: "Raionul Strășeni", region_ru: "Район Страшены", pop: "18.000+", lat: 47.1383, lng: 28.6070, eta_ro: "1–2 ore", eta_ru: "1–2 часа" },
  ialoveni: { ro: "Ialoveni", ru: "Яловены", region_ro: "Raionul Ialoveni", region_ru: "Район Яловены", pop: "16.000+", lat: 46.9456, lng: 28.7795, eta_ro: "30–60 min", eta_ru: "30–60 мин" },
  hincesti: { ro: "Hîncești", ru: "Хынчешты", region_ro: "Raionul Hîncești", region_ru: "Район Хынчешты", pop: "20.000+", lat: 46.8295, lng: 28.5854, eta_ro: "1–2 ore", eta_ru: "1–2 часа" },
  floresti: { ro: "Florești", ru: "Флорешты", region_ro: "Raionul Florești", region_ru: "Район Флорешты", pop: "18.000+", lat: 47.8638, lng: 28.2864, eta_ro: "2–3 ore", eta_ru: "2–3 часа" },
  edinet: { ro: "Edineț", ru: "Единцы", region_ro: "Raionul Edineț", region_ru: "Район Единцы", pop: "17.000+", lat: 48.1699, lng: 27.2977, eta_ro: "3–4 ore", eta_ru: "3–4 часа" },
  bender: { ro: "Bender", ru: "Бендеры", region_ro: "Municipiul Bender", region_ru: "Мун. Бендеры", pop: "90.000+", lat: 46.8281, lng: 29.4727, eta_ro: "1–2 ore", eta_ru: "1–2 часа" },
  drochia: { ro: "Drochia", ru: "Дрокия", region_ro: "Raionul Drochia", region_ru: "Район Дрокия", pop: "15.000+", lat: 48.0168, lng: 27.8633, eta_ro: "2–3 ore", eta_ru: "2–3 часа" },
  rezina: { ro: "Rezina", ru: "Резина", region_ro: "Raionul Rezina", region_ru: "Район Резина", pop: "11.000+", lat: 47.7424, lng: 28.9611, eta_ro: "2–3 ore", eta_ru: "2–3 часа" },
};

const SERVICES_RO = [
  { title: "Montaj Camere de Supraveghere", desc: "Instalare profesională camere IP WiFi și PoE la casă sau afacere.", price: sp?.montaj ?? "de la 300 MDL/cameră" },
  { title: "Diagnosticare & Depanare Sistem", desc: "Identificăm și rezolvăm orice problemă a sistemului tău de supraveghere.", price: sp?.diagnosticare ?? "de la 200 MDL/vizită" },
  { title: "Reparații Camere & NVR", desc: "Reparăm camere IP, NVR-uri, DVR-uri și sisteme de alarmă.", price: "prețuri la evaluare" },
  { title: "Configurare Acces Remote", desc: "Setăm accesul de pe telefon la camerele tale.", price: "de la 150 MDL" },
];
const SERVICES_RU = [
  { title: "Монтаж Камер Видеонаблюдения", desc: "Профессиональная установка IP WiFi и PoE камер дома или в офисе.", price: sp?.montaj ?? "от 300 MDL/камера" },
  { title: "Диагностика и Устранение Неисправностей", desc: "Найдём и устраним любую проблему вашей системы видеонаблюдения.", price: sp?.diagnosticare ?? "от 200 MDL/визит" },
  { title: "Ремонт Камер и NVR", desc: "Ремонтируем IP-камеры, NVR, DVR и охранные системы.", price: "по результатам оценки" },
  { title: "Настройка Удалённого Доступа", desc: "Настроим доступ с телефона к вашим камерам.", price: "от 150 MDL" },
];

export default function ServiceCity() {
  const sp = useStore((s) => s.settings.servicePrices);
const { city: citySlug } = useParams<{ city: string }>();
  const { lang } = useLang();
  const ro = lang === "ro";
  const adminPhone = useStore((s) => s.settings.general?.adminPhone ?? "");
  const phone = (adminPhone || "37367200463").replace(/\D/g, "");

  const city = CITY_DATA[citySlug?.toLowerCase() ?? "chisinau"] ?? CITY_DATA["chisinau"];
  const cityName = ro ? city.ro : city.ru;
  const services = ro ? SERVICES_RO : SERVICES_RU;

  const pageTitle = ro
    ? `Montaj și Reparații Camere Supraveghere ${city.ro} — Teco.md`
    : `Монтаж и Ремонт Камер Видеонаблюдения ${city.ru} — Teco.md`;
  const pageDesc = ro
    ? `Montaj profesional camere de supraveghere în ${city.ro}. Instalare în ${city.eta_ro}, reparații NVR și camere IP. Prețuri de la 200 MDL. ☎ +373 67 200 463`
    : `Профессиональный монтаж камер видеонаблюдения в ${city.ru}. Установка за ${city.eta_ru}, ремонт NVR и IP-камер. Цены от 200 MDL. ☎ +373 67 200 463`;

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      name: `Teco.md — Montaj Camere ${city.ro}`,
      description: pageDesc,
      url: `https://teco.md/servicii/${citySlug}`,
      telephone: "+37367200463",
      areaServed: { "@type": "City", name: cityName },
      geo: { "@type": "GeoCoordinates", latitude: city.lat, longitude: city.lng },
      address: { "@type": "PostalAddress", addressLocality: city.ro, addressCountry: "MD" },
      priceRange: "MDL 200–50000",
      openingHours: "Mo-Sa 09:00-19:00",
    },
    schemas.service({ name: `Montaj Camere Supraveghere ${city.ro}`, description: pageDesc, url: `https://teco.md/servicii/${citySlug}`, price: "200" }),
    schemas.breadcrumb([
      { name: "Teco.md", url: "https://teco.md" },
      { name: ro ? "Servicii" : "Услуги", url: "https://teco.md/servicii" },
      { name: cityName, url: `https://teco.md/servicii/${citySlug}` },
    ]),
  ];

  return (
    <>
      <SEO title={pageTitle} description={pageDesc} keywords={ro ? `montaj camere ${city.ro}, instalare supraveghere ${city.ro}, reparatii camere ${city.ro}` : `монтаж камер ${city.ru}, установка видеонаблюдения ${city.ru}, ремонт камер ${city.ru}`} canonical={`/servicii/${citySlug}`} lang={ro ? "ro" : "ru"} jsonLd={jsonLd} />
      <main className="flex-1 bg-[#FAFAFA] pb-[64px] md:pb-0">

        {/* Hero */}
        <section className="bg-[#09090B] text-white py-12 md:py-16">
          <div className="max-w-5xl mx-auto px-4 md:px-6">
            <div className="flex items-center gap-2 text-zinc-400 text-sm mb-4">
              <Link href="/servicii" className="hover:text-white transition-colors">{ro ? "Servicii" : "Услуги"}</Link>
              <ArrowRight className="w-3.5 h-3.5" />
              <span className="text-white font-semibold">{cityName}</span>
            </div>
            <div className="inline-flex items-center gap-2 bg-[#FF4F00]/20 border border-[#FF4F00]/30 rounded-full px-3.5 py-1.5 text-sm font-semibold text-[#FF4F00] mb-4">
              <MapPin className="w-3.5 h-3.5" />
              {cityName} · {ro ? city.region_ro : city.region_ru}
            </div>
            <h1 className="font-black text-3xl md:text-5xl leading-tight mb-4">
              {ro
                ? <><span className="text-[#FF4F00]">Montaj camere</span><br />de supraveghere<br />{city.ro}</>
                : <><span className="text-[#FF4F00]">Монтаж камер</span><br />видеонаблюдения<br />{city.ru}</>}
            </h1>
            <p className="text-zinc-300 text-base max-w-xl mb-6 leading-relaxed">
              {ro
                ? `Tehnicieni certificați Teco.md ajung în ${city.ro} în ${city.eta_ro}. Instalăm, depanăm și reparăm orice sistem de supraveghere video în ${city.region_ro}.`
                : `Сертифицированные техники Teco.md приедут в ${city.ru} за ${city.eta_ru}. Устанавливаем, диагностируем и ремонтируем любые системы видеонаблюдения в ${city.region_ru}.`}
            </p>
            <div className="flex flex-wrap gap-3">
              <a href={`https://wa.me/${phone}?text=${encodeURIComponent(ro ? `Bună ziua! Solicit instalare camere de supraveghere în ${city.ro}.` : `Здравствуйте! Прошу установку камер видеонаблюдения в ${city.ru}.`)}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-[#FF4F00] text-white font-bold px-6 py-3 rounded-xl hover:opacity-90 active:scale-95 transition-all">
                <Phone className="w-4 h-4" />
                {ro ? `Solicită în ${city.ro}` : `Заказать в ${city.ru}`}
              </a>
              <a href={`tel:+${phone}`} className="inline-flex items-center gap-2 bg-white/10 text-white font-semibold px-6 py-3 rounded-xl hover:bg-white/20 transition-all">
                <Phone className="w-4 h-4" /> +{phone}
              </a>
            </div>
          </div>
        </section>

        {/* ETA + stats */}
        <section className="bg-white border-b border-zinc-100">
          <div className="max-w-5xl mx-auto px-4 md:px-6 py-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { n: city.eta_ro, n_ru: city.eta_ru, ro: "Timp de ajuns", ru: "Время приезда" },
                { n: "847+", n_ru: "847+", ro: "Instalări totale", ru: "Монтажей всего" },
                { n: "4.9★", n_ru: "4.9★", ro: "Rating Google", ru: "Рейтинг Google" },
                { n: "12 luni", n_ru: "12 мес.", ro: "Garanție lucrare", ru: "Гарантия работ" },
              ].map(({ n, n_ru, ro: roLabel, ru: ruLabel }) => (
                <div key={roLabel} className="text-center py-2">
                  <p className="font-black text-xl text-[#FF4F00]">{ro ? n : n_ru}</p>
                  <p className="text-xs text-zinc-500 mt-1">{ro ? roLabel : ruLabel}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Services */}
        <section className="max-w-5xl mx-auto px-4 md:px-6 py-12">
          <div className="text-center mb-8">
            <p className="text-xs font-black uppercase tracking-widest text-[#FF4F00] mb-2">{ro ? `SERVICII ÎN ${city.ro.toUpperCase()}` : `УСЛУГИ В ${city.ru.toUpperCase()}`}</p>
            <h2 className="font-black text-2xl md:text-3xl text-[#09090B]">
              {ro ? `Ce oferim în ${city.ro}` : `Что предлагаем в ${city.ru}`}
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {services.map((s) => (
              <div key={s.title} className="bg-white border border-zinc-200 rounded-2xl p-5 flex gap-4 hover:border-[#FF4F00]/30 hover:shadow-md transition-all">
                <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Wrench className="w-5 h-5 text-[#FF4F00]" />
                </div>
                <div>
                  <h3 className="font-bold text-[#09090B] text-sm mb-1">{s.title}</h3>
                  <p className="text-zinc-500 text-xs mb-2">{s.desc}</p>
                  <span className="text-xs font-black text-[#FF4F00]">{s.price}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* How we work */}
        <section className="bg-white border-y border-zinc-100 py-12">
          <div className="max-w-5xl mx-auto px-4 md:px-6">
            <h2 className="font-black text-2xl text-center text-[#09090B] mb-8">{ro ? `Cum ajungem la tine în ${city.ro}` : `Как мы работаем в ${city.ru}`}</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { n: "01", ro: "Suni sau scrii", ru: "Позвоните или напишите", d_ro: "Contactează-ne pe WhatsApp sau telefon", d_ru: "Свяжитесь с нами в WhatsApp или по телефону" },
                { n: "02", ro: "Primești oferta", ru: "Получите предложение", d_ro: "Deviz complet în 30 minute", d_ru: "Полный расчёт за 30 минут" },
                { n: "03", ro: "Tehnicianul vine", ru: "Техник приедет", d_ro: `Ajungem în ${city.ro} în ${city.eta_ro}`, d_ru: `Приедем в ${city.ru} за ${city.eta_ru}` },
                { n: "04", ro: "Sistem funcțional", ru: "Система работает", d_ro: "Totul configurat și testat — cheie în mână", d_ru: "Всё настроено и протестировано под ключ" },
              ].map(({ n, ro: rt, ru: rut, d_ro, d_ru }) => (
                <div key={n} className="text-center">
                  <div className="w-12 h-12 bg-[#FF4F00]/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <span className="font-black text-[#FF4F00] text-lg">{n}</span>
                  </div>
                  <h3 className="font-bold text-[#09090B] text-sm mb-1">{ro ? rt : rut}</h3>
                  <p className="text-zinc-500 text-xs">{ro ? d_ro : d_ru}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="max-w-5xl mx-auto px-4 md:px-6 py-12">
          <div className="bg-[#09090B] rounded-3xl p-8 md:p-12 text-center">
            <h2 className="font-black text-2xl md:text-3xl text-white mb-3">
              {ro ? `Montaj camere în ${city.ro} — în ${city.eta_ro}` : `Монтаж камер в ${city.ru} — за ${city.eta_ru}`}
            </h2>
            <p className="text-white/60 mb-7 text-sm max-w-md mx-auto">
              {ro ? `Suni acum și un inginer Teco.md ajunge în ${city.ro} în ${city.eta_ro} cu ofertă personalizată.` : `Позвоните сейчас — инженер Teco.md приедет в ${city.ru} за ${city.eta_ru} с персональным предложением.`}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a href={`https://wa.me/${phone}?text=${encodeURIComponent(ro ? `Bună ziua! Vreau montaj camere în ${city.ro}.` : `Здравствуйте! Хочу монтаж камер в ${city.ru}.`)}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 bg-[#FF4F00] text-white font-bold px-8 py-4 rounded-2xl hover:opacity-90 active:scale-95 transition-all">
                <Phone className="w-5 h-5" />
                {ro ? `Solicită în ${city.ro}` : `Заказать в ${city.ru}`}
              </a>
              <a href={`tel:+${phone}`} className="inline-flex items-center justify-center gap-2 bg-white/10 text-white font-bold px-8 py-4 rounded-2xl hover:bg-white/20 transition-all">
                <Phone className="w-5 h-5" /> +{phone}
              </a>
            </div>
          </div>
        </section>

        {/* Other cities */}
        <section className="max-w-5xl mx-auto px-4 md:px-6 pb-10">
          <p className="text-xs font-bold text-zinc-400 text-center uppercase tracking-widest mb-4">{ro ? "ALTE LOCALITĂȚI" : "ДРУГИЕ ГОРОДА"}</p>
          <div className="flex flex-wrap justify-center gap-2">
            {Object.entries(CITY_DATA).filter(([slug]) => slug !== citySlug).slice(0, 10).map(([slug, c]) => (
              <Link key={slug} href={`/servicii/${slug}`} className="inline-flex items-center gap-1.5 bg-zinc-100 hover:bg-orange-50 hover:text-[#FF4F00] text-zinc-600 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors">
                <MapPin className="w-3 h-3" />
                {ro ? c.ro : c.ru}
              </Link>
            ))}
          </div>
        </section>

      </main>
    </>
  );
}
