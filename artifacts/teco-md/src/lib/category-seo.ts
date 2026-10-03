/** Shared category copy keeps browser metadata and Google-facing HTML consistent. */
type Category = { id?: string; slug: string; label?: string };
export function categoryIntent(category?: Category): string {
  if (!category) return "all";
  if (["wifi", "poe", "4g", "nvr", "kituri", "alarme"].includes(category.id || category.slug)) return category.id || category.slug;
  const key = `${category.slug} ${category.label || ""}`.toLowerCase();
  if (/seturi|kituri|complete/.test(key)) return "kituri";
  if (/alarm/.test(key)) return "alarme";
  return category.slug;
}
export function categorySeo(intent: string, lang: "ro" | "ru", label = "Produse") {
  const copy: Record<string, [string, string, string, string]> = {
    wifi: ["Camere WiFi de supraveghere în Moldova | TECO.md", "Compară camere WiFi pentru casă și exterior. Verifică alimentarea, stocarea și semnalul WiFi. Cere recomandări și montaj în Moldova.", "WiFi камеры видеонаблюдения в Молдове | TECO.md", "Сравните WiFi-камеры для дома и улицы. Проверьте питание, хранение и сигнал WiFi. Подбор оборудования и монтаж в Молдове."],
    poe: ["Camere IP PoE de supraveghere în Moldova | TECO.md", "Camere IP PoE pentru sisteme cu NVR. Compară rezoluția, imaginea nocturnă și compatibilitatea. Vezi prețuri și cere montaj în Moldova.", "IP PoE камеры видеонаблюдения в Молдове | TECO.md", "IP PoE камеры для систем с NVR. Сравните разрешение, ночное изображение и совместимость. Цены и монтаж в Молдове."],
    "4g": ["Camere 4G cu SIM pentru supraveghere | TECO.md Moldova", "Camere 4G pentru locuri fără internet fix. Compară modelele cu SIM, bateria și panoul solar. Verifică acoperirea și consumul de date.", "4G камеры с SIM-картой в Молдове | TECO.md", "4G камеры для мест без проводного интернета. Сравните SIM-модели, батареи и солнечные панели. Проверьте покрытие и расход трафика."],
    nvr: ["Înregistratoare NVR pentru camere IP | TECO.md Moldova", "Compară înregistratoare NVR după canale, rezoluție, compatibilitatea camerelor și HDD. Vezi prețuri și cere configurare în Moldova.", "Видеорегистраторы NVR для IP камер | TECO.md Молдова", "Сравните NVR по каналам, разрешению, совместимости камер и HDD. Цены и помощь с настройкой в Молдове."],
    kituri: ["Seturi camere de supraveghere în Moldova | TECO.md", "Compară seturi cu camere WiFi sau PoE, NVR și accesorii. Vezi prețurile, componentele și montajul inclus în fiecare ofertă din Moldova.", "Комплекты видеонаблюдения в Молдове | TECO.md", "Сравните комплекты WiFi или PoE камер, NVR и аксессуаров. Проверьте цены, состав и условия монтажа каждого предложения."],
    alarme: ["Alarme Ajax, sonerii și vizoare video | TECO.md", "Compară alarme Ajax, sonerii și vizoare video în Moldova. Verifică senzorii, aplicația și compatibilitatea. Cere o ofertă pentru montaj.", "Системы сигнализации для дома и бизнеса | TECO.md", "Сигнализация в Молдове. Проверьте хаб, датчики и совместимость. Подбор для дома или бизнеса и монтаж."],
    all: ["Camere de supraveghere, seturi și NVR | TECO.md Moldova", "Compară camere WiFi, PoE și 4G, seturi, NVR și alarme. Vezi prețurile și specificațiile și cere consultanță sau montaj în Moldova.", "Камеры, комплекты и NVR | TECO.md Молдова", "Сравните WiFi, PoE и 4G камеры, комплекты, NVR и сигнализации. Цены, характеристики, подбор и монтаж в Молдове."],
  };
  const values = copy[intent] || [`${label} în Moldova | TECO.md`, `Compară ${label}: prețuri, specificații și disponibilitate. Cere o recomandare pentru echipamente și montaj în Moldova.`, `${label} в Молдове | TECO.md`, `Сравните ${label}: цены, характеристики и наличие. Запросите подбор оборудования и монтаж.`];
  return { title: values[lang === "ro" ? 0 : 2], desc: values[lang === "ro" ? 1 : 3], keywords: `${label}, Moldova, TECO.md` };
}

export const CATEGORY_GUIDES: Record<string, { ro: { heading: string; copy: string }; ru: { heading: string; copy: string } }> = {
  wifi: { ro: { heading: "Cum alegi o cameră WiFi?", copy: "Verifică semnalul la locul montării, alimentarea și stocarea pe card sau înregistrator. Pentru curte, alege un model potrivit pentru exterior; pentru zone fără WiFi, compară camerele 4G." }, ru: { heading: "Как выбрать WiFi-камеру?", copy: "Проверьте сигнал в месте установки, питание и хранение записей. Для улицы выбирайте защищённую модель; если нет WiFi, рассмотрите камеры 4G." } },
  poe: { ro: { heading: "Când merită un sistem PoE?", copy: "Camerele PoE folosesc cablul de rețea pentru date și alimentare. Sunt potrivite când dorești mai multe camere și înregistrare centralizată pe NVR; verifică numărul de porturi și compatibilitatea înainte de comandă." }, ru: { heading: "Когда выбрать PoE?", copy: "PoE использует сетевой кабель для данных и питания. Для нескольких камер и записи на NVR проверьте число портов и совместимость оборудования." } },
  "4g": { ro: { heading: "Supraveghere unde nu ai internet fix", copy: "Pentru terenuri, șantiere sau gospodării fără internet fix, compară acoperirea 4G, consumul de date și autonomia bateriei. Un panou solar necesită amplasare cu lumină suficientă." }, ru: { heading: "Наблюдение без проводного интернета", copy: "Для участка или стройки сравните покрытие 4G, расход мобильных данных и автономность батареи. Солнечной панели нужно достаточно света." } },
  nvr: { ro: { heading: "Alege înregistratorul după camere", copy: "Verifică numărul de canale, rezoluția acceptată, compatibilitatea camerelor și spațiul pentru HDD. Dacă nu știi câtă memorie îți trebuie, spune-ne câte camere ai și câte zile vrei să păstrezi înregistrările." }, ru: { heading: "Выберите NVR под ваши камеры", copy: "Проверьте число каналов, разрешение, совместимость и место для HDD. Сообщите нам количество камер и срок хранения записи для расчёта накопителя." } },
  kituri: { ro: { heading: "Ce verifici într-un set complet?", copy: "Compară numărul de camere, NVR-ul, HDD-ul, cablurile și accesoriile incluse. Montajul și traseul de cablu depind de obiect; solicită un deviz cu toate componentele înainte de comandă." }, ru: { heading: "Что входит в комплект?", copy: "Сравните камеры, NVR, HDD, кабели и аксессуары. Монтаж и прокладка кабеля зависят от объекта; запросите полную смету до заказа." } },
  alarme: { ro: { heading: "Cum alegi un sistem de alarmă?", copy: "Verifică centrala, senzorii incluși, comunicația și dispozitivele compatibile. Numărul de uși, ferestre și încăperi determină necesarul de senzori. Cere un deviz pentru echipamente și montaj." }, ru: { heading: "Как выбрать сигнализацию?", copy: "Проверьте хаб, датчики, связь и совместимость устройств. Количество дверей, окон и помещений определяет число датчиков. Запросите смету оборудования и монтажа." } },
};


/** A network mesh set does not become a surveillance kit merely by its category. */
export function isSurveillanceKit(name: string): boolean { return /camer|cruiser|supraveghere|видеонаблюден|камер/i.test(name); }
