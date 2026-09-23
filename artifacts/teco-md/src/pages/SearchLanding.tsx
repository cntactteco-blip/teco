import { Link, useLocation } from "wouter";
import { AlertTriangle, ArrowRight, CheckCircle2, HardDrive, MessageCircle, Phone, Wifi } from "lucide-react";
import { SEO, schemas } from "@/components/SEO";
import { useLang } from "@/contexts/LangContext";
import { useStore } from "@/lib/store";
import { canonicalUrl } from "@/lib/seo-url";

type Copy = { title: string; description: string; heading: string; intro: string; sections: Array<{ title: string; text: string }>; links: Array<{ href: string; label: string }> };
type FAQ = { question: string; answer: string };

const REPAIR_FAQS: Record<"ro" | "ru", FAQ[]> = {
  ro: [
    { question: "Reparați camere care nu mai afișează imagine?", answer: "Da. Diagnosticarea verifică alimentarea, cablul, conectorii, rețeaua și camera. Spune-ne dacă problema afectează o singură cameră sau întregul sistem." },
    { question: "Ce fac dacă DVR-ul sau NVR-ul nu mai înregistrează?", answer: "Nu formata HDD-ul dacă ai nevoie de înregistrările existente. Notează mesajul de eroare și modelul înregistratorului, apoi solicită o diagnosticare." },
    { question: "Puteți restabili accesul camerelor de pe telefon?", answer: "Putem verifica aplicația, conectivitatea și configurarea sistemului. Menționează dacă ai schimbat recent routerul, parola WiFi sau telefonul." },
    { question: "Cât costă reparația unei camere de supraveghere?", answer: "Costul depinde de cauza defecțiunii, accesul la echipamente și piesele necesare. Primești diagnosticul și devizul înainte să confirmi reparația." },
  ],
  ru: [
    { question: "Вы ремонтируете камеры, на которых пропало изображение?", answer: "Да. При диагностике проверяются питание, кабель, разъёмы, сеть и сама камера. Сообщите, не работает одна камера или вся система." },
    { question: "Что делать, если DVR или NVR перестал записывать?", answer: "Не форматируйте HDD, если нужны существующие записи. Запишите сообщение об ошибке и модель регистратора, затем запросите диагностику." },
    { question: "Можно восстановить просмотр камер с телефона?", answer: "Мы можем проверить приложение, подключение и настройки системы. Сообщите, менялись ли недавно роутер, пароль WiFi или телефон." },
    { question: "Сколько стоит ремонт камеры видеонаблюдения?", answer: "Стоимость зависит от причины неисправности, доступа к оборудованию и необходимых деталей. Диагноз и смета согласовываются до ремонта." },
  ],
};
const PAGES: Record<string, { ro: Copy; ru: Copy }> = {
  "/camere-supraveghere-moldova": {
    ro: {
      title: "Camere de supraveghere în Moldova: produse și montaj | TECO.md",
      description: "Compară camere WiFi, PoE, 4G și seturi de supraveghere în Moldova. Prețuri în MDL, alegerea echipamentelor și ofertă de montaj pentru casă sau afacere.",
      heading: "Camere de supraveghere în Moldova",
      intro: "Alege sistemul după spațiul pe care vrei să îl protejezi, conexiunea disponibilă și modul de înregistrare. La TECO.md poți compara echipamentele din catalog și cere o ofertă cu produsele, cablarea, consumabilele și montajul detaliate separat.",
      sections: [
        { title: "WiFi, PoE sau 4G?", text: "Camerele WiFi folosesc rețeaua wireless și, în funcție de model, au nevoie de alimentare separată. PoE transmite datele și alimentarea prin cablul de rețea, cu echipament compatibil. Pentru o locație fără internet fix, verifică modelele 4G, acoperirea mobilă și autonomia specificată pentru fiecare produs." },
        { title: "Înregistrare și acces de pe telefon", text: "Verifică dacă modelul ales înregistrează pe card, NVR sau într-un serviciu cloud. Perioada păstrată depinde de capacitatea stocării, rezoluție, compresie și programul de înregistrare. Pentru un sistem cu mai multe camere, compatibilitatea dintre camere, NVR și alimentare se verifică înainte de cumpărare." },
        { title: "Ce intră în oferta de instalare", text: "Trimite localitatea, tipul obiectului, numărul aproximativ de camere și câteva fotografii ale zonelor importante. Devizul poate include camerele, stocarea, cablul, conectorii, sursele de alimentare, manopera și configurarea aplicației. Confirmăm condițiile și disponibilitatea montajului pentru adresa ta." },
      ],
      links: [{ href: "/produse?cat=wifi", label: "Camere WiFi" }, { href: "/produse?cat=poe", label: "Camere PoE" }, { href: "/produse?cat=4g", label: "Camere 4G" }, { href: "/seturi-camere-supraveghere", label: "Seturi complete" }, { href: "/montare-camere-supraveghere", label: "Preț instalare camere" }],
    },
    ru: {
      title: "Камеры видеонаблюдения в Молдове: каталог и монтаж | TECO.md",
      description: "WiFi, PoE, 4G камеры и комплекты видеонаблюдения в Молдове. Цены в MDL. Подбор оборудования и предложение по монтажу для дома и бизнеса.",
      heading: "Камеры видеонаблюдения в Молдове",
      intro: "Выбирайте систему с учётом объекта, подключения и способа записи. В каталоге TECO.md можно сравнить оборудование и запросить предложение с отдельным расчётом камер, кабеля, расходных материалов и монтажа.",
      sections: [
        { title: "WiFi, PoE или 4G?", text: "WiFi камеры подключаются к беспроводной сети и, в зависимости от модели, требуют отдельного питания. PoE передаёт данные и питание по сетевому кабелю при совместимом оборудовании. Для объектов без проводного интернета проверьте 4G модели, покрытие оператора и автономность конкретной камеры." },
        { title: "Запись и просмотр с телефона", text: "Уточните, поддерживает ли камера запись на карту, NVR или облачный сервис. Срок хранения зависит от объёма накопителя, разрешения, сжатия и режима записи. Совместимость камер, регистратора и питания нужно проверить перед покупкой." },
        { title: "Расчёт монтажа", text: "Укажите населённый пункт, тип объекта, примерное количество камер и приложите фотографии важных зон. В расчёт могут входить камеры, накопитель, кабель, разъёмы, питание, монтаж и настройка приложения. Условия и время выезда подтверждаются для вашего адреса." },
      ],
      links: [{ href: "/produse?cat=wifi", label: "WiFi камеры" }, { href: "/produse?cat=poe", label: "PoE камеры" }, { href: "/produse?cat=4g", label: "4G камеры" }, { href: "/seturi-camere-supraveghere", label: "Готовые комплекты" }, { href: "/montare-camere-supraveghere", label: "Монтаж" }],
    },
  },
  "/reparatii-camere-supraveghere": {
    ro: {
      title: "Reparații Camere Supraveghere în Moldova | TECO.md",
      description: "Diagnosticare și reparații camere de supraveghere, DVR și NVR în Chișinău și Moldova. Probleme de imagine, înregistrare sau acces de pe telefon.",
      heading: "Reparații camere de supraveghere, DVR și NVR",
      intro: "Camera nu mai are imagine, înregistrarea s-a oprit sau aplicația nu se conectează? Începem cu diagnosticarea sistemului, ca să stabilim dacă problema ține de alimentare, cablare, rețea, stocare sau echipament.",
      sections: [
        { title: "Cameră fără imagine sau offline", text: "Pentru evaluare sunt utile modelul camerei, tipul alimentării, mesajul de eroare și informația dacă problema afectează una sau toate camerele. O fotografie a conexiunilor și a etichetei echipamentului ajută la identificarea configurației. Nu trimite parolele de acces în formular." },
        { title: "DVR sau NVR care nu înregistrează", text: "Verificarea urmărește recunoașterea HDD-ului, programul de înregistrare, data și ora, erorile de stocare și conexiunile camerelor. Nu formata discul dacă ai nevoie de înregistrările existente. Costul și posibilitatea intervenției se stabilesc după evaluare." },
        { title: "Acces de pe telefon și mentenanță", text: "Putem evalua configurarea aplicației și conectivitatea sistemului. Spune-ne dacă vizualizarea funcționează în rețeaua locală, dacă ai schimbat routerul și când a apărut problema. Pentru o vizită, indică localitatea și accesul la echipamente; confirmăm programarea și devizul înainte de lucrare." },
      ],
      links: [{ href: "/servicii", label: "Toate serviciile" }, { href: "/montare-camere-supraveghere", label: "Instalarea unui sistem nou" }, { href: "/produse?cat=nvr", label: "Înregistratoare NVR" }, { href: "/contact", label: "Contact TECO.md" }],
    },
    ru: {
      title: "Ремонт камер видеонаблюдения, DVR и NVR | TECO.md",
      description: "Диагностика камер без изображения, DVR/NVR без записи и проблем доступа с телефона. Запросите оценку системы видеонаблюдения в TECO.md.",
      heading: "Ремонт камер видеонаблюдения, DVR и NVR",
      intro: "Пропало изображение, остановилась запись или приложение не подключается? Диагностика помогает определить, связана ли проблема с питанием, кабелем, сетью, накопителем или самим устройством.",
      sections: [
        { title: "Камера не показывает или находится offline", text: "Для оценки укажите модель, тип питания, сообщение об ошибке и количество неработающих камер. Фотографии подключений и этикетки устройства помогут определить конфигурацию. Не отправляйте пароли доступа через форму." },
        { title: "DVR или NVR перестал записывать", text: "Проверяются определение HDD, расписание записи, дата и время, ошибки накопителя и подключения камер. Не форматируйте диск, если нужны существующие записи. Возможность и стоимость ремонта определяются после оценки." },
        { title: "Доступ с телефона и обслуживание", text: "Сообщите, работает ли просмотр в локальной сети, менялся ли роутер и когда возникла проблема. Для выезда укажите населённый пункт и доступ к оборудованию. Время посещения и смета согласовываются перед работой." },
      ],
      links: [{ href: "/servicii", label: "Все услуги" }, { href: "/montare-camere-supraveghere", label: "Монтаж новой системы" }, { href: "/produse?cat=nvr", label: "NVR регистраторы" }, { href: "/contact", label: "Контакты TECO.md" }],
    },
  },
  "/contact": {
    ro: {
      title: "Contact TECO.md — produse, montaj și reparații în Moldova",
      description: "Contactează TECO.md pentru echipamente de supraveghere, montaj sau reparații. Trimite detaliile obiectului și solicită o ofertă în MDL.",
      heading: "Hai să alegem sistemul potrivit",
      intro: "Sună-ne sau completează cererea de ofertă pentru produse, instalare ori diagnosticarea unui sistem existent. Pentru o recomandare utilă, spune-ne ce vrei să supraveghezi și în ce localitate se află obiectul.",
      sections: [
        { title: "Pentru o ofertă de montaj", text: "Indică tipul obiectului, localitatea, numărul aproximativ de camere, dacă există internet și alimentare, precum și perioada de înregistrare dorită. O schiță sau câteva fotografii ne ajută să discutăm traseele de cablu și punctele de montaj." },
        { title: "Pentru produse sau reparații", text: "La o întrebare despre un produs, include denumirea sau linkul din catalog. Pentru o defecțiune, notează modelul, simptomele și momentul apariției. Confirmăm disponibilitatea echipamentelor și condițiile intervenției înainte de comandă sau programare." },
      ],
      links: [{ href: "/produse", label: "Catalog produse" }, { href: "/servicii", label: "Servicii" }, { href: "/reparatii-camere-supraveghere", label: "Diagnosticare și reparații" }],
    },
    ru: {
      title: "Контакты TECO.md — оборудование, монтаж и ремонт в Молдове",
      description: "Свяжитесь с TECO.md по вопросам видеонаблюдения, монтажа и ремонта. Опишите объект и запросите предложение в MDL.",
      heading: "Подберём систему для вашего объекта",
      intro: "Позвоните или отправьте заявку на оборудование, монтаж либо диагностику существующей системы. Укажите, что нужно контролировать и в каком населённом пункте находится объект.",
      sections: [
        { title: "Для расчёта монтажа", text: "Укажите тип объекта, населённый пункт, примерное количество камер, наличие интернета и питания, желаемый срок хранения записей. Схема или фотографии помогут обсудить кабельные трассы и места установки." },
        { title: "Для подбора оборудования или ремонта", text: "Приложите название или ссылку на товар. При неисправности укажите модель, симптомы и время появления проблемы. Наличие оборудования и условия выезда подтверждаются до заказа или назначения работ." },
      ],
      links: [{ href: "/produse", label: "Каталог" }, { href: "/servicii", label: "Услуги" }, { href: "/reparatii-camere-supraveghere", label: "Диагностика и ремонт" }],
    },
  },
};

export default function SearchLanding() {
  const [location] = useLocation();
  const path = location.replace(/\/$/, "");
  const { lang } = useLang();
  const copy = PAGES[path]?.[lang] ?? PAGES["/contact"][lang];
  const phone = useStore(s => s.settings.general?.adminPhone || "37367200463").replace(/\D/g, "");
  const isRepair = path === "/reparatii-camere-supraveghere";
  const repairFaqs = REPAIR_FAQS[lang];
  const jsonLd: Record<string, unknown>[] = [
    schemas.breadcrumb([{ name: "TECO.md", url: canonicalUrl("/") }, { name: copy.heading, url: canonicalUrl(path) }]),
    { "@context": "https://schema.org", "@type": path === "/contact" ? "ContactPage" : "WebPage", name: copy.heading, url: canonicalUrl(path), description: copy.description },
  ];
  if (isRepair) {
    jsonLd.push(
      {
        "@context": "https://schema.org",
        "@type": "Service",
        name: copy.heading,
        description: copy.description,
        url: canonicalUrl(path),
        serviceType: "Security Camera Repair and Maintenance",
        provider: { "@type": "Organization", "@id": "https://teco.md/#business", name: "TECO.md", telephone: `+${phone}` },
        areaServed: { "@type": "Country", name: "Moldova" },
      },
      schemas.faq(repairFaqs),
    );
  }
  return <>
    <SEO title={copy.title} description={copy.description} canonical={path} lang={lang} jsonLd={jsonLd} />
    <main className="flex-1 bg-[#FAFAFA] pb-20 md:pb-0">
      <section className="bg-zinc-950 text-white py-14 md:py-20">
        <div className="max-w-5xl mx-auto px-5 md:px-8">
          <nav aria-label="Breadcrumb" className="text-sm text-zinc-400 mb-8"><Link href="/">TECO.md</Link> / {lang === "ro" ? "Sisteme de supraveghere" : "Видеонаблюдение"}</nav>
          <h1 className="text-3xl md:text-5xl font-black leading-tight max-w-3xl">{copy.heading}</h1>
          <p className="mt-6 text-zinc-300 text-lg leading-relaxed max-w-3xl">{copy.intro}</p>
          <div className="flex flex-wrap gap-3 mt-8">
            <Link href="/oferta" className="inline-flex items-center gap-2 rounded-xl bg-[#FF4F00] px-6 py-3 font-bold">{isRepair ? (lang === "ro" ? "Solicită diagnosticare" : "Запросить диагностику") : (lang === "ro" ? "Solicită o ofertă" : "Запросить предложение")}<ArrowRight size={18} /></Link>
            <a href={`tel:+${phone}`} className="inline-flex items-center gap-2 rounded-xl border border-zinc-600 px-6 py-3 font-bold"><Phone size={18} />+{phone}</a>
            {isRepair && <a href={`https://wa.me/${phone}?text=${encodeURIComponent(lang === "ro" ? "Bună ziua! Am nevoie de diagnosticarea unui sistem de supraveghere." : "Здравствуйте! Нужна диагностика системы видеонаблюдения.")}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-zinc-600 px-6 py-3 font-bold"><MessageCircle size={18} />WhatsApp</a>}
          </div>
        </div>
      </section>
      <div className="max-w-5xl mx-auto px-5 md:px-8 py-12 md:py-16 space-y-6">
        {isRepair && <>
          <section className="grid gap-4 md:grid-cols-3" aria-label={lang === "ro" ? "Probleme frecvente" : "Частые проблемы"}>
            {[
              { icon: CheckCircle2, ro: "Cameră fără imagine", ru: "Нет изображения", roText: "Verificăm alimentarea, conexiunile și camera.", ruText: "Проверяем питание, соединения и камеру." },
              { icon: HardDrive, ro: "NVR / DVR nu înregistrează", ru: "NVR / DVR не записывает", roText: "Verificăm stocarea, setările și erorile sistemului.", ruText: "Проверяем накопитель, настройки и ошибки." },
              { icon: Wifi, ro: "Nu vezi camerele pe telefon", ru: "Нет доступа с телефона", roText: "Verificăm rețeaua, aplicația și accesul remote.", ruText: "Проверяем сеть, приложение и удалённый доступ." },
            ].map(item => <article key={item.ro} className="rounded-2xl bg-white border border-zinc-200 p-6"><item.icon className="h-6 w-6 text-[#FF4F00]" /><h2 className="mt-4 font-bold text-zinc-950">{lang === "ro" ? item.ro : item.ru}</h2><p className="mt-2 text-sm leading-relaxed text-zinc-600">{lang === "ro" ? item.roText : item.ruText}</p></article>)}
          </section>
          <aside className="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-relaxed text-amber-950">
            <AlertTriangle className="h-5 w-5 flex-none" />
            <p><strong>{lang === "ro" ? "Ai nevoie de înregistrări?" : "Нужны существующие записи?"}</strong> {lang === "ro" ? "Nu formata HDD-ul și nu reseta înregistratorul înainte de diagnosticare." : "Не форматируйте HDD и не сбрасывайте регистратор до диагностики."}</p>
          </aside>
        </>}
        {copy.sections.map(section => <section key={section.title} className="rounded-2xl bg-white border border-zinc-200 p-6 md:p-8"><h2 className="text-xl md:text-2xl font-bold text-zinc-950">{section.title}</h2><p className="mt-4 text-zinc-600 leading-relaxed">{section.text}</p></section>)}
        {isRepair && <section className="rounded-2xl bg-white border border-zinc-200 p-6 md:p-8"><h2 className="text-xl md:text-2xl font-bold text-zinc-950">{lang === "ro" ? "Întrebări despre reparații" : "Вопросы о ремонте"}</h2><div className="mt-6 divide-y divide-zinc-200">{repairFaqs.map(item => <details key={item.question} className="group py-4"><summary className="cursor-pointer list-none font-semibold text-zinc-950">{item.question}<span className="float-right text-[#FF4F00] group-open:rotate-45">+</span></summary><p className="mt-3 pr-8 text-sm leading-relaxed text-zinc-600">{item.answer}</p></details>)}</div></section>}
        <nav aria-label={lang === "ro" ? "Produse și servicii relevante" : "Оборудование и услуги"} className="flex flex-wrap gap-3 pt-5">
          {copy.links.map(link => <Link key={link.href} href={link.href} className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold hover:border-[#FF4F00]">{link.label}</Link>)}
        </nav>
      </div>
    </main>
  </>;
}
