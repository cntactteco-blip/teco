import { Link } from "wouter";
import { SEO, schemas } from "@/components/SEO";
import { useLang } from "@/contexts/LangContext";
import { canonicalUrl } from "@/lib/seo-url";

export default function NvrMoldova() {
  const { lang } = useLang();
  const ro = lang === "ro";
  const title = ro ? "NVR pentru Camere IP în Moldova | TECO.md" : "NVR регистраторы для IP камер в Молдове | TECO.md";
  const description = ro ? "NVR pentru camere IP în Moldova. Compară înregistratoarele disponibile și verifică numărul de canale, compatibilitatea și HDD-ul înainte de comandă." : "NVR для IP камер в Молдове. Сравните доступные регистраторы, число каналов, совместимость и HDD перед заказом.";
  const heading = ro ? "NVR pentru camere IP în Moldova" : "NVR регистраторы для IP камер в Молдове";
  const jsonLd = [
    schemas.breadcrumb([{ name: "TECO.md", url: canonicalUrl("/") }, { name: heading, url: canonicalUrl("/nvr-moldova") }]),
    { "@context": "https://schema.org", "@type": "CollectionPage", name: heading, url: canonicalUrl("/nvr-moldova"), description },
  ];
  return <>
    <SEO title={title} description={description} canonical="/nvr-moldova" lang={lang} jsonLd={jsonLd} />
    <main className="flex-1 bg-[#FAFAFA]">
      <section className="bg-zinc-950 text-white py-14 md:py-20"><div className="max-w-5xl mx-auto px-5 md:px-8">
        <h1 className="text-3xl md:text-5xl font-black">{heading}</h1>
        <p className="mt-6 text-lg text-zinc-300 max-w-3xl">{ro ? "Alege înregistratorul după numărul de camere, rezoluție, capacitatea de stocare și compatibilitate. TECO.md are NVR-uri în catalog și poate verifica configurația înainte de comandă." : "Выбирайте регистратор по числу камер, разрешению, объёму хранения и совместимости. В каталоге TECO.md есть NVR, а конфигурацию можно проверить до заказа."}</p>
        <Link href="/produse?cat=nvr" className="inline-flex mt-8 rounded-xl bg-[#FF4F00] px-6 py-3 font-bold">{ro ? "Vezi NVR-urile disponibile" : "Посмотреть доступные NVR"}</Link>
      </div></section>
      <section className="max-w-5xl mx-auto px-5 md:px-8 py-12 grid md:grid-cols-3 gap-5">
        {[
          [ro ? "Câte canale?" : "Сколько каналов?", ro ? "Lasă suficiente canale pentru camerele actuale și extinderea realistă. Verifică și rezoluția, banda de intrare și codec-urile suportate." : "Оставьте каналы для текущих камер и разумного расширения. Проверьте разрешение, входящий поток и кодеки."],
          [ro ? "Cât HDD?" : "Какой HDD?", ro ? "Perioada de păstrare depinde de numărul camerelor, bitrate, compresie, programul de înregistrare și capacitatea discului." : "Срок хранения зависит от числа камер, битрейта, сжатия, режима записи и объёма диска."],
          [ro ? "Înlocuiești un NVR?" : "Меняете NVR?", ro ? "Trimite modelul camerelor și al recorderului actual. Verificăm protocolul, PoE-ul, rezoluția și funcțiile înainte de recomandare." : "Укажите модели камер и текущего регистратора. Проверим протокол, PoE, разрешение и функции до рекомендации."],
        ].map(([h,t]) => <article key={h} className="bg-white border border-zinc-200 rounded-2xl p-6"><h2 className="font-bold text-xl">{h}</h2><p className="mt-3 text-zinc-600 leading-relaxed">{t}</p></article>)}
      </section>
      <section className="max-w-5xl mx-auto px-5 md:px-8 pb-16 flex flex-wrap gap-3">
        <Link href="/produse?cat=nvr" className="font-semibold text-[#FF4F00] underline">{ro ? "Catalog NVR" : "Каталог NVR"}</Link>
        <Link href="/reparatii-camere-supraveghere/" className="font-semibold text-[#FF4F00] underline">{ro ? "NVR nu înregistrează?" : "NVR не записывает?"}</Link>
        <Link href="/oferta/" className="font-semibold text-[#FF4F00] underline">{ro ? "Cere configurație" : "Подобрать систему"}</Link>
      </section>
    </main>
  </>;
}
