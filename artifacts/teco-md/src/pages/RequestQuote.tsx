import { useState } from "react";
import { ArrowLeft, CheckCircle2, ChevronRight, Building2, Home as HomeIcon, Warehouse, Store, Shield } from "lucide-react";
import { Link } from "wouter";
import { storeActions } from "@/lib/store";
import { useLang } from "@/contexts/LangContext";
import { SEO } from "@/components/SEO";

type PropertyType = "casa" | "apartament" | "birou" | "depozit" | "comercial";
type CameraCount = "2" | "4" | "8" | "12+";
type Step = 1 | 2 | 3 | "done";

const PROPERTY_ICONS: Record<PropertyType, React.ReactNode> = {
  casa: <HomeIcon className="w-7 h-7" />,
  apartament: <Building2 className="w-7 h-7" />,
  birou: <Shield className="w-7 h-7" />,
  depozit: <Warehouse className="w-7 h-7" />,
  comercial: <Store className="w-7 h-7" />,
};

const PROPERTY_LABELS_RO: Record<PropertyType, string> = {
  casa: "Casă / Vilă",
  apartament: "Apartament",
  birou: "Birou",
  depozit: "Depozit",
  comercial: "Spațiu comercial",
};

const PROPERTY_LABELS_RU: Record<PropertyType, string> = {
  casa: "Дом / Вилла",
  apartament: "Квартира",
  birou: "Офис",
  depozit: "Склад",
  comercial: "Торговое помещение",
};

const CAMERA_OPTIONS: CameraCount[] = ["2", "4", "8", "12+"];

export default function RequestQuote() {
  const { lang } = useLang();
  const ro = lang === "ro";

  const [step, setStep] = useState<Step>(1);
  const [property, setProperty] = useState<PropertyType | null>(null);
  const [cameras, setCameras] = useState<CameraCount | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!name.trim() || !phone.trim()) {
      setError(ro ? "Completați toate câmpurile" : "Заполните все поля");
      return;
    }
    if (phone.replace(/\D/g, "").length < 8) {
      setError(ro ? "Număr de telefon invalid" : "Неверный номер телефона");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const leadNotes = `${ro ? PROPERTY_LABELS_RO[property!] : PROPERTY_LABELS_RU[property!]}, ${cameras} ${ro ? "camere" : "камеры"}`;
      await storeActions.addLead({
        name: name.trim(),
        phone: phone.trim(),
        source: ro ? "Ofertă Mobilă" : "Мобильный запрос",
        notes: leadNotes,
      });
      import("@/lib/notify").then(({ notifyLead }) =>
        notifyLead({ name: name.trim(), phone: phone.trim(), source: "Cerere Ofertă", notes: leadNotes })
      );
      setStep("done");
    } catch {
      setError(ro ? "Eroare. Încearcă din nou." : "Ошибка. Попробуйте снова.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <SEO
        title={ro ? "Solicită Ofertă — Teco.md" : "Запросить Предложение — Teco.md"}
        description={ro ? "Primește o ofertă personalizată pentru sistemul tău de supraveghere." : "Получите персональное предложение для вашей системы видеонаблюдения."}
        canonical="/oferta"
        lang={ro ? "ro" : "ru"}
      />
      <main className="flex-1 bg-[#FAFAFA] pb-[64px] md:pb-0">
        <div className="max-w-lg mx-auto px-4 py-8">

          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Link href="/" className="w-9 h-9 rounded-xl bg-white border border-zinc-200 flex items-center justify-center hover:bg-zinc-50 transition-colors">
              <ArrowLeft className="w-4 h-4 text-zinc-600" />
            </Link>
            <div>
              <h1 className="font-black text-2xl text-[#09090B]">
                {ro ? "Solicită Ofertă" : "Запросить Предложение"}
              </h1>
              <p className="text-zinc-500 text-sm mt-0.5">
                {ro ? "Gratuit · Fără obligații · Răspuns în 30 min" : "Бесплатно · Без обязательств · Ответ за 30 мин"}
              </p>
            </div>
          </div>

          {/* Progress dots */}
          {step !== "done" && (
            <div className="flex gap-1.5 mb-8">
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${s <= (step as number) ? "bg-[#FF4F00]" : "bg-zinc-200"}`}
                />
              ))}
            </div>
          )}

          {/* Step 1 — Property type */}
          {step === 1 && (
            <div>
              <h2 className="font-black text-lg text-[#09090B] mb-1">
                {ro ? "Ce tip de proprietate?" : "Тип объекта?"}
              </h2>
              <p className="text-sm text-zinc-500 mb-5">
                {ro ? "Selectează tipul locației pe care vrei să o supraveghezi" : "Выберите тип объекта, который нужно защитить"}
              </p>
              <div className="grid grid-cols-2 gap-3">
                {(Object.keys(PROPERTY_ICONS) as PropertyType[]).map((type) => (
                  <button
                    key={type}
                    onClick={() => { setProperty(type); setStep(2); }}
                    className={`flex flex-col items-center gap-2.5 p-5 rounded-2xl border-2 transition-all active:scale-95 ${
                      property === type
                        ? "border-[#FF4F00] bg-[#FF4F00]/5 text-[#FF4F00]"
                        : "border-zinc-200 bg-white text-zinc-600 hover:border-[#FF4F00]/40"
                    }`}
                  >
                    {PROPERTY_ICONS[type]}
                    <span className="text-sm font-bold text-center leading-tight">
                      {ro ? PROPERTY_LABELS_RO[type] : PROPERTY_LABELS_RU[type]}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2 — Camera count */}
          {step === 2 && (
            <div>
              <h2 className="font-black text-lg text-[#09090B] mb-1">
                {ro ? "Câte camere ai nevoie?" : "Сколько камер нужно?"}
              </h2>
              <p className="text-sm text-zinc-500 mb-5">
                {ro ? "Numărul aproximativ de camere de supraveghere" : "Примерное количество камер видеонаблюдения"}
              </p>
              <div className="grid grid-cols-2 gap-3 mb-6">
                {CAMERA_OPTIONS.map((n) => (
                  <button
                    key={n}
                    onClick={() => { setCameras(n); setStep(3); }}
                    className={`flex flex-col items-center gap-1 py-6 rounded-2xl border-2 transition-all active:scale-95 ${
                      cameras === n
                        ? "border-[#FF4F00] bg-[#FF4F00]/5"
                        : "border-zinc-200 bg-white hover:border-[#FF4F00]/40"
                    }`}
                  >
                    <span className="text-3xl font-black text-[#09090B]">{n}</span>
                    <span className="text-xs text-zinc-500 font-medium">
                      {ro ? "camere" : "камеры"}
                    </span>
                  </button>
                ))}
              </div>
              <button
                onClick={() => setStep(1)}
                className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-600 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                {ro ? "Înapoi" : "Назад"}
              </button>
            </div>
          )}

          {/* Step 3 — Contact */}
          {step === 3 && (
            <div>
              <h2 className="font-black text-lg text-[#09090B] mb-1">
                {ro ? "Date de contact" : "Контактные данные"}
              </h2>
              <p className="text-sm text-zinc-500 mb-5">
                {ro ? "Te contactăm în cel mai scurt timp cu oferta personalizată" : "Свяжемся с вами в кратчайшие сроки с персональным предложением"}
              </p>

              {/* Summary card */}
              <div className="bg-[#FF4F00]/5 border border-[#FF4F00]/20 rounded-2xl p-4 mb-5 flex items-center gap-3">
                <div className="text-[#FF4F00]">{PROPERTY_ICONS[property!]}</div>
                <div>
                  <p className="text-sm font-bold text-[#09090B]">
                    {ro ? PROPERTY_LABELS_RO[property!] : PROPERTY_LABELS_RU[property!]}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {cameras} {ro ? "camere" : "камеры"}
                  </p>
                </div>
                <button
                  onClick={() => setStep(1)}
                  className="ml-auto text-xs text-[#FF4F00] font-bold underline underline-offset-2"
                >
                  {ro ? "Modifică" : "Изменить"}
                </button>
              </div>

              <div className="flex flex-col gap-3 mb-5">
                <div>
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wide block mb-1.5">
                    {ro ? "Prenume și Nume" : "Имя и Фамилия"}
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={ro ? "Ex: Ion Popescu" : "Напр: Иван Иванов"}
                    className="w-full border-2 border-zinc-200 rounded-xl px-4 py-3.5 text-base font-medium text-[#09090B] placeholder:text-zinc-400 focus:outline-none focus:border-[#FF4F00] transition-colors bg-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wide block mb-1.5">
                    {ro ? "Telefon" : "Телефон"}
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+373 __ ___ ___"
                    className="w-full border-2 border-zinc-200 rounded-xl px-4 py-3.5 text-base font-medium text-[#09090B] placeholder:text-zinc-400 focus:outline-none focus:border-[#FF4F00] transition-colors bg-white"
                  />
                </div>
              </div>

              {error && (
                <p className="text-red-500 text-sm font-medium mb-3">{error}</p>
              )}

              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full bg-[#FF4F00] text-white font-black text-base py-4 rounded-2xl flex items-center justify-center gap-2 shadow-[0_4px_24px_rgba(255,79,0,0.35)] active:scale-[0.98] transition-all disabled:opacity-60"
              >
                {submitting ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    {ro ? "Trimite Cererea" : "Отправить Запрос"}
                    <ChevronRight className="w-5 h-5" />
                  </>
                )}
              </button>

              <p className="text-[11px] text-zinc-400 text-center mt-3">
                {ro
                  ? "Datele tale sunt protejate. Nu trimitem spam."
                  : "Ваши данные защищены. Спам не рассылаем."}
              </p>

              <button
                onClick={() => setStep(2)}
                className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-600 transition-colors mt-4"
              >
                <ArrowLeft className="w-4 h-4" />
                {ro ? "Înapoi" : "Назад"}
              </button>
            </div>
          )}

          {/* Done */}
          {step === "done" && (
            <div className="text-center py-8">
              <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-5">
                <CheckCircle2 className="w-10 h-10 text-green-500" />
              </div>
              <h2 className="font-black text-2xl text-[#09090B] mb-2">
                {ro ? "Cerere trimisă!" : "Запрос отправлен!"}
              </h2>
              <p className="text-zinc-500 mb-2">
                {ro
                  ? `Mulțumim, ${name.split(" ")[0]}! Te contactăm în cel mult 30 de minute.`
                  : `Спасибо, ${name.split(" ")[0]}! Свяжемся с вами в течение 30 минут.`}
              </p>
              <p className="text-sm text-zinc-400 mb-8">
                {ro
                  ? "Echipa noastră îți va pregăti o ofertă personalizată pentru sistemul de supraveghere."
                  : "Наша команда подготовит персональное предложение для системы видеонаблюдения."}
              </p>
              <Link
                href="/produse"
                className="inline-flex items-center gap-2 bg-[#FF4F00] text-white font-bold px-6 py-3.5 rounded-2xl shadow-[0_4px_20px_rgba(255,79,0,0.3)] hover:opacity-90 transition-all"
              >
                {ro ? "Explorează produsele" : "Смотреть каталог"}
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
