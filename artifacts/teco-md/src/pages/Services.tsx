import { useState } from "react";
import { Link } from "wouter";
import { Wrench, Search, ShieldCheck, Phone, CheckCircle, Clock, Star, ArrowRight, ChevronDown, MapPin, Shield, Zap, Wifi } from "lucide-react";
import { useStore } from "@/lib/store";
import { useLang } from "@/contexts/LangContext";
import { SEO, schemas } from "@/components/SEO";
import { AppointmentBooker } from "@/components/AppointmentBooker";

const SERVICES = [
  {
    id: "montaj",
    icon: Wrench,
    color: "#FF4F00",
    bg: "bg-orange-50",
    border: "border-orange-100",
    title: "Montaj Camere de Supraveghere",
    titleRu: "Монтаж Камер Видеонаблюдения",
    desc: "Echipa noastră de tehnicieni certificați instalează și configurează sisteme complete de supraveghere video la locuința sau afacerea ta. Venim la tine oriunde în Moldova.",
    descRu: "Наша команда сертифицированных техников устанавливает и настраивает полные системы видеонаблюдения у вас дома или на предприятии. Работаем по всей Молдове.",
    features: ["Montaj și cablare profesională", "Configurare NVR și aplicație mobilă", "Testare completă a sistemului", "Instruire utilizator inclusă"],
    featuresRu: ["Профессиональный монтаж и прокладка кабеля", "Настройка NVR и мобильного приложения", "Полное тестирование системы", "Обучение пользователя включено"],
    price: "de la 300 MDL/cameră",
    priceRu: "от 300 MDL/камера",
    badge: "CEL MAI CERUT",
    badgeRu: "ПОПУЛЯРНОЕ",
  },
  {
    id: "diagnosticare",
    icon: Search,
    color: "#3B82F6",
    bg: "bg-blue-50",
    border: "border-blue-100",
    title: "Diagnosticare & Depanare",
    titleRu: "Диагностика и Устранение Неисправностей",
    desc: "Sistemul tău nu funcționează? Tehnicianul nostru identifică și rezolvă orice problemă: cameră defectă, conexiune pierdută, configurare incorectă sau NVR blocat.",
    descRu: "Система не работает? Наш техник выявит и устранит любую проблему: неисправная камера, потеря соединения, неправильная настройка или заблокированный NVR.",
    features: ["Diagnosticare completă on-site", "Verificare conexiuni și cabluri", "Resetare și reconfigurare sistem", "Raport tehnic detaliat"],
    featuresRu: ["Полная диагностика на месте", "Проверка соединений и кабелей", "Сброс и перенастройка системы", "Подробный технический отчет"],
    price: "de la 200 MDL/vizită",
    priceRu: "от 200 MDL/визит",
    badge: null,
    badgeRu: null,
  },
  {
    id: "reparatii",
    icon: ShieldCheck,
    color: "#10B981",
    bg: "bg-green-50",
    border: "border-green-100",
    title: "Reparații Echipamente",
    titleRu: "Ремонт Оборудования",
    desc: "Reparăm camere IP, NVR-uri, DVR-uri și sisteme de alarmă. Folosim piese originale sau compatibile de calitate și oferim garanție pe reparațiile efectuate.",
    descRu: "Ремонтируем IP-камеры, NVR, DVR и системы охраны. Используем оригинальные или качественные совместимые детали. Предоставляем гарантию на выполненные ремонты.",
    features: ["Reparație camere IP și NVR/DVR", "Înlocuire piese defecte", "Garanție 6 luni pe reparație", "Evaluare gratuită prealabilă"],
    featuresRu: ["Ремонт IP-камер, NVR/DVR", "Замена неисправных деталей", "Гарантия 6 месяцев на ремонт", "Бесплатная предварительная оценка"],
    price: "prețuri la evaluare",
    priceRu: "цены по результатам оценки",
    badge: null,
    badgeRu: null,
  },
];

const STEPS = [
  { n: "01", ro: { t: "Contactezi echipa", d: "Suni, scrii pe WhatsApp sau compleci formularul online" }, ru: { t: "Свяжитесь с нами", d: "Позвоните, напишите в WhatsApp или заполните форму" } },
  { n: "02", ro: { t: "Primești oferta", d: "Evaluăm necesitățile și trimitem prețul în 30 min" }, ru: { t: "Получите предложение", d: "Оцениваем нужды и отправляем цену в течение 30 мин" } },
  { n: "03", ro: { t: "Programăm instalarea", d: "Tehnicianul vine la adresa ta în intervalul ales" }, ru: { t: "Планируем установку", d: "Техник приедет по вашему адресу в удобное время" } },
  { n: "04", ro: { t: "Sistemul funcționează", d: "Predăm cheia în mână — totul configurat și testat" }, ru: { t: "Система работает", d: "Передаем готовую к работе систему — всё настроено" } },
];

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-zinc-50 transition-colors"
        aria-expanded={open}
      >
        <span className="font-semibold text-[#09090B] text-sm leading-snug">{question}</span>
        <ChevronDown className={`w-4 h-4 text-zinc-400 flex-shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="px-5 pb-4 text-zinc-600 text-sm leading-relaxed border-t border-zinc-100 pt-3">
          {answer}
        </div>
      )}
    </div>
  );
}

export default function Services() {
  const { lang } = useLang();
  const ro = lang === "ro";
  const adminPhone = useStore((s) => s.settings.general?.adminPhone ?? "");
  const phone = (adminPhone || "37367200463").replace(/\D/g, "");

  const openWA = (service: string) => {
    const msg = ro
      ? `Bună ziua! Sunt interesat de serviciul: ${service}. Puteți oferi detalii?`
      : `Здравствуйте! Меня интересует услуга: ${service}. Можете предоставить подробности?`;
    window.location.href = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
  };

  const FAQ_RO = [
    { q: "Cât costă repararea unei camere de supraveghere în Moldova?", a: "Costul reparației depinde de tipul defecțiunii. Diagnosticarea on-site costă de la 200 MDL. Reparația propriu-zisă (înlocuire matrice, lentilă, modul IR, sursă) începe de la 150 MDL. Oferim evaluare gratuită înainte de a confirma lucrarea." },
    { q: "Câte zile durează instalarea unui sistem complet de supraveghere?", a: "Un sistem de 4–8 camere se instalează în 1 zi lucrătoare. Sistemele mari (16+ camere, cablu structurat, NVR rack) pot dura 2–3 zile. Venimus la tine oriunde în Moldova în 24 de ore de la comandă." },
    { q: "Reparați sisteme vechi de supraveghere — DVR-uri, camere analogice HDCVI/AHD?", a: "Da, reparăm și diagnosticăm orice tip de sistem: IP modern, analogic HDCVI/AHD/TVI, sisteme hibride. Avem piese de schimb pentru cele mai frecvente branduri: Dahua, Hikvision, Uniview, TP-Link Tapo, Reolink." },
    { q: "Instalați sisteme de supraveghere și în afara Chișinăului?", a: "Da, lucrăm în toată Moldova: Bălți, Orhei, Ungheni, Cahul, Soroca, Tiraspol, Bender și localitățile din jur. Costul deplasării se calculează în funcție de distanță și se comunică înainte de confirmare." },
    { q: "Ce garanție oferiți pe lucrarea de instalare?", a: "Oferim 12 luni garanție pe lucrarea de instalare și 6 luni pe reparații. Garanția acoperă defecțiunile de montaj, conexiunile electrice și configurarea sistemului. Produsele au garanție producător 2–3 ani." },
    { q: "Camera mea nu afișează imagine sau NVR-ul nu înregistrează — ce fac?", a: "Suni sau scrii pe WhatsApp și un inginer Teco.md îți răspunde în 15 minute. De multe ori problema se rezolvă remote (resetare, reconfigurare aplicație). Dacă e nevoie de intervenție fizică, trimitem un tehnician în aceeași zi." },
    { q: "Puteți instala sisteme de supraveghere pentru afacere — magazin, depozit, birou?", a: "Da, aceasta este specialitatea noastră. Proiectăm și instalăm sisteme complete pentru retail, depozite, birouri, parcări și obiective industriale. Includem analiza riscurilor, planul de amplasare, cablu structurat și integrare cu sistemul de alarmă." },
    { q: "Ce include pachetul de instalare la cheie?", a: "Pachetul la cheie include: livrarea echipamentelor, cablare și montaj camere, configurarea NVR/DVR, setarea accesului remote pe telefon, testarea completă a sistemului și instruirea utilizatorului. Nu există costuri ascunse." },
    { q: "Oferiți intervenție de urgență pentru sisteme defecte?", a: "Da, oferim intervenție de urgență în Chișinău și localitățile apropiate. Timp de răspuns: 2–4 ore. Serviciul de urgență are un tarif suplimentar față de intervenția planificată." },
    { q: "Care este diferența dintre diagnosticare și reparație?", a: "Diagnosticarea este procesul de identificare a defecțiunii — costă de la 200 MDL și include deplasarea, inspecția vizuală și testarea componentelor. Reparația este intervenția propriu-zisă. Dacă nu se poate repara, nu plătești pentru reparație — doar diagnosticarea." },
  ];
  const FAQ_RU = [
    { q: "Сколько стоит ремонт камеры видеонаблюдения в Молдове?", a: "Стоимость ремонта зависит от типа неисправности. Диагностика на месте стоит от 200 MDL. Сам ремонт (замена матрицы, объектива, ИК-модуля, блока питания) начинается от 150 MDL. Предлагаем бесплатную оценку перед подтверждением работы." },
    { q: "Сколько времени занимает установка системы видеонаблюдения?", a: "Система на 4–8 камер устанавливается за 1 рабочий день. Большие системы (16+ камер, структурированный кабель, NVR) могут занять 2–3 дня. Приедем к вам по всей Молдове в течение 24 часов после заказа." },
    { q: "Вы ремонтируете старые системы видеонаблюдения — DVR, аналоговые камеры?", a: "Да, ремонтируем и диагностируем любые системы: IP, аналоговые HDCVI/AHD/TVI, гибридные. Имеем запчасти для популярных брендов: Dahua, Hikvision, Uniview, TP-Link Tapo, Reolink." },
    { q: "Вы устанавливаете системы видеонаблюдения за пределами Кишинева?", a: "Да, работаем по всей Молдове: Бельцы, Оргеев, Унгены, Кагул, Сорока, Тирасполь, Бендеры и окрестности. Стоимость выезда рассчитывается в зависимости от расстояния и сообщается заранее." },
    { q: "Какую гарантию вы даёте на монтажные работы?", a: "Предоставляем 12 месяцев гарантии на монтажные работы и 6 месяцев на ремонт. Гарантия покрывает дефекты монтажа, электрические соединения и настройку системы. На оборудование действует гарантия производителя 2–3 года." },
    { q: "Камера не показывает изображение или NVR не записывает — что делать?", a: "Позвоните или напишите в WhatsApp — инженер Teco.md ответит в течение 15 минут. Часто проблему можно решить удаленно (сброс настроек, перенастройка приложения). Если нужен выезд — отправим техника в тот же день." },
    { q: "Устанавливаете ли системы видеонаблюдения для бизнеса?", a: "Да, это наша специализация. Проектируем и устанавливаем комплексные системы для магазинов, складов, офисов, парковок и промышленных объектов. Включает анализ рисков, схему расстановки и интеграцию с охранной сигнализацией." },
    { q: "Что включает установка под ключ?", a: "Монтаж под ключ включает: доставку оборудования, прокладку кабеля и монтаж камер, настройку NVR/DVR, настройку удалённого доступа со смартфона, полное тестирование и обучение пользователя. Скрытых платежей нет." },
    { q: "Есть ли экстренный выезд при поломке?", a: "Да, предоставляем экстренный выезд в Кишиневе и пригородах. Время реагирования: 2–4 часа. Услуга экстренного выезда имеет дополнительную стоимость по сравнению с плановым обслуживанием." },
    { q: "В чем разница между диагностикой и ремонтом?", a: "Диагностика — это процесс выявления неисправности (от 200 MDL, включая выезд и тестирование). Ремонт — это непосредственное устранение проблемы. Если ремонт невозможен, платите только за диагностику." },
  ];

  const FAQ = ro ? FAQ_RO : FAQ_RU;

  const CITIES = [
    "Chișinău", "Bălți", "Orhei", "Ungheni", "Cahul",
    "Soroca", "Strășeni", "Ialoveni", "Criuleni", "Hîncești",
    "Florești", "Rezina", "Edineț", "Drochia", "Bender",
  ];

  const jsonLd = [
    schemas.service({ name: "Montaj Camere de Supraveghere", description: "Instalare profesionala camere IP, NVR, kituri complete in Moldova. Preturi de la 300 MDL/camera.", url: "https://teco.md/servicii", price: "300" }),
    schemas.service({ name: "Diagnosticare si Reparatii Sisteme Supraveghere", description: "Reparatii camere IP, NVR, DVR, sisteme analogice si alarme. Diagnosticare on-site de la 200 MDL. Garantie 6 luni.", url: "https://teco.md/servicii", price: "200" }),
    schemas.repairService({ name: "Reparare Camera Supraveghere Moldova", description: "Reparatii camere IP si analogice (Dahua, Hikvision, TP-Link, Reolink). Piese originale. Garantie 6 luni. Chisinau + toata Moldova.", price: "150" }),
    schemas.howTo({
      name: ro ? "Cum se instalează un sistem de supraveghere în Moldova" : "Как установить систему видеонаблюдения в Молдове",
      description: ro ? "Ghid pas cu pas pentru instalarea unui sistem complet de camere de supraveghere. Echipa Teco.md instalează oriunde în Moldova în 24h." : "Пошаговое руководство по установке системы видеонаблюдения. Команда Teco.md устанавливает по всей Молдове за 24 часа.",
      totalTime: "PT8H",
      supply: ro ? ["Camere IP sau WiFi", "NVR sau DVR", "Cablu UTP Cat6", "Surse de alimentare", "Monitoare sau router"] : ["IP или WiFi камеры", "NVR или DVR регистратор", "Кабель UTP Cat6", "Блоки питания", "Монитор или роутер"],
      tool: ro ? ["Burghiu profesional", "Cleste sertizat", "Multimetru", "Laptop configurare"] : ["Профессиональная дрель", "Кримпер", "Мультиметр", "Ноутбук для настройки"],
      steps: ro ? [
        { name: "Consultanță și proiectare", text: "Contactați Teco.md. Un inginer evaluează spațiul, identifică punctele critice și propune cel mai bun plan de amplasare a camerelor.", url: "https://teco.md/servicii" },
        { name: "Alegerea echipamentelor", text: "Pe baza analizei, recomandăm camerele potrivite (WiFi, PoE, 4G), tipul NVR/DVR și accesoriile necesare. Ofertă detaliată cu prețuri fixe." },
        { name: "Montajul și cablarea", text: "Tehnicianul Teco.md vine la adresa ta și realizează montajul fizic al camerelor, trage cablul ascuns pe traseu, montează NVR-ul și conectează totul." },
        { name: "Configurarea sistemului", text: "Setăm NVR-ul, configurăm înregistrarea automată, alertele de mișcare și accesul remote de pe smartphone-ul tău (iOS/Android)." },
        { name: "Testare și predare", text: "Testăm complet sistemul, verificăm toate camerele, predăm cheile în mână și instruim utilizatorul. Garanție 12 luni pe lucrare." },
      ] : [
        { name: "Консультация и проектирование", text: "Свяжитесь с Teco.md. Инженер оценит объект, определит критические точки и предложит оптимальный план расстановки камер.", url: "https://teco.md/servicii" },
        { name: "Выбор оборудования", text: "На основе анализа рекомендуем подходящие камеры (WiFi, PoE, 4G), тип NVR/DVR и необходимые аксессуары. Детальное предложение с фиксированными ценами." },
        { name: "Монтаж и прокладка кабеля", text: "Техник Teco.md приедет к вам и выполнит физический монтаж камер, скрытую прокладку кабеля, установку NVR и все подключения." },
        { name: "Настройка системы", text: "Настраиваем NVR, автоматическую запись, датчики движения и удалённый доступ со смартфона (iOS/Android)." },
        { name: "Тестирование и сдача", text: "Полностью тестируем систему, проверяем все камеры, передаём готовую систему и обучаем пользователя. Гарантия 12 месяцев на работу." },
      ],
    }),
    schemas.faq(FAQ_RO.map((x) => ({ question: x.q, answer: x.a }))),
    schemas.breadcrumb([
      { name: ro ? "Acasa" : "Главная", url: "https://teco.md/" },
      { name: ro ? "Servicii" : "Услуги", url: "https://teco.md/servicii" },
    ]),
  ];
  const pageTitle = ro ? "Servicii Montaj, Instalare si Reparatii Camere — Teco.md Moldova" : "Монтаж, Установка и Ремонт Камер Видеонаблюдения — Teco.md Молдова";
  const pageDesc = ro ? "Montaj și reparatii camere supraveghere in Moldova. Instalare in 24h oriunde in tara. Reparatie NVR, DVR, camere IP si analogice. Garantie 12 luni. Preturi de la 200 MDL." : "Монтаж и ремонт камер видеонаблюдения в Молдове. Установка за 24 часа по всей стране. Ремонт NVR, DVR, IP и аналоговых камер. Гарантия 12 месяцев. Цены от 200 MDL.";

  return (
    <>
      <SEO title={pageTitle} description={pageDesc} keywords={ro ? "montaj camere, instalare securitate, diagnosticare, reparatii, Moldova, Teco.md" : "монтаж камер, установка безопасности, диагностика, ремонт, Молдова"} canonical="/servicii" lang={ro ? "ro" : "ru"} jsonLd={jsonLd} />
      <main className="flex-1 bg-[#FAFAFA] pb-[64px] md:pb-0" role="main" aria-label={ro ? "Servicii Teco.md" : "Услуги Teco.md"}>
      {/* ── Hero ── */}
      <section className="bg-[#09090B] text-white py-14 md:py-20">
        <div className="max-w-5xl mx-auto px-4 md:px-6">
          <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 text-sm font-semibold mb-5">
            <Wrench className="w-4 h-4 text-[#FF4F00]" />
            {ro ? "Servicii Profesionale" : "Профессиональные Услуги"}
          </div>
          <h1 className="font-black text-3xl md:text-5xl leading-tight mb-4">
            {ro ? <>Instalare, Depanare &<br /><span className="text-[#FF4F00]">Service Sisteme</span></> : <>Монтаж, Диагностика &<br /><span className="text-[#FF4F00]">Сервис Систем</span></>}
          </h1>
          <p className="text-white/70 text-base md:text-lg max-w-xl mb-8">
            {ro
              ? "Tehnicieni certificați la tine acasă sau la afacere. Instalăm, configurăm și reparăm orice sistem de supraveghere din Moldova."
              : "Сертифицированные техники у вас дома или на предприятии. Устанавливаем, настраиваем и ремонтируем любые системы видеонаблюдения в Молдове."}
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href={`https://wa.me/${phone}?text=${encodeURIComponent(ro ? "Bună ziua! Vreau să solicit un serviciu de instalare. Puteți oferi detalii?" : "Здравствуйте! Хочу заказать услугу монтажа. Можете предоставить детали?")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#FF4F00] text-white font-bold px-6 py-3 rounded-xl hover:opacity-90 active:scale-95 transition-all"
            >
              <Phone className="w-4 h-4" />
              {ro ? "Solicită Serviciu Acum" : "Заказать Услугу Сейчас"}
            </a>
            <Link href="/produse" className="inline-flex items-center gap-2 bg-white/10 text-white font-semibold px-6 py-3 rounded-xl hover:bg-white/20 transition-all">
              {ro ? "Vezi Produse" : "Смотреть Товары"} <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Trust stats ── */}
      <section className="bg-white border-b border-zinc-100">
        <div className="max-w-5xl mx-auto px-4 md:px-6 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { n: "847+", ro: "Instalări finalizate", ru: "Выполненных монтажей" },
              { n: "24h", ro: "Timp de răspuns", ru: "Время ответа" },
              { n: "4.9★", ro: "Rating clienți", ru: "Рейтинг клиентов" },
              { n: "5+", ro: "Ani experiență", ru: "Лет опыта" },
            ].map(({ n, ro: roLabel, ru: ruLabel }) => (
              <div key={n} className="text-center py-2">
                <div className="font-black text-2xl text-[#FF4F00]">{n}</div>
                <div className="text-xs text-zinc-500 mt-1">{ro ? roLabel : ruLabel}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Services grid ── */}
      <section className="max-w-5xl mx-auto px-4 md:px-6 py-12">
        <div className="text-center mb-10">
          <div className="text-xs font-black uppercase tracking-widest text-[#FF4F00] mb-2">
            {ro ? "CE OFERIM" : "ЧТО МЫ ПРЕДЛАГАЕМ"}
          </div>
          <h2 className="font-black text-2xl md:text-3xl text-[#09090B]">
            {ro ? "Servicii Complete de Securitate" : "Полный Спектр Услуг Безопасности"}
          </h2>
          <p className="text-zinc-500 mt-2 max-w-lg mx-auto text-sm">
            {ro
              ? "De la montaj la service — acoperim tot ciclul de viață al sistemului tău de supraveghere."
              : "От монтажа до сервиса — мы охватываем полный жизненный цикл вашей системы видеонаблюдения."}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {SERVICES.map((s) => (
            <div key={s.id} className={`bg-white rounded-2xl border ${s.border} p-6 flex flex-col hover:shadow-lg transition-shadow`}>
              {(ro ? s.badge : s.badgeRu) && (
                <div className="inline-flex self-start mb-3">
                  <span className="bg-[#FF4F00] text-white text-[10px] font-black px-2.5 py-1 rounded-full">
                    {ro ? s.badge : s.badgeRu}
                  </span>
                </div>
              )}
              <div className={`w-12 h-12 ${s.bg} rounded-2xl flex items-center justify-center mb-4`}>
                <s.icon className="w-6 h-6" style={{ color: s.color }} />
              </div>
              <h3 className="font-black text-[#09090B] text-lg mb-2">{ro ? s.title : s.titleRu}</h3>
              <p className="text-zinc-500 text-sm mb-4 flex-1">{ro ? s.desc : s.descRu}</p>
              <ul className="space-y-2 mb-5">
                {(ro ? s.features : s.featuresRu).map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-zinc-600">
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <div className="border-t border-zinc-100 pt-4 mb-4">
                <span className="text-xs text-zinc-400">{ro ? "Cost estimat:" : "Ориентировочная стоимость:"}</span>
                <p className="font-black text-[#FF4F00] text-base">{ro ? s.price : s.priceRu}</p>
              </div>
              <button
                onClick={() => openWA(ro ? s.title : s.titleRu)}
                className="w-full bg-[#FF4F00] text-white font-bold py-3 rounded-xl hover:opacity-90 active:scale-95 transition-all text-sm"
              >
                {ro ? "Solicită Ofertă" : "Запросить Предложение"}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="bg-white border-y border-zinc-100 py-12">
        <div className="max-w-5xl mx-auto px-4 md:px-6">
          <div className="text-center mb-8">
            <h2 className="font-black text-2xl text-[#09090B]">
              {ro ? "Cum funcționează" : "Как это работает"}
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {STEPS.map(({ n, ro: roStep, ru: ruStep }) => (
              <div key={n} className="text-center">
                <div className="w-12 h-12 bg-[#FF4F00]/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <span className="font-black text-[#FF4F00] text-lg">{n}</span>
                </div>
                <h3 className="font-bold text-[#09090B] text-sm mb-1">{ro ? roStep.t : ruStep.t}</h3>
                <p className="text-zinc-500 text-xs">{ro ? roStep.d : ruStep.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why us ── */}
      <section className="max-w-5xl mx-auto px-4 md:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { icon: Clock, t: ro ? "Răspuns în 15 minute" : "Ответ за 15 минут", d: ro ? "Suni sau scrii și ești contactat imediat de un inginer." : "Позвоните или напишите — инженер ответит немедленно." },
            { icon: Star, t: ro ? "Tehnicieni certificați" : "Сертифицированные техники", d: ro ? "Toți tehnicii noștri au certificări și experiență dovedită." : "Все наши техники имеют сертификаты и подтвержденный опыт." },
            { icon: ShieldCheck, t: ro ? "Garanție pe lucrare" : "Гарантия на работу", d: ro ? "Orice lucrare efectuată vine cu garanție scrisă." : "Каждая выполненная работа сопровождается письменной гарантией." },
          ].map(({ icon: Icon, t, d }) => (
            <div key={t} className="bg-white rounded-2xl border border-zinc-200 p-5 flex gap-4">
              <div className="w-10 h-10 bg-[#FF4F00]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <Icon className="w-5 h-5 text-[#FF4F00]" />
              </div>
              <div>
                <h3 className="font-bold text-[#09090B] text-sm mb-1">{t}</h3>
                <p className="text-zinc-500 text-xs">{d}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Zone de acoperire ── */}
      <section className="bg-white border-y border-zinc-100 py-12">
        <div className="max-w-5xl mx-auto px-4 md:px-6">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 text-[#FF4F00] text-xs font-black uppercase tracking-widest mb-2">
              <MapPin className="w-3.5 h-3.5" />
              {ro ? "ACOPERIRE NAȚIONALĂ" : "НАЦИОНАЛЬНОЕ ПОКРЫТИЕ"}
            </div>
            <h2 className="font-black text-2xl text-[#09090B]">
              {ro ? "Instalăm și reparăm în toată Moldova" : "Монтаж и ремонт по всей Молдове"}
            </h2>
            <p className="text-zinc-500 text-sm mt-2 max-w-md mx-auto">
              {ro
                ? "Echipa noastră se deplasează oriunde în țară. Costul deplasării se comunică transparent înainte de confirmare."
                : "Наша команда выезжает по всей стране. Стоимость выезда сообщается заранее и прозрачно."}
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            {CITIES.map((city) => (
              <span key={city} className="inline-flex items-center gap-1.5 bg-zinc-50 border border-zinc-200 rounded-full px-3.5 py-1.5 text-sm font-medium text-zinc-700 hover:border-[#FF4F00]/40 hover:bg-orange-50 transition-colors">
                <MapPin className="w-3 h-3 text-[#FF4F00]" />
                {city}
              </span>
            ))}
            <span className="inline-flex items-center gap-1.5 bg-[#FF4F00] rounded-full px-3.5 py-1.5 text-sm font-bold text-white">
              + {ro ? "toată Moldova" : "вся Молдова"}
            </span>
          </div>
        </div>
      </section>

      {/* ── FAQ — Întrebări frecvente ── */}
      <section className="max-w-5xl mx-auto px-4 md:px-6 py-14" aria-label={ro ? "Întrebări frecvente" : "Часто задаваемые вопросы"}>
        <div className="text-center mb-10">
          <div className="text-xs font-black uppercase tracking-widest text-[#FF4F00] mb-2">FAQ</div>
          <h2 className="font-black text-2xl md:text-3xl text-[#09090B]">
            {ro ? "Întrebări frecvente despre servicii" : "Часто задаваемые вопросы об услугах"}
          </h2>
          <p className="text-zinc-500 text-sm mt-2 max-w-lg mx-auto">
            {ro
              ? "Răspunsuri clare la cele mai comune întrebări despre instalare, reparații și prețuri."
              : "Чёткие ответы на самые частые вопросы об установке, ремонте и ценах."}
          </p>
        </div>
        <div className="space-y-3 max-w-3xl mx-auto">
          {FAQ.map((item, i) => (
            <FAQItem key={i} question={item.q} answer={item.a} />
          ))}
        </div>
        <div className="mt-10 text-center">
          <p className="text-zinc-500 text-sm mb-4">
            {ro ? "Nu ai găsit răspunsul? Scrie-ne direct — răspundem în 15 minute." : "Не нашли ответа? Напишите нам — ответим в течение 15 минут."}
          </p>
          <a
            href={`https://wa.me/${phone}?text=${encodeURIComponent(ro ? "Bună ziua! Am o întrebare despre servicii." : "Здравствуйте! У меня вопрос об услугах.")}`}
            target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-[#FF4F00] text-white font-bold px-6 py-3 rounded-xl hover:opacity-90 active:scale-95 transition-all"
          >
            <Phone className="w-4 h-4" />
            {ro ? "Scrie pe WhatsApp" : "Написать в WhatsApp"}
          </a>
        </div>
      </section>

      {/* ── Teco Guard ── */}
      <section className="py-14 bg-[#09090B]">
        <div className="max-w-5xl mx-auto px-4 md:px-6">
          <div className="flex flex-col md:flex-row items-center gap-10">
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 bg-[#FF4F00]/20 border border-[#FF4F00]/30 rounded-full px-4 py-1.5 text-sm font-semibold text-[#FF4F00] mb-5">
                <Shield className="w-4 h-4" />
                {ro ? "ABONAMENT LUNAR" : "ЕЖЕМЕСЯЧНАЯ ПОДПИСКА"}
              </div>
              <h2 className="font-black text-3xl md:text-4xl text-white mb-4">
                Teco<span className="text-[#FF4F00]">Guard</span>
              </h2>
              <p className="text-zinc-300 text-base leading-relaxed mb-6 max-w-md">
                {ro
                  ? "Uită de griji. Monitorizăm sistemul tău lunar — actualizăm firmware, verificăm înregistrările, intervenim prioritar dacă ceva se defectează."
                  : "Забудьте о проблемах. Ежемесячно мониторим вашу систему — обновляем прошивку, проверяем записи, приоритетно выезжаем при неисправности."}
              </p>
              <div className="space-y-2.5 mb-8">
                {[
                  { icon: Wifi, ro: "Verificare remote lunară a sistemului", ru: "Ежемесячная удалённая проверка системы" },
                  { icon: Zap, ro: "Actualizare automată firmware camere & NVR", ru: "Автоматическое обновление прошивки камер и NVR" },
                  { icon: Wrench, ro: "Intervenție prioritară 4h la defecțiuni", ru: "Приоритетный выезд за 4ч при неисправности" },
                  { icon: Shield, ro: "Raport lunar de stare a sistemului", ru: "Ежемесячный отчёт о состоянии системы" },
                  { icon: CheckCircle, ro: "Reducere 20% la orice reparație sau upgrade", ru: "Скидка 20% на любой ремонт или апгрейд" },
                ].map(({ icon: Icon, ro: roLabel, ru: ruLabel }) => (
                  <div key={roLabel} className="flex items-center gap-3 text-sm text-zinc-300">
                    <div className="w-6 h-6 rounded-full bg-[#FF4F00]/20 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-3 h-3 text-[#FF4F00]" />
                    </div>
                    {ro ? roLabel : ruLabel}
                  </div>
                ))}
              </div>
              <a
                href={`https://wa.me/${phone}?text=${encodeURIComponent(ro ? "Bună ziua! Sunt interesat de abonamentul Teco Guard. Puteți da detalii?" : "Здравствуйте! Интересует подписка Teco Guard. Можете рассказать подробнее?")}`}
                target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-[#FF4F00] text-white font-bold px-7 py-3.5 rounded-2xl hover:opacity-90 active:scale-95 transition-all"
              >
                <Phone className="w-4 h-4" />
                {ro ? "Activează Teco Guard" : "Активировать Teco Guard"}
              </a>
            </div>
            <div className="flex-shrink-0 bg-white/5 border border-white/10 rounded-3xl p-8 min-w-[220px] text-center">
              <p className="text-zinc-400 text-sm mb-2">{ro ? "Prețul lunar" : "Цена в месяц"}</p>
              <p className="font-black text-5xl text-white mb-1">200</p>
              <p className="text-[#FF4F00] font-bold text-lg">MDL/lună</p>
              <div className="my-5 border-t border-white/10" />
              <p className="text-xs text-zinc-400">
                {ro ? "Contract lunar, anulezi oricând fără penalități." : "Ежемесячный контракт, отмена в любое время без штрафов."}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Programare Online ── */}
      <section className="py-14 bg-[#FAFAFA]">
        <div className="max-w-5xl mx-auto px-4 md:px-6">
          <div className="text-center mb-10">
            <p className="text-xs font-black uppercase tracking-widest text-[#FF4F00] mb-2">{ro ? "PROGRAMARE ONLINE" : "ОНЛАЙН ЗАПИСЬ"}</p>
            <h2 className="font-black text-2xl md:text-3xl text-[#09090B] mb-2">
              {ro ? "Programează vizita tehnicianului" : "Запишитесь на визит техника"}
            </h2>
            <p className="text-zinc-500 text-sm max-w-md mx-auto">
              {ro ? "Alege serviciul, data și intervalul orar — tehnicianul confirmă în 15 minute pe WhatsApp." : "Выберите услугу, дату и время — техник подтвердит в течение 15 минут в WhatsApp."}
            </p>
          </div>
          <div className="max-w-md mx-auto">
            <AppointmentBooker />
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="max-w-5xl mx-auto px-4 md:px-6 pb-12">
        <div className="bg-[#09090B] rounded-3xl p-8 md:p-12 text-center">
          <h2 className="font-black text-2xl md:text-3xl text-white mb-3">
            {ro ? "Gata să îți securizezi proprietatea?" : "Готовы обеспечить безопасность своей собственности?"}
          </h2>
          <p className="text-white/60 mb-8 max-w-md mx-auto">
            {ro
              ? "Contactează-ne acum și un inginer TECO te sună în 15 minute cu o ofertă personalizată."
              : "Свяжитесь с нами сейчас, и инженер TECO перезвонит вам в течение 15 минут с персональным предложением."}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href={`https://wa.me/${phone}?text=${encodeURIComponent(ro ? "Bună ziua! Vreau să solicit un serviciu de instalare. Puteți oferi detalii?" : "Здравствуйте! Хочу заказать услугу монтажа. Можете предоставить детали?")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-[#FF4F00] text-white font-bold px-8 py-4 rounded-2xl hover:opacity-90 active:scale-95 transition-all"
            >
              <Phone className="w-5 h-5" />
              {ro ? "Solicită Consultanță Gratuită" : "Запросить Бесплатную Консультацию"}
            </a>
            <a
              href={`tel:+${phone}`}
              className="inline-flex items-center justify-center gap-2 bg-white/10 text-white font-bold px-8 py-4 rounded-2xl hover:bg-white/20 transition-all"
            >
              <Phone className="w-5 h-5" /> +{phone}
            </a>
          </div>
        </div>
      </section>
    </main>
    </>
  );
}
