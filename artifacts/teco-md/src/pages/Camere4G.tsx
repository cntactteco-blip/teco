import { Link } from "wouter";
import { SEO, schemas } from "@/components/SEO";
import { useLang } from "@/contexts/LangContext";
import { canonicalUrl } from "@/lib/seo-url";

export default function Camere4G() {
  const { lang } = useLang(); const ro = lang === "ro";
  const heading = ro ? "Camere de supraveghere 4G cu SIM în Moldova" : "4G камеры видеонаблюдения с SIM в Молдове";
  const description = ro ? "Camere 4G/LTE cu SIM pentru locații fără internet fix în Moldova. Compară modelele disponibile și cere ofertă pentru instalare." : "4G/LTE камеры с SIM для объектов без проводного интернета в Молдове. Сравните доступные модели и запросите монтаж.";
  return <>
    <SEO title={ro ? "Camere 4G cu SIM în Moldova | TECO.md" : "4G камеры с SIM в Молдове | TECO.md"} description={description} canonical="/camere-4g-moldova" lang={lang} jsonLd={[
      schemas.breadcrumb([{name:"TECO.md",url:canonicalUrl("/")},{name:heading,url:canonicalUrl("/camere-4g-moldova")}]),
      {"@context":"https://schema.org","@type":"CollectionPage",name:heading,url:canonicalUrl("/camere-4g-moldova"),description}
    ]} />
    <main className="flex-1 bg-[#FAFAFA]">
      <section className="bg-zinc-950 text-white py-14 md:py-20"><div className="max-w-5xl mx-auto px-5 md:px-8">
        <h1 className="text-3xl md:text-5xl font-black">{heading}</h1>
        <p className="mt-6 text-lg text-zinc-300 max-w-3xl">{ro ? "Pentru teren, fermă, șantier sau casă fără internet fix, o cameră 4G poate folosi rețeaua mobilă. Verifică semnalul, SIM-ul, alimentarea și stocarea înainte de alegere." : "Для участка, фермы, стройки или дома без проводного интернета 4G камера может использовать мобильную сеть. До выбора проверьте сигнал, SIM, питание и хранение."}</p>
        <Link href="/produse?cat=4g" className="inline-flex mt-8 rounded-xl bg-[#FF4F00] px-6 py-3 font-bold">{ro ? "Vezi camerele 4G disponibile" : "Посмотреть доступные 4G камеры"}</Link>
      </div></section>
      <section className="max-w-5xl mx-auto px-5 md:px-8 py-12 grid md:grid-cols-3 gap-5">
        {[
          [ro?"Fără internet fix":"Без проводного интернета",ro?"4G este util unde există acoperire mobilă, dar nu există router sau fibră.":"4G полезен там, где есть мобильное покрытие, но нет роутера или оптики."],
          [ro?"SIM, trafic și stocare":"SIM, трафик и запись",ro?"Verifică benzile compatibile, operatorul, tipul SIM, cardul sau cloud-ul și consumul de date al modelului.":"Проверьте диапазоны, оператора, формат SIM, карту или облако и расход трафика модели."],
          [ro?"Acumulator și solar":"Аккумулятор и солнечная панель",ro?"Unele modele 4G pot lucra cu acumulator și panou solar. Autonomia reală depinde de model, utilizare, semnal și condiții.":"Некоторые 4G модели работают от аккумулятора и солнечной панели. Автономность зависит от модели, режима, сигнала и условий."],
        ].map(([h,t])=><article key={h} className="bg-white border border-zinc-200 rounded-2xl p-6"><h2 className="font-bold text-xl">{h}</h2><p className="mt-3 text-zinc-600 leading-relaxed">{t}</p></article>)}
      </section>
      <section className="max-w-5xl mx-auto px-5 md:px-8 pb-16 flex flex-wrap gap-3">
        <Link href="/produse?cat=4g" className="font-semibold text-[#FF4F00] underline">{ro?"Catalog camere 4G":"Каталог 4G камер"}</Link>
        <Link href="/montare-camere-supraveghere/" className="font-semibold text-[#FF4F00] underline">{ro?"Montaj de la 900 MDL/cameră":"Монтаж от 900 MDL/камера"}</Link>
        <Link href="/oferta/" className="font-semibold text-[#FF4F00] underline">{ro?"Cere ofertă":"Запросить предложение"}</Link>
      </section>
    </main>
  </>;
}
