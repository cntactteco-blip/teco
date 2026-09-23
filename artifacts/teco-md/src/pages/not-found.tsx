import { useState } from "react";
import { Link, useLocation } from "wouter";
import { ArrowRight, Camera, MessageCircle, PackageSearch, Phone, Search, Wrench } from "lucide-react";
import { SEO } from "@/components/SEO";
import { useLang } from "@/contexts/LangContext";
import { useStore } from "@/lib/store";

export default function NotFound() {
  const { lang } = useLang();
  const ro = lang === "ro";
  const [, navigate] = useLocation();
  const [query, setQuery] = useState("");
  const phone = useStore((state) => state.settings.general?.adminPhone || "37367200463").replace(/\D/g, "");

  const submitSearch = (event: React.FormEvent) => {
    event.preventDefault();
    const value = query.trim();
    navigate(value ? `/produse?q=${encodeURIComponent(value)}` : "/produse");
  };

  const routes = [
    {
      href: "/seturi-camere-supraveghere",
      icon: Camera,
      title: ro ? "Seturi complete" : "Готовые комплекты",
      text: ro ? "Camere, NVR și accesorii într-un singur sistem." : "Камеры, NVR и аксессуары в одной системе.",
    },
    {
      href: "/montare-camere-supraveghere",
      icon: Wrench,
      title: ro ? "Preț instalare" : "Стоимость монтажа",
      text: ro ? "Calculează costul și cere un deviz pentru obiectul tău." : "Рассчитайте стоимость и запросите смету.",
    },
    {
      href: "/reparatii-camere-supraveghere",
      icon: PackageSearch,
      title: ro ? "Diagnosticare și reparații" : "Диагностика и ремонт",
      text: ro ? "Cameră fără imagine, NVR sau acces de pe telefon." : "Нет изображения, записи или доступа с телефона.",
    },
  ];

  return (
    <>
      <SEO
        title={ro ? "Găsește produse și servicii — TECO.md" : "Товары и услуги — TECO.md"}
        description={ro ? "Găsește camere, seturi, instalare și reparații pe TECO.md." : "Найдите камеры, комплекты, монтаж и ремонт на TECO.md."}
        noIndex
        lang={lang}
      />

      <main className="flex-1 bg-[#FAFAFA] pb-20 md:pb-0">
        <section className="bg-zinc-950 px-5 py-14 text-white md:py-20">
          <div className="mx-auto max-w-4xl text-center">
            <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-[#FF4F00]">
              404 — {ro ? "adresă indisponibilă" : "страница недоступна"}
            </span>
            <h1 className="mt-5 text-3xl font-black leading-tight md:text-5xl">
              {ro ? "Nu ai găsit pagina," : "Страница не найдена,"}
              <span className="block text-[#FF4F00]">{ro ? "dar găsim soluția potrivită." : "но мы найдём решение."}</span>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-zinc-300 md:text-lg">
              {ro
                ? "Caută produsul dorit sau alege direct instalarea, reparația ori un sistem complet. Nu trebuie să pleci de pe site."
                : "Найдите нужный товар или сразу выберите монтаж, ремонт либо готовый комплект."}
            </p>

            <form onSubmit={submitSearch} className="mx-auto mt-8 flex max-w-2xl flex-col gap-3 rounded-2xl bg-white p-2 shadow-xl sm:flex-row">
              <label className="sr-only" htmlFor="recovery-search">{ro ? "Caută produse" : "Поиск товаров"}</label>
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400" />
                <input
                  id="recovery-search"
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={ro ? "Caută cameră, NVR, set, Ajax..." : "Камера, NVR, комплект, Ajax..."}
                  className="h-12 w-full rounded-xl bg-zinc-50 pl-12 pr-4 text-sm text-zinc-950 outline-none ring-[#FF4F00] focus:ring-2"
                />
              </div>
              <button type="submit" className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#FF4F00] px-6 font-bold text-white transition-opacity hover:opacity-90">
                {ro ? "Caută" : "Найти"}<ArrowRight className="h-4 w-4" />
              </button>
            </form>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-5 py-10 md:px-8 md:py-14">
          <h2 className="text-center text-2xl font-black text-zinc-950 md:text-3xl">
            {ro ? "Alege ce ai nevoie acum" : "Выберите, что вам нужно"}
          </h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {routes.map((route) => (
              <Link key={route.href} href={route.href} className="group rounded-2xl border border-zinc-200 bg-white p-6 transition-all hover:-translate-y-1 hover:border-[#FF4F00] hover:shadow-lg">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-[#FF4F00]">
                  <route.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-bold text-zinc-950">{route.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-600">{route.text}</p>
                <span className="mt-5 inline-flex items-center gap-1 text-sm font-bold text-[#FF4F00]">
                  {ro ? "Deschide" : "Открыть"}<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            ))}
          </div>

          <div className="mt-8 rounded-3xl bg-[#FF4F00] p-6 text-white md:flex md:items-center md:justify-between md:p-8">
            <div>
              <h2 className="text-xl font-black md:text-2xl">{ro ? "Nu știi ce sistem să alegi?" : "Не знаете, какую систему выбрать?"}</h2>
              <p className="mt-2 text-sm text-orange-100">{ro ? "Spune-ne ce vrei să protejezi și îți pregătim o ofertă." : "Расскажите, что нужно защитить, и мы подготовим предложение."}</p>
            </div>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row md:mt-0">
              <a href={`tel:+${phone}`} className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 font-black text-[#FF4F00]">
                <Phone className="h-4 w-4" />+{phone}
              </a>
              <a
                href={`https://wa.me/${phone}?text=${encodeURIComponent(ro ? "Bună ziua! Am nevoie de ajutor pentru alegerea unui sistem de supraveghere." : "Здравствуйте! Нужна помощь с выбором системы видеонаблюдения.")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/40 bg-white/15 px-5 py-3 font-bold text-white"
              >
                <MessageCircle className="h-4 w-4" />WhatsApp
              </a>
            </div>
          </div>

          <div className="mt-8 text-center">
            <Link href="/" className="text-sm font-semibold text-zinc-500 hover:text-zinc-950">
              {ro ? "Înapoi la pagina principală" : "Вернуться на главную"}
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
