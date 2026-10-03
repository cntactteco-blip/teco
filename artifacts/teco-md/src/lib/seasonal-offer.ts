interface OfferProduct { price: number; oldPrice?: number | null; inStock?: boolean; }

export function seasonalOffer(products: OfferProduct[], lang: string, now = new Date()) {
  const month = Number(new Intl.DateTimeFormat("en", { month: "numeric", timeZone: "Europe/Chisinau" }).format(now));
  const label = new Intl.DateTimeFormat(lang === "ru" ? "ru" : "ro", { month: "long", timeZone: "Europe/Chisinau" }).format(now);
  const discounts = products.filter(p => p.inStock !== false && Number.isFinite(p.price) && p.price > 0 && Number.isFinite(p.oldPrice) && (p.oldPrice ?? 0) > p.price);
  if (discounts.length) {
    const percent = Math.max(...discounts.map(p => Math.floor((p.oldPrice! - p.price) * 100 / p.oldPrice!)));
    return {
      label,
      headline: lang === "ru"
        ? (percent > 0 ? `Предложения месяца · до −${percent}%` : "Предложения месяца · Скидки на товары")
        : (percent > 0 ? `Ofertele lunii · până la −${percent}%` : "Ofertele lunii · Produse cu reducere"),
      cta: lang === "ru" ? "Смотреть предложения" : "Vezi ofertele",
      href: "/produse?oferte=1", percent,
    };
  }
  const messages = lang === "ru"
    ? ["Защитите дом зимой", "Обновите защиту дома", "Следите за домом во время отпуска", "Подготовьте защиту к долгим вечерам"]
    : ["Protejează casa în sezonul rece", "Pregătește protecția casei", "Vezi casa și când ești în vacanță", "Protejează casa în serile lungi"];
  const season = month >= 9 && month <= 11 ? 3 : month >= 6 && month <= 8 ? 2 : month >= 3 && month <= 5 ? 1 : 0;
  return { label, headline: messages[season], cta: lang === "ru" ? "Смотреть комплекты" : "Vezi seturile", href: "/seturi-camere-supraveghere", percent: null };
}
