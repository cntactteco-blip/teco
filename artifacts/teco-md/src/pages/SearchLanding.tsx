import { Link, useLocation } from "wouter";
import { AlertTriangle, ArrowRight, CheckCircle2, HardDrive, MessageCircle, Phone, Wifi } from "lucide-react";
import { SEO, schemas } from "@/components/SEO";
import { useLang } from "@/contexts/LangContext";
import { useStore } from "@/lib/store";
import { canonicalUrl } from "@/lib/seo-url";
import RemotePropertyHelp from "@/components/RemotePropertyHelp";

type Copy = { title: string; description: string; heading: string; intro: string; sections: Array<{ title: string; text: string }>; links: Array<{ href: string; label: string }> };
type FAQ = { question: string; answer: string };

const CAMERA_FAQS: Record<"ro" | "ru", FAQ[]> = {
  ro: [
    { question: "Ce camere de supraveghere aleg pentru o casă în Moldova?", answer: "Începe cu intrările, poarta și curtea, apoi verifică alimentarea, internetul și traseele cablurilor. WiFi poate fi potrivit cu semnal și alimentare la cameră; PoE se evaluează pentru un sistem cablat cu NVR; 4G pentru o locație cu acoperire mobilă, fără internet fix. Alegerea se confirmă pentru obiect și modelele propuse." },
    { question: "Pot vedea casa din Moldova pe telefon dacă sunt în Germania, Italia sau altă țară?", answer: "Accesul se verifică pentru aplicația și echipamentele alese. Sistemul din Moldova trebuie să fie alimentat și conectat la internet. La predare, cere un test de vizualizare cu telefonul pe date mobile, în afara rețelei locale. Conexiunea, serviciile aplicației și eventualele abonamente depind de model." },
    { question: "Cât costă camerele de supraveghere cu montaj?", answer: "Prețul total depinde de modele, numărul camerelor, stocare, lungimea cablurilor, manoperă și deplasare. Compară prețurile actuale din catalog și cere un deviz separat pentru echipamente și instalare. Prețul unei camere sau al manoperei nu reprezintă costul întregului sistem." },
    { question: "Ce verific pentru camerele de exterior?", answer: "Verifică protecția la intemperii și temperatura de lucru din fișa modelului, cadrul necesar, iluminarea de noapte și protejarea conexiunilor. Un model pentru interior nu se alege pentru exterior doar pentru că are aceeași rezoluție." },
    { question: "Pot organiza montajul fără să vin în Moldova?", answer: "Discuția și evaluarea inițială pot începe prin WhatsApp. Trimite localitatea și fotografii și indică persoana care poate oferi acces la obiect. Programarea, devizul și condițiile lucrării se confirmă după evaluare; prezența unui reprezentant la obiect se stabilește înainte de deplasare." },
  ],
  ru: [
    { question: "Как выбрать камеры для дома в Молдове?", answer: "Определите входы, ворота и двор, затем проверьте питание, интернет и кабельные трассы. WiFi требует подходящего сигнала и питания, PoE рассматривается для проводной системы с NVR, 4G — при наличии мобильного покрытия без проводного интернета. Решение согласуется для объекта и конкретных моделей." },
    { question: "Можно смотреть дом в Молдове с телефона из Германии, Италии или другой страны?", answer: "Доступ проверяется для выбранного приложения и оборудования. Система в Молдове должна иметь питание и интернет. При сдаче запросите проверку просмотра с телефона через мобильные данные вне локальной сети. Подключение, функции приложения и подписки зависят от модели." },
    { question: "Сколько стоят камеры вместе с монтажом?", answer: "Итог зависит от моделей, количества камер, накопителя, длины кабеля, работы и выезда. Сравните актуальные цены каталога и запросите отдельный расчёт оборудования и монтажа. Цена одной камеры или работы не равна стоимости всей системы." },
    { question: "Что проверить у уличной камеры?", answer: "Проверьте защиту от погоды и рабочую температуру в документации модели, нужный кадр, ночное освещение и защиту соединений. Внутренняя камера не подходит для улицы только потому, что имеет такое же разрешение." },
    { question: "Можно организовать монтаж без приезда в Молдову?", answer: "Обсуждение и первоначальная оценка могут начаться в WhatsApp. Укажите населённый пункт, пришлите фотографии и сообщите, кто предоставит доступ на месте. Время, смета и условия работ согласуются после оценки, доступ на объект — до выезда." },
  ],
};

const DIASPORA_FAQS: Record<"ro" | "ru", FAQ[]> = {
  ro: [
    { question: "Pot organiza instalarea camerelor în Moldova dacă locuiesc în străinătate?", answer: "Da. Evaluarea inițială poate începe de la distanță cu localitatea, fotografii sau video și date despre internet și alimentare. Accesul la proprietate și programarea se coordonează cu persoana indicată de proprietar în Moldova." },
    { question: "Voi putea vedea camerele din Italia, Germania, Franța sau UK?", answer: "Pentru echipamentele compatibile cu acces remote, configurarea poate include verificarea vizualizării din aplicația producătorului. Sistemul de la proprietate trebuie să aibă alimentare și conexiunea la internet necesară modelului ales." },
    { question: "Puteți repara sistemul dacă proprietarul nu este în Moldova?", answer: "Da, dacă o persoană autorizată de proprietar poate oferi acces la echipamente. Înainte de deplasare sunt utile modelul DVR/NVR sau al camerelor, simptomele și fotografii ale instalației." },
    { question: "Cât costă montajul camerelor pentru o proprietate din Moldova?", answer: "Montajul standard pornește de la 900 MDL pentru o cameră. Devizul final depinde de cablare, înălțime, acces, consumabile, echipamente și localitatea proprietății și se confirmă înainte de lucrare." },
  ],
  ru: [
    { question: "Можно организовать установку камер в Молдове, находясь за границей?", answer: "Да. Первичную оценку можно начать дистанционно: укажите населённый пункт, пришлите фото или видео и данные об интернете и питании. Доступ и время работ согласуются с указанным владельцем человеком в Молдове." },
    { question: "Смогу ли я смотреть камеры из Италии, Германии, Франции или Великобритании?", answer: "Для оборудования с удалённым доступом настройка может включать проверку просмотра через приложение производителя. На объекте должны быть питание и интернет, необходимые выбранной модели." },
    { question: "Можно отремонтировать систему, если владелец не находится в Молдове?", answer: "Да, если уполномоченный владельцем человек может предоставить доступ к оборудованию. До выезда полезно прислать модель DVR/NVR или камер, описание проблемы и фотографии системы." },
    { question: "Сколько стоит монтаж камер на объекте в Молдове?", answer: "Стандартный монтаж начинается от 900 MDL за одну камеру. Итоговая смета зависит от кабеля, высоты, доступа, расходных материалов, оборудования и населённого пункта и согласуется до работ." },
  ],
};

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
      title: "Camere de Supraveghere în Moldova | TECO.md",
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
  "/camere-supraveghere-moldova-din-strainatate": {
    ro: {
      title: "Camere în Moldova din Străinătate: Montaj & Reparații | TECO.md",
      description: "Locuiești în Italia, Germania, Franța, UK sau altă țară și ai o proprietate în Moldova? Organizează montajul sau reparația camerelor de la distanță cu TECO.md.",
      heading: "Montaj și reparații camere în Moldova când locuiești peste hotare",
      intro: "Ai casă, apartament, vilă sau afacere în Moldova, dar locuiești în străinătate? TECO.md poate evalua proiectul de la distanță, coordona accesul cu persoana indicată de tine și instala, configura sau diagnostica sistemul la proprietatea din Moldova.",
      sections: [
        { title: "Organizezi lucrarea din Italia, Germania, Franța, UK sau altă țară", text: "Trimite pe WhatsApp localitatea din Moldova, fotografii sau video ale proprietății și spune cine poate oferi acces la obiect. Discutăm configurația, echipamentele și devizul înainte de programare. Nu trebuie să vii în Moldova doar pentru evaluarea inițială." },
        { title: "Instalare nouă cu acces de pe telefon din străinătate", text: "Pentru un sistem nou evaluăm zonele de supravegheat, alimentarea, internetul, cablarea, NVR-ul și stocarea. La configurare putem verifica vizualizarea de pe telefon prin internet, astfel încât să poți controla sistemul de la distanță, în limitele funcțiilor oferite de echipamente și conexiune." },
        { title: "Reparații pentru sistemul rămas acasă în Moldova", text: "Dacă sistemul existent nu mai înregistrează, una dintre camere este offline sau accesul din aplicație nu mai funcționează, trimite modelul echipamentului, simptomele și fotografii. Diagnosticarea la obiect se coordonează cu persoana care are acces la proprietate." },
        { title: "Deviz clar înainte de lucrare", text: "Oferta poate separa echipamentele, materialele, manopera și deplasarea. Montajul standard pornește de la 900 MDL/cameră, iar costul final depinde de cablare, înălțime, acces, materiale și localitate. Condițiile se confirmă înainte de intervenție." },
      ],
      links: [{ href: "/montare-camere-supraveghere", label: "Preț montaj camere" }, { href: "/reparatii-camere-supraveghere", label: "Reparații și diagnosticare" }, { href: "/camere-supraveghere-moldova", label: "Camere în Moldova" }, { href: "/sisteme-supraveghere-casa", label: "Sisteme pentru casă" }, { href: "/oferta", label: "Cere deviz" }],
    },
    ru: {
      title: "Камеры в Молдове из-за границы: монтаж и ремонт | TECO.md",
      description: "Живёте за границей, а дом или бизнес находится в Молдове? Организуйте установку, настройку или ремонт видеонаблюдения дистанционно с TECO.md.",
      heading: "Монтаж и ремонт камер в Молдове, когда вы живёте за границей",
      intro: "Если ваш дом, квартира, дача или бизнес находится в Молдове, а вы живёте в другой стране, TECO.md может начать оценку дистанционно и согласовать доступ к объекту с указанным вами человеком.",
      sections: [
        { title: "Организация из Италии, Германии, Франции, Великобритании и других стран", text: "Отправьте в WhatsApp населённый пункт в Молдове, фотографии или видео объекта и сообщите, кто предоставит доступ. Конфигурация, оборудование и смета обсуждаются до назначения работ." },
        { title: "Новая система и просмотр с телефона", text: "Для новой системы оцениваются зоны наблюдения, питание, интернет, кабельные трассы, NVR и хранение. При настройке можно проверить удалённый просмотр с телефона с учётом возможностей оборудования и интернет-соединения." },
        { title: "Ремонт существующей системы в Молдове", text: "Если пропала запись, камера offline или приложение больше не подключается, отправьте модель оборудования, описание проблемы и фотографии. Выезд согласуется с человеком, который имеет доступ к объекту." },
        { title: "Смета до начала работ", text: "В предложении можно отдельно указать оборудование, материалы, работу и выезд. Стандартный монтаж начинается от 900 MDL за камеру; итог зависит от кабеля, высоты, доступа, материалов и населённого пункта." },
      ],
      links: [{ href: "/montare-camere-supraveghere", label: "Цена монтажа" }, { href: "/reparatii-camere-supraveghere", label: "Ремонт и диагностика" }, { href: "/camere-supraveghere-moldova", label: "Камеры в Молдове" }, { href: "/sisteme-supraveghere-casa", label: "Системы для дома" }, { href: "/oferta", label: "Запросить смету" }],
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
  const isDiaspora = path === "/camere-supraveghere-moldova-din-strainatate";
  const isCamera = path === "/camere-supraveghere-moldova";
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
        provider: { "@type": "Organization", "@id": "https://teco.md/#business", name: "TECO.md", url: "https://teco.md/", logo: "https://teco.md/logo.png", telephone: `+${phone}` },
        areaServed: { "@type": "Country", name: "Moldova" },
      },
      schemas.faq(repairFaqs),
    );
  }
  if (isCamera) jsonLd.push(schemas.faq(CAMERA_FAQS[lang]));
  if (isDiaspora) {
    jsonLd.push(
      {
        "@context": "https://schema.org",
        "@type": "Service",
        name: copy.heading,
        description: copy.description,
        url: canonicalUrl(path),
        serviceType: "Security Camera Installation and Repair",
        provider: { "@type": "Organization", "@id": "https://teco.md/#business", name: "TECO.md", url: "https://teco.md/", logo: "https://teco.md/logo.png" },
        areaServed: { "@type": "Country", name: "Moldova" },
      },
      schemas.faq(DIASPORA_FAQS[lang]),
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
            <Link href={isRepair ? "/oferta?serviciu=reparatii" : "/oferta"} className="inline-flex items-center gap-2 rounded-xl bg-[#FF4F00] px-6 py-3 font-bold">{isRepair ? (lang === "ro" ? "Solicită diagnosticare" : "Запросить диагностику") : (lang === "ro" ? "Solicită o ofertă" : "Запросить предложение")}<ArrowRight size={18} /></Link>
            <a href={`tel:+${phone}`} className="inline-flex items-center gap-2 rounded-xl border border-zinc-600 px-6 py-3 font-bold"><Phone size={18} />+{phone}</a>
            {isRepair && <a href={`https://wa.me/${phone}?text=${encodeURIComponent(lang === "ro" ? "Bună ziua! Am nevoie de diagnosticarea unui sistem de supraveghere." : "Здравствуйте! Нужна диагностика системы видеонаблюдения.")}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-zinc-600 px-6 py-3 font-bold"><MessageCircle size={18} />WhatsApp</a>}
          </div>
        </div>
      </section>
      <div className="max-w-5xl mx-auto px-5 md:px-8 py-12 md:py-16 space-y-6">
        {isCamera && <section className="rounded-2xl bg-white border border-zinc-200 p-6 md:p-8">
          <h2 className="text-xl md:text-2xl font-bold text-zinc-950">{lang === "ro" ? "Compară sistemul pentru casa ta" : "Сравните системы для вашего дома"}</h2>
          <div className="mt-5 overflow-x-auto"><table className="w-full min-w-[480px] text-sm text-left">
            <thead><tr className="border-b border-zinc-200 text-zinc-950"><th scope="col" className="p-3">{lang === "ro" ? "Sistem" : "Система"}</th><th scope="col" className="p-3">{lang === "ro" ? "Când îl evaluezi" : "Когда рассмотреть"}</th><th scope="col" className="p-3">{lang === "ro" ? "Ce verifici înainte" : "Что проверить"}</th></tr></thead>
            <tbody className="text-zinc-600">{[
              ["WiFi", "Alimentare și semnal la locul camerei", "Semnal, stocare și aplicația modelului", "Питание и сигнал в месте камеры", "Сигнал, запись и приложение модели"],
              ["PoE + NVR", "Mai multe camere și trasee de cablu", "Compatibilitate PoE, NVR și capacitate HDD", "Несколько камер и кабельные трассы", "Совместимость PoE, NVR и объём HDD"],
              ["4G", "Locație fără internet fix", "Acoperire SIM, trafic de date și alimentare", "Объект без проводного интернета", "Покрытие SIM, трафик и питание"],
            ].map(row => <tr key={row[0]} className="border-b border-zinc-100"><th scope="row" className="p-3 font-semibold text-zinc-950">{row[0]}</th><td className="p-3">{row[lang === "ro" ? 1 : 3]}</td><td className="p-3">{row[lang === "ro" ? 2 : 4]}</td></tr>)}</tbody>
          </table></div>
          <p className="mt-5 text-zinc-600 leading-relaxed">{lang === "ro" ? "Pentru o proprietate în Moldova administrată din străinătate, verifică și accesul de pe telefon, înregistrarea și cine poate interveni la obiect când lipsesc curentul sau internetul." : "Для объекта в Молдове, которым вы управляете из-за границы, проверьте просмотр с телефона, запись и возможность доступа на месте при отключении питания или интернета."}</p>
          <Link href="/blog/camere-supraveghere-casa-moldova-din-strainatate/" className="inline-flex mt-4 font-semibold text-[#FF4F00] underline underline-offset-4">{lang === "ro" ? "Ghid: supravegherea casei din Moldova când locuiești peste hotare" : "Как организовать наблюдение за домом в Молдове из-за границы"}</Link>
        </section>}
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
        {path !== "/contact" && !isDiaspora && <RemotePropertyHelp repair={isRepair} />}
        {isDiaspora && <RemotePropertyHelp repair={false} />}
        {isCamera && <section className="rounded-2xl bg-white border border-zinc-200 p-6 md:p-8"><h2 className="text-xl md:text-2xl font-bold text-zinc-950">{lang === "ro" ? "Întrebări despre camere pentru Moldova" : "Вопросы о камерах для Молдовы"}</h2><div className="mt-6 divide-y divide-zinc-200">{CAMERA_FAQS[lang].map(item => <details key={item.question} className="py-4"><summary className="cursor-pointer font-semibold text-zinc-950">{item.question}</summary><p className="mt-3 text-zinc-600 leading-relaxed">{item.answer}</p></details>)}</div></section>}
        {isRepair && <section className="rounded-2xl bg-white border border-zinc-200 p-6 md:p-8"><h2 className="text-xl md:text-2xl font-bold text-zinc-950">{lang === "ro" ? "Întrebări despre reparații" : "Вопросы о ремонте"}</h2><div className="mt-6 divide-y divide-zinc-200">{repairFaqs.map(item => <details key={item.question} className="group py-4"><summary className="cursor-pointer list-none font-semibold text-zinc-950">{item.question}<span className="float-right text-[#FF4F00] group-open:rotate-45">+</span></summary><p className="mt-3 pr-8 text-sm leading-relaxed text-zinc-600">{item.answer}</p></details>)}</div></section>}
        <nav aria-label={lang === "ro" ? "Produse și servicii relevante" : "Оборудование и услуги"} className="flex flex-wrap gap-3 pt-5">
          {copy.links.map(link => <Link key={link.href} href={link.href} className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold hover:border-[#FF4F00]">{link.label}</Link>)}
        </nav>
      </div>
    </main>
  </>;
}
